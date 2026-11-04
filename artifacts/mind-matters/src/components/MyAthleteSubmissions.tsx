import { useState } from "react";
import {
  getGetAthleteSessionQueryKey,
  getListAthleteQueryKey,
  getListMyAthleteQueryKey,
  useDeleteAthlete,
  useGetAthleteSession,
  useListMyAthlete,
} from "@workspace/api-client-react";
import type { AthleteEntry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@workspace/mind-matters-ds/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@workspace/mind-matters-ds/components/ui/alert-dialog";
import { Badge } from "@workspace/mind-matters-ds/components/ui/badge";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card, CardContent } from "@workspace/mind-matters-ds/components/ui/card";
import { Skeleton } from "@workspace/mind-matters-ds/components/ui/skeleton";

function statusVariant(status: AthleteEntry["status"]) {
  if (status === "approved") return "secondary" as const;
  if (status === "rejected") return "destructive" as const;
  return "outline" as const;
}

export function MyAthleteSubmissions() {
  const queryClient = useQueryClient();
  const session = useGetAthleteSession({
    query: { queryKey: getGetAthleteSessionQueryKey(), retry: 1 },
  });
  const ownAthletesQuery = useListMyAthlete({
    query: {
      enabled: Boolean(session.data),
      queryKey: [...getListMyAthleteQueryKey(), session.data?.id],
      staleTime: 30_000,
      refetchInterval: 60_000,
      retry: 1,
    },
  });
  const deleteAthlete = useDeleteAthlete();
  const [feedback, setFeedback] = useState("");
  const [actionError, setActionError] = useState("");

  if (session.isLoading || session.isFetching) return <Skeleton className="h-20 w-full" aria-label="Preparing browser identity" />;
  if (session.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Your browser identity could not be checked</AlertTitle>
        <AlertDescription className="mt-2 flex items-center gap-3">
          <span>Your submissions are associated with this browser. Try again to check their status.</span>
          <Button variant="outline" size="sm" onClick={() => void session.refetch()} data-testid="button-retry-my-athlete-session">Retry</Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (!session.data) return null;
  if (ownAthletesQuery.isLoading) return <Skeleton className="h-40 w-full" aria-label="Loading your challenge submissions" />;
  if (ownAthletesQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Your submissions could not be loaded</AlertTitle>
        <AlertDescription className="mt-2 flex items-center gap-3">
          <span>Please try again.</span>
          <Button variant="outline" size="sm" onClick={() => void ownAthletesQuery.refetch()} data-testid="button-retry-my-athletes">Retry</Button>
        </AlertDescription>
      </Alert>
    );
  }

  const sessionId = session.data.id;
  const withdraw = async (athlete: AthleteEntry) => {
    setActionError("");
    setFeedback("");
    try {
      await deleteAthlete.mutateAsync({ id: athlete.id });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...getListMyAthleteQueryKey(), sessionId] }),
        queryClient.invalidateQueries({ queryKey: getListAthleteQueryKey() }),
      ]);
      setFeedback(`“${athlete.title}” was withdrawn.`);
    } catch {
      setActionError("We could not withdraw this submission. Please try again.");
    }
  };

  const athletes = ownAthletesQuery.data ?? [];
  return (
    <section className="space-y-4" aria-labelledby="my-athlete-submissions">
      <div>
        <h3 id="my-athlete-submissions" className="font-display text-2xl italic text-foreground">Your submissions</h3>
        <p className="text-sm text-foreground/70">Submissions awaiting review are visible only to you in this browser and to your teachers.</p>
      </div>
      {feedback && <Alert><AlertDescription data-testid="status-athlete-withdrawal">{feedback}</AlertDescription></Alert>}
      {actionError && <Alert variant="destructive"><AlertDescription data-testid="status-athlete-withdrawal-error">{actionError}</AlertDescription></Alert>}
      {!athletes.length ? (
        <Card><CardContent className="p-6 text-sm text-foreground/75">Your photos, videos, and review status will appear here after you submit.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {athletes.map((athlete) => (
            <Card key={athlete.id} data-testid={`card-my-athlete-${athlete.id}`}>
              <CardContent className="space-y-3 p-4">
                {athlete.mediaType === "video" ? (
                  <video
                    src={athlete.imageUrl || `/api/athlete/${athlete.id}/image`}
                    aria-label={`Active challenge video shared by ${athlete.athleteName}: ${athlete.title}`}
                    className="aspect-square w-full rounded-lg bg-muted object-cover"
                    controls
                    preload="metadata"
                    playsInline
                    referrerPolicy="same-origin"
                    data-testid={`video-athlete-private-${athlete.id}`}
                  />
                ) : (
                  <img
                    src={athlete.imageUrl || `/api/athlete/${athlete.id}/image`}
                    alt={`Active challenge photo shared by ${athlete.athleteName}: ${athlete.title}`}
                    className="aspect-square w-full rounded-lg bg-muted object-cover"
                    loading="lazy"
                    referrerPolicy="same-origin"
                    data-testid={`img-athlete-private-${athlete.id}`}
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="break-words font-semibold text-foreground">{athlete.title}</h4>
                    <p className="text-sm text-foreground/70">{athlete.athleteName}</p>
                  </div>
                  <Badge variant={statusVariant(athlete.status)} data-testid={`status-my-athlete-${athlete.id}`}>{athlete.status}</Badge>
                </div>
                {athlete.status === "uploading" && <p className="text-sm text-foreground/70">Upload is processing. Your submission is not public.</p>}
                {athlete.status === "pending" && <p className="text-sm text-foreground/70">Waiting for teacher approval.</p>}
                {athlete.status === "approved" && <p className="text-sm text-foreground/70">Approved for the public gallery.</p>}
                {athlete.status === "rejected" && <p className="text-sm text-foreground/70">Not approved for public sharing.</p>}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={deleteAthlete.isPending} data-testid={`button-withdraw-athlete-${athlete.id}`}>Withdraw submission</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Withdraw this submission?</AlertDialogTitle>
                      <AlertDialogDescription>This removes “{athlete.title}” from review and from the public gallery.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep submission</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void withdraw(athlete)} data-testid={`button-confirm-withdraw-athlete-${athlete.id}`}>Withdraw submission</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
