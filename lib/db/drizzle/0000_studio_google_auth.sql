CREATE TYPE "public"."studio_account_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."studio_project_status" AS ENUM('Assigned', 'Researching', 'Drafting', 'Peer Review', 'Revision Needed', 'Ready for Teacher Review', 'Teacher Reviewing', 'Approved', 'Published', 'Archived');--> statement-breakpoint
CREATE TYPE "public"."studio_publication_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."studio_role" AS ENUM('teacher', 'student');--> statement-breakpoint
CREATE TYPE "public"."studio_teacher_decision" AS ENUM('approve', 'approve_and_publish', 'return_for_revision', 'save_for_later', 'archive');--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"content" text NOT NULL,
	"excerpt" text NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "collab_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collab_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"event_date" date NOT NULL,
	"location" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gratitude_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"entry_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"prompt" text DEFAULT '' NOT NULL,
	"content" text NOT NULL,
	"flagged" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"section" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"rating" integer NOT NULL,
	"helpful" boolean DEFAULT true NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_class_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_date" date,
	"end_date" date,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "studio_class_cycles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "studio_content_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "studio_content_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "studio_handoffs" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"previous_cycle_id" integer,
	"next_cycle_id" integer,
	"completed_work" text DEFAULT '' NOT NULL,
	"remaining_work" text DEFAULT '' NOT NULL,
	"ideas" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"teacher_notes" text DEFAULT '' NOT NULL,
	"is_visible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_impact_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_key" text NOT NULL,
	"is_visible" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "studio_impact_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "studio_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "studio_jobs_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "studio_peer_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"reviewer_id" varchar NOT NULL,
	"checklist_info_clear" boolean,
	"checklist_age_appropriate" boolean,
	"checklist_sources_included" boolean,
	"checklist_facts_accurate" boolean,
	"checklist_language_respectful" boolean,
	"checklist_no_private_info" boolean,
	"checklist_grammar_checked" boolean,
	"checklist_fits_mission" boolean,
	"comments" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"email" varchar NOT NULL,
	"role" "studio_role" DEFAULT 'student' NOT NULL,
	"display_name" text,
	"account_status" "studio_account_status" DEFAULT 'active' NOT NULL,
	"cycle_id" integer,
	"team_id" integer,
	"job_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "studio_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "studio_project_contributors" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"student_id" varchar NOT NULL,
	"contribution_type" text NOT NULL,
	"cycle_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_studio_project_contributor" UNIQUE("project_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "studio_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content_type" text NOT NULL,
	"status" "studio_project_status" DEFAULT 'Assigned' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"content_flagged" boolean DEFAULT false NOT NULL,
	"original_cycle_id" integer,
	"current_cycle_id" integer,
	"assigned_student_id" varchar,
	"peer_reviewer_id" varchar,
	"team_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "studio_publications" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"destination_section" text NOT NULL,
	"slug" text,
	"author_display" text DEFAULT 'Mind Matters Student Team' NOT NULL,
	"publication_status" "studio_publication_status" DEFAULT 'active' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"unpublished_at" timestamp,
	CONSTRAINT "studio_publications_project_id_unique" UNIQUE("project_id"),
	CONSTRAINT "studio_publications_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "studio_safety_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"flag_reason" text NOT NULL,
	"teacher_attention_recommended" boolean DEFAULT true NOT NULL,
	"flagged_by_user_id" varchar,
	"resolved_at" timestamp,
	"resolved_by_user_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"website" text,
	"url" text,
	"accessed_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_teacher_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"teacher_id" varchar NOT NULL,
	"decision" "studio_teacher_decision" NOT NULL,
	"feedback" text,
	"reviewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "studio_teams_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "collab_comments" ADD CONSTRAINT "collab_comments_post_id_collab_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."collab_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gratitude_entries" ADD CONSTRAINT "gratitude_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_handoffs" ADD CONSTRAINT "studio_handoffs_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_handoffs" ADD CONSTRAINT "studio_handoffs_previous_cycle_id_studio_class_cycles_id_fk" FOREIGN KEY ("previous_cycle_id") REFERENCES "public"."studio_class_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_handoffs" ADD CONSTRAINT "studio_handoffs_next_cycle_id_studio_class_cycles_id_fk" FOREIGN KEY ("next_cycle_id") REFERENCES "public"."studio_class_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_peer_reviews" ADD CONSTRAINT "studio_peer_reviews_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_peer_reviews" ADD CONSTRAINT "studio_peer_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_profiles" ADD CONSTRAINT "studio_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_profiles" ADD CONSTRAINT "studio_profiles_cycle_id_studio_class_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."studio_class_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_profiles" ADD CONSTRAINT "studio_profiles_team_id_studio_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."studio_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_profiles" ADD CONSTRAINT "studio_profiles_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_project_contributors" ADD CONSTRAINT "studio_project_contributors_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_project_contributors" ADD CONSTRAINT "studio_project_contributors_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_project_contributors" ADD CONSTRAINT "studio_project_contributors_cycle_id_studio_class_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."studio_class_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_projects" ADD CONSTRAINT "studio_projects_original_cycle_id_studio_class_cycles_id_fk" FOREIGN KEY ("original_cycle_id") REFERENCES "public"."studio_class_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_projects" ADD CONSTRAINT "studio_projects_current_cycle_id_studio_class_cycles_id_fk" FOREIGN KEY ("current_cycle_id") REFERENCES "public"."studio_class_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_projects" ADD CONSTRAINT "studio_projects_assigned_student_id_users_id_fk" FOREIGN KEY ("assigned_student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_projects" ADD CONSTRAINT "studio_projects_peer_reviewer_id_users_id_fk" FOREIGN KEY ("peer_reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_projects" ADD CONSTRAINT "studio_projects_team_id_studio_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."studio_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_publications" ADD CONSTRAINT "studio_publications_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_safety_flags" ADD CONSTRAINT "studio_safety_flags_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_safety_flags" ADD CONSTRAINT "studio_safety_flags_flagged_by_user_id_users_id_fk" FOREIGN KEY ("flagged_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_safety_flags" ADD CONSTRAINT "studio_safety_flags_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_sources" ADD CONSTRAINT "studio_sources_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_teacher_reviews" ADD CONSTRAINT "studio_teacher_reviews_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_teacher_reviews" ADD CONSTRAINT "studio_teacher_reviews_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");