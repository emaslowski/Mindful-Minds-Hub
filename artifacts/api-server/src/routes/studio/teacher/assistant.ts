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
import {
  ASSISTANT_PLANS,
  getAssistantAccess,
  isOwner,
  monthStart,
  planById,
  publicAccessRequest,
  recordRequest,
} from '../../../lib/assistant/access';
import {
  assistantAccessRequestsTable,
  assistantMembershipsTable,
  assistantRequestsTable,
} from '@workspace/db/schema';

const router = Router();
const teacherOnly = requireStudioRole('teacher');
const MAX_MESSAGE_CHARS = 8_000;

function ownerOnly(req: Request, res: Response, next: () => void): void {
  if (!req.studioUser || !isOwner(req.studioUser)) {
    res.status(403).json({ error: 'Only the site owner can manage assistant access.' });
    return;
  }
  next();
}

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
    access: await getAssistantAccess(req.studioUser!),
    plans: ASSISTANT_PLANS,
  });
});

// ── Membership requests (any teacher) ───────────────────────────────────────

router.post('/teacher/assistant/access-requests', teacherOnly, async (req: Request, res: Response) => {
  const { plan, note } = (req.body ?? {}) as { plan?: unknown; note?: unknown };
  if (typeof plan !== 'string' || !planById(plan)) { res.status(400).json({ error: 'Choose a plan.' }); return; }
  if (note !== undefined && (typeof note !== 'string' || note.length > 1000)) { res.status(400).json({ error: 'Keep the note under 1000 characters.' }); return; }
  const user = req.studioUser!;
  const [existing] = await db.select().from(assistantAccessRequestsTable)
    .where(and(eq(assistantAccessRequestsTable.teacherId, user.id), eq(assistantAccessRequestsTable.status, 'pending')));
  if (existing) { res.status(409).json({ error: 'You already have a request waiting for the site owner.', request: publicAccessRequest(existing) }); return; }
  const [created] = await db.insert(assistantAccessRequestsTable).values({
    teacherId: user.id, teacherName: user.displayName, teacherEmail: user.email,
    requestedPlan: plan, note: typeof note === 'string' && note.trim() ? note.trim() : null,
  }).returning();
  res.status(201).json({ request: publicAccessRequest(created!) });
});

// ── Owner administration ────────────────────────────────────────────────────

router.get('/teacher/assistant/admin', teacherOnly, ownerOnly, async (_req: Request, res: Response) => {
  const [requests, memberships, usage] = await Promise.all([
    db.select().from(assistantAccessRequestsTable).orderBy(desc(assistantAccessRequestsTable.createdAt)).limit(200),
    db.select().from(assistantMembershipsTable).orderBy(assistantMembershipsTable.createdAt),
    db.select({ teacherId: assistantRequestsTable.teacherId, used: sql<number>`count(*)::int` })
      .from(assistantRequestsTable).where(gte(assistantRequestsTable.createdAt, monthStart()))
      .groupBy(assistantRequestsTable.teacherId),
  ]);
  const usedBy = new Map(usage.map((u) => [u.teacherId, u.used]));
  res.json({
    plans: ASSISTANT_PLANS,
    requests: requests.map(publicAccessRequest),
    memberships: memberships.map((m) => ({
      teacherId: m.teacherId, teacherName: m.teacherName, teacherEmail: m.teacherEmail,
      plan: m.plan, planLabel: planById(m.plan)?.label ?? m.plan,
      monthlyRequestLimit: m.monthlyRequestLimit, status: m.status, note: m.note,
      usedThisMonth: usedBy.get(m.teacherId) ?? 0,
      grantedBy: m.grantedBy, createdAt: m.createdAt.toISOString(), updatedAt: m.updatedAt.toISOString(),
    })),
  });
});

interface MembershipInput { plan?: unknown; monthlyRequestLimit?: unknown; status?: unknown; note?: unknown }

function parseMembership(body: MembershipInput): { error: string } | { plan?: string; monthlyRequestLimit?: number | null; status?: 'active' | 'paused'; note?: string | null } {
  const out: { plan?: string; monthlyRequestLimit?: number | null; status?: 'active' | 'paused'; note?: string | null } = {};
  if (body.plan !== undefined) {
    if (typeof body.plan !== 'string' || (!planById(body.plan) && body.plan !== 'custom')) return { error: 'Unknown plan.' };
    out.plan = body.plan;
  }
  if (body.monthlyRequestLimit !== undefined) {
    if (body.monthlyRequestLimit !== null && (!Number.isSafeInteger(body.monthlyRequestLimit) || (body.monthlyRequestLimit as number) < 0)) return { error: 'monthlyRequestLimit must be a whole number or null for unlimited.' };
    out.monthlyRequestLimit = body.monthlyRequestLimit as number | null;
  }
  if (body.status !== undefined) {
    if (body.status !== 'active' && body.status !== 'paused') return { error: 'status must be active or paused.' };
    out.status = body.status;
  }
  if (body.note !== undefined) {
    if (body.note !== null && (typeof body.note !== 'string' || body.note.length > 1000)) return { error: 'Keep the note under 1000 characters.' };
    out.note = body.note === null ? null : (body.note as string).trim() || null;
  }
  return out;
}

