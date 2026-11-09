/**
 * Editable site content.
 *
 * Text and lists on the main site that used to be hardcoded in the React
 * pages live here as *defaults*. Teachers (and the Site Assistant) can
 * override any entry; overrides are stored in the `site_content` table and
 * served by GET /api/public/site-content. The page shows the override when
 * one exists and the default otherwise, so a reset is always possible.
 *
 * Every entry's value must keep the same shape as its default (same keys,
 * same types; arrays may change length). `validateSiteContent` enforces it.
 *
 * Shared by the main site (reads), the API server (validation, journal
 * prompts) and the Site Assistant (tool descriptions).
 */

export interface SiteContentEntry<T = unknown> {
  /** Short human label, e.g. "Homepage headline". */
  label: string;
  /** Where it shows and what each field means. Read by teachers and the assistant. */
  description: string;
  /** Site page the content appears on, e.g. "Home". */
  page: string;
  default: T;
}

function entry<T>(e: SiteContentEntry<T>): SiteContentEntry<T> { return e; }

export const SITE_CONTENT = {
  'home.hero': entry({
    label: 'Homepage headline and intro',
    page: 'Home',
    description: 'The top of the homepage: the big headline, the paragraph under it, the "Explore" button label, the purpose sentence below the button, and the two lines of the banner under the hero (tagline shown in large serif text, and the smaller mission sentence).',
    default: {
      headline: 'A brighter school starts with us.',
      intro: 'A student-created community hub to learn, create, connect, and feel a sense of belonging.',
      exploreButton: 'Explore the Centers',
      purpose: 'The Brightside Project is about connection and a sense of belonging with peers. Games are just one activity here—not the main focus of this website.',
      bannerTagline: 'Created by students. Connected by kindness.',
      bannerMission: 'Students practice research, digital citizenship, collaboration, and creative communication while making useful content for our school community.',
      centersTitle: 'Find your bright spot',
      creatorsTitle: 'Behind every bright idea is a student creator',
      processTitle: 'How we create',
    },
  }),
  'home.centers': entry({
    label: 'Homepage center tiles',
    page: 'Home',
    description: 'The grid of tiles on the homepage. Each tile has a title, a one-line description, the page it links to (href, a path on this site like /connect), and an image file name from the site\'s tile set (tile-1.jpg … tile-13.jpg). Reorder, reword, add or remove tiles.',
    default: [
      { title: 'Student Stories & Blogs', description: 'Ideas, encouragement, and student voices.', href: '/connect', image: 'tile-1.jpg' },
      { title: 'Podcasts & Videos', description: 'Listen, watch, and learn from peers.', href: '/listen/podcast', image: 'tile-2.jpg' },
      { title: 'Art & Drawing Studio', description: 'Create art and follow drawing tutorials.', href: '/create', image: 'tile-3.jpg' },
      { title: 'Games & Challenges', description: 'Try quizzes, activities, and fun challenges.', href: '/games', image: 'tile-4.jpg' },
      { title: 'Plants & Gardening', description: 'Grow plants, learn gardening tips, and explore student projects.', href: '/gardening', image: 'tile-5.jpg' },
      { title: 'Journaling Center', description: 'Reflect with private writing prompts.', href: '/grow/journal', image: 'tile-6.jpg' },
      { title: 'Movement & Sports', description: 'Stretch, move, and learn new skills.', href: '/move', image: 'tile-7.jpg' },
      { title: 'Music & Mindful Moments', description: 'Find sounds and guided pauses.', href: '/listen', image: 'tile-8.jpg' },
      { title: 'Cooking & Healthy Recipes', description: 'Discover recipes and kitchen creativity.', href: '/create/cooking', image: 'tile-9.jpg' },
      { title: 'Language Corner', description: 'Play Spanish vocabulary and ASL handshape games.', href: '/language-corner', image: 'tile-10.jpg' },
      { title: 'Friendship & Belonging', description: 'Practice kindness, teamwork, and inclusion.', href: '/connect', image: 'tile-11.jpg' },
      { title: 'School & Community Events', description: 'Discover events, clubs, and activities.', href: '/events', image: 'tile-12.jpg' },
      { title: 'Groups & Connections', description: 'Find teacher-approved ways to join in.', href: '/connect', image: 'tile-13.jpg' },
      { title: 'ASMR', description: 'Listen to gentle, teacher-approved sounds created by students.', href: '/listen/asmr', image: 'tile-8.jpg' },
    ],
  }),
  'home.creatorRoles': entry({
    label: 'Homepage "who creates" roles',
    page: 'Home',
    description: 'The list of student roles shown on the homepage (Writers, Researchers, …).',
    default: ['Writers', 'Researchers', 'Artists', 'Podcasters', 'Video Creators', 'Designers', 'Community Reporters'],
  }),
  'home.processSteps': entry({
    label: 'Homepage "how it works" steps',
    page: 'Home',
    description: 'The steps shown on the homepage, in order. Each has a title and an image file name from the step set (step-1.jpg … step-7.jpg).',
    default: [
      { title: 'Listen to student ideas', image: 'step-1.jpg' },
      { title: 'Research', image: 'step-2.jpg' },
      { title: 'Create', image: 'step-3.jpg' },
      { title: 'Collaborate', image: 'step-4.jpg' },
      { title: 'Revise', image: 'step-5.jpg' },
      { title: 'Teacher review', image: 'step-6.jpg' },
      { title: 'Share', image: 'step-7.jpg' },
    ],
  }),
  'journal.dailyPrompts': entry({
    label: 'Daily journal prompts',
    page: 'Grow → Journal',
    description: 'The pool of prompts shown one per day in the Journaling Center. The prompt for a day is chosen by the day of the year, cycling through the list, so any number of prompts works.',
    default: [
      'What is something that made you smile today? Why?',
      'Describe a challenge you faced recently. How did you handle it?',
      'What is one thing you are proud of about yourself?',
      'If you could change one thing about your day, what would it be?',
      'Write about someone who made a positive difference in your life.',
      'What does a perfect day look like for you? Describe it.',
      'What are three things you want to accomplish this week?',
    ],
  }),
} as const satisfies Record<string, SiteContentEntry>;

