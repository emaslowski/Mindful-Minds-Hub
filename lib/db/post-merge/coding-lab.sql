-- Coding Lab: lessons, student progress, page builds and AI helper runs.
-- Mirrors lib/db/src/schema/codingLab.ts; safe to run repeatedly.
CREATE TABLE IF NOT EXISTS "coding_lab_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"title" text NOT NULL,
	"emoji" text,
	"summary" text DEFAULT '' NOT NULL,
	"steps" jsonb NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 100 NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "coding_lab_progress" (
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
CREATE TABLE IF NOT EXISTS "coding_lab_builds" (
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
CREATE TABLE IF NOT EXISTS "coding_lab_ai_runs" (
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
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coding_lab_progress_lesson_id_coding_lab_lessons_id_fk') THEN
		ALTER TABLE "coding_lab_progress" ADD CONSTRAINT "coding_lab_progress_lesson_id_coding_lab_lessons_id_fk"
			FOREIGN KEY ("lesson_id") REFERENCES "public"."coding_lab_lessons"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coding_lab_builds_lesson_id_coding_lab_lessons_id_fk') THEN
		ALTER TABLE "coding_lab_builds" ADD CONSTRAINT "coding_lab_builds_lesson_id_coding_lab_lessons_id_fk"
			FOREIGN KEY ("lesson_id") REFERENCES "public"."coding_lab_lessons"("id") ON DELETE set null ON UPDATE no action;
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coding_lab_ai_runs_lesson_id_coding_lab_lessons_id_fk') THEN
		ALTER TABLE "coding_lab_ai_runs" ADD CONSTRAINT "coding_lab_ai_runs_lesson_id_coding_lab_lessons_id_fk"
			FOREIGN KEY ("lesson_id") REFERENCES "public"."coding_lab_lessons"("id") ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
CREATE INDEX IF NOT EXISTS "coding_lab_builds_student_idx" ON "coding_lab_builds" ("student_id", "updated_at");
CREATE INDEX IF NOT EXISTS "coding_lab_ai_runs_student_created_idx" ON "coding_lab_ai_runs" ("student_id", "created_at");
