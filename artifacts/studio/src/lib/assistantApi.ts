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

export interface AssistantStatus {
  configured: boolean;
  model: string;
  capabilities: string[];
  usageThisMonth: { requests: number; inputTokens: number; outputTokens: number };
}

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
