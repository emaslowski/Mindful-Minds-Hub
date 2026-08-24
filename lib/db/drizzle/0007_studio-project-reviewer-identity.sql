DO $$
DECLARE
  reviewer_fk text;
BEGIN
  SELECT constraint_name
    INTO reviewer_fk
    FROM information_schema.key_column_usage
    WHERE table_schema = 'public'
      AND table_name = 'studio_projects'
      AND column_name = 'peer_reviewer_id'
    LIMIT 1;

  IF reviewer_fk IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.studio_projects DROP CONSTRAINT %I',
      reviewer_fk
    );
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "studio_projects"
  ALTER COLUMN "peer_reviewer_id" TYPE varchar
  USING "peer_reviewer_id"::varchar;
