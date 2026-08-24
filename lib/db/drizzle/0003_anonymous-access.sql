CREATE TYPE "public"."anonymous_access_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."anonymous_request_status" AS ENUM('pending', 'approved', 'cancelled');--> statement-breakpoint
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
	"status" "anonymous_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	CONSTRAINT "anonymous_access_requests_request_code_unique" UNIQUE("request_code")
);
--> statement-breakpoint
ALTER TABLE "studio_jobs" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "studio_jobs" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "studio_projects" ADD COLUMN "job_id" integer;--> statement-breakpoint
ALTER TABLE "studio_projects" ADD COLUMN "peer_reviewer_job_id" integer;--> statement-breakpoint
ALTER TABLE "anonymous_access_accounts" ADD CONSTRAINT "anonymous_access_accounts_request_id_anonymous_access_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."anonymous_access_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anonymous_access_accounts" ADD CONSTRAINT "anonymous_access_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_jobs" ADD CONSTRAINT "studio_jobs_username_unique" UNIQUE("username");