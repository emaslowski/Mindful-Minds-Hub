import { Film } from 'lucide-react';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { VideoProductionQueue } from '@/components/studio/VideoProductionQueue';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { isVideoProducer } from '@/lib/videoApi';

export default function VideoProductions() {
  const { user, isLoading } = useRequireStudioRole('student');

  if (isLoading || !user) {
    return <div className="flex min-h-[50dvh] items-center justify-center text-[#453329]">Loading video assignments…</div>;
  }
  if (!isVideoProducer(user.jobTitle)) {
    return (
      <StudioLayout>
        <StudioPage title="Video Production Queue">
          <div className="rounded-xl border border-[#d5cabe] bg-[#eee6d8] p-5 text-sm text-[#453329]">This queue is available to the Video Producers group.</div>
        </StudioPage>
      </StudioLayout>
    );
  }

  return (
    <StudioLayout>
      <StudioPage title="Video Production Queue" subtitle="Approved projects assigned to your production group.">
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#d5cabe] bg-[#eee6d8] p-4">
          <Film className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#c4622d]" />
          <p className="text-sm leading-relaxed text-[#453329]">Open an assignment to review its content and teacher directions. Uploaded videos remain private until a teacher makes a final decision.</p>
        </div>
        <VideoProductionQueue userId={user.id} jobId={user.jobId} />
      </StudioPage>
    </StudioLayout>
  );
}
