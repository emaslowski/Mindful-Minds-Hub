import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { studioPortfolio } from '@/lib/studioApi';
import { Card, CardContent } from '@/components/ui/card';
import { Star, ClipboardCheck, CheckCircle, RefreshCw, FolderOpen } from 'lucide-react';

export default function Portfolio() {
  const { user, isLoading } = useRequireStudioRole('student');

  const { data } = useQuery({
    queryKey: ['studio-portfolio'],
    queryFn: () => studioPortfolio.get(),
    enabled: !!user,
  });

  if (isLoading || !user) return null;

  const p = data?.portfolio;

  const stats = [
    { label: 'Projects Contributed', value: p?.projectsContributed ?? 0, icon: <FolderOpen className="h-5 w-5 text-[#c4622d]" /> },
    { label: 'Peer Reviews Done', value: p?.peerReviewsCompleted ?? 0, icon: <ClipboardCheck className="h-5 w-5 text-orange-500" /> },
    { label: 'Published Projects', value: p?.publishedProjects ?? 0, icon: <Star className="h-5 w-5 text-[#d4a44c]" /> },
    { label: 'Completed Projects', value: p?.completedProjects ?? 0, icon: <CheckCircle className="h-5 w-5 text-[#688a52]" /> },
    { label: 'Handoffs Created', value: p?.handoffsCreated ?? 0, icon: <RefreshCw className="h-5 w-5 text-blue-500" /> },
  ];

  return (
    <StudioLayout>
      <StudioPage
        title="My Portfolio"
        subtitle={`${user.displayName} · Private — not visible to the public`}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {stats.map((s) => (
            <Card key={s.label} className="bg-[#eee6d8] border-[#d5cabe]">
              <CardContent className="p-4 flex items-center gap-3">
                {s.icon}
                <div>
                  <p className="text-2xl font-bold text-[#453329]">{s.value}</p>
                  <p className="text-xs text-[#688a52]">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="font-serif text-lg font-semibold text-[#453329] mb-3">All My Projects</h2>
        {(p?.projects ?? []).length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardContent className="p-8 text-center text-sm text-[#688a52]">
              No projects yet. Start creating from your dashboard!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {p?.projects.map((project) => (
              <Link key={project.id} href={`/studio/projects/${project.id}`}>
                <Card className="bg-[#eee6d8] border-[#d5cabe] hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#453329] text-sm">{project.title}</p>
                      <p className="text-xs text-[#688a52] mt-0.5">{project.contentType}</p>
                    </div>
                    <StatusBadge status={project.status} />
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
