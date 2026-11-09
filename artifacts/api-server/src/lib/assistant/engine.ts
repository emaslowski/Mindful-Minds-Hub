/**
 * Runs one assistant turn: sends the conversation to Claude, streams the
 * reply, executes read tools, records write tools as pending actions, and
 * persists the updated conversation.
 */
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@workspace/db';
import {
  assistantActionsTable,
  assistantConversationsTable,
  assistantUsageTable,
  type AssistantAction,
  type AssistantConversation,
  type AssistantTranscriptItem,
} from '@workspace/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { logger } from '../logger';
import { SYSTEM_PROMPT } from './prompt';
import { callSiteApi, formatToolResult, type SiteCaller } from './siteApi';
import { anthropicToolDefinitions, toolsByName } from './tools';

export const ASSISTANT_MODEL = process.env.ASSISTANT_MODEL || 'claude-opus-5-5';
const MAX_ITERATIONS = 12;
const MAX_TOKENS = 16_000;

let client: Anthropic | null = null;
export function isAssistantConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
function getClient(): Anthropic {
  if (!client) {
    if (!isAssistantConfigured()) throw new Error('ANTHROPIC_API_KEY is not set');
    client = new Anthropic({ maxRetries: 2, timeout: 10 * 60 * 1000 });
  }
  return client;
}

export type AssistantEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool'; name: string; summary: string; ok: boolean }
  | { type: 'action'; action: PublicAction }
  | { type: 'done'; usage: { inputTokens: number; outputTokens: number } }
  | { type: 'error'; message: string };

export interface PublicAction {
  id: number;
  conversationId: number;
  toolName: string;
  summary: string;
  input: Record<string, unknown>;
  status: AssistantAction['status'];
  result: unknown;
  error: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export function publicAction(a: AssistantAction): PublicAction {
  return {
    id: a.id, conversationId: a.conversationId, toolName: a.toolName, summary: a.summary,
    input: a.input, status: a.status, result: a.result ?? null, error: a.error ?? null,
    createdAt: a.createdAt.toISOString(), decidedAt: a.decidedAt?.toISOString() ?? null,
  };
}

const inFlight = new Set<number>();

export interface TurnParams {
  conversation: AssistantConversation;
  teacherId: string;
  teacherName: string;
  caller: SiteCaller;
  userText: string;
  emit: (event: AssistantEvent) => void;
}

export async function runAssistantTurn(params: TurnParams): Promise<void> {
  const { conversation, teacherId, caller, emit } = params;
  if (inFlight.has(conversation.id)) {
    emit({ type: 'error', message: 'The assistant is still working on your previous message. Wait for it to finish.' });
    return;
  }
  inFlight.add(conversation.id);
  const now = () => new Date().toISOString();
  const messages = [...(conversation.messages as Anthropic.Beta.BetaMessageParam[])];
  const transcript: AssistantTranscriptItem[] = [...conversation.transcript];
  const usage = { inputTokens: 0, outputTokens: 0 };

  try {
    const note = await buildSiteNote(conversation.id);
    const userContent: Anthropic.Beta.BetaContentBlockParam[] = [];
    if (note) userContent.push({ type: 'text', text: note });
    userContent.push({ type: 'text', text: `${turnContext(params.teacherName)}\n\n${params.userText}` });
    messages.push({ role: 'user', content: userContent });
    transcript.push({ kind: 'user', text: params.userText, at: now() });

    const anthropic = getClient();
    let assistantText = '';

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const stream = anthropic.beta.messages.stream({
        model: ASSISTANT_MODEL,
        max_tokens: MAX_TOKENS,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium' },
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        tools: anthropicToolDefinitions,
        messages,
      });
      stream.on('text', (delta) => {
        assistantText += delta;
        emit({ type: 'text', delta });
      });
      const message = await stream.finalMessage();
      usage.inputTokens += message.usage.input_tokens;
      usage.outputTokens += message.usage.output_tokens;
      await db.insert(assistantUsageTable).values({
        conversationId: conversation.id, teacherId, model: message.model,
        inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens,
        cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: message.usage.cache_creation_input_tokens ?? 0,
      });
      messages.push({ role: 'assistant', content: message.content });

      if (message.stop_reason === 'pause_turn') continue;
      if (message.stop_reason === 'refusal') {
        const text = 'The assistant declined this request. Try rephrasing it, or make the change in the Studio pages directly.';
        emit({ type: 'error', message: text });
        transcript.push({ kind: 'error', text, at: now() });
        break;
      }
      const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
      if (message.stop_reason === 'max_tokens' && toolUses.length > 0) {
        const text = 'The reply was cut off before a change could be described fully. Ask for a smaller change.';
        emit({ type: 'error', message: text });
        transcript.push({ kind: 'error', text, at: now() });
        break;
      }
      if (toolUses.length === 0) break;

      if (assistantText.trim()) {
        transcript.push({ kind: 'assistant', text: assistantText, at: now() });
        assistantText = '';
      }

      const results = await Promise.all(toolUses.map((use) => handleToolUse(use, {
        conversationId: conversation.id, teacherId, caller, emit, transcript,
      })));
      messages.push({ role: 'user', content: results });
    }

    if (assistantText.trim()) transcript.push({ kind: 'assistant', text: assistantText, at: now() });
    emit({ type: 'done', usage });
  } catch (err) {
    const text = describeError(err);
    logger.error({ err, conversationId: conversation.id }, 'assistant turn failed');
    emit({ type: 'error', message: text });
    transcript.push({ kind: 'error', text, at: now() });
    // Drop a trailing assistant/user pair that never completed so the stored
    // history always ends in a well-formed state for the next turn.
    while (messages.length > 0 && messages[messages.length - 1]!.role === 'assistant') messages.pop();
    if (messages.length > 0 && Array.isArray(messages[messages.length - 1]!.content)) {
      const last = messages[messages.length - 1]!;
      if ((last.content as Anthropic.Beta.BetaContentBlockParam[]).some((b) => b.type === 'tool_result')) messages.pop();
    }
  } finally {
    const title = conversation.title === 'New conversation'
      ? params.userText.trim().replace(/\s+/g, ' ').slice(0, 60) || 'New conversation'
      : conversation.title;
    await db.update(assistantConversationsTable)
      .set({ messages, transcript, title, updatedAt: new Date() })
      .where(eq(assistantConversationsTable.id, conversation.id));
    inFlight.delete(conversation.id);
  }
}

