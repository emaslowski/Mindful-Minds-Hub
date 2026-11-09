import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// ── Site Assistant (teacher AI helper in the Command Center) ───────────────
//
// A conversation stores two parallel records of the same chat:
// - `messages`: the exact message history sent to the Claude API (including
//   tool calls, tool results and thinking blocks). Append-only.
// - `transcript`: the simplified items the Studio UI renders.
//
// Every change the assistant wants to make is an `assistant_actions` row.
// Nothing is written to the site until a teacher applies the action, so the
// table doubles as the audit log of what the assistant changed, for whom.

export const assistantConversationsTable = pgTable('assistant_conversations', {
  id: serial('id').primaryKey(),
  teacherId: varchar('teacher_id').notNull(),
  title: text('title').notNull().default('New conversation'),
  messages: jsonb('messages').$type<unknown[]>().notNull().default([]),
  transcript: jsonb('transcript').$type<AssistantTranscriptItem[]>().notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type AssistantActionStatus = 'pending' | 'applied' | 'declined' | 'failed';

export const assistantActionsTable = pgTable('assistant_actions', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').notNull()
    .references(() => assistantConversationsTable.id, { onDelete: 'cascade' }),
  teacherId: varchar('teacher_id').notNull(),
  toolName: text('tool_name').notNull(),
  summary: text('summary').notNull(),
  input: jsonb('input').$type<Record<string, unknown>>().notNull(),
  status: text('status').$type<AssistantActionStatus>().notNull().default('pending'),
  result: jsonb('result').$type<unknown>(),
  error: text('error'),
  // Set once the outcome has been passed back to the model in a later turn.
  reported: boolean('reported').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  decidedAt: timestamp('decided_at'),
});

// One row per model call, so usage can be shown to teachers and capped later.
export const assistantUsageTable = pgTable('assistant_usage', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id')
    .references(() => assistantConversationsTable.id, { onDelete: 'set null' }),
  teacherId: varchar('teacher_id').notNull(),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  cacheReadTokens: integer('cache_read_tokens').notNull().default(0),
  cacheWriteTokens: integer('cache_write_tokens').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type AssistantTranscriptItem =
  | { kind: 'user'; text: string; at: string }
  | { kind: 'assistant'; text: string; at: string }
  | { kind: 'tool'; name: string; summary: string; ok: boolean; at: string }
  | { kind: 'action'; actionId: number; at: string }
  | { kind: 'error'; text: string; at: string };

export type AssistantConversation = typeof assistantConversationsTable.$inferSelect;
export type AssistantAction = typeof assistantActionsTable.$inferSelect;
export type AssistantUsage = typeof assistantUsageTable.$inferSelect;
