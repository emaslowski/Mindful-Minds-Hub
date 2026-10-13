import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { ContentWorkspace } from '@/components/studio/ContentWorkspace';
import { ContentPreview } from '@/components/studio/ContentPreview';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { studioProjects, studioSources, type StudioSource } from '@/lib/studioApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Plus, ExternalLink, ChevronRight, ArrowLeft, Save, AlertCircle, BookOpen, Eye, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WORKFLOW_STEPS = [
  'Assigned', 'Researching', 'Drafting', 'Peer Review',
  'Revision Needed', 'Ready for Teacher Review', 'Teacher Reviewing',
  'Approved', 'Published',
];

const NEXT_STATUS: Record<string, string> = {
  'Assigned': 'Researching',
  'Researching': 'Drafting',
  'Drafting': 'Peer Review',
  'Revision Needed': 'Drafting',
};

/** Stages where the Preview tab is available */
const PREVIEW_STAGES = new Set([
  'Drafting', 'Peer Review', 'Revision Needed',
  'Ready for Teacher Review', 'Teacher Reviewing', 'Approved', 'Published',
]);

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { user, isLoading: authLoading } = useRequireStudioRole('student', 'teacher');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['studio-project', projectId],
    queryFn: () => studioProjects.get(projectId),
    enabled: !!user && !!projectId,
  });

  const { data: sourcesData, refetch: refetchSources } = useQuery({
    queryKey: ['studio-sources', projectId],
    queryFn: () => studioSources.list(projectId),
    enabled: !!user && !!projectId,
  });

  const project = data?.project;

  // Fetch teacher feedback when project is returned for revision
  const { data: feedbackData } = useQuery({
    queryKey: ['teacher-feedback', projectId],
    queryFn: () => studioProjects.teacherFeedback(projectId),
    enabled: !!user && !!projectId && project?.status === 'Revision Needed',
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setContent(project.content);
      setNotes(project.notes);
      setIsDirty(false);
      // Auto-switch to Sources when entering Researching stage
      setActiveTab(project.status === 'Researching' ? 'sources' : 'content');
    }
  }, [project?.id, project?.status]);

  const { mutate: saveProject, isPending: isSaving } = useMutation({
    mutationFn: () => studioProjects.update(projectId, { title, content, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-project', projectId] });
      setIsDirty(false);
      toast({ title: 'Draft saved', description: 'Your work has been saved.' });
    },
    onError: (err) => toast({ title: 'Save failed', description: err.message, variant: 'destructive' }),
  });

  const { mutate: transition, isPending: isTransitioning } = useMutation({
    mutationFn: async (toStatus: string) => {
      // Persist current edits before changing stages, which reloads the form.
      // A failed save must leave the student in the current stage.
      if (isDirty) {
        await studioProjects.update(projectId, { title, content, notes });
      }
      return studioProjects.transition(projectId, toStatus);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['studio-project', projectId], data);
      queryClient.invalidateQueries({ queryKey: ['studio-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['studio-projects'] });
      setIsDirty(false);
      toast({ title: 'Status updated', description: `Project moved to: ${data.project.status}` });
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const [, navigate] = useLocation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { mutate: deleteProject, isPending: isDeleting } = useMutation({
    mutationFn: () => studioProjects.delete(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-projects'] });
      toast({ title: 'Project deleted' });
      navigate('/studio/projects');
    },
    onError: (err) => toast({ title: 'Could not delete', description: err.message, variant: 'destructive' }),
  });

  const canEdit =
    user?.role === 'teacher' ||
    project?.assignedStudentId === user?.id ||
    (user?.jobId != null && project?.jobId === user?.jobId);

  const canDelete =
    canEdit &&
    user?.role !== 'teacher' &&
    ['Assigned', 'Researching', 'Drafting'].includes(project?.status ?? '');

  const nextStatus = project ? NEXT_STATUS[project.status] : undefined;
  const showPreview = project ? PREVIEW_STAGES.has(project.status) : false;
  const teacherFeedback = feedbackData?.review;

  if (authLoading || isLoading || !project) {
    return <div className="flex items-center justify-center h-screen text-[#453329]">Loading…</div>;
  }

  const stepIndex = WORKFLOW_STEPS.indexOf(project.status);
  const sourceCount = sourcesData?.sources?.length ?? 0;

  return (
    <StudioLayout>
      <StudioPage
        title={title || 'Untitled Project'}
        subtitle={project.contentType}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} />
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving || isTransitioning || isDeleting}
                className="p-1.5 rounded-lg text-[#d5cabe] hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete project"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            {canEdit && isDirty && (
              <Button
                size="sm"
                variant="outline"
                className="border-[#d5cabe] text-[#453329] gap-1"
                onClick={() => saveProject()}
                disabled={isSaving || isTransitioning}
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            )}
            {canEdit && nextStatus && (
              <Button
                size="sm"
                className="bg-[#688a52] hover:bg-[#557a43] text-white rounded-full gap-1"
                onClick={() => transition(nextStatus)}
                disabled={isTransitioning || isSaving}
              >
                <ChevronRight className="h-3.5 w-3.5" />
                {nextStatus === 'Peer Review' ? 'Submit for Peer Review' :
                  nextStatus === 'Ready for Teacher Review' ? 'Submit to Teacher' :
                    `Move to ${nextStatus}`}
              </Button>
            )}
          </div>
        }
      >
        {/* Progress bar */}
        <div className="mb-6 bg-[#eee6d8] rounded-xl p-4 border border-[#d5cabe]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {WORKFLOW_STEPS.filter(s => s !== 'Revision Needed').map((step, i, arr) => (
              <div key={step} className="flex items-center gap-1.5 flex-shrink-0">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  step === project.status
                    ? 'bg-[#c4622d] text-white'
                    : i < stepIndex
                      ? 'bg-[#688a52] text-white'
                      : 'bg-white text-[#453329] border border-[#d5cabe]'
                }`}>
                  {step}
                </div>
                {i < arr.length - 1 && <ChevronRight className="h-3 w-3 text-[#d5cabe] flex-shrink-0" />}
              </div>
            ))}
          </div>
          {project.status === 'Revision Needed' && (
            <p className="text-xs text-red-600 mt-2 font-medium">⚠ Revision needed — review your teacher's feedback below and update your draft.</p>
          )}
        </div>

        {/* Teacher feedback banner — shown when returned for revision */}
        {project.status === 'Revision Needed' && teacherFeedback && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <MessageSquare className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">Teacher's Feedback</p>
              <p className="text-sm text-red-800 leading-relaxed whitespace-pre-wrap">
                {teacherFeedback.feedback ?? 'Your teacher reviewed this project and sent it back for revision. Please update your content and resubmit.'}
              </p>
            </div>
          </div>
        )}

        {/* Researching guidance banner */}
        {project.status === 'Researching' && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <BookOpen className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-700 mb-1">Research Stage</p>
              <p className="text-sm text-blue-800 leading-relaxed">
                Add your sources in the <strong>Sources</strong> tab below before moving to Drafting. 
                Document every website, book, or resource you used. Strong sources make your content more trustworthy!
              </p>
              {canEdit && user?.role === 'student' && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-200 text-blue-800 gap-1"
                    onClick={() => transition('Assigned')}
                    disabled={isTransitioning || isSaving}
                    data-testid="back-to-beginning"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {isTransitioning ? 'Saving and moving…' : 'Back to beginning'}
                  </Button>
                  <p className="mt-1 text-xs text-blue-800">
                    Moved here by accident? Return to the Assigned stage to plan your content. Your content, notes, and sources will be kept.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Peer Review info banner */}
        {project.status === 'Peer Review' && (
          <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-700 mb-1">Under Peer Review</p>
              <p className="text-sm text-orange-800 leading-relaxed">
                Your project has been sent to the <strong>Editors & Designers</strong> team for peer review. 
                They'll check your content and give feedback before it goes to your teacher. 
                You'll be notified once the review is complete.
              </p>
            </div>
          </div>
        )}

        {/* Safety reminder */}
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            Do not include private information about yourself or another student. Mind Matters provides
            general educational wellness information and does not replace help from a trusted adult or professional.
          </span>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#eee6d8] border border-[#d5cabe]">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="sources">
              Sources{sourceCount > 0 ? ` (${sourceCount})` : ''}
            </TabsTrigger>
            {showPreview && (
              <TabsTrigger value="preview" className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                Preview
              </TabsTrigger>
            )}
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[#453329]">Title</Label>
              <Input
                value={title}
                onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
                disabled={!canEdit || isTransitioning || isSaving}
                className="bg-white border-[#d5cabe] text-base font-medium"
                placeholder="Give your project a title"
              />
            </div>

            <ContentWorkspace
              contentType={project.contentType}
              content={content}
              onChange={(val) => { setContent(val); setIsDirty(true); }}
              disabled={!canEdit || isTransitioning || isSaving}
            />

            <p className="text-xs text-[#688a52]">
              ✏ This is a draft and will not be visible to the public until your teacher approves and publishes it.
            </p>

            {canEdit && (
              <Button
                className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full"
                onClick={() => saveProject()}
                disabled={isSaving || isTransitioning || !isDirty}
              >
                {isSaving ? 'Saving…' : 'Save Draft'}
              </Button>
            )}
          </TabsContent>

          <TabsContent value="sources" className="mt-4">
            {project.status === 'Researching' && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                📚 <strong>Add every source you research here.</strong> Include websites, books, articles — anything you read to learn about your topic.
                You need at least one source before moving to Drafting.
              </div>
            )}
            <SourcesPanel
              projectId={projectId}
              canEdit={canEdit && !isTransitioning && !isSaving}
              sources={sourcesData?.sources ?? []}
              onRefresh={refetchSources}
            />
            {project.status === 'Researching' && canEdit && (sourcesData?.sources?.length ?? 0) > 0 && (
              <div className="mt-6 pt-4 border-t border-[#d5cabe]">
                <Button
                  className="bg-[#688a52] hover:bg-[#557a43] text-white rounded-full gap-1"
                  onClick={() => transition('Drafting')}
                  disabled={isTransitioning || isSaving}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  {isTransitioning ? 'Moving…' : 'Done Researching — Start Drafting'}
                </Button>
              </div>
            )}
          </TabsContent>

          {showPreview && (
            <TabsContent value="preview" className="mt-4">
              <ContentPreview title={title} contentType={project.contentType} content={content} />
            </TabsContent>
          )}

          <TabsContent value="notes" className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[#453329]">Project notes (private — not published)</Label>
              <Textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setIsDirty(true); }}
                disabled={!canEdit || isTransitioning || isSaving}
                className="bg-white border-[#d5cabe] min-h-40 text-sm resize-y"
                placeholder="Add any research notes, ideas, or reminders here…"
              />
            </div>
            {canEdit && (
              <Button
                variant="outline"
                className="border-[#d5cabe] text-[#453329] rounded-full"
                onClick={() => saveProject()}
                disabled={isSaving || isTransitioning || !isDirty}
              >
                Save Notes
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </StudioPage>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">"{title || 'Untitled Project'}"</span> will be
              permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteProject()}
              disabled={isDeleting || isSaving || isTransitioning}
            >
              {isDeleting ? 'Deleting…' : 'Yes, delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StudioLayout>
  );
}

function SourcesPanel({
  projectId, canEdit, sources, onRefresh,
}: {
  projectId: number;
  canEdit: boolean;
  sources: StudioSource[];
  onRefresh: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', website: '', url: '', accessedDate: '', notes: '' });
  const { toast } = useToast();

  const { mutate: addSource, isPending } = useMutation({
    mutationFn: () => studioSources.create(projectId, form),
    onSuccess: () => { onRefresh(); setAdding(false); setForm({ title: '', author: '', website: '', url: '', accessedDate: '', notes: '' }); },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const { mutate: deleteSource } = useMutation({
    mutationFn: (id: number) => studioSources.delete(projectId, id),
    onSuccess: () => onRefresh(),
  });

  return (
    <div className="space-y-4">
      {sources.length === 0 && !adding && (
        <Card className="bg-[#eee6d8] border-[#d5cabe]">
          <CardContent className="p-6 text-center text-sm text-[#688a52]">
            No sources yet. Add your research sources below.
          </CardContent>
        </Card>
      )}
      {sources.map((s) => (
        <Card key={s.id} className="bg-[#eee6d8] border-[#d5cabe]">
          <CardContent className="p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-[#453329] text-sm">{s.title}</p>
              {s.author && <p className="text-xs text-[#688a52]">by {s.author}</p>}
              {s.website && <p className="text-xs text-[#688a52]">{s.website}</p>}
              {s.url && (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#c4622d] underline flex items-center gap-0.5">
                  Visit source <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {s.accessedDate && <p className="text-xs text-[#688a52]">Accessed: {s.accessedDate}</p>}
              {s.notes && <p className="text-xs text-[#453329] mt-1 italic">"{s.notes}"</p>}
            </div>
            {canEdit && (
              <button onClick={() => deleteSource(s.id)} className="text-[#d5cabe] hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </CardContent>
        </Card>
      ))}

      {adding ? (
        <Card className="bg-white border-[#d5cabe]">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label className="text-xs text-[#453329]">Source title *</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="border-[#d5cabe] text-sm" placeholder="Article or book title" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#453329]">Author</Label>
                <Input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} className="border-[#d5cabe] text-sm" placeholder="Author name" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#453329]">Website / Publication</Label>
                <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} className="border-[#d5cabe] text-sm" placeholder="CDC.gov, KidsHealth, etc." />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs text-[#453329]">URL</Label>
                <Input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} className="border-[#d5cabe] text-sm" placeholder="https://…" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#453329]">Date accessed</Label>
                <Input type="date" value={form.accessedDate} onChange={(e) => setForm((f) => ({ ...f, accessedDate: e.target.value }))} className="border-[#d5cabe] text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#453329]">Notes from source</Label>
                <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="border-[#d5cabe] text-sm" placeholder="Key fact or quote" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-[#688a52] hover:bg-[#557a43] text-white rounded-full" onClick={() => addSource()} disabled={isPending || !form.title}>
                {isPending ? 'Adding…' : 'Add Source'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        canEdit && (
          <Button variant="outline" className="border-[#d5cabe] text-[#453329] rounded-full gap-2" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add Source
          </Button>
        )
      )}
    </div>
  );
}
