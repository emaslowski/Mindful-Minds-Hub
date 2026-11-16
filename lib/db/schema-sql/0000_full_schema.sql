CREATE TYPE "public"."anonymous_access_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."anonymous_request_status" AS ENUM('pending', 'approved', 'cancelled');--> statement-breakpoint
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
CREATE TABLE "anonymous_access_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"access_code" varchar(32) NOT NULL,
	"password_hash" text NOT NULL,
	"status" "anonymous_access_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anonymous_access_accounts_request_id_unique" UNIQUE("request_id"),
	CONSTRAINT "anonymous_access_accounts_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "anonymous_access_accounts_access_code_unique" UNIQUE("access_code")
);
--> statement-breakpoint
CREATE TABLE "anonymous_access_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_code" varchar(20) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"grade" varchar(20),
	"student_email" varchar(254),
	"status" "anonymous_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	CONSTRAINT "anonymous_access_requests_request_code_unique" UNIQUE("request_code")
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
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp
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
CREATE TABLE "content_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"section" text NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
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
	"approved" boolean DEFAULT false NOT NULL,
	"teacher_reply" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friendship_profiles" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"first_name" varchar(30),
	"last_initial" varchar(2),
	"interests" text[] NOT NULL,
	"qualities" text[] NOT NULL,
	"approval_status" text DEFAULT 'pending' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"username" text,
	"password_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "studio_jobs_title_unique" UNIQUE("title"),
	CONSTRAINT "studio_jobs_username_unique" UNIQUE("username")
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
	"job_id" integer,
	"peer_reviewer_job_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "studio_publication_edits" (
	"project_id" integer PRIMARY KEY NOT NULL,
	"draft" jsonb NOT NULL,
	"published" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_publication_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"kind" text NOT NULL,
	"object_path" text NOT NULL,
	"filename" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "studio_publication_media_object_path_unique" UNIQUE("object_path")
);
--> statement-breakpoint
CREATE TABLE "studio_publications" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"destination_section" text NOT NULL,
	"slug" text,
	"author_display" text DEFAULT 'The Brightside Project Team' NOT NULL,
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
CREATE TABLE "studio_video_productions" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"producer_job_id" integer NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"object_path" text,
	"filename" text,
	"mime_type" text,
	"size" integer,
	"pending_object_path" text,
	"pending_filename" text,
	"pending_mime_type" text,
	"pending_size" integer,
	"pending_expires_at" timestamp with time zone,
	"uploaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "studio_video_productions_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "artwork_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"artist_name" text NOT NULL,
	"title" text NOT NULL,
	"object_path" text NOT NULL,
	"filename" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"status" text DEFAULT 'uploading' NOT NULL,
	"featured_month" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"athlete_name" text NOT NULL,
	"title" text NOT NULL,
	"object_path" text NOT NULL,
	"filename" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"status" text DEFAULT 'uploading' NOT NULL,
	"featured_month" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plant_observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"nickname" text NOT NULL,
	"height_cm" double precision,
	"leaf_count" integer,
	"observations" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant_access_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" varchar NOT NULL,
	"teacher_name" text,
	"teacher_email" text,
	"requested_plan" text NOT NULL,
	"note" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"decided_by" varchar,
	"decision_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"decided_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "assistant_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"teacher_id" varchar NOT NULL,
	"tool_name" text NOT NULL,
	"summary" text NOT NULL,
	"input" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"result" jsonb,
	"error" text,
	"reported" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"decided_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "assistant_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" varchar NOT NULL,
	"title" text DEFAULT 'New conversation' NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"transcript" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant_memberships" (
	"teacher_id" varchar PRIMARY KEY NOT NULL,
	"teacher_name" text,
	"teacher_email" text,
	"plan" text DEFAULT 'starter' NOT NULL,
	"monthly_request_limit" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"note" text,
	"granted_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" varchar NOT NULL,
	"conversation_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer,
	"teacher_id" varchar NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cache_read_tokens" integer DEFAULT 0 NOT NULL,
	"cache_write_tokens" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_content" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"intro" text DEFAULT '' NOT NULL,
	"emoji" text,
	"show_in_nav" boolean DEFAULT true NOT NULL,
	"nav_order" integer DEFAULT 100 NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_sections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "coding_lab_ai_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" varchar NOT NULL,
	"student_name" text,
	"lesson_id" integer,
	"prompt" text NOT NULL,
	"response" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coding_lab_builds" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" varchar NOT NULL,
	"student_name" text,
	"lesson_id" integer,
	"step_index" integer,
	"title" text DEFAULT 'My page' NOT NULL,
	"blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"project_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coding_lab_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"emoji" text,
	"summary" text DEFAULT '' NOT NULL,
	"steps" jsonb NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 100 NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coding_lab_lessons_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "coding_lab_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" varchar NOT NULL,
	"student_name" text,
	"lesson_id" integer NOT NULL,
	"completed_steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"quiz_answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_coding_lab_progress" UNIQUE("student_id","lesson_id")
);
--> statement-breakpoint
ALTER TABLE "anonymous_access_accounts" ADD CONSTRAINT "anonymous_access_accounts_request_id_anonymous_access_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."anonymous_access_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anonymous_access_accounts" ADD CONSTRAINT "anonymous_access_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collab_comments" ADD CONSTRAINT "collab_comments_post_id_collab_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."collab_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gratitude_entries" ADD CONSTRAINT "gratitude_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendship_profiles" ADD CONSTRAINT "friendship_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_handoffs" ADD CONSTRAINT "studio_handoffs_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_handoffs" ADD CONSTRAINT "studio_handoffs_previous_cycle_id_studio_class_cycles_id_fk" FOREIGN KEY ("previous_cycle_id") REFERENCES "public"."studio_class_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_handoffs" ADD CONSTRAINT "studio_handoffs_next_cycle_id_studio_class_cycles_id_fk" FOREIGN KEY ("next_cycle_id") REFERENCES "public"."studio_class_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_peer_reviews" ADD CONSTRAINT "studio_peer_reviews_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_profiles" ADD CONSTRAINT "studio_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_profiles" ADD CONSTRAINT "studio_profiles_cycle_id_studio_class_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."studio_class_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_profiles" ADD CONSTRAINT "studio_profiles_team_id_studio_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."studio_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_profiles" ADD CONSTRAINT "studio_profiles_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_project_contributors" ADD CONSTRAINT "studio_project_contributors_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_project_contributors" ADD CONSTRAINT "studio_project_contributors_cycle_id_studio_class_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."studio_class_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_projects" ADD CONSTRAINT "studio_projects_original_cycle_id_studio_class_cycles_id_fk" FOREIGN KEY ("original_cycle_id") REFERENCES "public"."studio_class_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_projects" ADD CONSTRAINT "studio_projects_current_cycle_id_studio_class_cycles_id_fk" FOREIGN KEY ("current_cycle_id") REFERENCES "public"."studio_class_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_projects" ADD CONSTRAINT "studio_projects_assigned_student_id_users_id_fk" FOREIGN KEY ("assigned_student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_projects" ADD CONSTRAINT "studio_projects_team_id_studio_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."studio_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_publication_edits" ADD CONSTRAINT "studio_publication_edits_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_publication_media" ADD CONSTRAINT "studio_publication_media_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_publications" ADD CONSTRAINT "studio_publications_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_safety_flags" ADD CONSTRAINT "studio_safety_flags_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_safety_flags" ADD CONSTRAINT "studio_safety_flags_flagged_by_user_id_users_id_fk" FOREIGN KEY ("flagged_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_safety_flags" ADD CONSTRAINT "studio_safety_flags_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_sources" ADD CONSTRAINT "studio_sources_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_teacher_reviews" ADD CONSTRAINT "studio_teacher_reviews_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_teacher_reviews" ADD CONSTRAINT "studio_teacher_reviews_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_video_productions" ADD CONSTRAINT "studio_video_productions_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_video_productions" ADD CONSTRAINT "studio_video_productions_producer_job_id_studio_jobs_id_fk" FOREIGN KEY ("producer_job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_observations" ADD CONSTRAINT "plant_observations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_actions" ADD CONSTRAINT "assistant_actions_conversation_id_assistant_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."assistant_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_requests" ADD CONSTRAINT "assistant_requests_conversation_id_assistant_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."assistant_conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_usage" ADD CONSTRAINT "assistant_usage_conversation_id_assistant_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."assistant_conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_lab_ai_runs" ADD CONSTRAINT "coding_lab_ai_runs_lesson_id_coding_lab_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."coding_lab_lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_lab_builds" ADD CONSTRAINT "coding_lab_builds_lesson_id_coding_lab_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."coding_lab_lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_lab_progress" ADD CONSTRAINT "coding_lab_progress_lesson_id_coding_lab_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."coding_lab_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE UNIQUE INDEX "artwork_one_winner_per_month" ON "artwork_submissions" USING btree ("featured_month");--> statement-breakpoint
CREATE UNIQUE INDEX "athlete_one_winner_per_month" ON "athlete_submissions" USING btree ("featured_month");--> statement-breakpoint
CREATE INDEX "plant_observations_owner_date_idx" ON "plant_observations" USING btree ("user_id","date");