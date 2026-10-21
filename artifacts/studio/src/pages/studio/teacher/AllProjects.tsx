import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { CONTENT_TYPES, teacherReview } from '@/lib/studioApi';
import { Card, CardContent } from '@workspace/mind-matters-ds/components/ui/card';
import { Button } from '@workspace/mind-matters-ds/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/mind-matters-ds/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/mind-matters-ds/components/ui/alert-dialog';
import { AlertCircle, ChevronRight, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@workspace/mind-matters-ds/components/ui/dialog';
import { Input } from '@workspace/mind-matters-ds/components/ui/input';
import { Label } from '@workspace/mind-matters-ds/components/ui/label';

const ALL_STATUSES = [
  'Assigned', 'Researching', 'Peer Review',
  'Revision Needed', 'Ready for Teacher Review', 'Teacher Reviewing',
  'Approved', 'Published', 'Archived',
];

export default function AllProjects() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const routeParams = new URLSearchParams(window.location.search);
  const requestedDestination = routeParams.get('destination') ?? '';
  const requestedContentType = routeParams.get('contentType') ?? '';
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [createOpen, setCreateOpen] = useState(requestedDestination === 'directed-draws');
  const [newTitle, setNewTitle] = useState(requestedDestination === 'directed-draws' ? 'Directed drawing activity' : '');
  const [newContentType, setNewContentType] = useState<string>(
    CONTENT_TYPES.includes(requestedContentType as (typeof CONTENT_TYPES)[number]) ? requestedContentType : 'Blog article',
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data } = useQuery({
    queryKey: ['teacher-all-projects'],
    queryFn: () => teacherReview.allProjects(),
    enabled: !!user,
  });

  const { mutate: deleteProject, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => teacherReview.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-all-projects'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-review-queue'] });
      setConfirmId(null);
      toast({ title: 'Project deleted', description: 'The project was moved to Archived.' });
    },
    onError: (err: Error) => {
      setConfirmId(null);
      toast({ title: 'Could not delete project', description: err.message, variant: 'destructive' });
    },
  });

  const { mutate: createWebsitePost, isPending: isCreating } = useMutation({
    mutationFn: () => teacherReview.createProject({ title: newTitle.trim(), contentType: newContentType }),
    onSuccess: ({ project }) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-all-projects'] });
      setCreateOpen(false);
      setNewTitle('');
      toast({ title: 'Website post created', description: 'You can now build its website edition.' });
      const destinationQuery = requestedDestination ? `?destination=${encodeURIComponent(requestedDestination)}` : '';
      navigate(`/studio/teacher/review/${project.id}${destinationQuery}`);
    },
    onError: (error: Error) => toast({ title: 'Could not create website post', description: error.message, variant: 'destructive' }),
  });

  if (isLoading || !user) return null;

  const all = data?.projects ?? [];
  // Archived projects remain available through the explicit Archived filter,
  // but should not stay in the normal active project list after deletion.
  const filtered = statusFilter
    ? all.filter((p) => p.status === statusFilter || (statusFilter === 'Researching' && p.status === 'Drafting'))
    : all.filter((p) => p.status !== 'Archived');

  return (
    <StudioLayout>
      <StudioPage
        title="All Projects"
        subtitle={`${filtered.length} project${filtered.length !== 1 ? 's' : ''}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={() => setCreateOpen(true)} className="bg-[#c4622d] text-white hover:bg-[#a85226] rounded-full">
              New Website Post
            </Button>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-56 bg-white border-[#d5cabe] text-sm">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardContent className="p-10 text-center text-sm text-[#688a52]">
              No projects found.
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#eee6d8] border-[#d5cabe] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#d5cabe] text-[#453329]">
                    <th className="text-left px-4 py-3 font-medium">Project</th>
                    <th className="text-left px-4 py-3 font-medium">Student</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Updated</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} className={i % 2 === 0 ? 'bg-[#eee6d8]' : 'bg-[#f5efe5]'}>
                      <td className="px-4 py-3 font-medium text-[#453329]">
                        <Link
                          href={`/studio/teacher/review/${p.id}`}
                          className="hover:text-[#c4622d] hover:underline underline-offset-2"
                        >
                          {p.contentFlagged && (
                            <AlertCircle className="inline h-3.5 w-3.5 text-amber-500 mr-1" />
                          )}
                          {p.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#688a52]">{p.studentName ?? '—'}</td>
                      <td className="px-4 py-3 text-[#688a52] text-xs">{p.contentType}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-[#688a52] text-xs">
                        {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {['Ready for Teacher Review', 'Teacher Reviewing'].includes(p.status) && (
                            <Link href={`/studio/teacher/review/${p.id}`}>
                              <Button size="sm" className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full text-xs">
                                Review
                              </Button>
                            </Link>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-[#d5cabe] hover:text-red-500 hover:bg-red-50"
                            onClick={() => {
                              setConfirmId(p.id);
                              setConfirmTitle(p.title);
                            }}
                            title="Delete project"
                            aria-label={`Delete ${p.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </StudioPage>

      <AlertDialog open={confirmId !== null} onOpenChange={(open) => !open && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">"{confirmTitle}"</span> will be moved to Archived and removed from active work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => confirmId !== null && deleteProject(confirmId)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Yes, delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a website post</DialogTitle>
            <DialogDescription>Start a teacher-owned post directly in the website editor. It does not change a student submission.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => { event.preventDefault(); if (newTitle.trim()) createWebsitePost(); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-website-post-title">Post title</Label>
              <Input id="new-website-post-title" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Title for the website post" required />
            </div>
            <div className="space-y-1.5">
              <Label>Post type</Label>
              <Select value={newContentType} onValueChange={setNewContentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTENT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isCreating || !newTitle.trim()} className="bg-[#688a52] text-white hover:bg-[#557a43]">
                {isCreating ? 'Creating…' : 'Create and edit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </StudioLayout>
  );
}
