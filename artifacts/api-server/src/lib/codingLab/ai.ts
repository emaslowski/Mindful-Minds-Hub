/**
 * The Coding Lab's AI helper: students send a prompt assembled only from
 * teacher-written chips, and get one short, kid-safe reply. Off by default;
 * teachers turn it on and set a daily per-student limit in the Coding Lab
 * settings.
 */
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@workspace/db';
import { codingLabAiRunsTable, studioAppSettingsTable } from '@workspace/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';

export const CODING_LAB_MODEL = process.env.CODING_LAB_MODEL || 'claude-sonnet-5-5';

const SETTING_ENABLED = 'coding_lab_ai_playground';
const SETTING_DAILY_LIMIT = 'coding_lab_ai_daily_limit';
const DEFAULT_DAILY_LIMIT = 10;

const SYSTEM_PROMPT = `You are the AI helper inside the Coding Lab of The Brightside Wellness Project, a school website made with students. You are talking with a student aged about 9 to 14 who is learning what AI is and how to write a good prompt. The student built their prompt by clicking buttons their teacher prepared.

Rules:
- Answer the prompt directly, in under 120 words, with simple, warm, encouraging language a ten-year-old can read.
- Everything must be appropriate for a school: no violence, romance, scary content, slang that would embarrass a teacher, or anything about drugs, weapons or self-harm. If a prompt heads somewhere you should not go, say in one kind sentence that this is something to talk about with a teacher, and stop.
- Never ask for, guess, or repeat personal information (full names, addresses, schools, phone numbers).
- You are not a doctor or counselor: for health, safety or feelings questions, give one gentle general idea and say a trusted adult is the best person to ask.
- Do not pretend to be a person. If asked, say you are an AI helper and that AI can make mistakes.
- Plain text only: no markdown headings or code fences; short lists with "-" are fine.`;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ maxRetries: 2, timeout: 60_000 });
  return client;
}

export function isAiHelperConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface CodingLabAiSettings { aiPlayground: boolean; aiDailyLimit: number }

export async function getAiSettings(): Promise<CodingLabAiSettings> {
  const rows = await db.select().from(studioAppSettingsTable)
    .where(sql`${studioAppSettingsTable.key} in (${SETTING_ENABLED}, ${SETTING_DAILY_LIMIT})`);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const limit = Number(map[SETTING_DAILY_LIMIT]);
  return {
    aiPlayground: map[SETTING_ENABLED] === 'on',
    aiDailyLimit: Number.isInteger(limit) && limit >= 0 ? limit : DEFAULT_DAILY_LIMIT,
  };
}

export async function setAiSettings(patch: Partial<CodingLabAiSettings>): Promise<CodingLabAiSettings> {
  const writes: Array<[string, string]> = [];
  if (patch.aiPlayground !== undefined) writes.push([SETTING_ENABLED, patch.aiPlayground ? 'on' : 'off']);
  if (patch.aiDailyLimit !== undefined) writes.push([SETTING_DAILY_LIMIT, String(patch.aiDailyLimit)]);
  for (const [key, value] of writes) {
    await db.insert(studioAppSettingsTable).values({ key, value })
      .onConflictDoUpdate({ target: studioAppSettingsTable.key, set: { value, updatedAt: new Date() } });
  }
  return getAiSettings();
}

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function countRunsToday(studentId: string): Promise<number> {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(codingLabAiRunsTable)
    .where(and(eq(codingLabAiRunsTable.studentId, studentId), gte(codingLabAiRunsTable.createdAt, startOfTodayUtc())));
  return n;
}

export async function runAiHelper(args: {
  studentId: string; studentName: string | null; lessonId: number | null; prompt: string;
}): Promise<{ reply: string; usedToday: number; limit: number }> {
  const settings = await getAiSettings();
  if (!settings.aiPlayground) throw new AiHelperError('The AI helper is turned off. Ask your teacher to turn it on in the Coding Lab settings.', 403);
  if (!isAiHelperConfigured()) throw new AiHelperError('The AI helper is not set up on this site yet.', 503);
  const usedToday = await countRunsToday(args.studentId);
  if (usedToday >= settings.aiDailyLimit) throw new AiHelperError(`You have used all ${settings.aiDailyLimit} AI tries for today. Try again tomorrow.`, 429);

  const response = await getClient().messages.create({
    model: CODING_LAB_MODEL,
    max_tokens: 400,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: args.prompt }],
  });
  const reply = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text).join('\n').trim() || 'I could not think of an answer for that one. Try a different prompt.';

  await db.insert(codingLabAiRunsTable).values({
    studentId: args.studentId, studentName: args.studentName, lessonId: args.lessonId,
    prompt: args.prompt, response: reply, model: response.model,
    inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens,
    // Set from JS (UTC) rather than the DB default, so the daily count and
    // this timestamp agree whatever timezone the database runs in.
    createdAt: new Date(),
  });
  return { reply, usedToday: usedToday + 1, limit: settings.aiDailyLimit };
}

export class AiHelperError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}
