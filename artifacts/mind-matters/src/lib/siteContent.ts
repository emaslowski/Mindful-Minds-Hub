/**
 * Editable site content for the main site.
 *
 * `useSiteContent('home.hero')` returns the teacher's override when one
 * exists, otherwise the default from @workspace/site-content. Pages render
 * immediately with the default and switch to the override once loaded, so a
 * failed or slow request never blanks a page.
 */
import { useQuery } from '@tanstack/react-query';
import { SITE_CONTENT, type SiteContentKey, type SiteContentValue, type SiteContentValues } from '@workspace/site-content';

async function fetchOverrides(): Promise<SiteContentValues> {
  const res = await fetch('/api/public/site-content', { credentials: 'include' });
  if (!res.ok) return {};
  const body = (await res.json()) as { values?: SiteContentValues };
  return body.values ?? {};
}

export function useSiteContentOverrides() {
  return useQuery({
    queryKey: ['site-content'],
    queryFn: fetchOverrides,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useSiteContent<K extends SiteContentKey>(key: K): SiteContentValue<K> {
  const { data } = useSiteContentOverrides();
  return (data?.[key] ?? SITE_CONTENT[key].default) as SiteContentValue<K>;
}
