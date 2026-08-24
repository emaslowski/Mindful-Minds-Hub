import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { teacherReview, teacherAnalytics } from '@/lib/studioApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Users, FolderOpen, ClipboardCheck, Star,
  RefreshCw, AlertCircle, ChevronRight, Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function CommandCenter() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');

  const { data: analytics } = useQuery({
    queryKey: ['teacher-analytics'],
    queryFn: () => teacherAnalytics.get(),
    enabled: !!user,
  });

  const { data: queueData } = useQuery({
    queryKey: ['teacher-review-queue'],
    queryFn: () => teacherReview.queue(),
    enabled: !!user,
  });

  const { mutate: deleteProject, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => teacherReview.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-all-projects'] });
      setConfirmId(null);
      toast({ title: 'Project deleted', description: 'The project was moved to Archived.' });
    },
    onError: (err: Error) => {
      setConfirmId(null);
      toast({ title: 'Could not delete project', description: err.message, variant: 'destructive' });
    },
  });

  if (isLoading || !user) return null;

  const s = analytics?.summary;
  const queue = queueData?.projects ?? [];

  const summaryCards = [
    { label: 'Active Students', value: s?.activeStudents ?? 0, icon: <Users className="h-5 w-5 text-[#c4622d]" />, href: '/studio/teacher/students' },
    { label: 'Projects In Progress', value: s?.totalProjects ?? 0, icon: <FolderOpen className="h-5 w-5 text-[#688a52]" />, href: '/studio/teacher/projects' },
    { label: 'Awaiting Review', value: s?.pendingReview ?? 0, icon: <ClipboardCheck className="h-5 w-5 text-orange-500" />, href: '/studio/teacher/review' },
    { label: 'Published This Cycle', value: s?.published ?? 0, icon: <Star className="h-5 w-5 text-[#d4a44c]" />, href: '/studio/teacher/projects?status=Published' },
    { label: 'Needs Revision', value: s?.revisionNeeded ?? 0, icon: <AlertCircle className="h-5 w-5 text-red-500" />, href: '/studio/teacher/projects?status=Revision+Needed' },
    { label: 'Handoff Projects', value: s?.handoffs ?? 0, icon: <RefreshCw className="h-5 w-5 text-blue-500" />, href: '/studio/teacher/handoffs' },
  ];

  return (
    <StudioLayout>
      <StudioPage title="Command Center" subtitle="Mind Matters Teacher Dashboard">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {summaryCards.map((c) => (
            <Link key={c.label} href={c.href}>
              <Card className="bg-[#eee6d8] border-[#d5cabe] hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  {c.icon}
                  <div>
                    <p className="text-2xl font-bold text-[#453329]">{c.value}</p>
                    <p className="text-xs text-[#688a52]">{c.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Awaiting approval table */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg font-semibold text-[#453329]">Awaiting Your Approval</h2>
          <Link href="/studio/teacher/review">
            <Button variant="ghost" size="sm" className="text-[#688a52] gap-1">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {queue.length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardContent className="p-8 text-center text-sm text-[#688a52]">
              No submissions awaiting review. 🎉
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
                    <th className="text-left px-4 py-3 font-medium">Submitted</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {queue.slice(0, 10).map((p, i) => (
                    <tr key={p.id} className={i % 2 === 0 ? 'bg-[#eee6d8]' : 'bg-[#f5efe5]'}>
                      <td className="px-4 py-3 font-medium text-[#453329]">
                        <Link
                          href={`/studio/teacher/review/${p.id}`}
                          className="hover:text-[#c4622d] hover:underline underline-offset-2"
                        >
                          {p.contentFlagged && (
                            <span className="inline-flex items-center gap-1 text-amber-600 text-xs mr-1">
                              <AlertCircle className="h-3.5 w-3.5" />
                            </span>
                          )}
                          {p.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#688a52]">{p.studentName ?? '—'}</td>
                      <td className="px-4 py-3 text-[#688a52]">{p.contentType}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-[#688a52] text-xs">
                        {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/studio/teacher/review/${p.id}`}>
                            <Button size="sm" className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full text-xs">
                              Review
                            </Button>
                          </Link>
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
