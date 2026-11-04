import { studioFetch } from './studioApi';
import { uploadVideoContentType } from '@workspace/api-client-react';
import type { VideoProductionEnvelope, VideoProductionsEnvelope, VideoUploadTicket } from '@workspace/api-client-react';

export const isVideoProducer = (jobTitle?: string | null) =>
  /^(video producers?|videographers?)$/i.test(jobTitle?.trim() ?? '');

export const videoProductions = {
  list: () => studioFetch<VideoProductionsEnvelope>('/studio/video-productions'),
  get: (projectId: number) => studioFetch<VideoProductionEnvelope>(`/studio/video-productions/${projectId}`),
  requestUpload: (projectId: number, file: File) =>
    studioFetch<VideoUploadTicket>(`/studio/video-productions/${projectId}/upload-url`, {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, contentType: uploadVideoContentType(file), size: file.size }),
    }),
  complete: (projectId: number, objectPath: string) =>
    studioFetch<{ success: boolean; message: string }>(`/studio/video-productions/${projectId}/complete`, {
      method: 'POST', body: JSON.stringify({ objectPath }),
    }),
};

export function videoMimeForName(name: string) {
  const extension = name.split('.').at(-1)?.toLowerCase();
  return ({ mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', ogv: 'video/ogg' } as Record<string, string>)[extension ?? ''] ?? '';
}
