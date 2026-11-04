import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { teacherReview, teacherSettings, AUTHOR_DISPLAY_OPTIONS, DESTINATION_SECTIONS, type DecisionData, type PublicationAppearance, type PublicationEdition } from '@/lib/studioApi';
import { PublishedArticle } from '@workspace/mind-matters-ds/components/PublishedArticle';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/mind-matters-ds/components/ui/card';
import { Button } from '@workspace/mind-matters-ds/components/ui/button';
import { Textarea } from '@workspace/mind-matters-ds/components/ui/textarea';
import { Input } from '@workspace/mind-matters-ds/components/ui/input';
import { Label } from '@workspace/mind-matters-ds/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/mind-matters-ds/components/ui/select';
import { Badge } from '@workspace/mind-matters-ds/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/mind-matters-ds/components/ui/tabs';
import { AlertCircle, CheckCircle, RotateCcw, Bookmark, Archive, ExternalLink, Film, Download, Bold, Italic, List, ListOrdered, Link2, Quote, Heading2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { videoProductions } from '@/lib/videoApi';
import { PublicationBlockEditor, teacherPublicationMediaUrl } from '@/components/studio/PublicationBlockEditor';
import { publicationMediaApi } from '@/lib/publicationMediaApi';

// ── Structured content helpers ────────────────────────────────────────────────

function parseSections(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const parts = text.split(/^## /m);
  for (const part of parts.slice(1)) {
    const nl = part.indexOf('\n');
    if (nl === -1) { result[part.trim()] = ''; continue; }
    result[part.slice(0, nl).trim()] = part.slice(nl + 1).trim();
  }
  return result;
}

function hasStructuredContent(text: string): boolean {
  return /^## /m.test(text);
}

function StructuredContentPreview({ content }: { content: string }) {
  if (!content) {
    return <p className="text-[#d5cabe] italic text-sm">No content.</p>;
  }

  if (!hasStructuredContent(content)) {
    // Fallback: plain text for older projects
    return (
      <div className="whitespace-pre-wrap text-sm text-[#453329] leading-relaxed">
        {content}
      </div>
    );
  }

  const sections = parseSections(content);
  const entries = Object.entries(sections);

  if (entries.length === 0) {
    return (
      <div className="whitespace-pre-wrap text-sm text-[#453329] leading-relaxed">
        {content}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map(([heading, body]) => (
        <div key={heading} className="rounded-lg border border-[#d5cabe] overflow-hidden">
          <div className="bg-[#eee6d8] border-b border-[#d5cabe] px-4 py-2">
            <h3 className="text-sm font-semibold text-[#453329] tracking-wide">{heading}</h3>
          </div>
          <div className="bg-white px-4 py-3">
            {body ? (
              <p className="text-sm text-[#453329] whitespace-pre-wrap leading-relaxed">{body}</p>
            ) : (
              <p className="text-sm text-[#d5cabe] italic">Not filled in.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const DESTINATION_OPTIONS = [
  { value: 'blog', label: 'Blog / Articles' },
  { value: 'podcast', label: 'Podcast Page' },
  { value: 'learn', label: 'Learn / Strategies' },
  { value: 'create', label: 'Creative Activities' },
  { value: 'dance-tutorials', label: 'Dance Tutorials' },
  { value: 'asmr', label: 'ASMR' },
  { value: 'focus-study', label: 'Focus & Study' },
  { value: 'move', label: 'Move Your Mind' },
  { value: 'move-morning-stretch', label: 'Move · Morning Stretch' },
  { value: 'move-soccer-skills', label: 'Move · Soccer Skills' },
  { value: 'move-basketball-drills', label: 'Move · Basketball Drills' },
  { value: 'move-yoga-for-calm', label: 'Move · Yoga for Calm' },
  { value: 'move-stretch-break', label: 'Move · Stretch Break' },
  { value: 'move-active-challenge', label: 'Move · Active Challenge' },
  { value: 'directed-draws', label: 'Directed Draws · Easel' },
  { value: 'cooking', label: 'Healthy Habits / Recipes' },
  { value: 'cooking-food-reviews', label: 'Cooking Corner · Food Reviews' },
  { value: 'gardening', label: 'Gardening' },
  { value: 'grow', label: 'Grow / Journaling' },
  { value: 'events', label: 'Community Events' },
  { value: 'resources', label: 'Resources' },
];

const DEFAULT_APPEARANCE: PublicationAppearance = {
  fontFamily: 'serif',
  fontSize: 'medium',
  alignment: 'left',
  accent: 'sage',
  spacing: 'comfortable',
  pageWidth: 'full',
};

const EMPTY_EDITION: PublicationEdition = { title: '', content: '', appearance: DEFAULT_APPEARANCE };

export default function ProjectReview() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { user, isLoading } = useRequireStudioRole('teacher');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data, isLoading: projectLoading } = useQuery({
    queryKey: ['teacher-project', projectId],
    queryFn: () => teacherReview.getProject(projectId),
    enabled: !!user,
  });

  const { data: settingsData } = useQuery({
    queryKey: ['teacher-author-display-options'],
    queryFn: () => teacherSettings.getAuthorDisplayOptions(),
    enabled: !!user,
  });

  const {
    data: productionData,
    isLoading: productionLoading,
    isError: productionError,
    error: productionLoadError,
    refetch: refetchProduction,
  } = useQuery({
    queryKey: ['studio-video-production', projectId, user?.id, user?.jobId ?? null],
    queryFn: () => videoProductions.get(projectId),
    enabled: !!user && Number.isFinite(projectId) && projectId > 0,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const production = productionData?.production ?? null;
  const productionActive = production?.status === 'assigned';
  const projectStatusKey = production?.projectStatus.toLowerCase();
  const replacementUnavailable = production?.status === 'uploaded'
    && (projectStatusKey === 'published' || projectStatusKey === 'archived');

  const { data: publicationMediaData, isLoading: publicationMediaLoading, isError: publicationMediaError } = useQuery({
    queryKey: ['teacher-publication-media', projectId],
    queryFn: () => publicationMediaApi.list(projectId),
    enabled: !!user && Number.isFinite(projectId) && projectId > 0,
  });

  const authorDisplayOptions = Array.from(new Set([
    ...(settingsData?.authorDisplayOptions ?? AUTHOR_DISPLAY_OPTIONS),
    ...(data?.publication?.authorDisplay ? [data.publication.authorDisplay] : []),
  ]));

  const [feedback, setFeedback] = useState('');
  const [destinationSection, setDestinationSection] = useState('');
  const [authorDisplay, setAuthorDisplay] = useState('');
  const [publicationDraft, setPublicationDraft] = useState<PublicationEdition>(EMPTY_EDITION);
  const [draftVersion, setDraftVersion] = useState(0);
  const [savedDraft, setSavedDraft] = useState<PublicationEdition>(EMPTY_EDITION);
  const [hasPersistedDraft, setHasPersistedDraft] = useState(false);
  const [draftInitialized, setDraftInitialized] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const initializedId = useRef<number | null>(null);
  const bodyEditorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!data || initializedId.current === projectId) return;
    initializedId.current = projectId;
    const initial = data.publicationDraft ?? {
      title: data.project.title ?? '',
      content: data.project.content ?? '',
      appearance: DEFAULT_APPEARANCE,
    };
    setPublicationDraft(initial);
    setSavedDraft(initial);
    setHasPersistedDraft((data.publicationDraftVersion ?? 0) > 0);
    setDraftVersion(data.publicationDraftVersion ?? 0);
    const requestedDestination = new URLSearchParams(window.location.search).get('destination');
    setDestinationSection(
      data.publication?.destinationSection
      ?? (DESTINATION_OPTIONS.some((option) => option.value === requestedDestination)
        ? requestedDestination!
        : DESTINATION_SECTIONS[data.project.contentType])
      ?? 'blog',
    );
    setAuthorDisplay(data.publication?.authorDisplay ?? '');
    setDraftInitialized(true);
  }, [data, projectId]);

  const isDraftDirty = draftInitialized && (!hasPersistedDraft || JSON.stringify(publicationDraft) !== JSON.stringify(savedDraft));

  const { mutate: saveDraft, isPending: isSavingDraft } = useMutation({
    mutationFn: (input: { draft: PublicationEdition; version: number }) => teacherReview.savePublicationDraft(projectId, input),
    onSuccess: (result, input) => {
      setDraftVersion(result.version);
      setPublicationDraft((current) => JSON.stringify(current) === JSON.stringify(input.draft) ? result.draft : current);
      setSavedDraft(result.draft);
      setHasPersistedDraft(true);
      setDraftError('');
      queryClient.setQueryData(['teacher-project', projectId], (old: typeof data | undefined) =>
        old ? { ...old, publicationDraft: result.draft, publicationDraftVersion: result.version } : old);
      toast({ title: 'Website draft saved', description: 'The published page is unchanged until you publish your update.' });
    },
    onError: (error: Error & { status?: number }) => {
      const conflict = error.message.includes('409') || error.message.toLowerCase().includes('conflict') || error.status === 409;
      setDraftError(conflict
        ? 'This draft changed elsewhere. Your unsaved edits are still here; reload the latest project before saving again.'
        : error.message || 'Could not save the website draft. Your edits are still here.');
    },
  });

  const changeAppearance = (key: keyof PublicationAppearance, value: string) => {
    setPublicationDraft((current) => ({
      ...current,
      appearance: { ...current.appearance, [key]: value } as PublicationAppearance,
    }));
  };

  const insertMarkup = (before: string, after = before) => {
    const editor = bodyEditorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = publicationDraft.content.slice(start, end);
    const content = `${publicationDraft.content.slice(0, start)}${before}${selected || 'text'}${after}${publicationDraft.content.slice(end)}`;
    setPublicationDraft((current) => ({ ...current, content }));
    requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(start + before.length, start + before.length + (selected || 'text').length);
    });
  };

  const { mutate: decide, isPending } = useMutation({
    mutationFn: (decisionData: DecisionData) =>
      teacherReview.decide(projectId, decisionData),
    onSuccess: (_, vars) => {
      if (vars.decision === 'approve_and_publish' && vars.publicationDraft) {
        // Reopening immediately must not initialize the editor from a stale,
        // pre-publish cached version while the background refetch is in flight.
        queryClient.setQueryData(['teacher-project', projectId], (old: typeof data | undefined) =>
          old ? {
            ...old,
            project: { ...old.project, status: 'Published' },
            publicationDraft: { ...vars.publicationDraft!, title: vars.publicationDraft!.title.trim() },
            publicationDraftVersion: (vars.publicationDraftVersion ?? 0) + 1,
            publication: {
              destinationSection: vars.destinationSection!,
              authorDisplay: vars.authorDisplay!,
              publicationStatus: 'active',
            },
          } : old);
      }
      queryClient.invalidateQueries({ queryKey: ['teacher-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-all-projects'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['studio-video-productions'] });
      queryClient.invalidateQueries({ queryKey: ['studio-video-production', projectId] });
      toast({
        title: vars.sendToVideoProducer ? 'Sent to Video Producers' : vars.decision === 'approve_and_publish' ? 'Published!' : 'Decision saved',
        description: vars.sendToVideoProducer
          ? 'The project was approved and assigned for video production. It is not published; you will review the video before making a final decision.'
          : vars.decision === 'approve_and_publish'
          ? 'The project is now live on the public website.'
          : 'The project status has been updated.',
      });
      navigate('/studio/teacher/review');
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  if (isLoading || projectLoading || !data) {
    return <div className="flex items-center justify-center h-screen text-[#453329]">Loading…</div>;
  }

  const { project, student, safetyFlags, peerReviews, sources, teacherReviews } = data;
  const suggestedDestination = DESTINATION_SECTIONS[project.contentType] ?? 'blog';
  const mediaBlocks = (publicationDraft.blocks ?? []).filter((block) => ['image', 'video', 'audio'].includes(block.type));
  const missingMediaBlock = mediaBlocks.find((block) => {
    if (!block.mediaId) return true;
    return !publicationMediaData?.media.some((media) => media.id === block.mediaId && media.status === 'ready');
  });
  const mediaPublishIssue = mediaBlocks.length === 0 ? ''
    : publicationMediaLoading ? 'Checking that each media block is ready…'
      : publicationMediaError ? 'Media library could not be checked. Retry the media library before publishing.'
        : missingMediaBlock ? `Block ${missingMediaBlock.type} is empty or its media is not ready. Choose an uploaded, ready file before publishing.` : '';

  return (
    <StudioLayout>
      <StudioPage
        title={project.title}
        subtitle={`${student?.displayName ?? 'Unknown student'} · ${project.contentType}`}
        action={<StatusBadge status={project.status} />}
      >
        {/* Safety flag */}
        {safetyFlags.length > 0 && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Teacher Attention Recommended</p>
              {safetyFlags.map((f) => (
                <p key={f.id} className="text-xs text-amber-700 mt-1">{f.flagReason}</p>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: project content */}
          <div className="min-w-0 lg:col-span-2 space-y-4">
            <Tabs defaultValue="publication">
              <TabsList className="h-auto flex-wrap justify-start bg-[#eee6d8] border border-[#d5cabe]">
                <TabsTrigger value="publication">Website Edition</TabsTrigger>
                <TabsTrigger value="content">Student Original</TabsTrigger>
                <TabsTrigger value="sources">Sources ({sources.length})</TabsTrigger>
                <TabsTrigger value="peer-review">Peer Review ({peerReviews.length})</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="publication" className="mt-3 space-y-4">
                <Card className="bg-[#eee6d8] border-[#d5cabe]">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-serif text-base text-[#453329]">Edit the public edition</CardTitle>
                    <p className="text-sm text-[#688a52]">Changes here never alter the student’s original submission. Save a website draft or publish it explicitly.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="publication-title">Website title</Label>
                      <Textarea id="publication-title" rows={1} value={publicationDraft.title} onChange={(event) => setPublicationDraft((current) => ({ ...current, title: event.target.value }))} className="min-h-10 resize-y bg-white border-[#d5cabe]" placeholder="Title shown on the public page" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="publication-content">Article body</Label>
                      <div className="flex flex-wrap gap-1 rounded-t-md border border-b-0 border-[#d5cabe] bg-white p-2">
                        {[
                          { label: 'Bold', icon: <Bold className="h-4 w-4" />, before: '**', after: '**' },
                          { label: 'Italic', icon: <Italic className="h-4 w-4" />, before: '*', after: '*' },
                          { label: 'Heading', icon: <Heading2 className="h-4 w-4" />, before: '## ', after: '' },
                          { label: 'Bulleted list', icon: <List className="h-4 w-4" />, before: '- ', after: '' },
                          { label: 'Numbered list', icon: <ListOrdered className="h-4 w-4" />, before: '1. ', after: '' },
                          { label: 'Quote', icon: <Quote className="h-4 w-4" />, before: '> ', after: '' },
                          { label: 'Link', icon: <Link2 className="h-4 w-4" />, before: '[', after: '](https://)' },
                        ].map((action) => (
                          <Button key={action.label} type="button" variant="outline" size="sm" aria-label={action.label} title={action.label} onClick={() => insertMarkup(action.before, action.after)} className="h-8 px-2">
                            {action.icon}<span className="sr-only">{action.label}</span>
                          </Button>
                        ))}
                      </div>
                      <Textarea
                        id="publication-content"
                        ref={bodyEditorRef}
                        value={publicationDraft.content}
                        onChange={(event) => setPublicationDraft((current) => ({ ...current, content: event.target.value }))}
                        className="min-h-64 rounded-t-none border-[#d5cabe] bg-white font-mono text-sm"
                        placeholder="Write the full article. Markdown headings, bold, italic, lists, quotes and links are supported."
                      />
                    </div>
                    <PublicationBlockEditor
                      projectId={projectId}
                      draft={publicationDraft}
                      onChange={setPublicationDraft}
                      canImportVideo={production?.status === 'uploaded'}
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="publication-page-order">Order in section</Label>
                        <Input
                          id="publication-page-order"
                          type="number"
                          min={0}
                          max={10000}
                          value={publicationDraft.pageOrder ?? 0}
                          onChange={(event) => setPublicationDraft((current) => ({
                            ...current,
                            pageOrder: Math.min(10000, Math.max(0, Number(event.target.value) || 0)),
                          }))}
                        />
                        <p className="text-xs text-[#688a52]">Lower numbers appear first in the selected website section.</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Article card width</Label>
                        <Select value={publicationDraft.appearance.pageWidth ?? 'full'} onValueChange={(value) => changeAppearance('pageWidth', value)}>
                          <SelectTrigger className="bg-white border-[#d5cabe]"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="full">Full width</SelectItem><SelectItem value="half">Half width</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {([
                        ['fontFamily', 'Typeface', [['serif', 'Serif'], ['sans', 'Sans serif']]],
                        ['fontSize', 'Text size', [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]],
                        ['alignment', 'Alignment', [['left', 'Left'], ['center', 'Centered']]],
                        ['accent', 'Accent color', [['sage', 'Sage'], ['terracotta', 'Terracotta'], ['amber', 'Amber']]],
                        ['spacing', 'Paragraph spacing', [['compact', 'Compact'], ['comfortable', 'Comfortable'], ['spacious', 'Spacious']]],
                      ] as const).map(([key, label, options]) => (
                        <div key={key} className="space-y-1.5">
                          <Label>{label}</Label>
                          <Select value={publicationDraft.appearance[key]} onValueChange={(value) => changeAppearance(key, value)}>
                            <SelectTrigger className="bg-white border-[#d5cabe]"><SelectValue /></SelectTrigger>
                            <SelectContent>{options.map(([value, text]) => <SelectItem key={value} value={value}>{text}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#eee6d8] border-[#d5cabe]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                      <CardTitle className="font-serif text-base text-[#453329]">Live preview</CardTitle>
                      <p className="mt-1 text-xs text-[#688a52]">This is the same renderer used on the public website.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant={previewMode === 'desktop' ? 'secondary' : 'outline'} onClick={() => setPreviewMode('desktop')}>Desktop</Button>
                      <Button type="button" size="sm" variant={previewMode === 'mobile' ? 'secondary' : 'outline'} onClick={() => setPreviewMode('mobile')}>Mobile</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`mx-auto min-h-48 rounded-lg border border-[#d5cabe] bg-white p-5 shadow-sm transition-all ${previewMode === 'mobile' ? 'max-w-xs' : 'w-full'}`}>
                      <div className={destinationSection !== 'blog' && publicationDraft.appearance.pageWidth === 'half' ? 'w-full md:w-1/2' : 'w-full'}>
                        <PublishedArticle
                          title={publicationDraft.title}
                          content={publicationDraft.content}
                          blocks={publicationDraft.blocks}
                          appearance={publicationDraft.appearance}
                          authorDisplay={authorDisplay || authorDisplayOptions[0] || ''}
                          projectId={projectId}
                          mediaUrl={(mediaId) => teacherPublicationMediaUrl(projectId, mediaId)}
                          presentation={destinationSection === 'blog' ? 'blog' : 'default'}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-[#d5cabe] bg-white p-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm font-medium text-[#453329]" role="status" data-testid="status-publication-draft">
                      {isSavingDraft ? 'Saving website draft…' : isDraftDirty ? hasPersistedDraft ? 'Unsaved website edits' : 'Website draft not saved yet' : 'Website draft saved'}
                    </p>
                    {draftError && <p className="mt-1 text-sm text-red-700" role="alert" data-testid="error-publication-draft">{draftError}</p>}
                  </div>
                  <Button type="button" variant="outline" onClick={() => { setDraftError(''); saveDraft({ draft: publicationDraft, version: draftVersion }); }} disabled={!isDraftDirty || isSavingDraft || isPending} data-testid="button-save-publication-draft">
                    {isSavingDraft ? 'Saving…' : 'Save Website Draft'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="content" className="mt-3">
                <Card className="bg-[#eee6d8] border-[#d5cabe]">
                  <CardContent className="p-4">
                    <StructuredContentPreview content={project.content ?? ''} />
                    {project.notes && (
                      <div className="mt-4 p-3 bg-white rounded-lg border border-[#d5cabe]">
                        <p className="text-xs font-medium text-[#453329] mb-1">Student notes:</p>
                        <p className="text-xs text-[#688a52] whitespace-pre-wrap">{project.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sources" className="mt-3 space-y-2">
                {sources.length === 0 ? (
                  <Card className="bg-[#eee6d8] border-[#d5cabe]"><CardContent className="p-6 text-center text-sm text-[#688a52]">No sources added.</CardContent></Card>
                ) : sources.map((s) => (
                  <Card key={s.id} className="bg-[#eee6d8] border-[#d5cabe]">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-[#453329]">{s.title}</p>
                      {s.author && <p className="text-xs text-[#688a52]">by {s.author}</p>}
                      {s.website && <p className="text-xs text-[#688a52]">{s.website}</p>}
                      {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#c4622d] underline flex items-center gap-0.5"><ExternalLink className="h-3 w-3" /> Visit</a>}
                      {s.notes && <p className="text-xs italic text-[#453329] mt-1">"{s.notes}"</p>}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="peer-review" className="mt-3">
                {peerReviews.length === 0 ? (
                  <Card className="bg-[#eee6d8] border-[#d5cabe]"><CardContent className="p-6 text-center text-sm text-[#688a52]">No peer review yet.</CardContent></Card>
                ) : peerReviews.map((r) => (
                  <Card key={r.id} className="bg-[#eee6d8] border-[#d5cabe]">
                    <CardContent className="p-4 space-y-2">
                      {[
                        ['Info clear', r.checklistInfoClear],
                        ['Age appropriate', r.checklistAgeAppropriate],
                        ['Sources included', r.checklistSourcesIncluded],
                        ['Facts accurate', r.checklistFactsAccurate],
                        ['Language respectful', r.checklistLanguageRespectful],
                        ['No private info', r.checklistNoPrivateInfo],
                        ['Grammar checked', r.checklistGrammarChecked],
                        ['Fits mission', r.checklistFitsMission],
                      ].map(([label, val]) => (
                        <div key={label as string} className="flex items-center gap-2 text-sm">
                          {val ? <CheckCircle className="h-4 w-4 text-[#688a52]" /> : <div className="h-4 w-4 rounded-full border-2 border-[#d5cabe]" />}
                          <span className="text-[#453329]">{label as string}</span>
                        </div>
                      ))}
                      {r.comments && (
                        <div className="mt-3 p-3 bg-white rounded border border-[#d5cabe]">
                          <p className="text-xs font-medium text-[#453329] mb-1">Peer feedback:</p>
                          <p className="text-xs text-[#688a52] whitespace-pre-wrap">{r.comments}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="history" className="mt-3 space-y-2">
                {teacherReviews.length === 0 ? (
                  <Card className="bg-[#eee6d8] border-[#d5cabe]"><CardContent className="p-6 text-center text-sm text-[#688a52]">No previous reviews.</CardContent></Card>
                ) : teacherReviews.map((r) => (
                  <Card key={r.id} className="bg-[#eee6d8] border-[#d5cabe]">
                    <CardContent className="p-3">
                      <Badge variant="outline" className="text-xs mb-1">{r.decision.replace(/_/g, ' ')}</Badge>
                      {r.feedback && <p className="text-xs text-[#453329]">{r.feedback}</p>}
                      <p className="text-xs text-[#d5cabe] mt-1">{new Date(r.reviewedAt).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>

            <Card className="border-[#d5cabe] bg-[#eee6d8]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-serif text-base text-[#453329]">
                  <Film className="h-4 w-4 text-[#688a52]" /> Video production
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {productionLoading ? (
                  <div className="h-16 animate-pulse rounded-lg bg-white" aria-label="Loading production assignment" />
                ) : productionError ? (
                  <div className="flex flex-col items-start gap-2 rounded-lg border border-[#d5cabe] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[#453329]">Could not load the production assignment{productionLoadError instanceof Error ? `: ${productionLoadError.message}` : '.'}</p>
                    <Button variant="outline" size="sm" onClick={() => refetchProduction()}>Retry</Button>
                  </div>
                ) : production ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-[#d5cabe] bg-white p-3">
                      <p className="text-sm font-medium text-[#453329]">
                        {production.status === 'uploaded' ? 'Video uploaded and awaiting your review' : 'Assigned to Video Producers'}
                      </p>
                      <p className="mt-1 text-xs text-[#688a52]">
                        {production.status === 'uploaded' && production.uploadedAt
                          ? `Uploaded ${new Date(production.uploadedAt).toLocaleString()}`
                          : 'Production is in progress. This project has not been published.'}
                      </p>
                      {production.instructions && (
                        <div className="mt-3 border-t border-[#d5cabe] pt-3">
                          <p className="mb-1 text-xs font-medium text-[#453329]">Directions sent to producers</p>
                          <p className="whitespace-pre-wrap text-sm text-[#688a52]">{production.instructions}</p>
                        </div>
                      )}
                    </div>
                    {production.videoUrl && (
                      <div className="space-y-2 rounded-lg border border-[#d5cabe] bg-white p-3">
                        {production.status === 'assigned' && (
                          <p className="text-xs font-medium text-[#688a52]">Prior uploaded version; replacement is in progress.</p>
                        )}
                        <video className="max-h-96 w-full rounded-lg bg-black" controls playsInline src={production.videoUrl}>
                          Your browser does not support embedded video.
                        </video>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs text-[#453329]">{production.filename || 'Uploaded video'}</p>
                          <a href={production.videoUrl} download={production.filename || true} className="inline-flex items-center gap-1 text-xs text-[#c4622d] underline">
                            <Download className="h-3.5 w-3.5" /> Download video
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[#688a52]">No video production assignment yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: decision panel */}
          <div className="space-y-4">
            <Card className="bg-[#eee6d8] border-[#d5cabe]">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-[#453329] text-base">Your Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="bg-white border-[#d5cabe] min-h-24 text-sm"
                  placeholder="Leave feedback for the student (optional)…"
                />
                <p className="text-xs leading-relaxed text-[#688a52]">
                  When you send this project for video production, this feedback is also shared as directions for the production group.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#eee6d8] border-[#d5cabe]">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-[#453329] text-base">Publish Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#453329]">Destination section</Label>
                  <Select value={destinationSection || suggestedDestination} onValueChange={setDestinationSection}>
                    <SelectTrigger className="bg-white border-[#d5cabe] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DESTINATION_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {destinationSection === 'directed-draws' && (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Add the video in this website edition, save the draft, then publish it. Published drawing videos appear directly on the Directed Draws easel.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#453329]">Author display name</Label>
                  <Select
                    value={authorDisplay || authorDisplayOptions[0] || ''}
                    onValueChange={setAuthorDisplay}
                  >
                    <SelectTrigger className="bg-white border-[#d5cabe] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {authorDisplayOptions.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[#688a52]">Student names are never shown publicly.</p>
                </div>
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="space-y-2">
              <p className="rounded-lg border border-[#d5cabe] bg-white p-3 text-xs leading-relaxed text-[#688a52]">
                Sending a project for video production approves the content for production only. It does not publish the project. A teacher makes the final publication decision after reviewing the uploaded video.
              </p>
              {productionActive && (
                <p className="rounded-lg border border-[#d5cabe] bg-[#eee6d8] p-3 text-xs leading-relaxed text-[#453329]">
                  This project is currently assigned for video production. Approve &amp; Publish is unavailable until the producer returns the video for your final review.
                </p>
              )}
              {mediaPublishIssue && (
                <p className="rounded-lg border border-[#c4622d] bg-white p-3 text-xs leading-relaxed text-[#453329]" role="alert">
                  {mediaPublishIssue}
                </p>
              )}
              {replacementUnavailable && (
                <p className="rounded-lg border border-[#d5cabe] bg-[#eee6d8] p-3 text-xs leading-relaxed text-[#453329]">
                  A replacement video can only be requested for an unpublished project that has not been archived.
                </p>
              )}
              <Button
                className="w-full bg-[#688a52] hover:bg-[#557a43] text-white rounded-full gap-2"
                onClick={() => decide({
                  decision: 'approve_and_publish',
                  feedback,
                  destinationSection: destinationSection || data.publication?.destinationSection || suggestedDestination,
                  authorDisplay: authorDisplay || data.publication?.authorDisplay || authorDisplayOptions[0] || AUTHOR_DISPLAY_OPTIONS[0],
                  publicationDraft,
                  publicationDraftVersion: draftVersion,
                })}
                disabled={isPending || isSavingDraft || !draftInitialized || productionLoading || productionError || productionActive || Boolean(mediaPublishIssue)}
              >
                <CheckCircle className="h-4 w-4" /> {data.publication ? 'Update Published Project' : 'Approve & Publish'}
              </Button>
              <Button
                variant="outline"
                className="w-full border-[#688a52] text-[#688a52] rounded-full gap-2"
                onClick={() => decide({ decision: 'approve', feedback })}
                disabled={isPending}
              >
                <CheckCircle className="h-4 w-4" /> Approve (don't publish yet)
              </Button>
              <Button
                variant="outline"
                className="w-full border-[#c4622d] text-[#c4622d] rounded-full gap-2"
                onClick={() => decide({ decision: 'approve', sendToVideoProducer: true, feedback })}
                disabled={isPending || productionLoading || productionError || productionActive || replacementUnavailable}
              >
                <Film className="h-4 w-4" />
                {productionActive
                  ? 'Already Assigned to Video Production'
                  : production?.status === 'uploaded'
                    ? replacementUnavailable ? 'Replacement Unavailable' : 'Approve & Send Replacement to Video Producer'
                    : 'Approve & Send to Video Producer'}
              </Button>
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600 rounded-full gap-2"
                onClick={() => decide({ decision: 'return_for_revision', feedback })}
                disabled={isPending}
              >
                <RotateCcw className="h-4 w-4" /> Return for Revision
              </Button>
              <Button
                variant="outline"
                className="w-full border-[#d5cabe] text-[#453329] rounded-full gap-2"
                onClick={() => decide({ decision: 'save_for_later', feedback })}
                disabled={isPending}
              >
                <Bookmark className="h-4 w-4" /> Save for Later
              </Button>
              <Button
                variant="ghost"
                className="w-full text-[#688a52] rounded-full gap-2 text-xs"
                onClick={() => decide({ decision: 'archive', feedback })}
                disabled={isPending}
              >
                <Archive className="h-3.5 w-3.5" /> Archive
              </Button>
            </div>
          </div>
        </div>
      </StudioPage>
    </StudioLayout>
  );
}
