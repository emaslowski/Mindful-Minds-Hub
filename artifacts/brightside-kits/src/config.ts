/**
 * Everything a non-developer is likely to change lives here: prices, what each
 * kit includes, checkout links, contact details and the link to the hub.
 *
 * Prices are placeholders until you set them. To take card payments, create a
 * Stripe Payment Link per kit (https://dashboard.stripe.com/payment-links) and
 * paste its URL into `checkoutUrl`. While `checkoutUrl` is empty, the "Buy"
 * button sends the buyer to the order form instead, which emails you the
 * order so you can invoice the district or accept their purchase order.
 */

export const SITE = {
  name: 'The Brightside Wellness Project',
  shortName: 'Brightside Kits',
  tagline: 'A complete wellness curriculum, ready for your classroom.',
  /** Public address of this site. */
  siteUrl: 'https://thebrightsidewellnessproject.com',
  /** Where buyers' questions and orders are sent (shown on the site). */
  contactEmail: 'elittle9514@gmail.com',
  /** The live student wellness website that comes with every kit. */
  hubUrl: 'https://thebrightsidehub-480156548115.us-east1.run.app',
  hubName: 'The Brightside Project Hub',
  /**
   * Base URL of the API that receives order-form submissions. Leave empty when
   * the site is served from the same origin as the API, or when Vite proxies
   * /api in development. Set VITE_API_BASE_URL at build time for production,
   * e.g. https://thebrightsidehub-480156548115.us-east1.run.app
   */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '',
  /** Months of hub access included with each kit. */
  accessMonths: 12,
} as const;

export type KitId = 'classroom' | 'school' | 'district';

export interface Kit {
  id: KitId;
  name: string;
  audience: string;
  /** Whole dollars. `null` means "request a quote". */
  price: number | null;
  priceNote: string;
  /** Stripe Payment Link (or any checkout URL). Empty = use the order form. */
  checkoutUrl: string;
  highlight?: boolean;
  teachers: string;
  students: string;
  includes: string[];
}

export const KITS: Kit[] = [
  {
    id: 'classroom',
    name: 'Classroom Kit',
    audience: 'One teacher, one class',
    price: 349,
    priceNote: 'one-time, includes 12 months of hub access',
    checkoutUrl: '',
    teachers: '1 teacher account',
    students: 'Up to 35 students',
    includes: [
      'Teacher manual (print + PDF)',
      'Full set of lesson slide decks',
      '35 student workbooks',
      '12 months of hub access for the class',
      'Email support',
    ],
  },
  {
    id: 'school',
    name: 'School Kit',
    audience: 'Up to 10 classrooms in one building',
    price: 1499,
    priceNote: 'one-time, includes 12 months of hub access',
    checkoutUrl: '',
    highlight: true,
    teachers: 'Up to 10 teacher accounts',
    students: 'Up to 350 students',
    includes: [
      '10 teacher manuals (print + PDF)',
      'Full set of lesson slide decks',
      '350 student workbooks',
      '12 months of hub access for the whole school',
      'School-branded hub (name, logo, colors)',
      'Live 60-minute teacher onboarding session',
      'Priority email support',
    ],
  },
  {
    id: 'district',
    name: 'District License',
    audience: 'Every school in the district',
    price: null,
    priceNote: 'custom quote, purchase orders welcome',
    checkoutUrl: '',
    teachers: 'Unlimited teacher accounts',
    students: 'Unlimited students',
    includes: [
      'Teacher manuals for every participating classroom',
      'Full set of lesson slide decks',
      'Student workbooks for every participating student',
      '12 months of hub access district-wide',
      'A branded hub for each school',
      'Onboarding sessions for every school',
      'Dedicated support contact',
      'Multi-year pricing available',
    ],
  },
];

export function kitById(id: string | null | undefined): Kit | undefined {
  return KITS.find((k) => k.id === id);
}

export function formatPrice(price: number | null): string {
  if (price === null) return 'Custom';
  return `$${price.toLocaleString('en-US')}`;
}

