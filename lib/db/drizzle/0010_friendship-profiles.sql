CREATE TABLE IF NOT EXISTS "friendship_profiles" (
  "user_id" varchar PRIMARY KEY NOT NULL,
  "interests" text[] NOT NULL,
  "qualities" text[] NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "friendship_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);