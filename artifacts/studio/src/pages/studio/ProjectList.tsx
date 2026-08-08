import { useQuery } from '@tanstack/react-query';
import { Link, useSearch } from 'wouter';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { studioProjects } from '@/lib/studioApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ProjectList() {
  const { user, isLoading } = useRequireStudioRole('student');
  const search = useSearch();
  const params = new URLSearchParams(search);
  const statusFilter = params.get('status');

  const { data } = useQuery({
    queryKey: ['studio-projects'],
    queryFn: () => studioProjects.list(),
    enabled: !!user,
  });

  if (isLoading || !user) return null;

  const projects = (data?.projects ?? []).filter((p) =>
    statusFilter ? p.status === statusFilter : true,
  );

  return (
    <StudioLayout>
      <StudioPage
        title={statusFilter ? `Projects: ${statusFilter}` : 'My Projects'}
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
            {projects.map((p) => (
              <Link key={p.id} href={`/studio/projects/${p.id}`}>
                <Card className="bg-[#eee6d8] border-[#d5cabe] hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-[#453329] text-sm truncate">{p.title}</p>
                      <p className="text-xs text-[#688a52] mt-0.5">{p.contentType}</p>
                      <p className="text-xs text-[#d5cabe] mt-0.5">
                        Updated {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={p.status} />
                      <ChevronRight className="h-4 w-4 text-[#d5cabe]" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </StudioPage>
    </StudioLayout>
  );
}
