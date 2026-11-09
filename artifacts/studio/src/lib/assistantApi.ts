/**
 * Site Assistant API helpers (teacher Command Center).
 */
import { studioFetch } from './studioApi';

export interface AssistantConversationSummary {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export type AssistantActionStatus = 'pending' | 'applied' | 'declined' | 'failed';

export interface AssistantAction {
  id: number;
  conversationId: number;
  toolName: string;
  summary: string;
  input: Record<string, unknown>;
  status: AssistantActionStatus;
  result: unknown;
  error: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export type TranscriptItem =
  | { kind: 'user'; text: string; at: string }
  | { kind: 'assistant'; text: string; at: string }
  | { kind: 'tool'; name: string; summary: string; ok: boolean; at: string }
  | { kind: 'action'; actionId: number; at: string }
  | { kind: 'error'; text: string; at: string };

export type AssistantEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool'; name: string; summary: string; ok: boolean }
  | { type: 'action'; action: AssistantAction }
  | { type: 'done'; usage: { inputTokens: number; outputTokens: number } }
  | { type: 'error'; message: string };

export interface AssistantPlan {
  id: string;
  label: string;
  monthlyRequests: number | null;
  blurb: string;
}

export interface AssistantAccess {
  isOwner: boolean;
  allowed: boolean;
  reason: 'no_membership' | 'paused' | 'limit_reached' | null;
  message: string | null;
  membership: { plan: string; planLabel: string; status: 'active' | 'paused'; monthlyRequestLimit: number | null } | null;
  usedThisMonth: number;
  remaining: number | null;
  renewsOn: string;
  pendingRequest: { id: number; requestedPlan: string; createdAt: string } | null;
}

export interface AssistantStatus {
  configured: boolean;
  model: string;
  capabilities: string[];
  usageThisMonth: { requests: number; inputTokens: number; outputTokens: number };
  access: AssistantAccess;
  plans: AssistantPlan[];
}

export interface AccessRequest {
  id: number;
  teacherId: string;
  teacherName: string | null;
  teacherEmail: string | null;
  requestedPlan: string;
  requestedPlanLabel: string;
  note: string | null;
  status: 'pending' | 'approved' | 'declined';
  decidedBy: string | null;
  decisionNote: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export interface Membership {
  teacherId: string;
  teacherName: string | null;
  teacherEmail: string | null;
  plan: string;
  planLabel: string;
  monthlyRequestLimit: number | null;
  status: 'active' | 'paused';
  note: string | null;
  usedThisMonth: number;
  grantedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const assistantAdminApi = {
  overview: () => studioFetch<{ plans: AssistantPlan[]; requests: AccessRequest[]; memberships: Membership[] }>('/teacher/assistant/admin'),
  decide: (id: number, body: { decision: 'approve' | 'decline'; plan?: string; monthlyRequestLimit?: number | null; decisionNote?: string }) =>
    studioFetch<{ request: AccessRequest }>(`/teacher/assistant/admin/requests/${id}/decide`, { method: 'POST', body: JSON.stringify(body) }),
  updateMembership: (teacherId: string, body: { plan?: string; monthlyRequestLimit?: number | null; status?: 'active' | 'paused'; note?: string | null }) =>
    studioFetch<{ membership: Membership }>(`/teacher/assistant/admin/memberships/${encodeURIComponent(teacherId)}`, { method: 'PUT', body: JSON.stringify(body) }),
  removeMembership: (teacherId: string) =>
    studioFetch<{ success: boolean }>(`/teacher/assistant/admin/memberships/${encodeURIComponent(teacherId)}`, { method: 'DELETE' }),
};

export const assistantApi = {
  status: () => studioFetch<AssistantStatus>('/teacher/assistant/status'),
  listConversations: () =>
    studioFetch<{ conversations: AssistantConversationSummary[] }>('/teacher/assistant/conversations'),
  createConversation: () =>
    studioFetch<{ conversation: AssistantConversationSummary }>('/teacher/assistant/conversations', { method: 'POST' }),
  getConversation: (id: number) =>
    studioFetch<{ conversation: AssistantConversationSummary; transcript: TranscriptItem[]; actions: AssistantAction[] }>(
      `/teacher/assistant/conversations/${id}`,
    ),
  deleteConversation: (id: number) =>
    studioFetch<{ success: boolean }>(`/teacher/assistant/conversations/${id}`, { method: 'DELETE' }),
  applyAction: (id: number) =>
    studioFetch<{ action: AssistantAction }>(`/teacher/assistant/actions/${id}/apply`, { method: 'POST' }),
  declineAction: (id: number) =>
    studioFetch<{ action: AssistantAction }>(`/teacher/assistant/actions/${id}/decline`, { method: 'POST' }),
  requestAccess: (plan: string, note: string) =>
    studioFetch<{ request: AccessRequest }>('/teacher/assistant/access-requests', { method: 'POST', body: JSON.stringify({ plan, note }) }),
};

/**
 * Sends a message and yields assistant events as they stream back.
 * The server answers with Server-Sent Events over a POST, so this reads the
 * body manually rather than using EventSource (which only supports GET).
 */
export async function* streamAssistantMessage(
  conversationId: number,
  text: string,
  signal?: AbortSignal,
): AsyncGenerator<AssistantEvent> {
  const res = await fetch(`/api/teacher/assistant/conversations/${conversationId}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');
      const data = chunk
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n');
      if (!data) continue;
      try {
        yield JSON.parse(data) as AssistantEvent;
      } catch {
        // Ignore malformed frames; the server always sends whole JSON events.
      }
    }
  }
}
