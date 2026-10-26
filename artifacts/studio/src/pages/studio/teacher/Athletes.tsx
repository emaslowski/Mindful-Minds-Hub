import { useState } from "react";
import {
  getListAthleteQueryKey,
  getListTeacherAthleteQueryKey,
  useListTeacherAthlete,
  useUpdateAthlete,
} from "@workspace/api-client-react";
import type { AthleteEntry } from "@workspace/api-client-react";
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
  return `${parts.find((part) => part.type === "year")!.value}-${parts.find((part) => part.type === "month")!.value}`;
}

function statusVariant(status: AthleteEntry["status"]) {
  if (status === "approved") return "secondary" as const;
  if (status === "rejected") return "destructive" as const;
  return "outline" as const;
}

export default function TeacherAthletes() {
  const { user, isLoading: authLoading } = useRequireStudioRole("teacher");
  const queryClient = useQueryClient();
  const athletesQuery = useListTeacherAthlete({
    query: {
      enabled: !!user,
      queryKey: [...getListTeacherAthleteQueryKey(), user?.id],
      staleTime: 20_000,
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  });
  const updateAthlete = useUpdateAthlete();
  const [month, setMonth] = useState(currentMonth);
  const [feedback, setFeedback] = useState("");
  const [actionError, setActionError] = useState("");

  if (authLoading || !user) return null;

  const refreshAthletes = async () => Promise.all([
    queryClient.invalidateQueries({ queryKey: getListTeacherAthleteQueryKey() }),
    queryClient.invalidateQueries({ queryKey: getListAthleteQueryKey() }),
  ]);

  const update = async (
    id: number,
    data: { status?: "approved" | "rejected"; featuredMonth?: string | null },
    message: string,
  ) => {
    setActionError("");
    setFeedback("");
    try {
      await updateAthlete.mutateAsync({ id, data });
      await refreshAthletes();
      setFeedback(message);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "This challenge photo could not be updated. Please try again.");
    }
  };

  const athletes = athletesQuery.data ?? [];
  return (
    <StudioLayout>
      <StudioPage
        title="Athlete of the Month"
        subtitle="Review challenge photos and choose this month's teacher-selected recognition."
      >
        <div className="mb-5 space-y-2">
          <p className="text-sm text-foreground/75">Only approved photos appear publicly. Approvals, rejections, and monthly recognition are selected by a teacher. There is no voting or automatic winner.</p>
          {feedback && <Alert><AlertDescription data-testid="status-athlete-update">{feedback}</AlertDescription></Alert>}
          {actionError && <Alert variant="destructive"><AlertTitle>Photo update failed</AlertTitle><AlertDescription>{actionError}</AlertDescription></Alert>}
        </div>
        {athletesQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-72 w-full" />)}
          </div>
        ) : athletesQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Challenge submissions could not be loaded</AlertTitle>
            <AlertDescription className="mt-2 flex items-center gap-3">
              <span>Please retry in a moment.</span>
              <Button variant="outline" size="sm" onClick={() => void athletesQuery.refetch()} data-testid="button-retry-teacher-athletes">Retry</Button>
            </AlertDescription>
          </Alert>
        ) : !athletes.length ? (
          <Card><CardContent className="p-8 text-sm text-foreground/75">There are no challenge photos to review yet.</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {athletes.map((athlete) => {
              const canApprove = athlete.status === "pending" || athlete.status === "rejected";
              const canReject = athlete.status === "pending" || athlete.status === "approved";
              return (
                <Card key={athlete.id} data-testid={`card-teacher-athlete-${athlete.id}`}>
                  <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
                    <img
                      src={athlete.imageUrl || `/api/athlete/${athlete.id}/image`}
                      alt={`Challenge photo titled ${athlete.title} by ${athlete.athleteName}`}
                      className="aspect-square w-full rounded-lg bg-muted object-cover"
                      loading="lazy"
                      data-testid={`img-teacher-athlete-${athlete.id}`}
                    />
                    <div className="flex min-w-0 flex-col items-start gap-3">
                      <Badge variant={statusVariant(athlete.status)} data-testid={`status-teacher-athlete-${athlete.id}`}>{athlete.status}</Badge>
                      <div>
                        <h2 className="break-words font-semibold text-foreground">{athlete.title}</h2>
                        <p className="text-sm text-foreground/70">By {athlete.athleteName}</p>
                        <p className="mt-1 text-xs text-foreground/60">Submitted {new Date(athlete.createdAt).toLocaleDateString()}</p>
                      </div>
                      {athlete.featuredMonth && <p className="text-sm text-foreground/75">Athlete of the Month for {athlete.featuredMonth}</p>}
                      <div className="flex flex-wrap gap-2">
                        {canApprove && (
                          <Button
                            size="sm"
                            disabled={updateAthlete.isPending}
                            onClick={() => void update(athlete.id, { status: "approved" }, `${athlete.status === "rejected" ? "Re-approved" : "Approved"} “${athlete.title}”.`)}
                            data-testid={`button-approve-athlete-${athlete.id}`}
                          >
                            {athlete.status === "rejected" ? "Re-approve" : "Approve"}
                          </Button>
                        )}
                        {canReject && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updateAthlete.isPending}
                            onClick={() => void update(athlete.id, { status: "rejected" }, `${athlete.status === "approved" ? "Unpublished" : "Rejected"} “${athlete.title}”.`)}
                            data-testid={`button-reject-athlete-${athlete.id}`}
                          >
                            {athlete.status === "approved" ? "Unpublish" : "Reject"}
                          </Button>
                        )}
                      </div>
                      {athlete.status === "approved" && (
                        <div className="w-full space-y-2">
                          <label htmlFor={`athlete-featured-month-${athlete.id}`} className="text-sm font-medium text-foreground">Recognition month</label>
                          <Input
                            id={`athlete-featured-month-${athlete.id}`}
                            type="month"
                            value={month}
                            onChange={(event) => setMonth(event.target.value)}
                            data-testid={`input-athlete-featured-month-${athlete.id}`}
                          />
                          <p className="text-xs text-foreground/70">Selecting this athlete replaces the current teacher-selected recognition for that month.</p>
                          <Button
                            size="sm"
                            disabled={updateAthlete.isPending || !month}
                            onClick={() => void update(athlete.id, { featuredMonth: month }, `Selected “${athlete.athleteName}” as Athlete of the Month for ${month}.`)}
                            data-testid={`button-feature-athlete-${athlete.id}`}
                          >
                            {athlete.featuredMonth === month ? "Keep selected" : "Select for month"}
                          </Button>
                        </div>
                      )}
                      {athlete.featuredMonth && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updateAthlete.isPending}
                          onClick={() => void update(athlete.id, { featuredMonth: null }, `Cleared the Athlete of the Month recognition for “${athlete.athleteName}”.`)}
                          data-testid={`button-clear-feature-athlete-${athlete.id}`}
                        >
                          Clear monthly recognition
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </StudioPage>
    </StudioLayout>
  );
}
