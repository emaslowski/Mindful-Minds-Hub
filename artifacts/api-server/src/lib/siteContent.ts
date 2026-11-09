/**
 * Effective site content = teacher override from the `site_content` table,
 * else the default from @workspace/site-content. Overrides are cached for a
 * few seconds because the public site asks for them on every page load.
 */
import { db } from '@workspace/db';
import { siteContentTable } from '@workspace/db/schema';
import {
  SITE_CONTENT,
  isSiteContentKey,
  type SiteContentKey,
  type SiteContentValue,
  type SiteContentValues,
} from '@workspace/site-content';
import { eq } from 'drizzle-orm';

const CACHE_MS = 5_000;
let cache: { at: number; values: SiteContentValues } | null = null;

export async function getSiteContentOverrides(): Promise<SiteContentValues> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.values;
  const rows = await db.select().from(siteContentTable);
  const values: SiteContentValues = {};
  for (const row of rows) {
    if (isSiteContentKey(row.key)) (values as Record<string, unknown>)[row.key] = row.value;
  }
  cache = { at: Date.now(), values };
  return values;
}

export async function getSiteContent<K extends SiteContentKey>(key: K): Promise<SiteContentValue<K>> {
  const overrides = await getSiteContentOverrides();
  return (overrides[key] ?? SITE_CONTENT[key].default) as SiteContentValue<K>;
}

export async function setSiteContent(key: SiteContentKey, value: unknown, updatedBy: string | null): Promise<void> {
  await db.insert(siteContentTable)
    .values({ key, value, updatedBy, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteContentTable.key, set: { value, updatedBy, updatedAt: new Date() } });
  cache = null;
}

export async function resetSiteContent(key: SiteContentKey): Promise<void> {
  await db.delete(siteContentTable).where(eq(siteContentTable.key, key));
  cache = null;
}
