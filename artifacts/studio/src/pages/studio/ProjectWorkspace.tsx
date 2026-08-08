import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { ContentWorkspace } from '@/components/studio/ContentWorkspace';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { studioProjects, studioSources, CONTENT_TYPES, type StudioSource } from '@/lib/studioApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, ExternalLink, ChevronRight, Save, Send, AlertCircle } from 'lucide-react';
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

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const project = data?.project;

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setContent(project.content);
      setNotes(project.notes);
      setIsDirty(false);
    }
  }, [project]);

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
    mutationFn: (toStatus: string) => studioProjects.transition(projectId, toStatus),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['studio-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['studio-projects'] });
      toast({ title: 'Status updated', description: `Project moved to: ${data.project.status}` });
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const canEdit = user?.role === 'teacher' || project?.assignedStudentId === user?.id;
  const nextStatus = project ? NEXT_STATUS[project.status] : undefined;

  if (authLoading || isLoading || !project) {
    return <div className="flex items-center justify-center h-screen text-[#453329]">Loading…</div>;
  }

  const stepIndex = WORKFLOW_STEPS.indexOf(project.status);

  return (
    <StudioLayout>
      <StudioPage
        title={title || 'Untitled Project'}
        subtitle={project.contentType}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} />
            {canEdit && isDirty && (
              <Button
                size="sm"
                variant="outline"
                className="border-[#d5cabe] text-[#453329] gap-1"
                onClick={() => saveProject()}
                disabled={isSaving}
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            )}
            {canEdit && nextStatus && (
              <Button
                size="sm"
                className="bg-[#688a52] hover:bg-[#557a43] text-white rounded-full gap-1"
                onClick={() => {
                  if (isDirty) saveProject();
                  transition(nextStatus);
                }}
                disabled={isTransitioning}
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
            <p className="text-xs text-red-600 mt-2 font-medium">⚠ Revision needed — review the feedback and update your draft.</p>
          )}
        </div>

        {/* Safety reminder */}
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            Do not include private information about yourself or another student. Mind Matters provides
            general educational wellness information and does not replace help from a trusted adult or professional.
          </span>
        </div>

        <Tabs defaultValue="content">
          <TabsList className="bg-[#eee6d8] border border-[#d5cabe]">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[#453329]">Title</Label>
              <Input
                value={title}
                onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
                disabled={!canEdit}
                className="bg-white border-[#d5cabe] text-base font-medium"
                placeholder="Give your project a title"
              />
            </div>

            <ContentWorkspace
              contentType={project.contentType}
              content={content}
              onChange={(val) => { setContent(val); setIsDirty(true); }}
              disabled={!canEdit}
            />

            <p className="text-xs text-[#688a52]">
              ✏ This is a draft and will not be visible to the public until your teacher approves and publishes it.
            </p>

            {canEdit && (
              <Button
                className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full"
                onClick={() => saveProject()}
                disabled={isSaving || !isDirty}
              >
                {isSaving ? 'Saving…' : 'Save Draft'}
              </Button>
            )}
          </TabsContent>

          <TabsContent value="sources" className="mt-4">
            <SourcesPanel projectId={projectId} canEdit={canEdit} sources={sourcesData?.sources ?? []} onRefresh={refetchSources} />
          </TabsContent>

          <TabsContent value="notes" className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[#453329]">Project notes (private — not published)</Label>
              <Textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setIsDirty(true); }}
                disabled={!canEdit}
                className="bg-white border-[#d5cabe] min-h-40 text-sm resize-y"
                placeholder="Add any research notes, ideas, or reminders here…"
              />
            </div>
            {canEdit && (
              <Button
                variant="outline"
                className="border-[#d5cabe] text-[#453329] rounded-full"
                onClick={() => saveProject()}
                disabled={isSaving || !isDirty}
              >
                Save Notes
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </StudioPage>
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
