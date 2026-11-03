import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MessageSquare, Star } from "lucide-react";
import { getGetReviewsQueryKey, useGetReviews, useSubmitReview } from "@workspace/api-client-react";
import { Badge } from "@workspace/mind-matters-ds/components/ui/badge";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/mind-matters-ds/components/ui/card";
import { Label } from "@workspace/mind-matters-ds/components/ui/label";
import { Textarea } from "@workspace/mind-matters-ds/components/ui/textarea";
import { Skeleton } from "@workspace/mind-matters-ds/components/ui/skeleton";
import { WaveFooter } from "@/components/WaveFooter";

export default function Review() {
  const queryClient = useQueryClient();
  const { data: reviews, isLoading: reviewsLoading, isError: reviewsError, refetch } = useGetReviews({
    query: { queryKey: getGetReviewsQueryKey(), refetchInterval: 60_000, refetchOnWindowFocus: true },
  });
  const { mutate: submitReview, isPending } = useSubmitReview();
  const [rating, setRating] = useState(0);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating === 0 || helpful === null) return;
    setSubmitError("");
    submitReview(
      { data: { rating, helpful, comment: comment.trim() || undefined } },
      {
        onSuccess: () => {
          setSubmitted(true);
          queryClient.invalidateQueries({ queryKey: getGetReviewsQueryKey() });
        },
        onError: () => setSubmitError("Your review could not be sent. Please try again."),
      },
    );
  }

  const approvedReviews = (reviews ?? []).filter((review) => review.approved !== false);

  return (
    <div className="relative flex w-full flex-1 flex-col pt-12">
      <div className="z-10 mx-auto mb-16 flex w-full max-w-4xl flex-1 flex-col items-center px-4">
        <h1 className="mb-4 text-center font-display text-5xl italic text-foreground md:text-7xl">Was this site helpful?</h1>
        <p className="mb-10 text-center font-sans text-xl text-secondary md:text-2xl">
          We want to make The Brightside Project the best it can be. Let us know how we're doing.
        </p>

        {!submitted ? (
          <Card className="mb-12 w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Share your feedback</CardTitle>
              <CardDescription>Every review is checked by a teacher before it is shown publicly.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                <fieldset>
                  <legend className="mb-3 font-semibold">Rate your experience</legend>
                  <div className="flex gap-2" role="group" aria-label="Rate your experience">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Button
                        key={value}
                        type="button"
                        size="icon"
                        variant={value <= rating ? "amber" : "outline"}
                        aria-label={`${value} out of 5 stars`}
                        aria-pressed={rating === value}
                        data-testid={`button-review-rating-${value}`}
                        onClick={() => setRating(value)}
                      >
                        <Star aria-hidden="true" className={value <= rating ? "fill-current" : ""} />
                      </Button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-3 font-semibold">Did you find what you were looking for?</legend>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant={helpful === true ? "secondary" : "outline"} aria-pressed={helpful === true} onClick={() => setHelpful(true)} data-testid="button-review-helpful-yes">
                      Yes, I did
                    </Button>
                    <Button type="button" variant={helpful === false ? "default" : "outline"} aria-pressed={helpful === false} onClick={() => setHelpful(false)} data-testid="button-review-helpful-no">
                      Not really
                    </Button>
                  </div>
                </fieldset>

                <div className="space-y-2">
                  <Label htmlFor="review-comment" className="flex items-center gap-2 font-semibold">
                    <MessageSquare aria-hidden="true" className="h-5 w-5 text-secondary" />
                    Any other feedback? <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="review-comment"
                    data-testid="input-review-comment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    maxLength={2000}
                    rows={4}
                    placeholder="Tell us what you liked or what we could improve."
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  Your review will not appear on the site unless a teacher approves it. Please do not include personal information.
                </p>
                {submitError && <p role="alert" className="text-sm font-medium text-destructive" data-testid="status-review-error">{submitError}</p>}
                <Button type="submit" className="w-full" disabled={isPending || rating === 0 || helpful === null} data-testid="button-submit-review">
                  {isPending ? "Sending…" : "Send review for approval"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-12 w-full max-w-2xl border-secondary/30 bg-secondary/10" role="status" data-testid="status-review-submitted">
            <CardHeader>
              <CardTitle>Thank you for sharing</CardTitle>
              <CardDescription>Your review has been sent to a teacher. It will be visible here only if approved.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setSubmitted(false); setRating(0); setHelpful(null); setComment(""); setSubmitError(""); }}
              >
                Submit another review
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="w-full" aria-labelledby="recent-reviews-title">
          <h2 id="recent-reviews-title" className="mb-6 border-b border-border pb-3 text-center font-display text-3xl italic md:text-4xl">
            Recent Feedback
          </h2>
          {reviewsLoading ? (
            <div className="grid gap-4 md:grid-cols-2" aria-label="Loading approved reviews">
              <Skeleton className="h-36 w-full" /><Skeleton className="h-36 w-full" />
            </div>
          ) : reviewsError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-center">
              <p className="mb-3 text-sm">Approved reviews could not be loaded.</p>
              <Button type="button" size="sm" variant="outline" onClick={() => refetch()}>Try again</Button>
            </div>
          ) : approvedReviews.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              No approved reviews have been shared yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2" data-testid="list-approved-reviews">
              {approvedReviews.map((review) => (
                <Card key={review.id} data-testid={`card-approved-review-${review.id}`}>
                  <CardContent className="flex h-full flex-col gap-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex gap-1" aria-label={`${review.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} aria-hidden="true" className={`h-4 w-4 ${star <= review.rating ? "fill-accent text-accent" : "text-muted"}`} />
                        ))}
                      </div>
                      <time className="text-xs text-muted-foreground" dateTime={review.createdAt}>{format(new Date(review.createdAt), "MMM d, yyyy")}</time>
                    </div>
                    {review.comment && <p className="flex-1 whitespace-pre-wrap text-sm italic text-foreground/85">“{review.comment}”</p>}
                    <Badge variant={review.helpful ? "secondary" : "muted"} className="w-fit">
                      {review.helpful ? "Found what they needed" : "Still looking"}
                    </Badge>
                    {review.teacherReply && (
                      <div className="rounded-md border border-secondary/30 bg-secondary/10 p-3" data-testid={`teacher-reply-${review.id}`}>
                        <p className="mb-1 text-xs font-semibold text-secondary">Teacher reply</p>
                        <p className="whitespace-pre-wrap text-sm">{review.teacherReply}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
      <WaveFooter quote="Your feedback helps us grow." />
    </div>
  );
}
