-- Teacher-created website sections (pages at /s/<slug>). Safe to run repeatedly.
CREATE TABLE IF NOT EXISTS "site_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"title" text NOT NULL,
	"intro" text DEFAULT '' NOT NULL,
	"emoji" text,
	"show_in_nav" boolean DEFAULT true NOT NULL,
	"nav_order" integer DEFAULT 100 NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
