import { useState } from "react";
import {
  getListArtworkQueryKey,
  getListTeacherArtworkQueryKey,
  useListTeacherArtwork,
  useUpdateArtwork,
} from "@workspace/api-client-react";
import type { ArtworkEntry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@workspace/mind-matters-ds/components/ui/alert";
import { Badge } from "@workspace/mind-matters-ds/components/ui/badge";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card, CardContent } from "@workspace/mind-matters-ds/components/ui/card";
import { Input } from "@workspace/mind-matters-ds/components/ui/input";
import { Skeleton } from "@workspace/mind-matters-ds/components/ui/skeleton";
import { StudioLayout, StudioPage } from "@/components/studio/StudioLayout";
import { useRequireStudioRole } from "@/hooks/useStudioAuth";

function currentMonth() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit" }).formatToParts();
  return `${parts.find(part => part.type === "year")!.value}-${parts.find(part => part.type === "month")!.value}`;
}

function artworkStatusVariant(status: ArtworkEntry["status"]) {
  if (status === "approved") return "secondary" as const;
  if (status === "rejected") return "destructive" as const;
  return "outline" as const;
}

export default function TeacherArtwork() {
  const { user, isLoading: authLoading } = useRequireStudioRole("teacher");
  const queryClient = useQueryClient();
  const artworksQuery = useListTeacherArtwork({
    query: {
      enabled: !!user,
      queryKey: getListTeacherArtworkQueryKey(),
      staleTime: 20_000,
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  });
  const updateArtwork = useUpdateArtwork();
  const [month, setMonth] = useState(currentMonth);
  const [feedback, setFeedback] = useState("");
  const [actionError, setActionError] = useState("");

  if (authLoading || !user) return null;

  const refreshArtwork = async () => Promise.all([
    queryClient.invalidateQueries({ queryKey: getListTeacherArtworkQueryKey() }),
    queryClient.invalidateQueries({ queryKey: getListArtworkQueryKey() }),
  ]);

  const update = async (id: number, data: { status?: "approved" | "rejected"; featuredMonth?: string | null }, message: string) => {
    setActionError("");
    setFeedback("");
    try {
      await updateArtwork.mutateAsync({ id, data });
      await refreshArtwork();
      setFeedback(message);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "This artwork could not be updated. Please try again.");
    }
  };

  const artworks = artworksQuery.data ?? [];
  return (
    <StudioLayout>
      <StudioPage
        title="Student Artwork"
        subtitle="Review submissions and choose this month's featured artist."
      >
        <div className="mb-5 space-y-2">
          <p className="text-sm text-foreground/75">Only approved artwork appears on the public website. The monthly featured artist is selected by a teacher; there is no automatic winner.</p>
          {feedback && <Alert><AlertDescription data-testid="status-artwork-update">{feedback}</AlertDescription></Alert>}
          {actionError && <Alert variant="destructive"><AlertTitle>Artwork update failed</AlertTitle><AlertDescription>{actionError}</AlertDescription></Alert>}
        </div>
        {artworksQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-72 w-full" />)}
          </div>
        ) : artworksQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Artwork submissions could not be loaded</AlertTitle>
            <AlertDescription className="mt-2 flex items-center gap-3">
              <span>Please retry in a moment.</span>
              <Button variant="outline" size="sm" onClick={() => void artworksQuery.refetch()} data-testid="button-retry-teacher-artwork">Retry</Button>
            </AlertDescription>
          </Alert>
        ) : !artworks.length ? (
          <Card>
            <CardContent className="p-8 text-sm text-foreground/75">No student artwork has been submitted yet.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {artworks.map((artwork) => (
              <Card key={artwork.id} data-testid={`card-teacher-artwork-${artwork.id}`}>
                <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
                  <img
                    src={artwork.imageUrl || `/api/artwork/${artwork.id}/image`}
                    alt={`Artwork titled ${artwork.title} by ${artwork.artistName}`}
                    className="aspect-square w-full rounded-lg bg-muted object-cover"
                    loading="lazy"
                    data-testid={`img-teacher-artwork-${artwork.id}`}
                  />
                  <div className="flex min-w-0 flex-col items-start gap-3">
                    <Badge variant={artworkStatusVariant(artwork.status)} data-testid={`status-teacher-artwork-${artwork.id}`}>
                      {artwork.status}
                    </Badge>
                    <div>
                      <h2 className="break-words font-semibold text-foreground">{artwork.title}</h2>
                      <p className="text-sm text-foreground/70">By {artwork.artistName}</p>
                      <p className="mt-1 text-xs text-foreground/60">Submitted {new Date(artwork.createdAt).toLocaleDateString()}</p>
                    </div>
                    {artwork.featuredMonth && (
                      <p className="text-sm text-foreground/75">Featured for {artwork.featuredMonth}</p>
                    )}
                    {artwork.status === "pending" && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={updateArtwork.isPending}
                          onClick={() => void update(artwork.id, { status: "approved" }, `Approved “${artwork.title}”.`)}
                          data-testid={`button-approve-artwork-${artwork.id}`}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updateArtwork.isPending}
                          onClick={() => void update(artwork.id, { status: "rejected" }, `Rejected “${artwork.title}”.`)}
                          data-testid={`button-reject-artwork-${artwork.id}`}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {artwork.status === "approved" && (
                      <div className="w-full space-y-2">
                        <label htmlFor={`featured-month-${artwork.id}`} className="text-sm font-medium text-foreground">Feature for month</label>
                        <Input
                          id={`featured-month-${artwork.id}`}
                          type="month"
                          value={month}
                          onChange={(event) => setMonth(event.target.value)}
                          data-testid={`input-featured-month-${artwork.id}`}
                        />
                        <p className="text-xs text-foreground/70">Selecting this artwork replaces the current teacher-selected feature for that month.</p>
                        <Button
                          size="sm"
                          disabled={updateArtwork.isPending || !month}
                          onClick={() => void update(artwork.id, { featuredMonth: month }, `Selected “${artwork.title}” as the featured artwork for ${month}.`)}
                          data-testid={`button-feature-artwork-${artwork.id}`}
                        >
                          {artwork.featuredMonth === month ? "Keep as featured" : "Set as featured"}
                        </Button>
                        {artwork.featuredMonth && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updateArtwork.isPending}
                            onClick={() => void update(artwork.id, { featuredMonth: null }, `Removed “${artwork.title}” from the monthly feature.`)}
                            data-testid={`button-remove-feature-${artwork.id}`}
                          >
                            Remove feature
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </StudioPage>
    </StudioLayout>
  );
}
