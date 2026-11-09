/**
 * Who may use the Site Assistant, and how much.
 *
 * - Owners (SITE_OWNER_EMAILS, or else the first ADMIN_EMAILS entry, plus the
 *   ADMIN_USERNAME password login) have unlimited use and manage everyone else.
 * - Other teachers need an active membership with a monthly request limit.
 *   A request is one teacher message. Limits reset on the 1st of each month.
 */
import { db } from '@workspace/db';
import {
  assistantAccessRequestsTable,
  assistantMembershipsTable,
  assistantRequestsTable,
  type AssistantAccessRequest,
  type AssistantMembership,
} from '@workspace/db/schema';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import type { StudioUserSession } from '../studioAuth';

export interface AssistantPlan {
  id: string;
  label: string;
  monthlyRequests: number | null;
  blurb: string;
}

export const ASSISTANT_PLANS: AssistantPlan[] = [
  { id: 'starter', label: 'Starter', monthlyRequests: 50, blurb: 'For occasional use: a few questions or changes a week.' },
  { id: 'standard', label: 'Standard', monthlyRequests: 200, blurb: 'For regular use: moderating, publishing and editing most days.' },
  { id: 'plus', label: 'Plus', monthlyRequests: 600, blurb: 'For heavy use or a teacher who runs the site for others.' },
];

export function planById(id: string): AssistantPlan | undefined {
  return ASSISTANT_PLANS.find((p) => p.id === id);
}

function emailList(value: string | undefined): string[] {
  return (value ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export function isOwner(user: StudioUserSession): boolean {
  if (user.role !== 'teacher') return false;
  if (user.id === 'teacher-admin') return true;
  const owners = emailList(process.env.SITE_OWNER_EMAILS);
  const email = user.email?.toLowerCase();
  if (!email) return false;
  if (owners.length > 0) return owners.includes(email);
  const admins = emailList(process.env.ADMIN_EMAILS);
  return admins.length > 0 && admins[0] === email;
}

export function monthStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
export function nextMonthStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

export async function countRequestsThisMonth(teacherId: string): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(assistantRequestsTable)
    .where(and(eq(assistantRequestsTable.teacherId, teacherId), gte(assistantRequestsTable.createdAt, monthStart())));
  return row?.n ?? 0;
}

export interface AssistantAccess {
  isOwner: boolean;
  allowed: boolean;
  /** Why not, when `allowed` is false. */
  reason: 'no_membership' | 'paused' | 'limit_reached' | null;
  message: string | null;
  membership: {
    plan: string;
    planLabel: string;
    status: AssistantMembership['status'];
    monthlyRequestLimit: number | null;
  } | null;
  usedThisMonth: number;
  remaining: number | null;
  renewsOn: string;
  pendingRequest: { id: number; requestedPlan: string; createdAt: string } | null;
}

export async function getAssistantAccess(user: StudioUserSession): Promise<AssistantAccess> {
  const owner = isOwner(user);
  const [membership] = await db.select().from(assistantMembershipsTable)
    .where(eq(assistantMembershipsTable.teacherId, user.id));
  const [pending] = await db.select().from(assistantAccessRequestsTable)
    .where(and(eq(assistantAccessRequestsTable.teacherId, user.id), eq(assistantAccessRequestsTable.status, 'pending')))
    .orderBy(desc(assistantAccessRequestsTable.createdAt)).limit(1);
  const used = await countRequestsThisMonth(user.id);
  const renewsOn = nextMonthStart().toISOString();
  const pendingRequest = pending ? { id: pending.id, requestedPlan: pending.requestedPlan, createdAt: pending.createdAt.toISOString() } : null;

  if (owner) {
    return { isOwner: true, allowed: true, reason: null, message: null, membership: null, usedThisMonth: used, remaining: null, renewsOn, pendingRequest };
  }
  if (!membership) {
    return {
      isOwner: false, allowed: false, reason: 'no_membership',
      message: 'You do not have a Site Assistant membership yet. Request access below and the site owner will set you up.',
      membership: null, usedThisMonth: used, remaining: null, renewsOn, pendingRequest,
    };
  }
  const summary = {
    plan: membership.plan,
    planLabel: planById(membership.plan)?.label ?? membership.plan,
    status: membership.status,
    monthlyRequestLimit: membership.monthlyRequestLimit,
  };
  if (membership.status === 'paused') {
    return {
      isOwner: false, allowed: false, reason: 'paused',
      message: 'Your Site Assistant membership is paused. Contact the site owner to resume it.',
      membership: summary, usedThisMonth: used, remaining: 0, renewsOn, pendingRequest,
    };
  }
  const limit = membership.monthlyRequestLimit;
  const remaining = limit == null ? null : Math.max(0, limit - used);
  if (remaining !== null && remaining <= 0) {
    return {
      isOwner: false, allowed: false, reason: 'limit_reached',
      message: `You have used all ${limit} requests in your plan this month. Your allowance renews on the 1st; you can also request more below.`,
      membership: summary, usedThisMonth: used, remaining: 0, renewsOn, pendingRequest,
    };
  }
  return { isOwner: false, allowed: true, reason: null, message: null, membership: summary, usedThisMonth: used, remaining, renewsOn, pendingRequest };
}

export async function recordRequest(teacherId: string, conversationId: number): Promise<void> {
  await db.insert(assistantRequestsTable).values({ teacherId, conversationId });
}

export function publicAccessRequest(r: AssistantAccessRequest) {
  return {
    id: r.id, teacherId: r.teacherId, teacherName: r.teacherName, teacherEmail: r.teacherEmail,
    requestedPlan: r.requestedPlan, requestedPlanLabel: planById(r.requestedPlan)?.label ?? r.requestedPlan,
    note: r.note, status: r.status, decidedBy: r.decidedBy, decisionNote: r.decisionNote,
    createdAt: r.createdAt.toISOString(), decidedAt: r.decidedAt?.toISOString() ?? null,
  };
}
