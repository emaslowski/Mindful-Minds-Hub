import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, MessageSquare, Star, Trash2 } from "lucide-react";
import { useSaveTeacherReviewReply } from "@workspace/api-client-react";
import { Badge } from "@workspace/mind-matters-ds/components/ui/badge";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/mind-matters-ds/components/ui/card";
import { Label } from "@workspace/mind-matters-ds/components/ui/label";
import { Skeleton } from "@workspace/mind-matters-ds/components/ui/skeleton";
import { Textarea } from "@workspace/mind-matters-ds/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@workspace/mind-matters-ds/components/ui/alert-dialog";
import {
  teacherModeration,
  type TeacherModerationData,
} from "@/lib/studioApi";

interface PublicFeedbackModerationProps {
  data?: TeacherModerationData;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

function TeacherReplyEditor({ id, initialReply }: { id: number; initialReply: string | null }) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState(initialReply ?? "");
  const [savedReply, setSavedReply] = useState(initialReply ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const { mutate: saveReply, isPending } = useSaveTeacherReviewReply({
    request: { credentials: "include" },
  });
  const hasReply = Boolean(savedReply);
  const hasChanges = reply.trim() !== savedReply;

  function save(value = reply) {
    setError("");
    setSaved(false);
    saveReply(
      { id, data: { reply: value.trim() } },
      {
        onSuccess: (review) => {
          const persistedReply = review.teacherReply ?? "";
          setReply(persistedReply);
          setSavedReply(persistedReply);
          setSaved(true);
          queryClient.invalidateQueries({ queryKey: ["teacher-moderation"] });
          queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
        },
        onError: (failure) => setError(
          failure.status === 401
            ? "Your session has expired. Sign in again, then save your reply. Your text has been kept here."
            : failure.status === 403
              ? "You must be signed in as a teacher to save a reply. Your text has been kept here."
              : "The teacher reply could not be saved. Your text has been kept here. Try again.",
        ),
      },
    );
  }

  return (
    <div className="mt-4 space-y-2 border-t border-border pt-4">
      <Label htmlFor={`teacher-reply-${id}`} className="text-sm font-semibold">Teacher reply</Label>
      <Textarea
        id={`teacher-reply-${id}`}
        value={reply}
        onChange={(event) => {
          setReply(event.target.value);
          setSaved(false);
          setError("");
        }}
        disabled={isPending}
        maxLength={2000}
        rows={3}
        placeholder="Write a helpful response"
        data-testid={`input-teacher-review-reply-${id}`}
      />
      <p className="text-xs text-muted-foreground">
        Saving a reply does not approve the review. A reply becomes public only after the review is approved.
      </p>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <p className="text-xs text-muted-foreground" role="status" aria-live="polite" data-testid={`status-teacher-review-reply-${id}`}>
        {isPending ? "Saving reply…" : saved ? (hasReply ? "Reply saved." : "Reply removed.") : hasChanges ? "You have unsaved changes." : hasReply ? "This reply is saved." : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={isPending || reply.trim().length > 2000 || (!reply.trim() && !hasReply) || (saved && !hasChanges)} onClick={() => save()} data-testid={`button-save-review-reply-${id}`}>
          {isPending ? "Saving…" : saved && !hasChanges ? "Saved" : "Save reply"}
        </Button>
        {(hasReply || reply) && (
          <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => save("")} data-testid={`button-clear-review-reply-${id}`}>
            Clear reply
          </Button>
        )}
      </div>
    </div>
  );
}

export function PublicFeedbackModeration({ data, isLoading, isError, refetch }: PublicFeedbackModerationProps) {
  const queryClient = useQueryClient();
  const [actionMessage, setActionMessage] = useState("");
  const [reviewToDelete, setReviewToDelete] = useState<{ id: number; approved: boolean; comment: string | null } | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const { mutate: deleteReview, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => teacherModeration.delete("review", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-moderation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      setReviewToDelete(null);
      setDeleteError("");
      setActionMessage("Review and its teacher reply permanently deleted.");
    },
    onError: () => setDeleteError("The review could not be deleted. Please try again."),
  });
  const { mutate: approve, isPending: isApproving } = useMutation({
    mutationFn: ({ type, id }: { type: "content-comment" | "review"; id: number }) => teacherModeration.approve(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-moderation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      setActionMessage("Content approved and now available publicly.");
    },
    onError: () => setActionMessage("Could not approve content. Please try again."),
  });
  const { mutate: reject, isPending: isRejecting } = useMutation({
    mutationFn: ({ type, id }: { type: "content-comment" | "review"; id: number }) => teacherModeration.delete(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-moderation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      setActionMessage("Submission rejected and removed; it will not be published.");
    },
    onError: () => setActionMessage("Could not reject the submission. Please try again."),
  });
  const comments = data?.contentComments ?? [];
  const reviews = data?.reviews ?? [];
  const pendingReviewCount = reviews.filter((review) => !review.approved).length;
  const pendingCount = comments.length + pendingReviewCount;
  const busy = isApproving || isRejecting || isDeleting;
  const getCommentPageHref = (section: string) => {
    if (/^\/content\/publication\/[0-9]+$/.test(section)) return section;
    if (section === "/content/featured/chef-video") return "/create/cooking";
    if (section === "/content/featured/homepage-video") return "/";
    return section;
  };

