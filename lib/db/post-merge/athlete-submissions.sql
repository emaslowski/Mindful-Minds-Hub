-- Development only. Publish applies the development schema to production.
CREATE TABLE IF NOT EXISTS athlete_submissions (
  id serial PRIMARY KEY,
  owner_id text NOT NULL,
  athlete_name text NOT NULL,
  title text NOT NULL,
  object_path text NOT NULL,
  filename text NOT NULL,
  content_type text NOT NULL,
  size integer NOT NULL,
  status text NOT NULL DEFAULT 'uploading',
  featured_month text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS athlete_one_winner_per_month
  ON athlete_submissions(featured_month);
