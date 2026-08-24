DO $$
DECLARE
  contributor_fk text;
BEGIN
  SELECT constraint_name
    INTO contributor_fk
    FROM information_schema.key_column_usage
    WHERE table_schema = 'public'
      AND table_name = 'studio_project_contributors'
      AND column_name = 'student_id'
    LIMIT 1;

  IF contributor_fk IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.studio_project_contributors DROP CONSTRAINT %I',
      contributor_fk
    );
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "studio_project_contributors"
  ALTER COLUMN "student_id" TYPE varchar
  USING "student_id"::varchar;
