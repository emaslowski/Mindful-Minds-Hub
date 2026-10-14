import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { studioPeerReviews } from '@/lib/studioApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, ChevronRight } from 'lucide-react';

export default function PeerReviewList() {
  const { user, isLoading } = useRequireStudioRole('student');

  const { data } = useQuery({
    queryKey: ['studio-peer-review-queue', user?.id, user?.jobId ?? null],
    queryFn: () => studioPeerReviews.myQueue(),
    enabled: !!user,
    refetchInterval: 30_000,
  });

  if (isLoading || !user) return null;

  const projects = data?.projects ?? [];
  const pending = projects.filter((p) => p.status === 'Peer Review');
  const done = projects.filter((p) => p.status !== 'Peer Review');

  // E&D job group gets a tailored heading
  const isEditorGroup = user.jobId === 269;
  const pageSubtitle = isEditorGroup
    ? 'Projects submitted by other groups for your editorial review'
    : 'Projects assigned to you for review';

  return (
    <StudioLayout>
      <StudioPage
        title={isEditorGroup ? 'Editorial Review Inbox' : 'Peer Reviews'}
        subtitle={pageSubtitle}
      >
        {pending.length === 0 && done.length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardContent className="p-10 text-center">
              <ClipboardCheck className="h-10 w-10 text-[#d5cabe] mx-auto mb-3" />
              <p className="text-sm text-[#688a52]">No peer reviews assigned to you right now.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <div>
                <h2 className="font-serif text-base font-semibold text-[#453329] mb-2">Awaiting Your Review</h2>
                <div className="space-y-2">
                  {pending.map((p) => (
                    <Link key={p.id} href={`/studio/peer-reviews/${p.id}`}>
                      <Card className="bg-[#eee6d8] border-[#d5cabe] hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-400">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-[#453329] text-sm">{p.title}</p>
                            <p className="text-xs text-[#688a52] mt-0.5">{p.contentType}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full text-xs">
                              Review Now
                            </Button>
                            <ChevronRight className="h-4 w-4 text-[#d5cabe]" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {done.length > 0 && (
              <div>
                <h2 className="font-serif text-base font-semibold text-[#453329] mb-2">Previously Reviewed</h2>
                <div className="space-y-2">
                  {done.map((p) => (
                    <Card key={p.id} className="bg-[#eee6d8] border-[#d5cabe]">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[#453329] text-sm">{p.title}</p>
                          <p className="text-xs text-[#688a52] mt-0.5">{p.contentType}</p>
                        </div>
                        <StatusBadge status={p.status} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </StudioPage>
    </StudioLayout>
  );
}
