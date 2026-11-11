/**
 * Coding Lab lesson validation, starter seeding, and the block-to-content
 * conversion used when a student sends a built page to their teacher.
 */
import { db } from '@workspace/db';
import {
  codingLabLessonsTable,
  type CodingLabBlock,
  type CodingLabBlockType,
  type CodingLabLesson,
  type CodingLabStep,
} from '@workspace/db/schema';
import { sql } from 'drizzle-orm';
import { slugify } from '../../routes/sections';
import { STARTER_LESSONS } from './starterLessons';

export const BLOCK_TYPES: CodingLabBlockType[] = ['heading', 'paragraph', 'list', 'quote', 'tip', 'button', 'divider'];
export const STEP_TYPES = ['read', 'quiz', 'build', 'prompt'] as const;

const MAX_STEPS = 40;
const MAX_TEXT = 8000;

type Result<T> = { error: string } | { value: T };

function text(v: unknown, field: string, max = MAX_TEXT, required = true): Result<string> {
  if (v === undefined || v === null) {
    if (required) return { error: `${field} is required.` };
    return { value: '' };
  }
  if (typeof v !== 'string') return { error: `${field} must be text.` };
  const trimmed = v.trim();
  if (required && !trimmed) return { error: `${field} cannot be empty.` };
  if (trimmed.length > max) return { error: `${field} is too long (max ${max} characters).` };
  return { value: trimmed };
}

function stringList(v: unknown, field: string, min: number, max: number, itemMax: number): Result<string[]> {
  if (!Array.isArray(v)) return { error: `${field} must be a list.` };
  const items = v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
  if (items.length < min) return { error: `${field} needs at least ${min} item${min === 1 ? '' : 's'}.` };
  if (items.length > max) return { error: `${field} can have at most ${max} items.` };
  if (items.some((x) => x.length > itemMax)) return { error: `Each item in ${field} must be under ${itemMax} characters.` };
  return { value: items };
}

export function validateStep(raw: unknown, index: number): Result<CodingLabStep> {
  const where = `Step ${index + 1}`;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: `${where} must be an object.` };
  const s = raw as Record<string, unknown>;
  if (!STEP_TYPES.includes(s.type as typeof STEP_TYPES[number])) return { error: `${where}: type must be one of ${STEP_TYPES.join(', ')}.` };
  const title = text(s.title, `${where} title`, 120);
  if ('error' in title) return title;

  switch (s.type) {
    case 'read': {
      const body = text(s.body, `${where} body`);
      if ('error' in body) return body;
      return { value: { type: 'read', title: title.value, body: body.value } };
    }
    case 'quiz': {
      const question = text(s.question, `${where} question`, 1000);
      if ('error' in question) return question;
      const options = stringList(s.options, `${where} options`, 2, 6, 300);
      if ('error' in options) return options;
      const answer = Number(s.answer);
      if (!Number.isInteger(answer) || answer < 0 || answer >= options.value.length) return { error: `${where}: answer must be the index of the correct option (0 to ${options.value.length - 1}).` };
      const explanation = text(s.explanation, `${where} explanation`, 2000, false);
      if ('error' in explanation) return explanation;
      return { value: { type: 'quiz', title: title.value, question: question.value, options: options.value, answer, explanation: explanation.value } };
    }
    case 'build': {
      const instructions = text(s.instructions, `${where} instructions`, 4000);
      if ('error' in instructions) return instructions;
      const requiredRaw = s.required === undefined ? [] : s.required;
      if (!Array.isArray(requiredRaw) || requiredRaw.some((t) => !BLOCK_TYPES.includes(t as CodingLabBlockType))) {
        return { error: `${where}: required must be a list of block types (${BLOCK_TYPES.join(', ')}).` };
      }
      const required = [...new Set(requiredRaw as CodingLabBlockType[])];
      const minBlocks = s.minBlocks === undefined ? Math.max(1, required.length) : Number(s.minBlocks);
      if (!Number.isInteger(minBlocks) || minBlocks < 0 || minBlocks > 50) return { error: `${where}: minBlocks must be a whole number from 0 to 50.` };
      return { value: { type: 'build', title: title.value, instructions: instructions.value, required, minBlocks } };
    }
    case 'prompt': {
      const instructions = text(s.instructions, `${where} instructions`, 4000);
      if ('error' in instructions) return instructions;
      if (!Array.isArray(s.groups) || s.groups.length < 1 || s.groups.length > 6) return { error: `${where}: groups must be a list of 1 to 6 chip groups.` };
      const groups: Array<{ label: string; chips: string[] }> = [];
      for (const [gi, g] of (s.groups as unknown[]).entries()) {
        if (!g || typeof g !== 'object') return { error: `${where}: group ${gi + 1} must be an object.` };
        const label = text((g as Record<string, unknown>).label, `${where} group ${gi + 1} label`, 60);
        if ('error' in label) return label;
        const chips = stringList((g as Record<string, unknown>).chips, `${where} group ${gi + 1} chips`, 1, 12, 160);
        if ('error' in chips) return chips;
        groups.push({ label: label.value, chips: chips.value });
      }
      return { value: { type: 'prompt', title: title.value, instructions: instructions.value, groups, allowAi: s.allowAi !== false } };
    }
  }
  return { error: `${where}: unknown step type.` };
}

