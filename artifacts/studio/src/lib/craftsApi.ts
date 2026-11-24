/**
 * Craft Corner (teacher side): crafts posted to the hub homepage.
 */
import { studioFetch } from '@/lib/studioApi';

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

export interface CraftInput {
  title?: string;
  description?: string;
  materials?: string;
  steps?: string;
  link?: string | null;
  published?: boolean;
}

export const CRAFT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const CRAFT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export const craftsApi = {
  list: () => studioFetch<{ crafts: Craft[] }>('/teacher/crafts'),
  create: (data: CraftInput) => studioFetch<{ craft: Craft }>('/teacher/crafts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: CraftInput) => studioFetch<{ craft: Craft }>(`/teacher/crafts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: number) => studioFetch<{ success: true; id: number }>(`/teacher/crafts/${id}`, { method: 'DELETE' }),
  removeImage: (id: number) => studioFetch<{ craft: Craft }>(`/teacher/crafts/${id}/image`, { method: 'DELETE' }),

  /** Upload a photo straight to storage, then ask the server to verify and show it. */
  async uploadImage(id: number, file: File): Promise<Craft> {
    if (!CRAFT_IMAGE_TYPES.includes(file.type)) throw new Error('Choose a JPG, PNG, WebP or GIF photo.');
    if (file.size > CRAFT_IMAGE_MAX_BYTES) throw new Error('Choose a photo smaller than 10 MB.');
    const { uploadUrl } = await studioFetch<{ uploadUrl: string }>(`/teacher/crafts/${id}/image/upload-url`, {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
    });
    const put = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    if (!put.ok) throw new Error(`The photo upload failed (${put.status}). Please try again.`);
    const { craft } = await studioFetch<{ craft: Craft }>(`/teacher/crafts/${id}/image/complete`, { method: 'POST', body: JSON.stringify({}) });
    return craft;
  },
};
