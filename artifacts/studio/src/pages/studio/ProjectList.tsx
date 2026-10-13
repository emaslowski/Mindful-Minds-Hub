import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearch } from 'wouter';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { studioProjects } from '@/lib/studioApi';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, ChevronRight, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const DELETABLE_STATUSES = ['Assigned', 'Researching', 'Drafting'];

export default function ProjectList() {
  const { user, isLoading } = useRequireStudioRole('student');
  const search = useSearch();
  const params = new URLSearchParams(search);
  // Support ?statuses=A,B,C (multi) and legacy ?status=A (single)
  const statusFilter: string[] | null = params.get('statuses')
    ? params.get('statuses')!.split(',')
    : params.get('status')
      ? [params.get('status')!]
      : null;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');

  const { data } = useQuery({
    queryKey: ['studio-projects', user?.id, user?.jobId ?? null],
    queryFn: () => studioProjects.list(),
    enabled: !!user,
  });

  const { mutate: deleteProject, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => studioProjects.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-projects'] });
      setConfirmId(null);
      toast({ title: 'Project deleted', description: 'The project has been removed.' });
    },
    onError: (err) => {
      setConfirmId(null);
      toast({ title: 'Could not delete', description: err.message, variant: 'destructive' });
    },
  });

  if (isLoading || !user) return null;

  const projects = (data?.projects ?? []).filter((p) =>
    statusFilter ? statusFilter.includes(p.status) : true,
  );

  return (
    <StudioLayout>
      <StudioPage
        title={statusFilter ? `Projects: ${statusFilter.join(', ')}` : 'My Projects'}
        subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        action={
          <Link href="/studio">
            <Button className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full gap-2">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </Link>
        }
      >
        {projects.length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardContent className="p-10 text-center">
              <p className="text-[#688a52] text-sm">No projects found. Head to your dashboard to create one!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => {
              const canDelete = DELETABLE_STATUSES.includes(p.status);
              return (
                <Card key={p.id} className="bg-[#eee6d8] border-[#d5cabe] hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <Link href={`/studio/projects/${p.id}`} className="flex-1 min-w-0">
                      <p className="font-medium text-[#453329] text-sm truncate">{p.title}</p>
                      <p className="text-xs text-[#688a52] mt-0.5">{p.contentType}</p>
                      <p className="text-xs text-[#d5cabe] mt-0.5">
                        Updated {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={p.status} />
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setConfirmId(p.id);
                            setConfirmTitle(p.title);
                          }}
                          className="p-1.5 rounded-lg text-[#d5cabe] hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <Link href={`/studio/projects/${p.id}`}>
                        <ChevronRight className="h-4 w-4 text-[#d5cabe]" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </StudioPage>

      <AlertDialog open={confirmId !== null} onOpenChange={(open) => !open && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">"{confirmTitle}"</span> will be permanently removed.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => confirmId && deleteProject(confirmId)}
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
