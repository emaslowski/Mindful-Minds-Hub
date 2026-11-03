import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useGetPublishedContent } from "@workspace/api-client-react";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/mind-matters-ds/components/ui/select";
import type { PublicationBlock } from "@workspace/mind-matters-ds/components/PublishedArticle";
import { PublicationDiscussion } from "@/components/PublicationDiscussion";

type PublishedEdition = {
  id: number;
  projectId?: number;
  title: string;
  blocks?: PublicationBlock[];
  pageOrder?: number;
};

type EaselVideo = {
  edition: PublishedEdition;
  block: PublicationBlock;
};

export function DirectedDrawsEasel() {
  const { data, isLoading, isError } = useGetPublishedContent(
    { section: "directed-draws" },
    { query: { staleTime: 45_000, refetchOnWindowFocus: true } },
  );
  const editions = [...((data?.publications ?? []) as PublishedEdition[])].sort(
    (a, b) => (a.pageOrder ?? 0) - (b.pageOrder ?? 0),
  );
  const videos: EaselVideo[] = editions.flatMap((edition) =>
    (edition.blocks ?? [])
      .filter((block) => block.type === "video" && Number.isFinite(block.mediaId) && Number.isFinite(edition.projectId))
      .map((block) => ({ edition, block })),
  );
  const [activeVideo, setActiveVideo] = useState(0);
  useEffect(() => {
    setActiveVideo((current) => Math.min(current, Math.max(videos.length - 1, 0)));
  }, [videos.length]);
  const selected = videos[activeVideo];

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center gap-2">
      {isLoading ? (
        <div className="min-h-0 w-full flex-1 animate-pulse rounded-sm bg-card" aria-label="Loading directed drawing videos" />
      ) : isError ? (
        <div className="flex min-h-0 w-full flex-1 items-center justify-center rounded-sm bg-card p-3 text-center">
          <p className="text-sm text-foreground/75">Directed drawing videos could not be loaded.</p>
        </div>
      ) : selected ? (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-1 overflow-hidden">
          <video
            key={`${selected.edition.projectId}-${selected.block.mediaId}`}
            src={`/api/public/publications/${selected.edition.projectId}/media/${selected.block.mediaId}`}
            controls
            playsInline
            preload="metadata"
            aria-label={selected.block.caption || selected.edition.title}
            className="min-h-0 w-full flex-1 rounded-sm object-contain"
          />
          {(selected.block.caption || selected.edition.title) && (
            <p className="line-clamp-2 w-full break-words text-center text-xs font-semibold leading-tight text-foreground">
              {selected.block.caption || selected.edition.title}
            </p>
          )}
        </div>
      ) : (
        <div className="flex min-h-0 w-full flex-1 items-center justify-center p-3 text-center">
          <p className="font-handwritten text-xl text-foreground/65">A new drawing lesson will appear here.</p>
        </div>
      )}
      {!isLoading && !isError && selected && (
        <PublicationDiscussion
          section={`/content/publication/${selected.edition.projectId}`}
          title={selected.block.caption || selected.edition.title}
          testId={`publication-${selected.edition.projectId}`}
        />
      )}
      {!isLoading && !isError && videos.length > 1 && (
        <Select value={String(activeVideo)} onValueChange={(value) => setActiveVideo(Number(value))}>
          <SelectTrigger className="h-8 w-full shrink-0 bg-background/90 text-xs" aria-label="Choose a drawing video">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {videos.map((video, index) => (
              <SelectItem key={`${video.edition.projectId}-${video.block.mediaId}`} value={String(index)}>
                {video.block.caption || video.edition.title || `Video ${index + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function TeacherDrawingPostLink() {
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/studio/auth/me", { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((result: { user?: { role?: string } | null } | null) => {
        if (!cancelled) setIsTeacher(result?.user?.role === "teacher");
      })
      .catch(() => {
        if (!cancelled) setIsTeacher(false);
      });
    return () => { cancelled = true; };
  }, []);

  return isTeacher ? (
    <div className="flex flex-col items-center gap-2 text-center">
      <Button asChild variant="secondary" size="sm">
        <Link href="/studio/teacher/projects?destination=directed-draws&contentType=Directed%20drawing%20activity">
          Post a drawing video
        </Link>
      </Button>
      <p className="max-w-xs text-xs text-foreground/70">Teachers can add a video to a website edition and publish it to this easel.</p>
    </div>
  ) : null;
}