/** The four parts of every kit, used across the site. */
export const KIT_PARTS = [
  {
    key: 'manual',
    title: 'Teacher Manual',
    short: 'Lesson-by-lesson plans with scripts, pacing and rubrics.',
    details: [
      'A pacing guide for a full semester or a focused six-week unit',
      'Objectives, discussion prompts and closing reflections for every lesson',
      'Rubrics for student projects and publishing',
      'Guidance for sensitive conversations and when to involve counselors',
    ],
  },
  {
    key: 'slides',
    title: 'PowerPoint Presentations',
    short: 'Ready-to-teach slide decks for every lesson.',
    details: [
      'One deck per lesson, editable in PowerPoint or Google Slides',
      'Warm-ups, mini-lessons, activity instructions and exit tickets',
      'Speaker notes that follow the teacher manual',
      'Illustrated in the Brightside style so every class feels consistent',
    ],
  },
  {
    key: 'workbooks',
    title: 'Student Workbooks',
    short: 'Printed workbooks for reflection, journaling and projects.',
    details: [
      'Daily check-ins and gratitude pages',
      'Guided journaling prompts tied to each lesson',
      'Project planners for stories, podcasts, art and recipes',
      'Space for peer feedback and teacher comments',
    ],
  },
  {
    key: 'hub',
    title: 'Access to the Hub',
    short: 'A live student-led wellness website for your school.',
    details: [
      'Students publish stories, art, podcasts and videos after teacher review',
      'Private journaling with teacher alerts for concerning entries',
      'Centers for movement, gardening, cooking, music, games and languages',
      'A Teacher Command Center with review queues, rosters and analytics',
    ],
  },
] as const;

/** Centers on the hub, shown in the "the website" section. */
export const HUB_CENTERS = [
  { title: 'Student Stories & Blogs', blurb: 'Ideas, encouragement and student voices.' },
  { title: 'Podcasts & Videos', blurb: 'Listen, watch and learn from peers.' },
  { title: 'Art & Drawing Studio', blurb: 'Create art and follow drawing tutorials.' },
  { title: 'Journaling Center', blurb: 'Reflect with private writing prompts.' },
  { title: 'Movement & Sports', blurb: 'Stretch, move and learn new skills.' },
  { title: 'Plants & Gardening', blurb: 'Grow plants and track observations.' },
  { title: 'Cooking & Healthy Recipes', blurb: 'Discover recipes and kitchen creativity.' },
  { title: 'Music & Mindful Moments', blurb: 'Find sounds and guided pauses.' },
  { title: 'Language Corner', blurb: 'Spanish vocabulary and ASL handshape games.' },
  { title: 'Friendship & Belonging', blurb: 'Practice kindness, teamwork and inclusion.' },
  { title: 'Games & Challenges', blurb: 'Quizzes, puzzles and fun challenges.' },
  { title: 'School & Community Events', blurb: 'Discover events, clubs and activities.' },
];

export const FAQ = [
  {
    q: 'Who is the kit for?',
    a: 'Upper elementary through high school classrooms: advisory periods, health classes, ELA electives, counseling groups and after-school programs. The lessons are written so any teacher can lead them, not only health or counseling staff.',
  },
  {
    q: 'How long does the curriculum take?',
    a: 'The teacher manual includes a full-semester pacing guide and a condensed six-week version. Most lessons fit a 40 to 50 minute period, and the hub keeps students engaged between lessons.',
  },
  {
    q: 'What happens after the 12 months of hub access?',
    a: 'Nothing disappears. Student work stays published, and you can renew hub access for the next school year at a reduced rate. The printed materials and slide decks are yours to keep.',
  },
  {
    q: 'Can our district pay with a purchase order?',
    a: 'Yes. Choose "Purchase order" on the order form and we will send a formal quote, a W-9 and vendor paperwork. We also accept card payments and ACH for schools that prefer to pay online.',
  },
  {
    q: 'How is student privacy handled?',
    a: 'Students sign in with their school Google accounts. Journals are private to the student, with an alert to the teacher only when an entry suggests a student may be at risk. Nothing is published on the hub until a teacher approves it.',
  },
  {
    q: 'Can we customize the hub for our school?',
    a: 'School and District licenses include a branded hub with your school name, logo and colors. Teachers can also edit homepage text, add sections and manage events without a developer.',
  },
];
