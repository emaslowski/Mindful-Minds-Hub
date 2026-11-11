import { boolean, integer, jsonb, pgTable, serial, text, timestamp, unique, varchar } from 'drizzle-orm/pg-core';

// ── Coding Lab ──────────────────────────────────────────────────────────────
// Teacher-authored lessons about AI and about how the website is built.
// Students work through a lesson step by step; "build" steps use a
// click-to-add page builder whose result can be sent to the teacher as a
// normal Studio project.

/** A piece of a page built in the Coding Lab. Each type maps to one HTML element in the code view. */
export type CodingLabBlockType = 'heading' | 'paragraph' | 'list' | 'quote' | 'tip' | 'button' | 'divider';

export interface CodingLabBlock {
  id: string;
  type: CodingLabBlockType;
  /** heading, paragraph, quote, tip */
  text?: string;
  /** list */
  items?: string[];
  /** quote: who said it */
  by?: string;
  /** button */
  label?: string;
  href?: string;
  /** divider */
  emoji?: string;
}

export type CodingLabStep =
  | { type: 'read'; title: string; body: string }
  | { type: 'quiz'; title: string; question: string; options: string[]; answer: number; explanation: string }
  | { type: 'build'; title: string; instructions: string; required: CodingLabBlockType[]; minBlocks: number }
  | { type: 'prompt'; title: string; instructions: string; groups: Array<{ label: string; chips: string[] }>; allowAi: boolean };

export const codingLabLessonsTable = pgTable('coding_lab_lessons', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  emoji: text('emoji'),
  summary: text('summary').notNull().default(''),
  steps: jsonb('steps').$type<CodingLabStep[]>().notNull(),
  published: boolean('published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(100),
  createdBy: varchar('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const codingLabProgressTable = pgTable('coding_lab_progress', {
  id: serial('id').primaryKey(),
  studentId: varchar('student_id').notNull(),
  studentName: text('student_name'),
  lessonId: integer('lesson_id').notNull().references(() => codingLabLessonsTable.id, { onDelete: 'cascade' }),
  completedSteps: jsonb('completed_steps').$type<number[]>().notNull().default([]),
  quizAnswers: jsonb('quiz_answers').$type<Record<string, number>>().notNull().default({}),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [unique('uq_coding_lab_progress').on(t.studentId, t.lessonId)]);

export const codingLabBuildsTable = pgTable('coding_lab_builds', {
  id: serial('id').primaryKey(),
  studentId: varchar('student_id').notNull(),
  studentName: text('student_name'),
  lessonId: integer('lesson_id').references(() => codingLabLessonsTable.id, { onDelete: 'set null' }),
  stepIndex: integer('step_index'),
  title: text('title').notNull().default('My page'),
  blocks: jsonb('blocks').$type<CodingLabBlock[]>().notNull().default([]),
  /** Set once the build has been sent to the teacher as a Studio project. */
  projectId: integer('project_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const codingLabAiRunsTable = pgTable('coding_lab_ai_runs', {
  id: serial('id').primaryKey(),
  studentId: varchar('student_id').notNull(),
  studentName: text('student_name'),
  lessonId: integer('lesson_id').references(() => codingLabLessonsTable.id, { onDelete: 'set null' }),
  prompt: text('prompt').notNull(),
  response: text('response').notNull(),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type CodingLabLesson = typeof codingLabLessonsTable.$inferSelect;
export type CodingLabProgress = typeof codingLabProgressTable.$inferSelect;
export type CodingLabBuild = typeof codingLabBuildsTable.$inferSelect;
export type CodingLabAiRun = typeof codingLabAiRunsTable.$inferSelect;
