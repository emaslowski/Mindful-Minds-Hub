-- Rebrand: replace legacy "Mind Matters" author labels with The Brightside Project.
-- Safe to repeat; only rows still using a legacy label are changed.
ALTER TABLE studio_publications
  ALTER COLUMN author_display SET DEFAULT 'The Brightside Project Team';

UPDATE studio_publications
SET author_display = CASE author_display
  WHEN 'Mind Matters Blog Team' THEN 'The Brightside Project Blog Team'
  WHEN 'Grade 5 Mind Matters Team' THEN 'Grade 5 Brightside Project Team'
  ELSE 'The Brightside Project Team'
END
WHERE author_display IN (
  'Mind Matter Team',
  'Mind Matters Team',
  'Mind Matters Student Team',
  'Mind Matters Blog Team',
  'Grade 5 Mind Matters Team'
);
