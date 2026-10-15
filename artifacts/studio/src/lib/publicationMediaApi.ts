import { studioFetch, type PublicationMedia } from '@/lib/studioApi';

const uploadContentType = (file: File) =>
  file.type === 'audio/wave' ? 'audio/wav' : file.type === 'audio/x-m4a' ? 'audio/mp4' : file.type;

export const publicationMediaApi = {
  list: (projectId: number) =>
    studioFetch<{ media: PublicationMedia[] }>(`/teacher/projects/${projectId}/publication-media`),
  requestUpload: (projectId: number, file: File) =>
    studioFetch<{ mediaId: number; uploadUrl: string }>(
      `/teacher/projects/${projectId}/publication-media/upload-url`,
      {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, contentType: uploadContentType(file), size: file.size }),
      },
    ),
  completeUpload: (projectId: number, mediaId: number) =>
    studioFetch<{ media: PublicationMedia }>(
      `/teacher/projects/${projectId}/publication-media/${mediaId}/complete`,
      { method: 'POST', body: JSON.stringify({}) },
    ),
  importVideo: (projectId: number) =>
    studioFetch<{ media: PublicationMedia }>(
      `/teacher/projects/${projectId}/publication-media/import-video`,
      { method: 'POST', body: JSON.stringify({}) },
    ),
};

export function putPublicationFile(
  uploadUrl: string,
  file: File,
  onProgress: (percentage: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', uploadUrl);
    request.setRequestHeader('Content-Type', uploadContentType(file));
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new Error('Upload connection failed. Please retry.'));
    request.onabort = () => reject(new Error('Upload was cancelled.'));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error(`Upload failed (${request.status}). Please retry.`));
    };
    request.send(file);
  });
}

export function teacherPublicationMediaUrl(projectId: number, mediaId: number): string {
  return `/api/teacher/projects/${projectId}/publication-media/${mediaId}/content`;
}
