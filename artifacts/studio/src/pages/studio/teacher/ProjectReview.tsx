import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { teacherReview, teacherSettings, AUTHOR_DISPLAY_OPTIONS, DESTINATION_SECTIONS, type DecisionData } from '@/lib/studioApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, RotateCcw, Bookmark, Archive, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  { value: 'calm-corner', label: 'Calm Corner (Meditation)' },
  { value: 'move', label: 'Move Your Mind' },
  { value: 'cooking', label: 'Healthy Habits / Recipes' },
  { value: 'grow', label: 'Grow / Journaling' },
  { value: 'events', label: 'Community Events' },
  { value: 'resources', label: 'Resources' },
];

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

  const authorDisplayOptions = settingsData?.authorDisplayOptions ?? AUTHOR_DISPLAY_OPTIONS;

  const [feedback, setFeedback] = useState('');
  const [destinationSection, setDestinationSection] = useState('');
  const [authorDisplay, setAuthorDisplay] = useState('');

  const { mutate: decide, isPending } = useMutation({
    mutationFn: (decisionData: DecisionData) =>
      teacherReview.decide(projectId, decisionData),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-project', projectId] });
      toast({
        title: vars.decision === 'approve_and_publish' ? 'Published!' : 'Decision saved',
        description: vars.decision === 'approve_and_publish'
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
          <div className="lg:col-span-2 space-y-4">
            <Tabs defaultValue="content">
              <TabsList className="bg-[#eee6d8] border border-[#d5cabe]">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="sources">Sources ({sources.length})</TabsTrigger>
                <TabsTrigger value="peer-review">Peer Review ({peerReviews.length})</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

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
                          <p className="text-xs font-medium text-[#453329] mb-1">Comments:</p>
                          <p className="text-xs text-[#688a52]">{r.comments}</p>
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
              <Button
                className="w-full bg-[#688a52] hover:bg-[#557a43] text-white rounded-full gap-2"
                onClick={() => decide({ decision: 'approve_and_publish', feedback, destinationSection: destinationSection || suggestedDestination, authorDisplay: authorDisplay || authorDisplayOptions[0] || AUTHOR_DISPLAY_OPTIONS[0] })}
                disabled={isPending}
              >
                <CheckCircle className="h-4 w-4" /> Approve &amp; Publish
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
