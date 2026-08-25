ALTER TABLE "collab_comments" ADD COLUMN "approved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "collab_comments" ADD COLUMN "approved_at" timestamp;