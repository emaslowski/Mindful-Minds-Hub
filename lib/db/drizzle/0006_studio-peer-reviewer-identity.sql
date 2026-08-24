DO $$
DECLARE
  reviewer_fk text;
BEGIN
  SELECT constraint_name
    INTO reviewer_fk
    FROM information_schema.key_column_usage
    WHERE table_schema = 'public'
      AND table_name = 'studio_peer_reviews'
      AND column_name = 'reviewer_id'
    LIMIT 1;

  IF reviewer_fk IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.studio_peer_reviews DROP CONSTRAINT %I',
      reviewer_fk
    );
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "studio_peer_reviews"
  ALTER COLUMN "reviewer_id" TYPE varchar
  USING "reviewer_id"::varchar;
