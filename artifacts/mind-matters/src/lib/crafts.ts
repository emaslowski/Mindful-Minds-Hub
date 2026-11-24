/**
 * Craft Corner: craft ideas teachers post from the Command Center.
 */
import { useQuery } from '@tanstack/react-query';

export interface Craft {
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

async function fetchCrafts(): Promise<Craft[]> {
  const res = await fetch('/api/crafts', { credentials: 'include' });
  if (!res.ok) throw new Error('Crafts could not be loaded');
  const body = (await res.json()) as { crafts?: Craft[] };
  return body.crafts ?? [];
}

export function useCrafts() {
  return useQuery({ queryKey: ['crafts'], queryFn: fetchCrafts, staleTime: 30 * 1000, refetchOnWindowFocus: true, retry: 1 });
}
