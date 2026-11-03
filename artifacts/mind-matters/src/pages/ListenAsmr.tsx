import { Link } from "wouter";
import { useGetPublishedContent } from "@workspace/api-client-react";
import { PublishedArticle } from "@workspace/mind-matters-ds/components/PublishedArticle";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Skeleton } from "@workspace/mind-matters-ds/components/ui/skeleton";
import { Headphones } from "lucide-react";
import { WaveFooter } from "@/components/WaveFooter";
import { PublicationDiscussion } from "@/components/PublicationDiscussion";

export default function ListenAsmr() {
  const { data, isLoading, isError, refetch } = useGetPublishedContent({}, {
    query: { staleTime: 45_000, refetchOnWindowFocus: true },
  });
  const clips = (data?.publications ?? [])
    .filter((publication) =>
      publication.destinationSection === "asmr"
      || (publication.destinationSection === "calm-corner" && (
        publication.contentType === "ASMR video" || publication.title.trim().toLowerCase() === "squishy asmr"
      )),
    )
    .sort((first, second) => (first.pageOrder ?? 0) - (second.pageOrder ?? 0));

  return (
    <div className="w-full flex flex-col flex-1 pt-8 md:pt-12">
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 mb-16 relative z-10">
        <div className="mb-8">
          <Button asChild size="sm" variant="outline">
            <Link href="/listen" data-testid="link-back-to-listen">Back to Listen</Link>
          </Button>
        </div>

        <header className="mb-10 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-secondary/20 p-4 text-primary">
            <Headphones aria-hidden="true" className="h-8 w-8" />
          </div>
          <h1 className="mb-3 font-serif text-4xl font-bold text-foreground sm:text-5xl">ASMR</h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg">
            ASMR is a name for gentle sounds that some people enjoy listening to, such as soft tapping or quiet page turning.
            Explore student-created clips approved by a teacher.
          </p>
          <p className="mx-auto mt-4 max-w-2xl rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground/75">
            Keep the volume low. Headphones are optional. Nothing plays automatically; choose a clip and use its regular playback controls if you would like to listen.
          </p>
        </header>

        {isLoading ? (
          <div aria-label="Loading published ASMR clips" className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[0, 1].map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-card p-6">
                <Skeleton className="mb-4 h-7 w-2/3" />
                <Skeleton className="mb-3 h-4 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div role="alert" className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="mb-4 text-foreground/75">Published clips could not be loaded right now.</p>
            <Button variant="outline" onClick={() => refetch()} data-testid="button-retry-asmr">Try again</Button>
          </div>
        ) : clips.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2" data-testid="list-published-asmr">
            {clips.map((clip) => (
              <article key={clip.id} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
                <PublishedArticle
                  title={clip.title}
                  content={clip.content}
                  blocks={clip.blocks}
                  projectId={clip.projectId}
                  appearance={clip.appearance}
                  authorDisplay={clip.authorDisplay}
                />
                <PublicationDiscussion
                  section={`/content/publication/${clip.projectId ?? clip.id}`}
                  title={clip.title}
                  testId={`publication-${clip.projectId ?? clip.id}`}
                />
              </article>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center sm:p-10" data-testid="empty-asmr">
            <Headphones aria-hidden="true" className="mx-auto mb-4 h-10 w-10 text-primary/60" />
            <h2 className="mb-2 font-serif text-2xl font-bold text-foreground">No clips yet</h2>
            <p className="text-sm leading-relaxed text-foreground/75">
              There are no teacher-published ASMR clips here yet. Check back when student work has been reviewed and published.
            </p>
          </div>
        )}
      </div>
      <WaveFooter quote="Take a quiet moment, whenever it feels right." />
    </div>
  );
}
