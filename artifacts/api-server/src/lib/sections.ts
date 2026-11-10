import { db } from '@workspace/db';
import { siteSectionsTable } from '@workspace/db/schema';

/** Sections that have their own page in the main site's code. */
export const BUILT_IN_SECTIONS = [
  'blog', 'podcast', 'learn', 'sign-language', 'create', 'calm-corner', 'dance-tutorials', 'focus-study', 'asmr', 'move', 'cooking', 'gardening', 'grow', 'events', 'resources',
  'move-morning-stretch', 'move-soccer-skills', 'move-basketball-drills',
  'move-yoga-for-calm', 'move-stretch-break', 'move-active-challenge',
  'directed-draws', 'cooking-food-reviews',
] as const;

/** Built-in sections plus every teacher-created one: the valid publish destinations. */
export async function allPublishDestinations(): Promise<string[]> {
  const custom = await db.select({ slug: siteSectionsTable.slug }).from(siteSectionsTable);
  return [...BUILT_IN_SECTIONS, ...custom.map((c) => c.slug)];
}
