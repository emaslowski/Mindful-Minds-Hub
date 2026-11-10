/**
 * Site Assistant tool catalog.
 *
 * Every tool is a thin wrapper around an existing teacher API endpoint. The
 * assistant never touches the database directly: tools are executed as HTTP
 * requests against this same server, carrying the requesting teacher's own
 * session, so the assistant can only do what that teacher could do by hand
 * and every existing validation rule applies.
 *
 * `read` tools run immediately. `write` tools only create a pending action;
 * the request is sent when the teacher clicks Apply in the Studio.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { SITE_CONTENT, SITE_CONTENT_KEYS } from '@workspace/site-content';

type JsonSchema = Anthropic.Beta.BetaTool.InputSchema;

const SITE_CONTENT_GUIDE = SITE_CONTENT_KEYS.map((key) => {
  const e = SITE_CONTENT[key];
  return `- ${key} (${e.page}): ${e.label}. ${e.description}\n  Shape example: ${JSON.stringify(e.default).slice(0, 700)}`;
}).join('\n');

export interface SiteRequest {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
}

export interface AssistantTool {
  name: string;
  description: string;
  mode: 'read' | 'write';
  inputSchema: JsonSchema;
  /** Builds the site API request for the given (already schema-valid) input. */
  toRequest: (input: Record<string, unknown>) => SiteRequest;
  /** One line shown on the approval card, e.g. "Publish project 12 to Learn". */
  summarize: (input: Record<string, unknown>) => string;
}

export const PUBLICATION_SECTIONS = [
  'blog', 'podcast', 'learn', 'sign-language', 'create', 'calm-corner', 'dance-tutorials',
  'focus-study', 'asmr', 'move', 'cooking', 'gardening', 'grow', 'events', 'resources',
  'move-morning-stretch', 'move-soccer-skills', 'move-basketball-drills', 'move-yoga-for-calm',
  'move-stretch-break', 'move-active-challenge', 'directed-draws', 'cooking-food-reviews',
] as const;

const PROJECT_STATUSES = [
  'Assigned', 'Researching', 'Drafting', 'Peer Review', 'Revision Needed',
  'Ready for Teacher Review', 'Teacher Reviewing', 'Approved', 'Published', 'Archived',
] as const;

const MODERATION_TYPES = ['blog', 'collab-post', 'comment', 'content-comment', 'review'] as const;

const id = (description: string): Record<string, unknown> => ({
  type: 'integer', minimum: 1, description,
});

const str = (description: string, extra: Record<string, unknown> = {}) => ({
  type: 'string', description, ...extra,
});

const obj = (
  properties: Record<string, unknown>,
  required: string[] = [],
): JsonSchema => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});

const publicationEditionSchema = {
  type: 'object',
  description: 'The full website edition of a page. Send the whole edition, not just the changed fields.',
  properties: {
    title: str('Page title shown on the website.'),
    content: str('Main body text. Plain text; blank lines separate paragraphs.'),
    appearance: {
      type: 'object',
      properties: {
        fontFamily: { type: 'string', enum: ['serif', 'sans'] },
        fontSize: { type: 'string', enum: ['small', 'medium', 'large'] },
        alignment: { type: 'string', enum: ['left', 'center'] },
        accent: { type: 'string', enum: ['sage', 'terracotta', 'amber'] },
        spacing: { type: 'string', enum: ['compact', 'comfortable', 'spacious'] },
        pageWidth: { type: 'string', enum: ['full', 'half'] },
      },
      required: ['fontFamily', 'fontSize', 'alignment', 'accent', 'spacing'],
      additionalProperties: false,
    },
    blocks: {
      type: 'array',
      description: 'Optional layout blocks under the main text. Keep existing image/video/audio blocks (their mediaId) unless the teacher asks to remove them; new media cannot be added here.',
      items: {
        type: 'object',
        properties: {
          id: str('Stable block id. Keep existing ids; use a short random string for new blocks.'),
          type: { type: 'string', enum: ['text', 'image', 'video', 'audio', 'recipe'] },
          width: { type: 'string', enum: ['full', 'half'] },
          text: str('Text for text blocks.'),
          mediaId: { type: 'integer', description: 'Existing media id for image/video/audio blocks.' },
          caption: str('Caption for media blocks.'),
          alt: str('Alt text for images.'),
          fit: { type: 'string', enum: ['contain', 'cover'] },
          recipe: {
            type: 'object',
            properties: {
              name: { type: 'string' }, description: { type: 'string' }, servings: { type: 'string' },
              prepTime: { type: 'string' }, cookTime: { type: 'string' },
              ingredients: { type: 'string' }, steps: { type: 'string' },
            },
            required: ['name', 'description', 'servings', 'prepTime', 'cookTime', 'ingredients', 'steps'],
            additionalProperties: false,
          },
        },
        required: ['id', 'type', 'width'],
        additionalProperties: false,
      },
    },
    pageOrder: { type: 'integer', description: 'Lower numbers appear first within a section. Default 1000.' },
  },
  required: ['title', 'content', 'appearance'],
  additionalProperties: false,
};

