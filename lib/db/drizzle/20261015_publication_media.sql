CREATE TABLE IF NOT EXISTS studio_publication_media (
  id serial PRIMARY KEY,
  project_id integer NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  kind text NOT NULL,
  object_path text NOT NULL UNIQUE,
  filename text NOT NULL,
  content_type text NOT NULL,
  size integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);