function turnContext(teacherName: string): string {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' });
  return `[Teacher: ${teacherName}. Today is ${date}.]`;
}

/** Tells the model what happened to the actions it proposed since its last turn. */
async function buildSiteNote(conversationId: number): Promise<string | null> {
  const decided = await db.select().from(assistantActionsTable)
    .where(and(
      eq(assistantActionsTable.conversationId, conversationId),
      inArray(assistantActionsTable.status, ['applied', 'declined', 'failed']),
      eq(assistantActionsTable.reported, false),
    ));
  if (decided.length === 0) return null;
  await db.update(assistantActionsTable).set({ reported: true })
    .where(inArray(assistantActionsTable.id, decided.map((a) => a.id)));
  const lines = decided.map((a) => {
    if (a.status === 'applied') return `- Action #${a.id} "${a.summary}" was APPLIED by the teacher. Result: ${JSON.stringify(a.result).slice(0, 500)}`;
    if (a.status === 'failed') return `- Action #${a.id} "${a.summary}" FAILED when applied: ${a.error}`;
    return `- Action #${a.id} "${a.summary}" was declined by the teacher.`;
  });
  return `<site_note>Since your last reply:\n${lines.join('\n')}</site_note>`;
}

interface ToolContext {
  conversationId: number;
  teacherId: string;
  caller: SiteCaller;
  emit: (event: AssistantEvent) => void;
  transcript: AssistantTranscriptItem[];
}

async function handleToolUse(
  use: Anthropic.Beta.BetaToolUseBlock,
  ctx: ToolContext,
): Promise<Anthropic.Beta.BetaToolResultBlockParam> {
  const tool = toolsByName.get(use.name);
  const input = (use.input && typeof use.input === 'object' ? use.input : {}) as Record<string, unknown>;
  const at = new Date().toISOString();
  if (!tool) {
    return { type: 'tool_result', tool_use_id: use.id, is_error: true, content: `Unknown tool ${use.name}` };
  }

  if (tool.mode === 'read') {
    try {
      const result = await callSiteApi(ctx.caller, tool.toRequest(input));
      const summary = tool.summarize(input);
      ctx.emit({ type: 'tool', name: tool.name, summary, ok: result.ok });
      ctx.transcript.push({ kind: 'tool', name: tool.name, summary, ok: result.ok, at });
      return { type: 'tool_result', tool_use_id: use.id, is_error: !result.ok, content: formatToolResult(result) };
    } catch (err) {
      const summary = tool.summarize(input);
      ctx.emit({ type: 'tool', name: tool.name, summary, ok: false });
      ctx.transcript.push({ kind: 'tool', name: tool.name, summary, ok: false, at });
      return { type: 'tool_result', tool_use_id: use.id, is_error: true, content: `Lookup failed: ${describeError(err)}` };
    }
  }

  let summary: string;
  try { summary = tool.summarize(input); } catch { summary = tool.name; }
  const [action] = await db.insert(assistantActionsTable).values({
    conversationId: ctx.conversationId, teacherId: ctx.teacherId,
    toolName: tool.name, summary, input, status: 'pending',
  }).returning();
  ctx.emit({ type: 'action', action: publicAction(action!) });
  ctx.transcript.push({ kind: 'action', actionId: action!.id, at });
  return {
    type: 'tool_result', tool_use_id: use.id,
    content: JSON.stringify({
      status: 'pending_approval', actionId: action!.id,
      note: 'Proposed to the teacher as a card. It has NOT been applied. Tell the teacher what the card will do and wait.',
    }),
  };
}

/** Applies a pending action as the teacher who approved it. */
export async function applyAction(action: AssistantAction, caller: SiteCaller): Promise<AssistantAction> {
  const tool = toolsByName.get(action.toolName);
  if (!tool || tool.mode !== 'write') throw new Error('This action can no longer be applied.');
  const result = await callSiteApi(caller, tool.toRequest(action.input));
  const [updated] = await db.update(assistantActionsTable).set(result.ok
    ? { status: 'applied', result: result.body, error: null, decidedAt: new Date() }
    : { status: 'failed', result: result.body, error: formatToolResult(result).slice(0, 1000), decidedAt: new Date() })
    .where(eq(assistantActionsTable.id, action.id)).returning();
  return updated!;
}

export function describeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return 'The assistant\'s API key was rejected. Ask the site owner to check the ANTHROPIC_API_KEY setting.';
  if (err instanceof Anthropic.RateLimitError) return 'The assistant is busy right now. Try again in a minute.';
  if (err instanceof Anthropic.APIConnectionError) return 'Could not reach the assistant service. Check the connection and try again.';
  if (err instanceof Anthropic.APIError) return `The assistant service returned an error (${err.status ?? 'unknown'}): ${err.message}`;
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}
