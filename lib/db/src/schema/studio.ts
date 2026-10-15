import {
  pgTable,
  pgEnum,
  serial,
  text,
  boolean,
  timestamp,
  integer,
  varchar,
  date,
  unique,
  jsonb,
} from 'drizzle-orm/pg-core';
import { usersTable } from './auth';

// ── Enums ──────────────────────────────────────────────────────────────────

export const studioRoleEnum = pgEnum('studio_role', ['teacher', 'student']);
export const accountStatusEnum = pgEnum('studio_account_status', ['active', 'disabled']);
export const projectStatusEnum = pgEnum('studio_project_status', [
  'Assigned', 'Researching', 'Drafting', 'Peer Review',
  'Revision Needed', 'Ready for Teacher Review', 'Teacher Reviewing',
  'Approved', 'Published', 'Archived',
]);
export const teacherDecisionEnum = pgEnum('studio_teacher_decision', [
  'approve', 'approve_and_publish', 'return_for_revision', 'save_for_later', 'archive',
]);
export const publicationStatusEnum = pgEnum('studio_publication_status', ['active', 'archived']);

// ── Reference tables ───────────────────────────────────────────────────────

export const studioTeamsTable = pgTable('studio_teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const studioJobsTable = pgTable('studio_jobs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull().unique(),
  description: text('description'),
  username: text('username').unique(),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const studioContentTypesTable = pgTable('studio_content_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Class Cycles ───────────────────────────────────────────────────────────

export const studioClassCyclesTable = pgTable('studio_class_cycles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  isActive: boolean('is_active').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Studio Profiles ────────────────────────────────────────────────────────
// One row per enrolled user. Teacher creates this before the student logs in
// (with email only, userId = null). On first Google login, userId is backfilled.

export const studioProfilesTable = pgTable('studio_profiles', {
  id: serial('id').primaryKey(),
  // null until the student completes their first Google login
  userId: varchar('user_id').references(() => usersTable.id),
  // used for pre-creation lookup before userId is known
  email: varchar('email').notNull().unique(),
  role: studioRoleEnum('role').notNull().default('student'),
  displayName: text('display_name'),
  accountStatus: accountStatusEnum('account_status').notNull().default('active'),
  cycleId: integer('cycle_id').references(() => studioClassCyclesTable.id),
  teamId: integer('team_id').references(() => studioTeamsTable.id),
  jobId: integer('job_id').references(() => studioJobsTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// ── Projects ───────────────────────────────────────────────────────────────
// assignedStudentId is a Google-auth user ID. Peer-review assignments may also
// target identities migrated from legacy Studio accounts, so reviewer IDs are
// stored as text without a user-table FK.

export const studioProjectsTable = pgTable('studio_projects', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  contentType: text('content_type').notNull(),
  status: projectStatusEnum('status').notNull().default('Assigned'),
  content: text('content').notNull().default(''),
  notes: text('notes').notNull().default(''),
  contentFlagged: boolean('content_flagged').notNull().default(false),
  originalCycleId: integer('original_cycle_id').references(() => studioClassCyclesTable.id),
  currentCycleId: integer('current_cycle_id').references(() => studioClassCyclesTable.id),
  assignedStudentId: varchar('assigned_student_id').references(() => usersTable.id),
  peerReviewerId: varchar('peer_reviewer_id'),
  teamId: integer('team_id').references(() => studioTeamsTable.id),
  // Job-group ownership: set when a job-group session creates the project (no FK so any string works)
  jobId: integer('job_id'),
  // Job-group peer reviewer: resolved to the current Editors & Designers job when entering Peer Review
  peerReviewerJobId: integer('peer_reviewer_job_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
  publishedAt: timestamp('published_at'),
});

// ── Project Contributors ───────────────────────────────────────────────────

export const studioProjectContributorsTable = pgTable(
  'studio_project_contributors',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id').notNull()
      .references(() => studioProjectsTable.id, { onDelete: 'cascade' }),
    // Keep legacy and current contributor identities as stable text values.
    studentId: varchar('student_id').notNull(),
    contributionType: text('contribution_type').notNull(), // 'author' | 'editor' | 'peer_reviewer' | 'handoff'
    cycleId: integer('cycle_id').references(() => studioClassCyclesTable.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [unique('uq_studio_project_contributor').on(t.projectId, t.studentId)],
);

// ── Sources / Research ─────────────────────────────────────────────────────

export const studioSourcesTable = pgTable('studio_sources', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull()
    .references(() => studioProjectsTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  author: text('author'),
  website: text('website'),
  url: text('url'),
  accessedDate: date('accessed_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Peer Reviews ───────────────────────────────────────────────────────────

export const studioPeerReviewsTable = pgTable('studio_peer_reviews', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull()
    .references(() => studioProjectsTable.id, { onDelete: 'cascade' }),
  // A review can be authored by an individual user or a shared job-group session.
  // Keep the stable session identity without a user-table FK so both are valid.
  reviewerId: varchar('reviewer_id').notNull(),
  checklistInfoClear: boolean('checklist_info_clear'),
  checklistAgeAppropriate: boolean('checklist_age_appropriate'),
  checklistSourcesIncluded: boolean('checklist_sources_included'),
  checklistFactsAccurate: boolean('checklist_facts_accurate'),
  checklistLanguageRespectful: boolean('checklist_language_respectful'),
  checklistNoPrivateInfo: boolean('checklist_no_private_info'),
  checklistGrammarChecked: boolean('checklist_grammar_checked'),
  checklistFitsMission: boolean('checklist_fits_mission'),
  comments: text('comments'),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
});

// ── Teacher Reviews ────────────────────────────────────────────────────────

export const studioTeacherReviewsTable = pgTable('studio_teacher_reviews', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull()
    .references(() => studioProjectsTable.id, { onDelete: 'cascade' }),
  // keeping 'teacherId' column name for route backward compat (varchar → usersTable)
  teacherId: varchar('teacher_id').notNull().references(() => usersTable.id),
  decision: teacherDecisionEnum('decision').notNull(),
  feedback: text('feedback'),
  reviewedAt: timestamp('reviewed_at').notNull().defaultNow(),
});

// ── Handoffs ───────────────────────────────────────────────────────────────

export const studioHandoffsTable = pgTable('studio_handoffs', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull()
    .references(() => studioProjectsTable.id, { onDelete: 'cascade' }),
  previousCycleId: integer('previous_cycle_id').references(() => studioClassCyclesTable.id),
  nextCycleId: integer('next_cycle_id').references(() => studioClassCyclesTable.id),
  completedWork: text('completed_work').notNull().default(''),
  remainingWork: text('remaining_work').notNull().default(''),
  ideas: text('ideas').notNull().default(''),
  notes: text('notes').notNull().default(''),
  teacherNotes: text('teacher_notes').notNull().default(''),
  isVisible: boolean('is_visible').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Publications ───────────────────────────────────────────────────────────

export const studioPublicationsTable = pgTable('studio_publications', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().unique()
    .references(() => studioProjectsTable.id, { onDelete: 'cascade' }),
  destinationSection: text('destination_section').notNull(),
  // nullable — set when a publication gets a public URL (task 8)
  slug: text('slug').unique(),
  authorDisplay: text('author_display').notNull().default('Mind Matters Student Team'),
  publicationStatus: publicationStatusEnum('publication_status').notNull().default('active'),
  featured: boolean('featured').notNull().default(false),
  publishedAt: timestamp('published_at').notNull().defaultNow(),
  unpublishedAt: timestamp('unpublished_at'),
});

export interface PublicationBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'recipe';
  width: 'full' | 'half';
  text?: string;
  mediaId?: number;
  caption?: string;
  alt?: string;
  fit?: 'contain' | 'cover';
  recipe?: {
    name: string; description: string; servings: string; prepTime: string;
    cookTime: string; ingredients: string; steps: string;
  };
}

export interface PublicationEdition {
  title: string;
  content: string;
  appearance: {
    fontFamily: 'serif' | 'sans';
    fontSize: 'small' | 'medium' | 'large';
    alignment: 'left' | 'center';
    accent: 'sage' | 'terracotta' | 'amber';
    spacing: 'compact' | 'comfortable' | 'spacious';
    pageWidth?: 'full' | 'half';
  };
  blocks?: PublicationBlock[];
  pageOrder?: number;
}

// Teacher-owned website editions never overwrite student work. Saving a draft
// does not change the public snapshot; only an explicit publish decision does.
export const studioPublicationEditsTable = pgTable('studio_publication_edits', {
  projectId: integer('project_id').primaryKey()
    .references(() => studioProjectsTable.id, { onDelete: 'cascade' }),
  draft: jsonb('draft').$type<PublicationEdition>().notNull(),
  published: jsonb('published').$type<PublicationEdition>(),
  version: integer('version').notNull().default(1),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const studioPublicationMediaTable = pgTable('studio_publication_media', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull()
    .references(() => studioProjectsTable.id, { onDelete: 'cascade' }),
  kind: text('kind').$type<'image' | 'video' | 'audio'>().notNull(),
  objectPath: text('object_path').notNull().unique(),
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  size: integer('size').notNull(),
  status: text('status').$type<'pending' | 'ready'>().notNull().default('pending'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Safety Flags ───────────────────────────────────────────────────────────

export const studioSafetyFlagsTable = pgTable('studio_safety_flags', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull()
    .references(() => studioProjectsTable.id, { onDelete: 'cascade' }),
  flagReason: text('flag_reason').notNull(),
  teacherAttentionRecommended: boolean('teacher_attention_recommended').notNull().default(true),
  flaggedByUserId: varchar('flagged_by_user_id').references(() => usersTable.id),
  resolvedAt: timestamp('resolved_at'),
  resolvedByUserId: varchar('resolved_by_user_id').references(() => usersTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── General Settings (key/value store) ────────────────────────────────────

export const studioAppSettingsTable = pgTable('studio_app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ── Impact / Visibility Settings ───────────────────────────────────────────

export const studioImpactSettingsTable = pgTable('studio_impact_settings', {
  id: serial('id').primaryKey(),
  settingKey: text('setting_key').notNull().unique(),
  isVisible: boolean('is_visible').notNull().default(false),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ── Type exports ───────────────────────────────────────────────────────────

export type StudioTeam = typeof studioTeamsTable.$inferSelect;
export type StudioJob = typeof studioJobsTable.$inferSelect;
export type StudioContentType = typeof studioContentTypesTable.$inferSelect;
export type StudioClassCycle = typeof studioClassCyclesTable.$inferSelect;
export type StudioProfile = typeof studioProfilesTable.$inferSelect;
export type StudioProject = typeof studioProjectsTable.$inferSelect;
export type StudioProjectContributor = typeof studioProjectContributorsTable.$inferSelect;
export type StudioSource = typeof studioSourcesTable.$inferSelect;
export type StudioPeerReview = typeof studioPeerReviewsTable.$inferSelect;
export type StudioTeacherReview = typeof studioTeacherReviewsTable.$inferSelect;
export type StudioHandoff = typeof studioHandoffsTable.$inferSelect;
export type StudioPublication = typeof studioPublicationsTable.$inferSelect;
export type StudioSafetyFlag = typeof studioSafetyFlagsTable.$inferSelect;
