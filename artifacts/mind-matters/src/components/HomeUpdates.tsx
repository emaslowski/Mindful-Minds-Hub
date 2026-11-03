import { useGetPublicUpdates } from "@workspace/api-client-react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card } from "@workspace/mind-matters-ds/components/ui/card";

function formatPublishedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function HomeUpdates() {
  const {
    data: updates,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetPublicUpdates({
    query: {
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
  });

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-4 px-2 py-5 md:grid-cols-2 md:gap-6" aria-label="Brightside community updates">
      <Card className="flex flex-col items-start justify-center gap-4 border-primary/30 bg-primary/10 p-5 sm:p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Brightside Advice Column</p>
          <h2 className="mt-2 font-serif text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            Want to chat with your friends?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80 sm:text-base">
            Share a kind thought or join a conversation. Posts and comments are reviewed by a teacher before they appear.
          </p>
        </div>
        <Button asChild size="lg" className="h-auto min-h-14 w-full whitespace-normal py-4 text-center sm:w-auto">
          <Link href="/grow/collab" data-testid="link-home-advice-column">
            Want to chat with your friends? Go to the Brightside Advice Column!
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
      </Card>

      <Card className="border-border bg-card p-5 sm:p-6" aria-labelledby="home-updates-title" aria-live="polite">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 id="home-updates-title" className="font-serif text-2xl font-bold text-foreground">What’s new</h2>
            <p className="mt-1 text-sm text-foreground/75">Fresh teacher-approved posts from our community.</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh community updates"
            data-testid="button-refresh-home-updates"
          >
            <RefreshCw aria-hidden="true" className={isFetching ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3" aria-label="Loading community updates">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted/70" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4" role="alert">
            <p className="font-semibold text-foreground">Updates aren’t available right now.</p>
            <p className="mt-1 text-sm text-foreground/75">Please try again in a moment.</p>
            <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => refetch()} disabled={isFetching}>
              Try again
            </Button>
          </div>
        ) : updates && updates.length > 0 ? (
          <ul className="divide-y divide-border">
            {updates.map((update) => (
              <li key={update.id}>
                <Link
                  href={update.href}
                  className="group flex items-start justify-between gap-3 rounded-md px-2 py-3 focus-visible:ring-2 focus-visible:ring-ring"
                  data-testid={`link-home-update-${update.id}`}
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-foreground group-hover:text-primary">{update.title}</span>
                    <span className="mt-1 block text-xs text-foreground/70">
                      {update.section} <span aria-hidden="true">·</span> {formatPublishedDate(update.publishedAt)}
                    </span>
                  </span>
                  <ArrowUpRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
            <p className="font-semibold text-foreground">No new posts just yet.</p>
            <p className="mt-1 text-sm text-foreground/75">Check back soon for teacher-approved community updates.</p>
          </div>
        )}
      </Card>
    </section>
  );
}
