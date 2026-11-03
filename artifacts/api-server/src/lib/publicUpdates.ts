export const UPDATE_DESTINATIONS: Record<string, { href: string; label: string }> = {
  blog: { href: '/connect', label: 'Student Stories & Blogs' },
  connect: { href: '/connect', label: 'Student Stories & Blogs' },
  podcast: { href: '/listen/podcast', label: 'Brightside Podcast' },
  podcasts: { href: '/listen/podcast', label: 'Brightside Podcast' },
  learn: { href: '/learn', label: 'Learning Center' },
  create: { href: '/create', label: 'Creative Activities' },
  'calm-corner': { href: '/listen/meditations', label: 'Mindful Moments' },
  'focus-study': { href: '/listen/focus-sounds', label: 'Focus & Study' },
  asmr: { href: '/listen/asmr', label: 'ASMR' },
  move: { href: '/move', label: 'Movement & Sports' },
  'directed-draws': { href: '/create/directed-draws', label: 'Art & Drawing Studio' },
  cooking: { href: '/create/cooking', label: 'Cooking & Recipes' },
  'cooking-food-reviews': { href: '/create/cooking', label: 'Food Reviews' },
  gardening: { href: '/gardening', label: 'Plants & Gardening' },
  grow: { href: '/grow', label: 'Personal Growth' },
  events: { href: '/events', label: 'School & Community Events' },
  resources: { href: '/resources', label: 'Resources' },
};

for (const activity of ['morning-stretch', 'soccer-skills', 'basketball-drills', 'yoga-for-calm', 'stretch-break', 'active-challenge']) {
  UPDATE_DESTINATIONS[`move-${activity}`] = { href: `/move/${activity}`, label: 'Movement & Sports' };
}

export interface HomepageUpdate {
  id: string;
  title: string;
  section: string;
  href: string;
  publishedAt: string;
}

export function newestUpdates(items: HomepageUpdate[]): HomepageUpdate[] {
  return items.filter(item => Number.isFinite(Date.parse(item.publishedAt)))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.id.localeCompare(b.id))
    .slice(0, 6);
}
