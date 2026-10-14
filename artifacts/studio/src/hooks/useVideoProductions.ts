import { useQuery } from '@tanstack/react-query';
import { videoProductions } from '@/lib/videoApi';

export const videoProductionsQueueKey = (userId?: number, jobId?: number | null) =>
  ['studio-video-productions', userId, jobId ?? null] as const;

export const videoProductionDetailKey = (projectId: number, userId?: number, jobId?: number | null) =>
  ['studio-video-production', projectId, userId, jobId ?? null] as const;

export function useVideoProductions(userId?: number, jobId?: number | null, enabled = true) {
  return useQuery({
    queryKey: videoProductionsQueueKey(userId, jobId),
    queryFn: videoProductions.list,
    enabled,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useVideoProduction(projectId: number, userId?: number, jobId?: number | null, enabled = true) {
  return useQuery({
    queryKey: videoProductionDetailKey(projectId, userId, jobId),
    queryFn: () => videoProductions.get(projectId),
    enabled: enabled && Number.isFinite(projectId) && projectId > 0,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}
