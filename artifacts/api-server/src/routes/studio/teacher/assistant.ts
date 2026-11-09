/**
 * Site Assistant API (teacher only).
 *
 *   GET    /teacher/assistant/status
 *   GET    /teacher/assistant/conversations
 *   POST   /teacher/assistant/conversations
 *   GET    /teacher/assistant/conversations/:id
 *   DELETE /teacher/assistant/conversations/:id
 *   POST   /teacher/assistant/conversations/:id/messages   (Server-Sent Events)
 *   POST   /teacher/assistant/actions/:id/apply
 *   POST   /teacher/assistant/actions/:id/decline
 *
 * Conversations are private to the teacher who started them.
 */
import { db } from '@workspace/db';
import {
  assistantActionsTable,
  assistantConversationsTable,
  assistantUsageTable,
} from '@workspace/db/schema';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';
import {
  ASSISTANT_MODEL,
  applyAction,
  isAssistantConfigured,
  publicAction,
  runAssistantTurn,
} from '../../../lib/assistant/engine';
import { siteCallerFromRequest } from '../../../lib/assistant/siteApi';
import { ASSISTANT_TOOLS } from '../../../lib/assistant/tools';

const router = Router();
const teacherOnly = requireStudioRole('teacher');
const MAX_MESSAGE_CHARS = 8_000;

function teacherName(req: Request): string {
  const user = req.studioUser!;
  return user.displayName || user.email || 'Teacher';
}

function positiveId(value: string | string[] | undefined): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

async function ownConversation(req: Request, id: number) {
  const [conversation] = await db.select().from(assistantConversationsTable)
    .where(and(eq(assistantConversationsTable.id, id), eq(assistantConversationsTable.teacherId, req.studioUser!.id)));
  return conversation ?? null;
}

router.get('/teacher/assistant/status', teacherOnly, async (req: Request, res: Response) => {
  const monthStart = new Date();
  monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const [usage] = await db.select({
    requests: sql<number>`count(*)::int`,
    inputTokens: sql<number>`coalesce(sum(${assistantUsageTable.inputTokens}), 0)::int`,
    outputTokens: sql<number>`coalesce(sum(${assistantUsageTable.outputTokens}), 0)::int`,
  }).from(assistantUsageTable)
    .where(and(eq(assistantUsageTable.teacherId, req.studioUser!.id), gte(assistantUsageTable.createdAt, monthStart)));
  res.json({
    configured: isAssistantConfigured(),
    model: ASSISTANT_MODEL,
    capabilities: ASSISTANT_TOOLS.filter((t) => t.mode === 'write').map((t) => t.name),
    usageThisMonth: usage ?? { requests: 0, inputTokens: 0, outputTokens: 0 },
  });
});

router.get('/teacher/assistant/conversations', teacherOnly, async (req: Request, res: Response) => {
  const rows = await db.select({
    id: assistantConversationsTable.id,
    title: assistantConversationsTable.title,
    createdAt: assistantConversationsTable.createdAt,
    updatedAt: assistantConversationsTable.updatedAt,
  }).from(assistantConversationsTable)
    .where(eq(assistantConversationsTable.teacherId, req.studioUser!.id))
    .orderBy(desc(assistantConversationsTable.updatedAt))
    .limit(100);
  res.json({ conversations: rows });
});

router.post('/teacher/assistant/conversations', teacherOnly, async (req: Request, res: Response) => {
  const [conversation] = await db.insert(assistantConversationsTable)
    .values({ teacherId: req.studioUser!.id }).returning();
  res.status(201).json({ conversation: { id: conversation!.id, title: conversation!.title, createdAt: conversation!.createdAt, updatedAt: conversation!.updatedAt } });
});

