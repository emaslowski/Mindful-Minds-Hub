/**
 * Coding Lab API helpers and types (student and teacher).
 * Types mirror lib/db/src/schema/codingLab.ts.
 */
import { studioFetch } from './studioApi';

export type CodingLabBlockType = 'heading' | 'paragraph' | 'list' | 'quote' | 'tip' | 'button' | 'divider';

export interface CodingLabBlock {
  id: string;
  type: CodingLabBlockType;
  text?: string;
  items?: string[];
  by?: string;
  label?: string;
  href?: string;
  emoji?: string;
}

export type CodingLabStep =
  | { type: 'read'; title: string; body: string }
  | { type: 'quiz'; title: string; question: string; options: string[]; answer: number; explanation: string }
  | { type: 'build'; title: string; instructions: string; required: CodingLabBlockType[]; minBlocks: number }
  | { type: 'prompt'; title: string; instructions: string; groups: Array<{ label: string; chips: string[] }>; allowAi: boolean };

export interface LessonProgress {
  completedSteps: number[];
  quizAnswers: Record<string, number>;
  completed: boolean;
  completedAt: string | null;
}

export interface LessonSummary {
  id: number;
  slug: string;
  title: string;
  emoji: string | null;
  summary: string;
  stepCount: number;
  published: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface Lesson extends LessonSummary {
  steps: CodingLabStep[];
  createdAt: string;
}

export interface Build {
  id: number;
  lessonId: number | null;
  stepIndex: number | null;
  title: string;
  blocks: CodingLabBlock[];
  projectId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiStatus { aiHelper: boolean; aiDailyLimit: number; aiUsedToday: number }

export interface LabOverview extends AiStatus {
  lessons: Array<LessonSummary & { progress: LessonProgress }>;
  builds: Build[];
}

export interface LessonDetail extends AiStatus {
  lesson: Lesson;
  progress: LessonProgress;
  builds: Build[];
}

export const codingLabApi = {
  overview: () => studioFetch<LabOverview>('/studio/coding-lab'),
  lesson: (slug: string) => studioFetch<LessonDetail>(`/studio/coding-lab/lessons/${encodeURIComponent(slug)}`),
  completeStep: (slug: string, stepIndex: number, quizAnswer?: number) =>
    studioFetch<{ progress: LessonProgress }>(`/studio/coding-lab/lessons/${encodeURIComponent(slug)}/progress`, {
      method: 'POST', body: JSON.stringify({ stepIndex, quizAnswer }),
    }),
  createBuild: (data: { lessonId?: number; stepIndex?: number; title: string; blocks: CodingLabBlock[] }) =>
    studioFetch<{ build: Build }>('/studio/coding-lab/builds', { method: 'POST', body: JSON.stringify(data) }),
  updateBuild: (id: number, data: { title?: string; blocks?: CodingLabBlock[] }) =>
    studioFetch<{ build: Build }>(`/studio/coding-lab/builds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBuild: (id: number) => studioFetch<{ success: boolean }>(`/studio/coding-lab/builds/${id}`, { method: 'DELETE' }),
  submitBuild: (id: number) =>
    studioFetch<{ project: { id: number; title: string; status: string }; updated: boolean }>(`/studio/coding-lab/builds/${id}/submit`, { method: 'POST' }),
  askAi: (slug: string, stepIndex: number, chips: string[]) =>
    studioFetch<{ prompt: string; reply: string; usedToday: number; limit: number }>('/studio/coding-lab/ai', {
      method: 'POST', body: JSON.stringify({ slug, stepIndex, chips }),
    }),
};

// ── Teacher ────────────────────────────────────────────────────────────────

export interface TeacherLessonRow extends LessonSummary { started: number; completed: number }

export interface LessonInput {
  title: string; slug?: string; emoji?: string | null; summary?: string; steps: CodingLabStep[]; published?: boolean; sortOrder?: number;
}

export interface ProgressReport {
  lessons: Array<{ id: number; title: string; emoji: string | null; stepCount: number }>;
  students: Array<{ studentId: string; studentName: string | null; lessons: Record<number, { completedSteps: number; completed: boolean; updatedAt: string }> }>;
  builds: Array<{ id: number; studentId: string; studentName: string | null; lessonId: number | null; title: string; projectId: number | null; blockCount: number; updatedAt: string; projectStatus: string | null }>;
  aiRuns: Array<{ id: number; studentId: string; studentName: string | null; lessonId: number | null; prompt: string; response: string; model: string; createdAt: string }>;
}

export interface LabSettings { aiPlayground: boolean; aiDailyLimit: number; aiConfigured: boolean; model: string }

export const codingLabAdminApi = {
  lessons: () => studioFetch<{ lessons: TeacherLessonRow[] }>('/teacher/coding-lab/lessons'),
  lesson: (id: number) => studioFetch<{ lesson: Lesson }>(`/teacher/coding-lab/lessons/${id}`),
  create: (data: LessonInput) => studioFetch<{ lesson: Lesson }>('/teacher/coding-lab/lessons', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<LessonInput>) =>
    studioFetch<{ lesson: Lesson }>(`/teacher/coding-lab/lessons/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => studioFetch<{ success: boolean }>(`/teacher/coding-lab/lessons/${id}`, { method: 'DELETE' }),
  restoreStarters: () => studioFetch<{ added: number }>('/teacher/coding-lab/lessons/restore-starters', { method: 'POST' }),
  progress: () => studioFetch<ProgressReport>('/teacher/coding-lab/progress'),
  settings: () => studioFetch<LabSettings>('/teacher/coding-lab/settings'),
  updateSettings: (data: { aiPlayground?: boolean; aiDailyLimit?: number }) =>
    studioFetch<LabSettings>('/teacher/coding-lab/settings', { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Shared helpers ─────────────────────────────────────────────────────────

export const BLOCK_PALETTE: Array<{ type: CodingLabBlockType; label: string; emoji: string; hint: string; tag: string }> = [
  { type: 'heading', label: 'Heading', emoji: '🔠', hint: 'A big title for a part of your page', tag: 'h2' },
  { type: 'paragraph', label: 'Paragraph', emoji: '📝', hint: 'A few sentences of writing', tag: 'p' },
  { type: 'list', label: 'List', emoji: '📋', hint: 'Bullet points, one idea per line', tag: 'ul' },
  { type: 'quote', label: 'Quote', emoji: '💬', hint: 'Words someone said, with their name', tag: 'blockquote' },
  { type: 'tip', label: 'Tip box', emoji: '💡', hint: 'A highlighted box for the most important idea', tag: 'aside' },
  { type: 'button', label: 'Link button', emoji: '🔗', hint: 'A button that opens another page on our site', tag: 'a' },
  { type: 'divider', label: 'Divider', emoji: '➖', hint: 'A line that separates two parts', tag: 'hr' },
];

export const EXAMPLE_TEXT: Record<CodingLabBlockType, Partial<CodingLabBlock>> = {
  heading: { text: 'Three ways to calm down before a test' },
  paragraph: { text: 'Tests can make anyone nervous. The good news is that a few small habits can help your brain feel ready.' },
  list: { items: ['Take three slow breaths', 'Stretch your arms up high', 'Tell yourself: I can do hard things'] },
  quote: { text: 'Mistakes are proof that you are trying.', by: 'Our class motto' },
  tip: { text: 'Remember: one worry at a time. Write it down, then let it go.' },
  button: { label: 'Visit the Calm Corner', href: '/calm-corner' },
  divider: { emoji: '🌱' },
};

export function newBlock(type: CodingLabBlockType): CodingLabBlock {
  const id = `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  switch (type) {
    case 'heading': case 'paragraph': case 'tip': return { id, type, text: '' };
    case 'quote': return { id, type, text: '', by: '' };
    case 'list': return { id, type, items: [''] };
    case 'button': return { id, type, label: '', href: '/' };
    case 'divider': return { id, type, emoji: '' };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The HTML a block represents, as shown in the Code tab. */
export function blockToHtml(b: CodingLabBlock): string {
  switch (b.type) {
    case 'heading': return `<h2>${escapeHtml(b.text ?? '')}</h2>`;
    case 'paragraph': return `<p>${escapeHtml(b.text ?? '')}</p>`;
    case 'list': return `<ul>\n${(b.items ?? []).map((i) => `  <li>${escapeHtml(i)}</li>`).join('\n')}\n</ul>`;
    case 'quote': return `<blockquote>\n  ${escapeHtml(b.text ?? '')}${b.by ? `\n  <cite>${escapeHtml(b.by)}</cite>` : ''}\n</blockquote>`;
    case 'tip': return `<aside class="tip">${escapeHtml(b.text ?? '')}</aside>`;
    case 'button': return `<a class="button" href="${escapeHtml(b.href ?? '/')}">${escapeHtml(b.label ?? '')}</a>`;
    case 'divider': return b.emoji ? `<hr title="${escapeHtml(b.emoji)}">` : '<hr>';
  }
}

export function pageToHtml(title: string, blocks: CodingLabBlock[]): string {
  const body = blocks.map((b) => blockToHtml(b).split('\n').map((l) => `    ${l}`).join('\n')).join('\n');
  return `<!doctype html>\n<html>\n  <head>\n    <title>${escapeHtml(title)}</title>\n  </head>\n  <body>\n    <h1>${escapeHtml(title)}</h1>\n${body}\n  </body>\n</html>`;
}

export function buildMeetsStep(blocks: CodingLabBlock[], step: Extract<CodingLabStep, { type: 'build' }>): boolean {
  const types = new Set(blocks.map((b) => b.type));
  return blocks.length >= step.minBlocks && step.required.every((t) => types.has(t));
}
