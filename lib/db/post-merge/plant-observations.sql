-- Development-only post-merge migration. Publish transfers schema changes
-- to production. Safe to repeat; existing student observations are untouched.
CREATE TABLE IF NOT EXISTS plant_observations (
  id serial PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  nickname text NOT NULL CHECK (length(trim(nickname)) BETWEEN 1 AND 80),
  height_cm double precision CHECK (height_cm >= 0 AND height_cm <= 100000),
  leaf_count integer CHECK (leaf_count >= 0 AND leaf_count <= 100000),
  observations text NOT NULL DEFAULT '' CHECK (length(observations) <= 1000)
);
CREATE INDEX IF NOT EXISTS plant_observations_owner_date_idx
  ON plant_observations(user_id, date);
