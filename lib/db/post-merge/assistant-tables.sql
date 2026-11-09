-- Site Assistant tables (teacher AI helper in the Command Center).
-- Mirrors lib/db/src/schema/assistant.ts; safe to run repeatedly.
CREATE TABLE IF NOT EXISTS "assistant_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" varchar NOT NULL,
	"title" text DEFAULT 'New conversation' NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"transcript" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "assistant_actions" (
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
CREATE TABLE IF NOT EXISTS "assistant_usage" (
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
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assistant_actions_conversation_id_assistant_conversations_id_fk') THEN
		ALTER TABLE "assistant_actions" ADD CONSTRAINT "assistant_actions_conversation_id_assistant_conversations_id_fk"
			FOREIGN KEY ("conversation_id") REFERENCES "public"."assistant_conversations"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assistant_usage_conversation_id_assistant_conversations_id_fk') THEN
		ALTER TABLE "assistant_usage" ADD CONSTRAINT "assistant_usage_conversation_id_assistant_conversations_id_fk"
			FOREIGN KEY ("conversation_id") REFERENCES "public"."assistant_conversations"("id") ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
CREATE INDEX IF NOT EXISTS "assistant_conversations_teacher_idx" ON "assistant_conversations" ("teacher_id", "updated_at");
CREATE INDEX IF NOT EXISTS "assistant_actions_conversation_idx" ON "assistant_actions" ("conversation_id");
CREATE INDEX IF NOT EXISTS "assistant_usage_teacher_created_idx" ON "assistant_usage" ("teacher_id", "created_at");