router.get('/teacher/assistant/conversations/:id', teacherOnly, async (req: Request, res: Response) => {
  const id = positiveId(req.params.id);
  const conversation = id ? await ownConversation(req, id) : null;
  if (!conversation) { res.status(404).json({ error: 'Conversation not found' }); return; }
  const actions = await db.select().from(assistantActionsTable)
    .where(eq(assistantActionsTable.conversationId, conversation.id))
    .orderBy(assistantActionsTable.id);
  res.json({
    conversation: { id: conversation.id, title: conversation.title, createdAt: conversation.createdAt, updatedAt: conversation.updatedAt },
    transcript: conversation.transcript,
    actions: actions.map(publicAction),
  });
});

router.delete('/teacher/assistant/conversations/:id', teacherOnly, async (req: Request, res: Response) => {
  const id = positiveId(req.params.id);
  const conversation = id ? await ownConversation(req, id) : null;
  if (!conversation) { res.status(404).json({ error: 'Conversation not found' }); return; }
  await db.delete(assistantConversationsTable).where(eq(assistantConversationsTable.id, conversation.id));
  res.json({ success: true });
});

router.post('/teacher/assistant/conversations/:id/messages', teacherOnly, async (req: Request, res: Response) => {
  const id = positiveId(req.params.id);
  const conversation = id ? await ownConversation(req, id) : null;
  if (!conversation) { res.status(404).json({ error: 'Conversation not found' }); return; }
  const { text } = (req.body ?? {}) as { text?: unknown };
  if (typeof text !== 'string' || !text.trim()) { res.status(400).json({ error: 'Type a message first.' }); return; }
  if (text.length > MAX_MESSAGE_CHARS) { res.status(400).json({ error: `Keep messages under ${MAX_MESSAGE_CHARS} characters.` }); return; }
  if (!isAssistantConfigured()) {
    res.status(503).json({ error: 'The Site Assistant is not set up yet. The site owner needs to add the ANTHROPIC_API_KEY setting.' }); return;
  }

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let closed = false;
  req.on('close', () => { closed = true; });
  const heartbeat = setInterval(() => { if (!closed) res.write(': ping\n\n'); }, 15_000);

  try {
    await runAssistantTurn({
      conversation,
      teacherId: req.studioUser!.id,
      teacherName: teacherName(req),
      caller: siteCallerFromRequest(req),
      userText: text.trim(),
      emit: (event) => { if (!closed) res.write(`data: ${JSON.stringify(event)}\n\n`); },
    });
  } finally {
    clearInterval(heartbeat);
    if (!closed) res.end();
  }
});

async function ownAction(req: Request, id: number) {
  const [action] = await db.select().from(assistantActionsTable)
    .where(and(eq(assistantActionsTable.id, id), eq(assistantActionsTable.teacherId, req.studioUser!.id)));
  return action ?? null;
}

router.post('/teacher/assistant/actions/:id/apply', teacherOnly, async (req: Request, res: Response) => {
  const id = positiveId(req.params.id);
  const action = id ? await ownAction(req, id) : null;
  if (!action) { res.status(404).json({ error: 'Change not found' }); return; }
  if (action.status !== 'pending') { res.status(409).json({ error: `This change was already ${action.status}.`, action: publicAction(action) }); return; }
  const updated = await applyAction(action, siteCallerFromRequest(req));
  res.json({ action: publicAction(updated) });
});

router.post('/teacher/assistant/actions/:id/decline', teacherOnly, async (req: Request, res: Response) => {
  const id = positiveId(req.params.id);
  const action = id ? await ownAction(req, id) : null;
  if (!action) { res.status(404).json({ error: 'Change not found' }); return; }
  if (action.status !== 'pending') { res.status(409).json({ error: `This change was already ${action.status}.`, action: publicAction(action) }); return; }
  const [updated] = await db.update(assistantActionsTable)
    .set({ status: 'declined', decidedAt: new Date() })
    .where(eq(assistantActionsTable.id, action.id)).returning();
  res.json({ action: publicAction(updated!) });
});

export default router;
