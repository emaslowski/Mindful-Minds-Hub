-- Existing opt-ins must receive teacher approval before becoming visible.
ALTER TABLE "friendship_profiles"
  ADD COLUMN IF NOT EXISTS "approval_status" text NOT NULL DEFAULT 'pending';
ALTER TABLE "friendship_profiles"
  ADD CONSTRAINT "friendship_profiles_approval_status_check"
  CHECK ("approval_status" IN ('pending', 'approved', 'rejected'));