export type SiteContentKey = keyof typeof SITE_CONTENT;
export type SiteContentValue<K extends SiteContentKey> = (typeof SITE_CONTENT)[K]['default'];
export type SiteContentValues = { [K in SiteContentKey]?: SiteContentValue<K> };

export const SITE_CONTENT_KEYS = Object.keys(SITE_CONTENT) as SiteContentKey[];

export function isSiteContentKey(key: string): key is SiteContentKey {
  return Object.prototype.hasOwnProperty.call(SITE_CONTENT, key);
}

/**
 * Checks that `value` has the same shape as the entry's default. Returns an
 * error message, or null when the value is acceptable.
 */
export function validateSiteContent(key: SiteContentKey, value: unknown): string | null {
  return matchShape(SITE_CONTENT[key].default, value, key);
}

function matchShape(template: unknown, value: unknown, path: string): string | null {
  if (Array.isArray(template)) {
    if (!Array.isArray(value)) return `${path} must be a list`;
    if (template.length === 0) return null;
    for (let i = 0; i < value.length; i++) {
      const err = matchShape(template[0], value[i], `${path}[${i}]`);
      if (err) return err;
    }
    return null;
  }
  if (template === null) {
    return value === null || typeof value === 'string' ? null : `${path} must be text or empty`;
  }
  if (typeof template === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return `${path} must be an object`;
    const t = template as Record<string, unknown>;
    const v = value as Record<string, unknown>;
    for (const k of Object.keys(t)) {
      if (!(k in v)) return `${path}.${k} is missing`;
      const err = matchShape(t[k], v[k], `${path}.${k}`);
      if (err) return err;
    }
    for (const k of Object.keys(v)) if (!(k in t)) return `${path}.${k} is not a known field`;
    return null;
  }
  if (typeof value !== typeof template) return `${path} must be ${typeof template === 'string' ? 'text' : typeof template}`;
  if (typeof value === 'string' && value.length > 5000) return `${path} is too long (max 5000 characters)`;
  if (typeof value === 'number' && !Number.isFinite(value)) return `${path} must be a number`;
  return null;
}
