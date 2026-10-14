import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { teacherReview } from '@/lib/studioApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ReviewQueue() {
  const { user, isLoading } = useRequireStudioRole('teacher');

  const { data } = useQuery({
    queryKey: ['teacher-review-queue'],
    queryFn: () => teacherReview.queue(),
    enabled: !!user,
    refetchInterval: 30_000,
  });

  if (isLoading || !user) return null;

  const queue = data?.projects ?? [];

  return (
    <StudioLayout>
      <StudioPage
        title="Review Submissions"
        subtitle={`${queue.length} project${queue.length !== 1 ? 's' : ''} awaiting your review`}
      >
        {queue.length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardContent className="p-10 text-center text-sm text-[#688a52]">
              No submissions awaiting review right now. 🎉
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {queue.map((p) => (
              <Link key={p.id} href={`/studio/teacher/review/${p.id}`}>
                <Card className="bg-[#eee6d8] border-[#d5cabe] hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {p.contentFlagged && (
                          <span className="flex items-center gap-1 text-amber-600 text-xs font-medium bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                            <AlertCircle className="h-3 w-3" /> Teacher Attention Recommended
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-[#453329] text-sm mt-1">{p.title}</p>
                      <p className="text-xs text-[#688a52]">
                        {p.studentName ?? 'Unknown'} · {p.teamName ?? 'No team'} · {p.contentType}
                      </p>
                      <p className="text-xs text-[#d5cabe] mt-0.5">
                        {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}
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