router.post('/teacher/assistant/admin/requests/:id/decide', teacherOnly, ownerOnly, async (req: Request, res: Response) => {
  const id = positiveId(req.params.id);
  const [request] = id ? await db.select().from(assistantAccessRequestsTable).where(eq(assistantAccessRequestsTable.id, id)) : [];
  if (!request) { res.status(404).json({ error: 'Request not found' }); return; }
  if (request.status !== 'pending') { res.status(409).json({ error: `This request was already ${request.status}.` }); return; }
  const { decision, decisionNote, ...rest } = (req.body ?? {}) as { decision?: unknown; decisionNote?: unknown } & MembershipInput;
  if (decision !== 'approve' && decision !== 'decline') { res.status(400).json({ error: 'decision must be approve or decline.' }); return; }
  const parsed = parseMembership(rest);
  if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
  const note = typeof decisionNote === 'string' ? decisionNote.trim().slice(0, 1000) || null : null;

  if (decision === 'approve') {
    const plan = parsed.plan ?? request.requestedPlan;
    const limit = parsed.monthlyRequestLimit !== undefined ? parsed.monthlyRequestLimit : (planById(plan)?.monthlyRequests ?? null);
    await db.insert(assistantMembershipsTable).values({
      teacherId: request.teacherId, teacherName: request.teacherName, teacherEmail: request.teacherEmail,
      plan, monthlyRequestLimit: limit, status: 'active', note: parsed.note ?? null, grantedBy: req.studioUser!.id,
    }).onConflictDoUpdate({
      target: assistantMembershipsTable.teacherId,
      set: { plan, monthlyRequestLimit: limit, status: 'active', grantedBy: req.studioUser!.id, updatedAt: new Date(), ...(parsed.note !== undefined ? { note: parsed.note } : {}) },
    });
  }
  const [updated] = await db.update(assistantAccessRequestsTable)
    .set({ status: decision === 'approve' ? 'approved' : 'declined', decidedBy: req.studioUser!.id, decisionNote: note, decidedAt: new Date() })
    .where(eq(assistantAccessRequestsTable.id, request.id)).returning();
  res.json({ request: publicAccessRequest(updated!) });
});

router.put('/teacher/assistant/admin/memberships/:teacherId', teacherOnly, ownerOnly, async (req: Request, res: Response) => {
  const teacherId = String(req.params.teacherId);
  const body = (req.body ?? {}) as MembershipInput & { teacherName?: unknown; teacherEmail?: unknown };
  const parsed = parseMembership(body);
  if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
  const [existing] = await db.select().from(assistantMembershipsTable).where(eq(assistantMembershipsTable.teacherId, teacherId));
  if (!existing && !parsed.plan) { res.status(400).json({ error: 'Choose a plan for the new membership.' }); return; }
  const plan = parsed.plan ?? existing!.plan;
  const limit = parsed.monthlyRequestLimit !== undefined ? parsed.monthlyRequestLimit
    : existing ? existing.monthlyRequestLimit : (planById(plan)?.monthlyRequests ?? null);
  const [row] = await db.insert(assistantMembershipsTable).values({
    teacherId,
    teacherName: typeof body.teacherName === 'string' ? body.teacherName : existing?.teacherName ?? null,
    teacherEmail: typeof body.teacherEmail === 'string' ? body.teacherEmail : existing?.teacherEmail ?? null,
    plan, monthlyRequestLimit: limit, status: parsed.status ?? 'active', note: parsed.note ?? null, grantedBy: req.studioUser!.id,
  }).onConflictDoUpdate({
    target: assistantMembershipsTable.teacherId,
    set: {
      plan, monthlyRequestLimit: limit, updatedAt: new Date(),
      ...(parsed.status !== undefined ? { status: parsed.status } : {}),
      ...(parsed.note !== undefined ? { note: parsed.note } : {}),
    },
  }).returning();
  res.json({ membership: row });
});

router.delete('/teacher/assistant/admin/memberships/:teacherId', teacherOnly, ownerOnly, async (req: Request, res: Response) => {
  const deleted = await db.delete(assistantMembershipsTable)
    .where(eq(assistantMembershipsTable.teacherId, String(req.params.teacherId))).returning({ teacherId: assistantMembershipsTable.teacherId });
  if (deleted.length === 0) { res.status(404).json({ error: 'Membership not found' }); return; }
  res.json({ success: true });
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
  const access = await getAssistantAccess(req.studioUser!);
  if (!access.allowed) {
    res.status(403).json({ error: access.message, code: access.reason, access }); return;
  }
  await recordRequest(req.studioUser!.id, conversation.id);

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
