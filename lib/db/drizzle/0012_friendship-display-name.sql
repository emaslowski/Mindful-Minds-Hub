-- Existing profiles have no chosen display name until the student enters one.
ALTER TABLE "friendship_profiles"
  ADD COLUMN IF NOT EXISTS "first_name" varchar(30),
  ADD COLUMN IF NOT EXISTS "last_initial" varchar(2);
ALTER TABLE "friendship_profiles"
  ADD CONSTRAINT "friendship_profiles_display_name_pair_check"
  CHECK (
    ("first_name" IS NULL AND "last_initial" IS NULL)
    OR ("first_name" IS NOT NULL AND "last_initial" IS NOT NULL)
  );