export interface LessonInput {
  slug?: string; title?: string; emoji?: string | null; summary?: string; steps?: unknown; published?: boolean; sortOrder?: number;
}

/** Validates a lesson body. `partial` allows omitting fields (PATCH). */
export function validateLesson(body: LessonInput, partial: boolean): Result<Partial<typeof codingLabLessonsTable.$inferInsert>> {
  const values: Partial<typeof codingLabLessonsTable.$inferInsert> = {};
  if (body.title !== undefined || !partial) {
    const title = text(body.title, 'title', 120);
    if ('error' in title) return title;
    values.title = title.value;
  }
  if (body.slug !== undefined) {
    const slug = slugify(String(body.slug));
    if (slug.length < 2) return { error: 'The web address part (slug) must have at least 2 letters or numbers.' };
    values.slug = slug;
  }
  if (body.summary !== undefined) {
    const summary = text(body.summary, 'summary', 500, false);
    if ('error' in summary) return summary;
    values.summary = summary.value;
  }
  if (body.emoji !== undefined) {
    if (body.emoji !== null && (typeof body.emoji !== 'string' || [...body.emoji].length > 2)) return { error: 'emoji must be a single emoji or null.' };
    values.emoji = body.emoji === null ? null : body.emoji.trim() || null;
  }
  if (body.steps !== undefined || !partial) {
    if (!Array.isArray(body.steps) || body.steps.length === 0) return { error: 'A lesson needs at least one step.' };
    if (body.steps.length > MAX_STEPS) return { error: `A lesson can have at most ${MAX_STEPS} steps.` };
    const steps: CodingLabStep[] = [];
    for (const [i, raw] of body.steps.entries()) {
      const step = validateStep(raw, i);
      if ('error' in step) return step;
      steps.push(step.value);
    }
    values.steps = steps;
  }
  if (body.published !== undefined) {
    if (typeof body.published !== 'boolean') return { error: 'published must be true or false.' };
    values.published = body.published;
  }
  if (body.sortOrder !== undefined) {
    if (!Number.isSafeInteger(body.sortOrder)) return { error: 'sortOrder must be a whole number.' };
    values.sortOrder = body.sortOrder;
  }
  return { value: values };
}

const MAX_BLOCKS = 60;

