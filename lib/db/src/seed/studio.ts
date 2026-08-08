/**
 * Seed default Studio reference data: 14 jobs and 10 teams.
 * Run with: cd lib/db && pnpm exec tsx src/seed/studio.ts
 */
import { db } from '..';
import { studioJobsTable, studioTeamsTable } from '../schema/studio';

const DEFAULT_JOBS = [
  { title: 'Reporter', description: 'Researches and writes news stories' },
  { title: 'Editor', description: 'Reviews and edits content for publication' },
  { title: 'Copy Editor', description: 'Proofreads and corrects grammar, style, and facts' },
  { title: 'Photographer', description: 'Captures photos to accompany stories' },
  { title: 'Videographer', description: 'Films and edits video content' },
  { title: 'Podcast Producer', description: 'Records and produces audio episodes' },
  { title: 'Graphic Designer', description: 'Creates visual assets and infographics' },
  { title: 'Social Media Manager', description: 'Manages social media presence and promotion' },
  { title: 'Layout Designer', description: 'Designs page and digital layouts' },
  { title: 'Fact Checker', description: 'Verifies accuracy of claims and sources' },
  { title: 'Data Journalist', description: 'Analyzes data and creates data-driven stories' },
  { title: 'Illustrator', description: 'Creates illustrations and original artwork' },
  { title: 'Web Editor', description: 'Manages and publishes content on the website' },
  { title: 'Anchor / Host', description: 'Presents broadcast or podcast content on air' },
];

const DEFAULT_TEAMS = [
  { name: 'News', description: 'Breaking news and current events' },
  { name: 'Features', description: 'Long-form and in-depth feature stories' },
  { name: 'Arts & Culture', description: 'Arts, entertainment, and culture coverage' },
  { name: 'Sports', description: 'Sports news and athlete profiles' },
  { name: 'Opinion', description: 'Editorials, columns, and commentary' },
  { name: 'Multimedia', description: 'Video, audio, and interactive content' },
  { name: 'Investigations', description: 'Investigative and accountability journalism' },
  { name: 'Science & Health', description: 'Science, technology, and health reporting' },
  { name: 'Community', description: 'Hyperlocal and community-focused stories' },
  { name: 'Digital', description: 'Web-first and social media content' },
];

async function seed() {
  console.log('Seeding default jobs...');
  for (const job of DEFAULT_JOBS) {
    await db.insert(studioJobsTable).values(job).onConflictDoNothing();
  }
  console.log(`  ✓ ${DEFAULT_JOBS.length} jobs`);

  console.log('Seeding default teams...');
  for (const team of DEFAULT_TEAMS) {
    await db.insert(studioTeamsTable).values(team).onConflictDoNothing();
  }
  console.log(`  ✓ ${DEFAULT_TEAMS.length} teams`);

  console.log('Done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
