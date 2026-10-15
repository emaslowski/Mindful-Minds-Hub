CREATE TABLE IF NOT EXISTS studio_publication_edits (
  project_id integer PRIMARY KEY REFERENCES studio_projects(id) ON DELETE CASCADE,
  draft jsonb NOT NULL,
  published jsonb,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamp NOT NULL DEFAULT now()
);
