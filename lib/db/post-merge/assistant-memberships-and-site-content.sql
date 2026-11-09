-- Site Assistant memberships/allowances and editable site content.
-- Mirrors lib/db/src/schema/assistant.ts and siteContent.ts; safe to run repeatedly.
CREATE TABLE IF NOT EXISTS "site_content" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "assistant_memberships" (
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
CREATE TABLE IF NOT EXISTS "assistant_access_requests" (
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
CREATE TABLE IF NOT EXISTS "assistant_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" varchar NOT NULL,
	"conversation_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assistant_requests_conversation_id_assistant_conversations_id_fk') THEN
		ALTER TABLE "assistant_requests" ADD CONSTRAINT "assistant_requests_conversation_id_assistant_conversations_id_fk"
			FOREIGN KEY ("conversation_id") REFERENCES "public"."assistant_conversations"("id") ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
CREATE INDEX IF NOT EXISTS "assistant_requests_teacher_created_idx" ON "assistant_requests" ("teacher_id", "created_at");
CREATE INDEX IF NOT EXISTS "assistant_access_requests_status_idx" ON "assistant_access_requests" ("status", "created_at");
