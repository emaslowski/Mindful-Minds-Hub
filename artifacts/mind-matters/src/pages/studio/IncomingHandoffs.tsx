import { useQuery } from '@tanstack/react-query';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { studioPortfolio } from '@/lib/studioApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, ChevronRight } from 'lucide-react';

export default function IncomingHandoffs() {
  const { user, isLoading } = useRequireStudioRole('student');

  const { data } = useQuery({
    queryKey: ['studio-incoming-handoffs'],
    queryFn: () => studioPortfolio.incomingHandoffs(),
    enabled: !!user,
  });

  if (isLoading || !user) return null;

  const handoffs = data?.handoffs ?? [];

  return (
    <StudioLayout>
      <StudioPage
        title="Work From Previous Class"
        subtitle="Projects your team can adopt and continue"
      >
        {handoffs.length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardContent className="p-10 text-center">
              <BookOpen className="h-10 w-10 text-[#d5cabe] mx-auto mb-3" />
              <p className="text-sm text-[#688a52]">No handoff projects are available yet. Check back later, or ask your teacher.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {handoffs.map((h) => (
              <Card key={h.id} className="bg-[#eee6d8] border-[#d5cabe]">
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif text-[#453329] text-base">{h.projectTitle}</CardTitle>
                  <p className="text-xs text-[#688a52]">{h.contentType} · From: {h.previousCycleName ?? 'Previous class'}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-[#d5cabe]">
                      <p className="text-xs font-medium text-[#453329] mb-1">✅ What was completed</p>
                      <p className="text-xs text-[#688a52]">{h.completedWork || 'See notes below'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[#d5cabe]">
                      <p className="text-xs font-medium text-[#453329] mb-1">📋 Still needs to be done</p>
                      <p className="text-xs text-[#688a52]">{h.remainingWork || 'See notes below'}</p>
                    </div>
                    {h.ideas && (
                      <div className="bg-white rounded-lg p-3 border border-[#d5cabe] md:col-span-2">
                        <p className="text-xs font-medium text-[#453329] mb-1">💡 Ideas from the previous team</p>
                        <p className="text-xs text-[#688a52]">{h.ideas}</p>
                      </div>
                    )}
                    {h.notes && (
                      <div className="bg-white rounded-lg p-3 border border-[#d5cabe] md:col-span-2">
                        <p className="text-xs font-medium text-[#453329] mb-1">📝 Notes</p>
                        <p className="text-xs text-[#688a52]">{h.notes}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[#688a52] italic">
                    Talk to your teacher if you'd like to adopt this project for your class.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </StudioPage>
    </StudioLayout>
  );
}
