import {
  pgTable, pgEnum, serial, text, boolean, timestamp, integer, date,
} from 'drizzle-orm/pg-core';

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

// ── Teams ──────────────────────────────────────────────────────────────────
export const studioTeamsTable = pgTable('studio_teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Jobs ───────────────────────────────────────────────────────────────────
export const studioJobsTable = pgTable('studio_jobs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull().unique(),
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

// ── Accounts (username + password) ────────────────────────────────────────
export const studioAccountsTable = pgTable('studio_accounts', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  role: studioRoleEnum('role').notNull(),
  accountStatus: accountStatusEnum('account_status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ── Student Profiles (extra data for students) ────────────────────────────
export const studioStudentProfilesTable = pgTable('studio_student_profiles', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().unique()
    .references(() => studioAccountsTable.id, { onDelete: 'cascade' }),
  className: text('class_name'),
  cycleId: integer('cycle_id').references(() => studioClassCyclesTable.id),
  teamId: integer('team_id').references(() => studioTeamsTable.id),
  jobId: integer('job_id').references(() => studioJobsTable.id),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ── Projects ───────────────────────────────────────────────────────────────
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
  assignedStudentId: integer('assigned_student_id')
    .references(() => studioAccountsTable.id),
  peerReviewerId: integer('peer_reviewer_id')
    .references(() => studioAccountsTable.id),
  teamId: integer('team_id').references(() => studioTeamsTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  publishedAt: timestamp('published_at'),
});

// ── Project Contributors ───────────────────────────────────────────────────
export const studioProjectContributorsTable = pgTable('studio_project_contributors', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull()
    .references(() => studioProjectsTable.id, { onDelete: 'cascade' }),
  studentId: integer('student_id').notNull()
    .references(() => studioAccountsTable.id),
  contributionType: text('contribution_type').notNull(), // 'author' | 'editor' | 'peer_reviewer' | 'handoff'
  cycleId: integer('cycle_id').references(() => studioClassCyclesTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

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
  reviewerId: integer('reviewer_id').notNull()
    .references(() => studioAccountsTable.id),
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
  teacherId: integer('teacher_id').notNull()
    .references(() => studioAccountsTable.id),
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
  authorDisplay: text('author_display').notNull().default('Mind Matters Student Team'),
  publicationStatus: publicationStatusEnum('publication_status').notNull().default('active'),
  publishedAt: timestamp('published_at').notNull().defaultNow(),
});

// ── Safety Flags (never shown to students) ─────────────────────────────────
export const studioSafetyFlagsTable = pgTable('studio_safety_flags', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull()
    .references(() => studioProjectsTable.id, { onDelete: 'cascade' }),
  flagReason: text('flag_reason').notNull(),
  teacherAttentionRecommended: boolean('teacher_attention_recommended').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Impact Settings ────────────────────────────────────────────────────────
export const studioImpactSettingsTable = pgTable('studio_impact_settings', {
  id: serial('id').primaryKey(),
  settingKey: text('setting_key').notNull().unique(),
  isVisible: boolean('is_visible').notNull().default(false),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ── Type exports ───────────────────────────────────────────────────────────
export type StudioAccount = typeof studioAccountsTable.$inferSelect;
export type StudioTeam = typeof studioTeamsTable.$inferSelect;
export type StudioJob = typeof studioJobsTable.$inferSelect;
export type StudioClassCycle = typeof studioClassCyclesTable.$inferSelect;
export type StudioStudentProfile = typeof studioStudentProfilesTable.$inferSelect;
export type StudioProject = typeof studioProjectsTable.$inferSelect;
export type StudioSource = typeof studioSourcesTable.$inferSelect;
export type StudioPeerReview = typeof studioPeerReviewsTable.$inferSelect;
export type StudioTeacherReview = typeof studioTeacherReviewsTable.$inferSelect;
export type StudioHandoff = typeof studioHandoffsTable.$inferSelect;
export type StudioPublication = typeof studioPublicationsTable.$inferSelect;
export type StudioSafetyFlag = typeof studioSafetyFlagsTable.$inferSelect;
