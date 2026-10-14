import { Link } from 'wouter';
import { AlertCircle, CheckCircle, Film } from 'lucide-react';
import { useVideoProductions } from '@/hooks/useVideoProductions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function VideoProductionQueue({
  userId,
  jobId,
}: {
  userId?: number;
  jobId?: number | null;
}) {
  const { data, isLoading, isError, error, refetch } = useVideoProductions(userId, jobId, !!userId);

  if (isLoading) {
    return (
      <div className="space-y-2" aria-label="Loading video assignments">
        {[1, 2].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded-xl border border-[#d5cabe] bg-[#eee6d8]" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="bg-[#eee6d8] border-[#d5cabe]">
        <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-[#453329]">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
            Could not load video assignments{error instanceof Error ? `: ${error.message}` : '.'}
          </p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const productions = data?.productions ?? [];
  if (productions.length === 0) {
    return (
      <Card className="bg-[#eee6d8] border-[#d5cabe]">
        <CardContent className="flex items-center gap-3 p-6">
          <Film className="h-5 w-5 text-[#688a52]" />
          <div>
            <p className="font-medium text-[#453329]">No video assignments yet</p>
            <p className="text-sm text-[#688a52]">Teacher-approved production assignments will appear here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {productions.map((production) => {
        const uploaded = production.status === 'uploaded';
        return (
          <Link key={production.projectId} href={`/studio/video-productions/${production.projectId}`}>
            <Card className="cursor-pointer border-[#d5cabe] bg-[#eee6d8] transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#453329]">{production.projectTitle}</p>
                  <p className="mt-0.5 text-xs text-[#688a52]">{production.contentType}</p>
                </div>
                <span className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${uploaded ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {uploaded ? <CheckCircle className="h-3.5 w-3.5" /> : <Film className="h-3.5 w-3.5" />}
                  {uploaded ? 'Uploaded' : 'Pending'}
                </span>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