function q(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

/** Drops undefined keys so PATCH endpoints only receive the fields to change. */
function pick(input: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) if (input[key] !== undefined) out[key] = input[key];
  return out;
}

export const ASSISTANT_TOOLS: AssistantTool[] = [
  // ── Reading ──────────────────────────────────────────────────────────────
  {
    name: 'list_projects',
    mode: 'read',
    description: 'List all Studio projects (student and teacher-created) with id, title, content type, status, student and team. Use this to find a project id before changing anything.',
    inputSchema: obj({
      status: { type: 'string', enum: PROJECT_STATUSES, description: 'Optional status filter.' },
    }),
    toRequest: (i) => ({ method: 'GET', path: `/teacher/projects${q({ status: i.status })}` }),
    summarize: (i) => `List projects${i.status ? ` with status ${i.status}` : ''}`,
  },
  {
    name: 'get_project',
    mode: 'read',
    description: 'Get one project in full: original student text, sources, peer and teacher reviews, the current website edition draft (publicationDraft) with its version number, and publication info. Required before save_page_draft or decide_project. Note: opening a project that is "Ready for Teacher Review" marks it "Teacher Reviewing", exactly as opening it in the Studio does.',
    inputSchema: obj({ projectId: id('Project id.') }, ['projectId']),
    toRequest: (i) => ({ method: 'GET', path: `/teacher/projects/${i.projectId}` }),
    summarize: (i) => `Open project ${i.projectId}`,
  },
  {
    name: 'list_review_queue',
    mode: 'read',
    description: 'List student submissions waiting for teacher review.',
    inputSchema: obj({}),
    toRequest: () => ({ method: 'GET', path: '/teacher/review/queue' }),
    summarize: () => 'List the review queue',
  },
  {
    name: 'list_published_pages',
    mode: 'read',
    description: 'List pages currently live on the public website: project id, title, section, author display, text, blocks and order. Optionally filter by section.',
    inputSchema: obj({
      section: { type: 'string', enum: PUBLICATION_SECTIONS, description: 'Optional website section.' },
    }),
    toRequest: (i) => ({ method: 'GET', path: `/public/published${q({ section: i.section })}` }),
    summarize: (i) => `List published pages${i.section ? ` in ${i.section}` : ''}`,
  },
  {
    name: 'list_moderation_items',
    mode: 'read',
    description: 'List community items awaiting approval (blog submissions, Connect posts and comments, content comments) and all site reviews with their teacher replies.',
    inputSchema: obj({}),
    toRequest: () => ({ method: 'GET', path: '/teacher/moderation' }),
    summarize: () => 'List moderation items',
  },
  {
    name: 'list_students',
    mode: 'read',
    description: 'List student profiles with team, job and class cycle.',
    inputSchema: obj({}),
    toRequest: () => ({ method: 'GET', path: '/teacher/students' }),
    summarize: () => 'List students',
  },
  {
    name: 'list_teams',
    mode: 'read',
    description: 'List Studio teams.',
    inputSchema: obj({}),
    toRequest: () => ({ method: 'GET', path: '/teacher/teams' }),
    summarize: () => 'List teams',
  },
  {
    name: 'list_jobs',
    mode: 'read',
    description: 'List Studio job groups (for example Writers, Editors & Designers, Video Producers).',
    inputSchema: obj({}),
    toRequest: () => ({ method: 'GET', path: '/teacher/jobs' }),
    summarize: () => 'List jobs',
  },
  {
    name: 'list_cycles',
    mode: 'read',
    description: 'List class cycles (terms) with dates and which one is active.',
    inputSchema: obj({}),
    toRequest: () => ({ method: 'GET', path: '/teacher/cycles' }),
    summarize: () => 'List class cycles',
  },
  {
    name: 'list_handoffs',
    mode: 'read',
    description: 'List end-of-cycle project handoffs written by students.',
    inputSchema: obj({}),
    toRequest: () => ({ method: 'GET', path: '/teacher/handoffs' }),
    summarize: () => 'List handoffs',
  },
  {
    name: 'get_settings',
    mode: 'read',
    description: 'Get Studio settings, currently the list of author display options used on published pages.',
    inputSchema: obj({}),
    toRequest: () => ({ method: 'GET', path: '/teacher/settings' }),
    summarize: () => 'Read settings',
  },
  {
    name: 'get_analytics',
    mode: 'read',
    description: 'Get impact and analytics numbers, and which impact stats are shown publicly.',
    inputSchema: obj({}),
    toRequest: () => ({ method: 'GET', path: '/teacher/analytics' }),
    summarize: () => 'Read analytics',
  },
  {
    name: 'list_artwork',
    mode: 'read',
    description: 'List student artwork submissions with status and Featured Artist month.',
    inputSchema: obj({}),
    toRequest: () => ({ method: 'GET', path: '/teacher/artwork' }),
    summarize: () => 'List artwork submissions',
  },
  {
    name: 'list_athlete_submissions',
    mode: 'read',
    description: 'List Athlete of the Month submissions with status and featured month.',
    inputSchema: obj({}),
    toRequest: () => ({ method: 'GET', path: '/teacher/athlete' }),
    summarize: () => 'List athlete submissions',
  },
  {
    name: 'list_events',
    mode: 'read',
    description: 'List events shown on the Events page (id, title, description, eventDate, location).',
    inputSchema: obj({}),
    toRequest: () => ({ method: 'GET', path: '/events' }),
    summarize: () => 'List events',
  },
  {
    name: 'list_sections',
    mode: 'read',
    description: 'List teacher-created website sections (slug, title, intro, emoji, showInNav, path). These are extra pages at /s/<slug> that list the student pages published to them, and they are valid publish destinations. Built-in sections are not listed here.',
    inputSchema: obj({}),
    toRequest: () => ({ method: 'GET', path: '/public/sections' }),
    summarize: () => 'List custom sections',
  },
  {
    name: 'get_site_content',
    mode: 'read',
    description: `Read the editable text and lists of the main site: for every entry, its current value, its default, and whether a teacher has changed it. Call this before update_site_content so you edit the current value. Entries:\n${SITE_CONTENT_GUIDE}`,
    inputSchema: obj({}),
    toRequest: () => ({ method: 'GET', path: '/teacher/site-content' }),
    summarize: () => 'Read editable site text',
  },

  // ── Site text and events ─────────────────────────────────────────────────
  {
    name: 'update_site_content',
    mode: 'write',
    description: 'Replace one editable site entry (see get_site_content for the keys). Send the COMPLETE new value with the same shape as the current one: every field present, same types; lists may gain or lose items. Keep the writing warm, clear and suitable for children.',
    inputSchema: obj({
      key: { type: 'string', enum: SITE_CONTENT_KEYS, description: 'Which entry to change.' },
      value: { description: 'The complete new value, same shape as the current value.' },
    }, ['key', 'value']),
    toRequest: (i) => ({ method: 'PUT', path: `/teacher/site-content/${encodeURIComponent(String(i.key))}`, body: { value: i.value } }),
    summarize: (i) => `Update site text: ${SITE_CONTENT[i.key as keyof typeof SITE_CONTENT]?.label ?? i.key}`,
  },
  {
    name: 'reset_site_content',
    mode: 'write',
    description: 'Put one editable site entry back to its original default text.',
    inputSchema: obj({ key: { type: 'string', enum: SITE_CONTENT_KEYS } }, ['key']),
    toRequest: (i) => ({ method: 'DELETE', path: `/teacher/site-content/${encodeURIComponent(String(i.key))}` }),
    summarize: (i) => `Reset site text to default: ${SITE_CONTENT[i.key as keyof typeof SITE_CONTENT]?.label ?? i.key}`,
  },
  {
    name: 'create_section',
    mode: 'write',
    description: 'Create a new section of the website (for example "Jokes"). It gets its own page at /s/<slug> with the title and intro, appears in the site navigation (unless showInNav is false), and becomes a publish destination so student projects can be published to it. After creating one, offer to add a homepage tile for it (update_site_content on home.centers with href "/s/<slug>").',
    inputSchema: obj({
      title: str('Section title shown on the page and in navigation, e.g. "Jokes".', { minLength: 1, maxLength: 60 }),
      slug: str('Web address part, lowercase letters/numbers/hyphens, e.g. "jokes". Defaults to a slug made from the title.', { pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' }),
      intro: str('A friendly one- or two-sentence intro shown under the title.', { maxLength: 2000 }),
      emoji: str('Optional single emoji shown with the title, e.g. "😂".'),
      showInNav: { type: 'boolean', description: 'Show a link in the site navigation. Default true.' },
      navOrder: { type: 'integer', description: 'Lower numbers come first among custom sections. Default 100.' },
    }, ['title']),
    toRequest: (i) => ({ method: 'POST', path: '/teacher/sections', body: pick(i, ['title', 'slug', 'intro', 'emoji', 'showInNav', 'navOrder']) }),
    summarize: (i) => `Create website section "${i.title}"`,
  },
  {
    name: 'update_section',
    mode: 'write',
    description: 'Change a custom section\'s title, intro, emoji, navigation visibility or order, or rename its web address (slug). Published pages follow a renamed slug automatically.',
    inputSchema: obj({
      slug: str('Current slug from list_sections.', { minLength: 1 }),
      title: str('New title.', { minLength: 1, maxLength: 60 }),
      newSlug: str('New web address part.', { pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' }),
      intro: str('New intro text.', { maxLength: 2000 }),
      emoji: { type: ['string', 'null'], description: 'New emoji, or null to remove.' },
      showInNav: { type: 'boolean' },
      navOrder: { type: 'integer' },
    }, ['slug']),
    toRequest: (i) => ({
      method: 'PATCH', path: `/teacher/sections/${encodeURIComponent(String(i.slug))}`,
      body: { ...pick(i, ['title', 'intro', 'emoji', 'showInNav', 'navOrder']), ...(i.newSlug !== undefined ? { slug: i.newSlug } : {}) },
    }),
    summarize: (i) => `Update website section "${i.slug}"`,
  },
  {
    name: 'delete_section',
    mode: 'write',
    description: 'Remove a custom section and its page. Refused while pages are still published there; archive or re-publish those pages elsewhere first.',
    inputSchema: obj({ slug: str('Slug from list_sections.', { minLength: 1 }) }, ['slug']),
    toRequest: (i) => ({ method: 'DELETE', path: `/teacher/sections/${encodeURIComponent(String(i.slug))}` }),
    summarize: (i) => `Delete website section "${i.slug}"`,
  },
  {
    name: 'create_event',
    mode: 'write',
    description: 'Add an event to the Events page.',
    inputSchema: obj({
      title: str('Event title.', { minLength: 1, maxLength: 200 }),
      eventDate: str('Date as YYYY-MM-DD.', { pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
      description: str('Optional description.'),
      location: str('Optional location.'),
    }, ['title', 'eventDate']),
    toRequest: (i) => ({ method: 'POST', path: '/teacher/events', body: pick(i, ['title', 'eventDate', 'description', 'location']) }),
    summarize: (i) => `Add event "${i.title}" on ${i.eventDate}`,
  },
  {
    name: 'update_event',
    mode: 'write',
    description: 'Change an event\'s title, date, description or location. Use null to clear description or location.',
    inputSchema: obj({
      eventId: id('Event id from list_events.'),
      title: str('New title.'),
      eventDate: str('New date as YYYY-MM-DD.', { pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
      description: { type: ['string', 'null'] },
      location: { type: ['string', 'null'] },
    }, ['eventId']),
    toRequest: (i) => ({ method: 'PATCH', path: `/teacher/events/${i.eventId}`, body: pick(i, ['title', 'eventDate', 'description', 'location']) }),
    summarize: (i) => `Update event ${i.eventId}`,
  },
  {
    name: 'delete_event',
    mode: 'write',
    description: 'Remove an event from the Events page permanently.',
    inputSchema: obj({ eventId: id('Event id from list_events.') }, ['eventId']),
    toRequest: (i) => ({ method: 'DELETE', path: `/teacher/events/${i.eventId}` }),
    summarize: (i) => `Delete event ${i.eventId}`,
  },
  {
    name: 'list_friendship_requests',
    mode: 'read',
    description: 'List pending friendship-matching profile requests from students.',
    inputSchema: obj({}),
    toRequest: () => ({ method: 'GET', path: '/teacher/friendship/requests' }),
    summarize: () => 'List friendship requests',
  },

  // ── Website pages ────────────────────────────────────────────────────────
  {
    name: 'save_page_draft',
    mode: 'write',
    description: 'Save the website edition draft of a project (title, text, appearance, blocks). This does NOT change the live page; use decide_project with approve_and_publish afterwards to publish. Always call get_project first and pass back its publicationDraftVersion as `version`; include the complete edition with your edits applied.',
    inputSchema: obj({
      projectId: id('Project id.'),
      version: { type: 'integer', minimum: 0, description: 'publicationDraftVersion from get_project.' },
      draft: publicationEditionSchema,
    }, ['projectId', 'version', 'draft']),
    toRequest: (i) => ({
      method: 'PATCH', path: `/teacher/projects/${i.projectId}/publication-draft`,
      body: { draft: i.draft, version: i.version },
    }),
    summarize: (i) => `Save website draft for project ${i.projectId}: "${(i.draft as { title?: string })?.title ?? ''}"`,
  },
  {
    name: 'decide_project',
    mode: 'write',
    description: 'Record a teacher decision on a project. approve_and_publish puts the current website edition live in destinationSection (or re-publishes it with changes); archive takes a published page off the website; return_for_revision sends it back to the student with feedback; approve marks it approved without publishing; save_for_later keeps it in Teacher Reviewing.',
    inputSchema: obj({
      projectId: id('Project id.'),
      decision: { type: 'string', enum: ['approve', 'approve_and_publish', 'return_for_revision', 'save_for_later', 'archive'] },
      feedback: str('Feedback for the student. Required in spirit for return_for_revision.'),
      destinationSection: { type: 'string', description: `Website section. Required for approve_and_publish. One of the built-in sections (${PUBLICATION_SECTIONS.join(', ')}) or the slug of a teacher-created section from list_sections.` },
      authorDisplay: str('Author line shown on the page, e.g. "The Brightside Project Student Team". Must be one of the author display options from get_settings.'),
    }, ['projectId', 'decision']),
    toRequest: (i) => ({
      method: 'POST', path: `/teacher/projects/${i.projectId}/decision`,
      body: pick(i, ['decision', 'feedback', 'destinationSection', 'authorDisplay']),
    }),
    summarize: (i) => {
      const labels: Record<string, string> = {
        approve: 'Approve', approve_and_publish: 'Publish', return_for_revision: 'Return for revision',
        save_for_later: 'Save for later', archive: 'Archive',
      };
      return `${labels[String(i.decision)] ?? i.decision} project ${i.projectId}${i.destinationSection ? ` to ${i.destinationSection}` : ''}`;
    },
  },
  {
    name: 'create_website_page',
    mode: 'write',
    description: 'Create a new teacher-authored page project (status Teacher Reviewing) with an empty body. Afterwards use save_page_draft to write the content and decide_project to publish it.',
    inputSchema: obj({
      title: str('Page title.', { minLength: 1, maxLength: 200 }),
      contentType: str('Content type label, e.g. "Article", "Recipe", "Activity".', { minLength: 1, maxLength: 100 }),
    }, ['title', 'contentType']),
    toRequest: (i) => ({ method: 'POST', path: '/teacher/projects', body: pick(i, ['title', 'contentType']) }),
    summarize: (i) => `Create page "${i.title}" (${i.contentType})`,
  },
  {
    name: 'update_project_text',
    mode: 'write',
    description: "Edit a project's original title, body text or notes (the student's working copy, not the website edition). Prefer save_page_draft for anything that should show on the website.",
    inputSchema: obj({
      projectId: id('Project id.'),
      title: str('New title.'),
      content: str('New body text.'),
      notes: str('New notes.'),
    }, ['projectId']),
    toRequest: (i) => ({ method: 'PATCH', path: `/studio/projects/${i.projectId}`, body: pick(i, ['title', 'content', 'notes']) }),
    summarize: (i) => `Edit project ${i.projectId} text (${Object.keys(pick(i, ['title', 'content', 'notes'])).join(', ')})`,
  },
  {
    name: 'assign_peer_reviewer',
    mode: 'write',
    description: 'Assign a student as peer reviewer of a project and move it to Peer Review. reviewerId is the student userId from list_students.',
    inputSchema: obj({
      projectId: id('Project id.'),
      reviewerId: str('Student userId.'),
    }, ['projectId', 'reviewerId']),
    toRequest: (i) => ({ method: 'POST', path: `/teacher/projects/${i.projectId}/assign-reviewer`, body: { reviewerId: i.reviewerId } }),
    summarize: (i) => `Assign reviewer ${i.reviewerId} to project ${i.projectId}`,
  },

  // ── Community moderation ─────────────────────────────────────────────────
  {
    name: 'approve_moderation_item',
    mode: 'write',
    description: 'Approve a pending community item so it appears on the site. Types: blog (blog submission), collab-post (Connect post), comment (Connect comment), content-comment (comment on a content page), review (site review).',
    inputSchema: obj({
      type: { type: 'string', enum: MODERATION_TYPES },
      itemId: id('Item id from list_moderation_items.'),
    }, ['type', 'itemId']),
    toRequest: (i) => ({ method: 'POST', path: `/teacher/moderation/${i.type}/${i.itemId}/approve` }),
    summarize: (i) => `Approve ${i.type} #${i.itemId}`,
  },
  {
    name: 'remove_moderation_item',
    mode: 'write',
    description: 'Permanently delete a community item (pending items of any type; Connect posts even when approved, which also deletes their comments).',
    inputSchema: obj({
      type: { type: 'string', enum: MODERATION_TYPES },
      itemId: id('Item id from list_moderation_items.'),
    }, ['type', 'itemId']),
    toRequest: (i) => ({ method: 'DELETE', path: `/teacher/moderation/${i.type}/${i.itemId}` }),
    summarize: (i) => `Delete ${i.type} #${i.itemId}`,
  },
  {
    name: 'reply_to_review',
    mode: 'write',
    description: 'Set or clear the teacher reply shown under a site review (max 2000 characters; empty string clears it).',
    inputSchema: obj({
      reviewId: id('Review id.'),
      reply: str('Reply text.', { maxLength: 2000 }),
    }, ['reviewId', 'reply']),
    toRequest: (i) => ({ method: 'PUT', path: `/teacher/reviews/${i.reviewId}/reply`, body: { reply: i.reply } }),
    summarize: (i) => `Reply to review #${i.reviewId}`,
  },

  // ── Galleries ────────────────────────────────────────────────────────────
  {
    name: 'review_artwork',
    mode: 'write',
    description: 'Approve or reject a student artwork submission, and/or set it as Featured Artist for a month (YYYY-MM). Pass featuredMonth null to clear the feature.',
    inputSchema: obj({
      artworkId: id('Artwork id.'),
      status: { type: 'string', enum: ['approved', 'rejected'] },
      featuredMonth: { type: ['string', 'null'], pattern: '^\\d{4}-(0[1-9]|1[0-2])$', description: 'YYYY-MM or null.' },
    }, ['artworkId']),
    toRequest: (i) => ({ method: 'PATCH', path: `/teacher/artwork/${i.artworkId}`, body: pick(i, ['status', 'featuredMonth']) }),
    summarize: (i) => `Artwork #${i.artworkId}: ${[i.status, i.featuredMonth === null ? 'clear feature' : i.featuredMonth ? `feature ${i.featuredMonth}` : null].filter(Boolean).join(', ')}`,
  },
  {
    name: 'review_athlete_submission',
    mode: 'write',
    description: 'Approve or reject an Athlete of the Month submission, and/or set its featured month (YYYY-MM). Pass featuredMonth null to clear.',
    inputSchema: obj({
      submissionId: id('Submission id.'),
      status: { type: 'string', enum: ['approved', 'rejected'] },
      featuredMonth: { type: ['string', 'null'], pattern: '^\\d{4}-(0[1-9]|1[0-2])$', description: 'YYYY-MM or null.' },
    }, ['submissionId']),
    toRequest: (i) => ({ method: 'PATCH', path: `/teacher/athlete/${i.submissionId}`, body: pick(i, ['status', 'featuredMonth']) }),
    summarize: (i) => `Athlete submission #${i.submissionId}: ${[i.status, i.featuredMonth === null ? 'clear feature' : i.featuredMonth ? `feature ${i.featuredMonth}` : null].filter(Boolean).join(', ')}`,
  },

  // ── Settings ─────────────────────────────────────────────────────────────
  {
    name: 'update_author_display_options',
    mode: 'write',
    description: 'Replace the list of author display options teachers can choose when publishing. Send the complete new list.',
    inputSchema: obj({
      authorDisplayOptions: { type: 'array', items: { type: 'string', minLength: 1 }, minItems: 1 },
    }, ['authorDisplayOptions']),
    toRequest: (i) => ({ method: 'PATCH', path: '/teacher/settings', body: { authorDisplayOptions: i.authorDisplayOptions } }),
    summarize: (i) => `Set author display options (${(i.authorDisplayOptions as string[]).length})`,
  },
  {
    name: 'update_impact_visibility',
    mode: 'write',
    description: 'Choose which impact statistics are shown on the public site. Setting keys come from get_analytics.',
    inputSchema: obj({
      settings: {
        type: 'array', minItems: 1,
        items: obj({ settingKey: { type: 'string' }, isVisible: { type: 'boolean' } }, ['settingKey', 'isVisible']),
      },
    }, ['settings']),
    toRequest: (i) => ({ method: 'PATCH', path: '/teacher/analytics/impact-settings', body: { settings: i.settings } }),
    summarize: (i) => `Update impact visibility (${(i.settings as unknown[]).length} settings)`,
  },

  // ── Students, teams, jobs, cycles, handoffs ──────────────────────────────
  {
    name: 'create_student',
    mode: 'write',
    description: 'Pre-create a student profile so the student is enrolled when they sign in with that email.',
    inputSchema: obj({
      displayName: str('Student display name.', { minLength: 1 }),
      email: str('School email (optional).'),
      teamId: id('Team id (optional).'),
      jobId: id('Job id (optional).'),
      cycleId: id('Class cycle id (optional).'),
    }, ['displayName']),
    toRequest: (i) => ({ method: 'POST', path: '/teacher/students', body: pick(i, ['displayName', 'email', 'teamId', 'jobId', 'cycleId']) }),
    summarize: (i) => `Add student "${i.displayName}"`,
  },
  {
    name: 'update_student',
    mode: 'write',
    description: "Change a student's display name, team, job, class cycle or account status. Use null for teamId/jobId/cycleId to unassign.",
    inputSchema: obj({
      studentId: id('Student profile id from list_students.'),
      displayName: str('New display name.'),
      teamId: { type: ['integer', 'null'] },
      jobId: { type: ['integer', 'null'] },
      cycleId: { type: ['integer', 'null'] },
      accountStatus: { type: 'string', enum: ['active', 'disabled'] },
    }, ['studentId']),
    toRequest: (i) => ({ method: 'PATCH', path: `/teacher/students/${i.studentId}`, body: pick(i, ['displayName', 'teamId', 'jobId', 'cycleId', 'accountStatus']) }),
    summarize: (i) => `Update student ${i.studentId} (${Object.keys(pick(i, ['displayName', 'teamId', 'jobId', 'cycleId', 'accountStatus'])).join(', ')})`,
  },
  {
    name: 'create_team',
    mode: 'write',
    description: 'Create a Studio team.',
    inputSchema: obj({ name: str('Team name.', { minLength: 1 }), description: str('Optional description.') }, ['name']),
    toRequest: (i) => ({ method: 'POST', path: '/teacher/teams', body: pick(i, ['name', 'description']) }),
    summarize: (i) => `Create team "${i.name}"`,
  },
  {
    name: 'update_team',
    mode: 'write',
    description: "Rename a team or change its description.",
    inputSchema: obj({ teamId: id('Team id.'), name: str('New name.'), description: str('New description.') }, ['teamId']),
    toRequest: (i) => ({ method: 'PATCH', path: `/teacher/teams/${i.teamId}`, body: pick(i, ['name', 'description']) }),
    summarize: (i) => `Update team ${i.teamId}`,
  },
  {
    name: 'delete_team',
    mode: 'write',
    description: 'Delete a team.',
    inputSchema: obj({ teamId: id('Team id.') }, ['teamId']),
    toRequest: (i) => ({ method: 'DELETE', path: `/teacher/teams/${i.teamId}` }),
    summarize: (i) => `Delete team ${i.teamId}`,
  },
  {
    name: 'create_job',
    mode: 'write',
    description: 'Create a job group (e.g. "Writers"). Login usernames and passwords cannot be set through the assistant; teachers do that in the Jobs page.',
    inputSchema: obj({ title: str('Job title.', { minLength: 1 }), description: str('Optional description.') }, ['title']),
    toRequest: (i) => ({ method: 'POST', path: '/teacher/jobs', body: pick(i, ['title', 'description']) }),
    summarize: (i) => `Create job "${i.title}"`,
  },
  {
    name: 'update_job',
    mode: 'write',
    description: 'Rename a job group or change its description.',
    inputSchema: obj({ jobId: id('Job id.'), title: str('New title.'), description: str('New description.') }, ['jobId']),
    toRequest: (i) => ({ method: 'PATCH', path: `/teacher/jobs/${i.jobId}`, body: pick(i, ['title', 'description']) }),
    summarize: (i) => `Update job ${i.jobId}`,
  },
  {
    name: 'delete_job',
    mode: 'write',
    description: 'Delete a job group.',
    inputSchema: obj({ jobId: id('Job id.') }, ['jobId']),
    toRequest: (i) => ({ method: 'DELETE', path: `/teacher/jobs/${i.jobId}` }),
    summarize: (i) => `Delete job ${i.jobId}`,
  },
  {
    name: 'create_cycle',
    mode: 'write',
    description: 'Create a class cycle (term). Dates are YYYY-MM-DD. Making it active deactivates the others.',
    inputSchema: obj({
      name: str('Cycle name, e.g. "Spring 2027".', { minLength: 1 }),
      startDate: str('YYYY-MM-DD'), endDate: str('YYYY-MM-DD'),
      isActive: { type: 'boolean' },
    }, ['name']),
    toRequest: (i) => ({ method: 'POST', path: '/teacher/cycles', body: pick(i, ['name', 'startDate', 'endDate', 'isActive']) }),
    summarize: (i) => `Create cycle "${i.name}"`,
  },
  {
    name: 'update_cycle',
    mode: 'write',
    description: "Change a class cycle's name, dates or active flag.",
    inputSchema: obj({
      cycleId: id('Cycle id.'), name: str('New name.'),
      startDate: str('YYYY-MM-DD'), endDate: str('YYYY-MM-DD'), isActive: { type: 'boolean' },
    }, ['cycleId']),
    toRequest: (i) => ({ method: 'PATCH', path: `/teacher/cycles/${i.cycleId}`, body: pick(i, ['name', 'startDate', 'endDate', 'isActive']) }),
    summarize: (i) => `Update cycle ${i.cycleId}`,
  },
  {
    name: 'update_handoff',
    mode: 'write',
    description: 'Change a handoff: make it visible to the next students, add teacher notes, or set the next cycle.',
    inputSchema: obj({
      handoffId: id('Handoff id.'), isVisible: { type: 'boolean' },
      teacherNotes: str('Teacher notes.'), nextCycleId: id('Next cycle id.'),
    }, ['handoffId']),
    toRequest: (i) => ({ method: 'PATCH', path: `/teacher/handoffs/${i.handoffId}`, body: pick(i, ['isVisible', 'teacherNotes', 'nextCycleId']) }),
    summarize: (i) => `Update handoff ${i.handoffId}`,
  },
  {
    name: 'assign_handoff',
    mode: 'write',
    description: 'Assign a handoff to a job group (and optionally a cycle) so those students pick the project up.',
    inputSchema: obj({ handoffId: id('Handoff id.'), jobId: id('Job id.'), cycleId: id('Cycle id (optional).') }, ['handoffId', 'jobId']),
    toRequest: (i) => ({ method: 'POST', path: `/teacher/handoffs/${i.handoffId}/assign`, body: pick(i, ['jobId', 'cycleId']) }),
    summarize: (i) => `Assign handoff ${i.handoffId} to job ${i.jobId}`,
  },
  {
    name: 'decide_friendship_request',
    mode: 'write',
    description: 'Approve or reject a student friendship-matching profile request. userId comes from list_friendship_requests.',
    inputSchema: obj({ userId: str('Student userId.', { minLength: 1 }), decision: { type: 'string', enum: ['approve', 'reject'] } }, ['userId', 'decision']),
    toRequest: (i) => ({ method: 'POST', path: `/teacher/friendship/requests/${encodeURIComponent(String(i.userId))}/decision`, body: { decision: i.decision } }),
    summarize: (i) => `${i.decision === 'approve' ? 'Approve' : 'Reject'} friendship request from ${i.userId}`,
  },
];

export const toolsByName = new Map(ASSISTANT_TOOLS.map((t) => [t.name, t]));

/** The tool list in Claude API shape. Order is fixed so prompt caching stays valid. */
export const anthropicToolDefinitions: Anthropic.Beta.BetaTool[] = ASSISTANT_TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  input_schema: t.inputSchema,
}));