  return (
    <section className="mb-8" aria-labelledby="public-feedback-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="public-feedback-heading" className="font-serif text-lg font-semibold text-foreground">Page comments and site reviews</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pending comments and reviews stay private. Review replies are separate from approval.
          </p>
        </div>
        <Badge variant={pendingCount ? "accent" : "secondary"} data-testid="status-public-feedback-pending-count">
          {isLoading ? "Loading" : `${pendingCount} awaiting approval`}
        </Badge>
      </div>
      {actionMessage && <p className="mb-3 text-sm text-foreground" role="status" data-testid="status-feedback-moderation-action">{actionMessage}</p>}

      {isError ? (
        <Card>
          <CardContent className="p-6">
            <p className="mb-3 text-sm">Public feedback moderation could not be loaded.</p>
            <Button type="button" size="sm" variant="outline" onClick={refetch}>Try again</Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3" aria-label="Loading public feedback moderation">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : comments.length === 0 && reviews.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-secondary" />
            There are no page comments or site reviews to review.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><MessageSquare aria-hidden="true" className="h-4 w-4 text-secondary" />Page comments awaiting approval</CardTitle>
                <CardDescription>{comments.length} pending comment{comments.length === 1 ? "" : "s"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {comments.map((comment) => (
                  <article key={comment.id} className="rounded-lg border border-border p-4" data-testid={`moderation-content-comment-${comment.id}`}>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="accent">Pending</Badge>
                      <span className="text-sm font-semibold">{comment.authorName || "Brightside visitor"}</span>
                      <time className="text-xs text-muted-foreground" dateTime={comment.createdAt}>
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </time>
                      <Button asChild type="button" size="sm" variant="link" className="ml-auto h-auto px-1">
                        <a href={getCommentPageHref(comment.section)} target="_blank" rel="noopener noreferrer" data-testid={`link-view-comment-page-${comment.id}`}>View page</a>
                      </Button>
                    </div>
                    <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => approve({ type: "content-comment", id: comment.id })} data-testid={`button-approve-content-comment-${comment.id}`}>Approve</Button>
                      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => reject({ type: "content-comment", id: comment.id })} data-testid={`button-reject-content-comment-${comment.id}`}>Reject</Button>
                    </div>
                  </article>
                ))}
              </CardContent>
            </Card>
          )}

          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Star aria-hidden="true" className="h-4 w-4 text-accent" />Site reviews</CardTitle>
                <CardDescription>
                  {pendingReviewCount} pending · {reviews.length - pendingReviewCount} approved. You can reply to or delete reviews of either status.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-lg border border-border p-4" data-testid={`moderation-review-${review.id}`}>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star key={index} aria-hidden="true" className={`h-4 w-4 ${index < review.rating ? "fill-accent text-accent" : "text-muted"}`} />
                        ))}
                      </div>
                      <Badge variant={review.approved ? "secondary" : "accent"}>{review.approved ? "Approved" : "Pending approval"}</Badge>
                      <time className="ml-auto text-xs text-muted-foreground" dateTime={review.createdAt}>
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </time>
                    </div>
                    <p className="mb-2 text-sm font-medium">{review.helpful ? "Found what they needed" : "Still looking"}</p>
                    <p className="whitespace-pre-wrap text-sm text-foreground/85">{review.comment || "No written feedback was included."}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!review.approved && (
                        <>
                        <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => approve({ type: "review", id: review.id })} data-testid={`button-approve-review-${review.id}`}>Approve</Button>
                        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => reject({ type: "review", id: review.id })} data-testid={`button-reject-review-${review.id}`}>Reject</Button>
                        </>
                      )}
                      <Button
                        type="button" size="sm" variant="destructive" disabled={busy}
                        onClick={() => { setDeleteError(""); setReviewToDelete({ id: review.id, approved: review.approved, comment: review.comment }); }}
                        data-testid={`button-delete-review-${review.id}`}
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" /> Delete review
                      </Button>
                    </div>
                    <TeacherReplyEditor id={review.id} initialReply={review.teacherReply} />
                  </article>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
      <AlertDialog open={reviewToDelete !== null} onOpenChange={(open) => { if (!open && !isDeleting) setReviewToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              {reviewToDelete?.approved ? "This will remove the published review from the website." : "This will permanently remove the pending review."}
              {" "}Its rating, feedback, and any teacher reply will be deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border p-3 text-sm">
            {reviewToDelete?.comment || "No written feedback was included."}
          </p>
          {deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              data-testid="button-confirm-delete-review"
              onClick={(event) => {
                event.preventDefault();
                if (reviewToDelete && !isDeleting) deleteReview(reviewToDelete.id);
              }}
            >
              {isDeleting ? "Deleting…" : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

import * as React from "react";
