/**
 * Craft Corner helpers: input validation and the JSON shape shared by the
 * public hub pages and the Teacher Command Center. Kept free of database
 * imports so it can be unit tested on its own.
 */
import type { Craft } from '@workspace/db';

export const CRAFT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const CRAFT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

/** One item per line; blank lines and list markers ("1.", "-", "*") are dropped. */
export function splitLines(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim()).filter(Boolean);
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.length > 0;
  } catch {
    return false;
  }
}

export interface CraftJson {
  id: number;
  title: string;
  description: string;
  materials: string[];
  steps: string[];
  link: string | null;
  published: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export function serializeCraft(row: Craft): CraftJson {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    materials: splitLines(row.materials),
    steps: splitLines(row.steps),
    link: row.link,
    published: row.published,
    // updatedAt in the query string so a replaced photo is not served from cache.
    imageUrl: row.imageReady && row.imageObjectPath ? `/api/crafts/${row.id}/image?v=${row.updatedAt.getTime()}` : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface CraftInput {
  title?: unknown; description?: unknown; materials?: unknown; steps?: unknown; link?: unknown; published?: unknown;
}

export type CraftValues = Partial<Pick<Craft, 'title' | 'description' | 'materials' | 'steps' | 'link' | 'published'>>;

/** Materials and steps may arrive as a newline-separated string or an array of strings. */
function linesField(value: unknown, name: string, max: number): { error: string } | { text: string } {
  const text = Array.isArray(value) ? value.map(String).join('\n') : value;
  if (typeof text !== 'string') return { error: `${name} must be text, one item per line.` };
  if (text.length > max) return { error: `${name} is too long (up to ${max} characters).` };
  return { text: splitLines(text).join('\n') };
}

export function parseCraft(body: CraftInput, partial: boolean): { error: string } | { values: CraftValues } {
  const values: CraftValues = {};
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 120) return { error: 'Give the craft a title of up to 120 characters.' };
    values.title = body.title.trim();
  } else if (!partial) return { error: 'Give the craft a title.' };
  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || body.description.length > 2000) return { error: 'description must be text of up to 2000 characters.' };
    values.description = body.description.trim();
  }
  if (body.materials !== undefined) {
    const r = linesField(body.materials, 'materials', 2000);
    if ('error' in r) return r;
    values.materials = r.text;
  }
  if (body.steps !== undefined) {
    const r = linesField(body.steps, 'steps', 6000);
    if ('error' in r) return r;
    values.steps = r.text;
  }
  if (body.link !== undefined) {
    if (body.link === null || (typeof body.link === 'string' && !body.link.trim())) values.link = null;
    else if (typeof body.link !== 'string' || body.link.length > 500 || !isSafeHttpUrl(body.link.trim())) return { error: 'link must be a full web address starting with https:// (or empty).' };
    else values.link = body.link.trim();
  }
  if (body.published !== undefined) {
    if (typeof body.published !== 'boolean') return { error: 'published must be true or false.' };
    values.published = body.published;
  }
  return { values };
}

export interface CraftImageRequest { filename?: unknown; contentType?: unknown; size?: unknown }

export function parseCraftImage(body: CraftImageRequest): { error: string } | { filename: string; contentType: string; size: number } {
  const { filename, contentType, size } = body;
  if (typeof contentType !== 'string' || !(CRAFT_IMAGE_TYPES as readonly string[]).includes(contentType)) {
    return { error: 'Choose a JPG, PNG, WebP or GIF photo.' };
  }
  if (typeof size !== 'number' || !Number.isSafeInteger(size) || size < 1) return { error: 'The photo file looks empty. Choose it again.' };
  if (size > CRAFT_IMAGE_MAX_BYTES) return { error: `Choose a photo smaller than ${CRAFT_IMAGE_MAX_BYTES / 1024 / 1024} MB.` };
  return { filename: typeof filename === 'string' ? filename.slice(0, 200) : 'photo', contentType, size };
}
