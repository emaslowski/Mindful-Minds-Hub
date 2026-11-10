/**
 * Teacher-created website sections (pages at /s/<slug>).
 */
import { useQuery } from '@tanstack/react-query';

export interface SiteSection {
  id: number;
  slug: string;
  title: string;
  intro: string;
  emoji: string | null;
  showInNav: boolean;
  navOrder: number;
  path: string;
}

async function fetchSections(): Promise<SiteSection[]> {
  const res = await fetch('/api/public/sections', { credentials: 'include' });
  if (!res.ok) return [];
  const body = (await res.json()) as { sections?: SiteSection[] };
  return body.sections ?? [];
}

export function useSiteSections() {
  return useQuery({ queryKey: ['site-sections'], queryFn: fetchSections, staleTime: 60 * 1000, retry: 1 });
}
