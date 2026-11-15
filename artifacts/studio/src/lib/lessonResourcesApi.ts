import { studioFetch } from '@/lib/studioApi';

export interface LessonResourceFile {
  folder: string;
  name: string;
  size: number;
  contentType: string;
  updatedAt: string | null;
  url: string;
}

export interface LessonResourceSection {
  folder: string;
  title: string;
  files: LessonResourceFile[];
}

export const lessonResourcesApi = {
  list: () => studioFetch<{ sections: LessonResourceSection[] }>('/teacher/lesson-resources'),
  requestUpload: (folder: string, file: File) =>
    studioFetch<{ uploadUrl: string; contentType: string; file: Pick<LessonResourceFile, 'folder' | 'name' | 'url'> }>(
      '/teacher/lesson-resources/upload-url',
      { method: 'POST', body: JSON.stringify({ folder, filename: file.name, size: file.size }) },
    ),
  remove: (file: Pick<LessonResourceFile, 'folder' | 'name'>) =>
    studioFetch<{ ok: true }>(`/teacher/lesson-resources/file/${file.folder}/${encodeURIComponent(file.name)}`, { method: 'DELETE' }),
};

/** PUT the bytes straight to storage with the signed URL from requestUpload. */
export function putLessonResource(uploadUrl: string, contentType: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', uploadUrl);
    request.setRequestHeader('Content-Type', contentType);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new Error('Upload connection failed. Please try again.'));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error(`Upload failed (${request.status}). Please try again.`));
    };
    request.send(file);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