/** Validates a student's page blocks; returns cleaned blocks or an error. */
export function validateBlocks(raw: unknown): Result<CodingLabBlock[]> {
  if (!Array.isArray(raw)) return { error: 'blocks must be a list.' };
  if (raw.length > MAX_BLOCKS) return { error: `A page can have at most ${MAX_BLOCKS} blocks.` };
  const out: CodingLabBlock[] = [];
  const ids = new Set<string>();
  for (const [i, b] of raw.entries()) {
    if (!b || typeof b !== 'object') return { error: `Block ${i + 1} is not valid.` };
    const block = b as Record<string, unknown>;
    if (!BLOCK_TYPES.includes(block.type as CodingLabBlockType)) return { error: `Block ${i + 1} has an unknown type.` };
    const id = typeof block.id === 'string' && block.id.length <= 40 && block.id ? block.id : `b${i}`;
    if (ids.has(id)) return { error: 'Block ids must be unique.' };
    ids.add(id);
    const clean: CodingLabBlock = { id, type: block.type as CodingLabBlockType };
    const str = (k: string, max: number) => {
      const v = block[k];
      if (v === undefined || v === null) return undefined;
      if (typeof v !== 'string') throw new Error(`Block ${i + 1}: ${k} must be text.`);
      if (v.length > max) throw new Error(`Block ${i + 1}: ${k} is too long.`);
      return v;
    };
    try {
      switch (clean.type) {
        case 'heading': clean.text = str('text', 200) ?? ''; break;
        case 'paragraph': case 'tip': clean.text = str('text', 4000) ?? ''; break;
        case 'quote': clean.text = str('text', 1000) ?? ''; clean.by = str('by', 100) ?? ''; break;
        case 'list': {
          const items = Array.isArray(block.items) ? block.items : [];
          if (items.length > 30 || items.some((x) => typeof x !== 'string' || x.length > 500)) throw new Error(`Block ${i + 1}: list items must be short text (max 30 items).`);
          clean.items = items as string[];
          break;
        }
        case 'button': {
          clean.label = str('label', 80) ?? '';
          const href = (str('href', 300) ?? '/').trim();
          // Only links to pages on this site: students cannot send readers off-site.
          if (!/^\/[a-zA-Z0-9\-_/]*$/.test(href)) throw new Error(`Block ${i + 1}: the link must be a page on this site, like /games.`);
          clean.href = href;
          break;
        }
        case 'divider': clean.emoji = str('emoji', 8) ?? ''; break;
      }
    } catch (err) {
      return { error: (err as Error).message };
    }
    out.push(clean);
  }
  return { value: out };
}

/** Turns built blocks into the `## Heading\nbody` text a Studio project uses. */
export function blocksToProjectContent(blocks: CodingLabBlock[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case 'heading': parts.push(`## ${b.text ?? ''}`); break;
      case 'paragraph': parts.push(b.text ?? ''); break;
      case 'list': parts.push((b.items ?? []).map((i) => `- ${i}`).join('\n')); break;
      case 'quote': parts.push(`> ${b.text ?? ''}${b.by ? `\n> — ${b.by}` : ''}`); break;
      case 'tip': parts.push(`💡 ${b.text ?? ''}`); break;
      case 'button': parts.push(`[${b.label ?? 'Open'}](${b.href ?? '/'})`); break;
      case 'divider': parts.push(b.emoji ? `${b.emoji} ${b.emoji} ${b.emoji}` : '---'); break;
    }
  }
  // Project content is expected to start with a "## Section" heading.
  const joined = parts.join('\n\n').trim();
  return joined.startsWith('## ') ? joined : `## My page\n\n${joined}`;
}

/** Whether a build satisfies a build step's requirements. */
export function buildMeetsStep(blocks: CodingLabBlock[], step: Extract<CodingLabStep, { type: 'build' }>): boolean {
  const types = new Set(blocks.map((b) => b.type));
  return blocks.length >= step.minBlocks && step.required.every((t) => types.has(t));
}

/** Inserts the starter lessons that are missing. Returns how many were added. */
export async function restoreStarterLessons(createdBy: string | null): Promise<number> {
  const inserted = await db.insert(codingLabLessonsTable)
    .values(STARTER_LESSONS.map((l) => ({ ...l, published: true, createdBy })))
    .onConflictDoNothing({ target: codingLabLessonsTable.slug })
    .returning({ id: codingLabLessonsTable.id });
  return inserted.length;
}

/** Seeds the starter lessons the first time the lab is opened on an empty site. */
export async function ensureStarterLessons(): Promise<void> {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(codingLabLessonsTable);
  if (n === 0) await restoreStarterLessons(null);
}

export function lessonSummary(l: CodingLabLesson) {
  return {
    id: l.id, slug: l.slug, title: l.title, emoji: l.emoji, summary: l.summary,
    stepCount: l.steps.length, published: l.published, sortOrder: l.sortOrder,
    updatedAt: l.updatedAt.toISOString(),
  };
}

export function lessonFull(l: CodingLabLesson) {
  return { ...lessonSummary(l), steps: l.steps, createdAt: l.createdAt.toISOString() };
}
