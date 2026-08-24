/**
 * Studio API helpers — used by all student and teacher dashboard pages.
 * Uses relative /api paths which are proxied to the API server by Replit.
 */

export interface StudioUser {
  id: number;
  username: string;
  displayName: string;
  role: 'teacher' | 'student';
  accountStatus: 'active' | 'disabled';
  teamId?: number | null;
  jobId?: number | null;
  cycleId?: number | null;
  teamName?: string | null;
  jobTitle?: string | null;
  cycleName?: string | null;
  className?: string | null;
}

export class StudioApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function studioFetch<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new StudioApiError(res.status, body.error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth ───────────────────────────────────────────────────────────────────
export const studioAuth = {
  me: () => studioFetch<{ user: StudioUser | null }>('/studio/auth/me'),
  login: (username: string, password: string) =>
    studioFetch<{ user: StudioUser }>('/studio/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => studioFetch('/studio/auth/logout', { method: 'POST' }),
  changePassword: (currentPassword: string, newPassword: string) =>
    studioFetch('/studio/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// ── Projects ───────────────────────────────────────────────────────────────
export const studioProjects = {
  list: (status?: string) =>
    studioFetch<{ projects: StudioProject[] }>(
      `/studio/projects${status ? `?status=${encodeURIComponent(status)}` : ''}`,
    ),
  get: (id: number) => studioFetch<{ project: StudioProject }>(`/studio/projects/${id}`),
  create: (data: { title: string; contentType: string; teamId?: number; cycleId?: number }) =>
    studioFetch<{ project: StudioProject }>('/studio/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: { title?: string; content?: string; notes?: string }) =>
    studioFetch<{ project: StudioProject }>(`/studio/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  transition: (id: number, toStatus: string) =>
    studioFetch<{ project: StudioProject }>(`/studio/projects/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ toStatus }),
    }),
  teacherFeedback: (id: number) =>
    studioFetch<{ review: StudioTeacherReview | null }>(`/studio/projects/${id}/teacher-feedback`),
  delete: (id: number) =>
    studioFetch<{ success: boolean }>(`/studio/projects/${id}`, { method: 'DELETE' }),
};

// ── Sources ────────────────────────────────────────────────────────────────
export const studioSources = {
  list: (projectId: number) =>
    studioFetch<{ sources: StudioSource[] }>(`/studio/projects/${projectId}/sources`),
  create: (projectId: number, data: Partial<StudioSource>) =>
    studioFetch<{ source: StudioSource }>(`/studio/projects/${projectId}/sources`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (projectId: number, sourceId: number) =>
    studioFetch(`/studio/projects/${projectId}/sources/${sourceId}`, { method: 'DELETE' }),
};

// ── Peer Reviews ───────────────────────────────────────────────────────────
export const studioPeerReviews = {
  myQueue: () => studioFetch<{ projects: StudioProject[] }>('/studio/peer-reviews'),
  getForProject: (projectId: number) =>
    studioFetch<{ reviews: StudioPeerReview[] }>(`/studio/peer-reviews/${projectId}`),
  submit: (projectId: number, data: PeerReviewSubmission) =>
    studioFetch(`/studio/peer-reviews/${projectId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── Portfolio & Handoffs ───────────────────────────────────────────────────
export const studioPortfolio = {
  get: () => studioFetch<{ portfolio: StudioPortfolio }>('/studio/portfolio'),
  createHandoff: (data: HandoffData) =>
    studioFetch('/studio/handoffs', { method: 'POST', body: JSON.stringify(data) }),
  incomingHandoffs: () => studioFetch<{ handoffs: IncomingHandoff[] }>('/studio/handoffs/incoming'),
};

// ── Teacher: Students ──────────────────────────────────────────────────────
export const teacherStudents = {
  list: () => studioFetch<{ students: TeacherStudent[] }>('/teacher/students'),
  create: (data: CreateStudentData) =>
    studioFetch('/teacher/students', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: {
    displayName?: string;
    jobId?: number | null;
    cycleId?: number | null;
    accountStatus?: 'active' | 'disabled';
  }) =>
    studioFetch(`/teacher/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getProjects: (id: number) =>
    studioFetch<{ projects: StudioProject[] }>(`/teacher/students/${id}/projects`),
};

// ── Teacher: Teams & Jobs ──────────────────────────────────────────────────
export const teacherTeams = {
  list: () => studioFetch<{ teams: Team[] }>('/teacher/teams'),
  create: (data: { name: string; description?: string }) =>
    studioFetch('/teacher/teams', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { name?: string; description?: string }) =>
    studioFetch(`/teacher/teams/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => studioFetch(`/teacher/teams/${id}`, { method: 'DELETE' }),
};

export const teacherJobs = {
  list: () => studioFetch<{ jobs: Job[] }>('/teacher/jobs'),
  create: (data: { title: string; description?: string; username?: string; password?: string }) =>
    studioFetch('/teacher/jobs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { title?: string; description?: string; username?: string; password?: string }) =>
    studioFetch(`/teacher/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => studioFetch(`/teacher/jobs/${id}`, { method: 'DELETE' }),
};

// ── Teacher: Cycles ────────────────────────────────────────────────────────
export const teacherCycles = {
  list: () => studioFetch<{ cycles: Cycle[] }>('/teacher/cycles'),
  create: (data: { name: string; startDate?: string; endDate?: string; isActive?: boolean }) =>
    studioFetch('/teacher/cycles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ name: string; startDate: string; endDate: string; isActive: boolean }>) =>
    studioFetch(`/teacher/cycles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Teacher: Review ────────────────────────────────────────────────────────
export const teacherReview = {
  queue: () => studioFetch<{ projects: TeacherQueueProject[] }>('/teacher/review/queue'),
  allProjects: (status?: string) =>
    studioFetch<{ projects: TeacherQueueProject[] }>(
      `/teacher/projects${status ? `?status=${encodeURIComponent(status)}` : ''}`,
    ),
  getProject: (id: number) =>
    studioFetch<TeacherProjectDetail>(`/teacher/projects/${id}`),
  decide: (id: number, data: DecisionData) =>
    studioFetch(`/teacher/projects/${id}/decision`, { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number) =>
    studioFetch<{ success: boolean }>(`/studio/projects/${id}`, { method: 'DELETE' }),
  assignReviewer: (id: number, reviewerId: number) =>
    studioFetch(`/teacher/projects/${id}/assign-reviewer`, {
      method: 'POST',
      body: JSON.stringify({ reviewerId }),
    }),
};

// ── Teacher: Handoffs ──────────────────────────────────────────────────────
export const teacherHandoffs = {
  list: () => studioFetch<{ handoffs: TeacherHandoff[] }>('/teacher/handoffs'),
  update: (id: number, data: { isVisible?: boolean; teacherNotes?: string; nextCycleId?: number }) =>
    studioFetch(`/teacher/handoffs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  assign: (id: number, jobId: number, cycleId?: number) =>
    studioFetch(`/teacher/handoffs/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ jobId, cycleId }),
    }),
};

// ── Teacher: Analytics ─────────────────────────────────────────────────────
export const teacherAnalytics = {
  get: () => studioFetch<AnalyticsData>('/teacher/analytics'),
  updateImpactSettings: (settings: Array<{ settingKey: string; isVisible: boolean }>) =>
    studioFetch('/teacher/analytics/impact-settings', {
      method: 'PATCH',
      body: JSON.stringify({ settings }),
    }),
};

// ── Teacher: Settings ─────────────────────────────────────────────────────
export const teacherSettings = {
  get: () =>
    studioFetch<{ adminEmails: string[]; authorDisplayOptions: string[] }>(
      '/teacher/settings',
    ),
  getAuthorDisplayOptions: () =>
    studioFetch<{ authorDisplayOptions: string[] }>(
      '/teacher/settings/author-display-options',
    ),
  updateAuthorDisplayOptions: (authorDisplayOptions: string[]) =>
    studioFetch('/teacher/settings', {
      method: 'PATCH',
      body: JSON.stringify({ authorDisplayOptions }),
    }),
};

// ── Teacher: Anonymous wellness access ──────────────────────────────────────
export const teacherAnonymousAccess = {
  list: () =>
    studioFetch<{ requests: AnonymousAccessRequest[]; accounts: AnonymousAccessAccount[] }>(
      '/teacher/anonymous-access',
    ),
  approve: (requestId: number, data: { accessCode: string; password: string }) =>
    studioFetch<{
      account: Pick<AnonymousAccessAccount, 'id' | 'accessCode' | 'status'>;
      emailSent: boolean;
    }>(
      `/teacher/anonymous-access/requests/${requestId}/approve`,
      { method: 'POST', body: JSON.stringify(data) },
    ),
  resetPassword: (accountId: number, password: string) =>
    studioFetch<{ account: Pick<AnonymousAccessAccount, 'id' | 'accessCode'> }>(
      `/teacher/anonymous-access/accounts/${accountId}/reset-password`,
      { method: 'POST', body: JSON.stringify({ password }) },
    ),
  updateStatus: (accountId: number, status: 'active' | 'disabled') =>
    studioFetch<{ account: Pick<AnonymousAccessAccount, 'id' | 'accessCode' | 'status'> }>(
      `/teacher/anonymous-access/accounts/${accountId}`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
    ),
};

// ── Shared (student + teacher) ─────────────────────────────────────────────
export const studioShared = {
  teams: () => studioFetch<{ teams: Team[] }>('/studio/teams'),
  jobs: () => studioFetch<{ jobs: Job[] }>('/studio/jobs'),
  cycles: () => studioFetch<{ cycles: Cycle[] }>('/studio/cycles'),
};

// ── Types ──────────────────────────────────────────────────────────────────
export interface StudioProject {
  id: number;
  title: string;
  contentType: string;
  status: string;
  content: string;
  notes: string;
  contentFlagged: boolean;
  teamId?: number | null;
  teamName?: string | null;
  cycleId?: number | null;
  cycleName?: string | null;
  assignedStudentId?: number | null;
  peerReviewerId?: number | null;
  jobId?: number | null;
  peerReviewerJobId?: number | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface StudioTeacherReview {
  id: number;
  projectId: number;
  teacherId: string;
  decision: 'approve' | 'approve_and_publish' | 'return_for_revision' | 'save_for_later' | 'archive';
  feedback?: string | null;
  reviewedAt: string;
}

export interface StudioSource {
  id: number;
  projectId: number;
  title: string;
  author?: string | null;
  website?: string | null;
  url?: string | null;
  accessedDate?: string | null;
  notes?: string | null;
}

export interface StudioPeerReview {
  id: number;
  projectId: number;
  reviewerId: number;
  checklistInfoClear?: boolean | null;
  checklistAgeAppropriate?: boolean | null;
  checklistSourcesIncluded?: boolean | null;
  checklistFactsAccurate?: boolean | null;
  checklistLanguageRespectful?: boolean | null;
  checklistNoPrivateInfo?: boolean | null;
  checklistGrammarChecked?: boolean | null;
  checklistFitsMission?: boolean | null;
  comments?: string | null;
  submittedAt: string;
}

export interface PeerReviewSubmission {
  checklistInfoClear?: boolean;
  checklistAgeAppropriate?: boolean;
  checklistSourcesIncluded?: boolean;
  checklistFactsAccurate?: boolean;
  checklistLanguageRespectful?: boolean;
  checklistNoPrivateInfo?: boolean;
  checklistGrammarChecked?: boolean;
  checklistFitsMission?: boolean;
  comments?: string;
  recommendRevision: boolean;
}

export interface StudioPortfolio {
  projectsContributed: number;
  peerReviewsCompleted: number;
  publishedProjects: number;
  completedProjects: number;
  handoffsCreated: number;
  projects: Pick<StudioProject, 'id' | 'title' | 'contentType' | 'status' | 'createdAt' | 'updatedAt'>[];
}

export interface HandoffData {
  projectId: number;
  completedWork?: string;
  remainingWork?: string;
  ideas?: string;
  notes?: string;
}

export interface IncomingHandoff {
  id: number;
  projectId: number;
  projectTitle: string;
  contentType: string;
  completedWork: string;
  remainingWork: string;
  ideas: string;
  notes: string;
  previousCycleName?: string | null;
}

export interface Team {
  id: number;
  name: string;
  description?: string | null;
  username?: string | null;
  hasPassword?: boolean;
}
export interface Job {
  id: number;
  title: string;
  description?: string | null;
  username?: string | null;
  hasPassword?: boolean;
}
export interface Cycle { id: number; name: string; startDate?: string | null; endDate?: string | null; isActive: boolean; }

export interface TeacherStudent {
  id: number;
  username: string;
  displayName: string;
  accountStatus: 'active' | 'disabled';
  createdAt: string;
  teamId?: number | null;
  teamName?: string | null;
  jobId?: number | null;
  jobTitle?: string | null;
  cycleId?: number | null;
  cycleName?: string | null;
  className?: string | null;
}

export interface CreateStudentData {
  displayName: string;
  jobId?: number;
  cycleId?: number;
  className?: string;
}

export interface TeacherQueueProject {
  id: number;
  title: string;
  contentType: string;
  status: string;
  contentFlagged: boolean;
  studentName?: string | null;
  teamName?: string | null;
  updatedAt: string;
}

export interface TeacherProjectDetail {
  project: StudioProject;
  student?: { displayName: string } | null;
  safetyFlags: Array<{ id: number; flagReason: string; teacherAttentionRecommended: boolean }>;
  peerReviews: StudioPeerReview[];
  sources: StudioSource[];
  teacherReviews: Array<{ id: number; decision: string; feedback?: string | null; reviewedAt: string }>;
}

export interface DecisionData {
  decision: 'approve' | 'approve_and_publish' | 'return_for_revision' | 'save_for_later' | 'archive';
  feedback?: string;
  destinationSection?: string;
  authorDisplay?: string;
}

export interface TeacherHandoff {
  id: number;
  projectId: number;
  projectTitle: string;
  contentType: string;
  completedWork: string;
  remainingWork: string;
  ideas: string;
  notes: string;
  teacherNotes: string;
  isVisible: boolean;
  previousCycleName?: string | null;
  createdAt: string;
}

export interface AnalyticsData {
  summary: {
    activeStudents: number;
    totalProjects: number;
    pendingReview: number;
    published: number;
    revisionNeeded: number;
    handoffs: number;
    cycles: number;
  };
  statusBreakdown: Array<{ status: string; count: number }>;
  pubByType: Array<{ contentType: string; count: number }>;
  impactSettings: Array<{ id: number; settingKey: string; isVisible: boolean }>;
}

export interface AnonymousAccessRequest {
  id: number;
  requestCode: string;
  firstName: string | null;
  lastName: string | null;
  grade: string | null;
  studentEmail: string | null;
  status: 'pending' | 'approved' | 'cancelled';
  createdAt: string;
  approvedAt?: string | null;
}

export interface AnonymousAccessAccount {
  id: number;
  requestCode: string;
  firstName: string | null;
  lastName: string | null;
  grade: string | null;
  studentEmail: string | null;
  accessCode: string;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

export const CONTENT_TYPES = [
  'Blog article',
  'Blog Writer',
  'Coping strategy',
  'Wellness activity',
  'Podcast',
  'Video production',
  'Artwork',
  'Directed drawing activity',
  'Journaling activity',
  'Meditation activity',
  'Movement activity',
  'Healthy recipe',
  'Community event',
  'School resource',
  'Student resource',
  'Research summary',
  'Music production',
  'Social media campaign',
] as const;

export const DESTINATION_SECTIONS: Record<string, string> = {
  'Blog article': 'blog',
  'Coping strategy': 'learn',
  'Wellness activity': 'create',
  'Podcast': 'podcast',
  'Video production': 'create',
  'Artwork': 'create',
  'Directed drawing activity': 'create',
  'Journaling activity': 'grow',
  'Meditation activity': 'calm-corner',
  'Movement activity': 'move',
  'Healthy recipe': 'cooking',
  'Community event': 'events',
  'School resource': 'resources',
  'Student resource': 'resources',
  'Research summary': 'learn',
  'Music production': 'create',
  'Social media campaign': 'blog',
};

export const STATUS_COLORS: Record<string, string> = {
  'Assigned': 'bg-amber-100 text-amber-800',
  'Researching': 'bg-blue-100 text-blue-800',
  'Drafting': 'bg-purple-100 text-purple-800',
  'Peer Review': 'bg-orange-100 text-orange-800',
  'Revision Needed': 'bg-red-100 text-red-800',
  'Ready for Teacher Review': 'bg-teal-100 text-teal-800',
  'Teacher Reviewing': 'bg-indigo-100 text-indigo-800',
  'Approved': 'bg-green-100 text-green-800',
  'Published': 'bg-emerald-100 text-emerald-800',
  'Archived': 'bg-gray-100 text-gray-600',
};

export const AUTHOR_DISPLAY_OPTIONS = [
  'Mind Matters Student Team',
  'Mind Matters Blog Team',
  'Student Wellness Team',
  'Grade 5 Mind Matters Team',
  'Anonymous Student Contributor',
];
