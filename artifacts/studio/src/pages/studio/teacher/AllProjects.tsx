import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearch } from 'wouter';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { teacherReview } from '@/lib/studioApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { AlertCircle, ChevronRight, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const ALL_STATUSES = [
  'Assigned', 'Researching', 'Drafting', 'Peer Review',
  'Revision Needed', 'Ready for Teacher Review', 'Teacher Reviewing',
  'Approved', 'Published', 'Archived',
];

export default function AllProjects() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  if (isLoading || !user) return null;

  const all = data?.projects ?? [];
  // Archived projects remain available through the explicit Archived filter,
  // but should not stay in the normal active project list after deletion.
  const filtered = statusFilter
    ? all.filter((p) => p.status === statusFilter)
    : all.filter((p) => p.status !== 'Archived');

  return (
    <StudioLayout>
      <StudioPage
        title="All Projects"
        subtitle={`${filtered.length} project${filtered.length !== 1 ? 's' : ''}`}
        action={
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
                    <th className="text-left px-4 py-3 font-medium">Team</th>
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
                      <td className="px-4 py-3 text-[#688a52]">{p.teamName ?? '—'}</td>
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
    </StudioLayout>
  );
}
