-- Craft Corner: teacher-posted crafts for the hub homepage. Safe to run repeatedly.
CREATE TABLE IF NOT EXISTS "crafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"materials" text DEFAULT '' NOT NULL,
	"steps" text DEFAULT '' NOT NULL,
	"link" text,
	"published" boolean DEFAULT true NOT NULL,
	"image_object_path" text,
	"image_content_type" text,
	"image_size" integer,
	"image_ready" boolean DEFAULT false NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
