/**
 * Lesson printables library: naming rules shared by the teacher route and its tests.
 *
 * Files live in Google Cloud Storage under
 *   <PRIVATE_OBJECT_DIR>/lesson-resources/<folder>/<filename>
 * where <folder> is `unit` (whole-unit files) or `lesson-01` … `lesson-12`.
 * Nothing is stored in the database: the folder is the lesson and the file name
 * is the title, so a teacher can add, replace or remove a file from the Studio
 * (or straight in the bucket) without a deploy.
 */

export const LESSON_TITLES: readonly string[] = [
  'Website Detectives',
  'A Place for Every Kind of Day',
  'What Makes an Online Community Safe and Welcoming?',
  'Being a Digital Citizen: Your Digital Footprint',
  'Student Voice, Leadership, and Team Roles',
  'Listening to Our School Community',
  'Why a Survey?',
  'Research Before We Create',
  'Our Website is LIVE!',
  'Scripting a Podcast Together',
  'Podcast Rehearsal and Revision',
  'What is AI? Code Your First Website Feature',
];

export const UNIT_FOLDER = 'unit';
export const FOLDERS: readonly string[] = [UNIT_FOLDER, ...LESSON_TITLES.map((_, i) => lessonFolder(i + 1))];
export const MAX_FILE_BYTES = 100 * 1024 * 1024;

const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  zip: 'application/zip',
};

export function lessonFolder(n: number): string {
  return `lesson-${String(n).padStart(2, '0')}`;
}

export function parseFolder(value: unknown): string | null {
  return typeof value === 'string' && FOLDERS.includes(value) ? value : null;
}

/** A display-friendly file name that is safe as a single object path segment. */
export function parseFilename(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.replace(/\s+/g, ' ').trim();
  if (name.length < 5 || name.length > 120) return null;
  if (/[\\/\x00-\x1f\x7f]/.test(name) || name.includes('..') || name.startsWith('.')) return null;
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
  if (!name.includes('.') || !(ext in CONTENT_TYPES)) return null;
  return name;
}

export function contentTypeFor(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
  return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

export function folderTitle(folder: string): string {
  if (folder === UNIT_FOLDER) return 'Whole unit';
  const n = Number(folder.slice('lesson-'.length));
  return `Lesson ${n}: ${LESSON_TITLES[n - 1] ?? ''}`;
}
