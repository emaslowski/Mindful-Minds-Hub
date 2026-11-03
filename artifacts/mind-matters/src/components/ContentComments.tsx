import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MessageSquare, Send } from "lucide-react";
import {
  getGetContentCommentsQueryKey,
  useGetContentComments,
  useSubmitContentComment,
} from "@workspace/api-client-react";
import { Badge } from "@workspace/mind-matters-ds/components/ui/badge";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/mind-matters-ds/components/ui/card";
import { Input } from "@workspace/mind-matters-ds/components/ui/input";
import { Label } from "@workspace/mind-matters-ds/components/ui/label";
import { Skeleton } from "@workspace/mind-matters-ds/components/ui/skeleton";
import { Textarea } from "@workspace/mind-matters-ds/components/ui/textarea";

export function normalizePublicCommentSection(path: string): string | null {
  const rawPath = path.split(/[?#]/, 1)[0];
  if (rawPath.length > 180) return null;
  const normalized = rawPath.replace(/\/+$/, "") || "/";
  const roots = new Set([
    "/", "/learn", "/create", "/connect", "/move", "/listen", "/grow",
    "/gardening", "/language-corner", "/games", "/resources", "/events", "/review",
  ]);
  if (roots.has(normalized)) return normalized;
  if (/^\/learn\/[a-z0-9-]+$/.test(normalized)) return normalized;
  if (/^\/create\/[a-z0-9-]+$/.test(normalized)) return normalized;
  if (/^\/create\/cooking\/(?:videos|recipes\/[a-z0-9-]+)$/.test(normalized)) return normalized;
  if (/^\/connect\/(?:blog|post)\/[0-9]+$/.test(normalized)) {
    return normalized.replace("/connect/post/", "/connect/blog/");
  }
  if (/^\/(?:move|listen)\/[a-z0-9-]+$/.test(normalized)) return normalized;
  if (normalized === "/grow/collab") return normalized;
  return null;
}

export function ContentComments({ section }: { section: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, isError, refetch } = useGetContentComments(
    { section },
    {
      query: {
        queryKey: getGetContentCommentsQueryKey({ section }),
        refetchInterval: 60_000,
        refetchOnWindowFocus: true,
      },
    },
  );
  const { mutate: submitComment, isPending } = useSubmitContentComment();
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedContent = content.trim();
    const trimmedName = authorName.trim();
    if (!trimmedContent || trimmedContent.length > 2000 || trimmedName.length > 60) {
      setError(trimmedName.length > 60 ? "Display names can be up to 60 characters." : "Write a comment of 1 to 2,000 characters.");
      return;
    }
    setError("");
    setSuccess(false);
    submitComment(
      { data: { section, content: trimmedContent, ...(trimmedName ? { authorName: trimmedName } : {}) } },
      {
        onSuccess: () => {
          setContent("");
          setAuthorName("");
          setSuccess(true);
          queryClient.invalidateQueries({ queryKey: getGetContentCommentsQueryKey({ section }) });
        },
        onError: () => setError("Your comment could not be submitted. Please try again."),
      },
    );
  }

  const comments = (data ?? []).filter((comment) => comment.section === section);

  return (
    <section className="w-full max-w-4xl py-8" aria-labelledby="content-comments-title">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare aria-hidden="true" className="h-5 w-5 text-primary" />
            <CardTitle id="content-comments-title">Join the conversation</CardTitle>
          </div>
          <CardDescription>
            Share a kind, on-topic thought about this page. A teacher reviews every comment before it appears publicly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-3" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="comment-author" className="text-sm font-medium">Display name <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input
                id="comment-author"
                data-testid="input-comment-author"
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                maxLength={60}
                autoComplete="nickname"
                placeholder="Name or nickname"
                aria-describedby="comment-approval-note"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comment-content" className="text-sm font-medium">Your comment</Label>
              <Textarea
                id="comment-content"
                data-testid="input-comment-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={2000}
                rows={4}
                required
                aria-describedby="comment-approval-note comment-count"
                placeholder="What would you like to share?"
              />
              <p id="comment-count" className="text-right text-xs text-muted-foreground">{content.length}/2000</p>
            </div>
            <p id="comment-approval-note" className="text-sm text-muted-foreground">
              Comments stay private until a teacher approves them. Please do not share personal information.
            </p>
            {error && <p className="text-sm font-medium text-destructive" role="alert" data-testid="status-comment-error">{error}</p>}
            {success && <p className="text-sm font-medium text-secondary" role="status" data-testid="status-comment-submitted">Your comment was sent for teacher approval. It will appear here only if approved.</p>}
            <Button type="submit" disabled={isPending || !content.trim()} data-testid="button-submit-comment">
              <Send aria-hidden="true" />
              {isPending ? "Sending…" : "Send for approval"}
            </Button>
          </form>

          <div className="border-t border-border pt-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-serif text-xl font-semibold">Approved comments</h3>
              {isFetching && !isLoading && <span className="text-xs text-muted-foreground" role="status">Refreshing</span>}
            </div>
            {isLoading ? (
              <div className="space-y-3" aria-label="Loading approved comments">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="mb-2 text-sm text-foreground">Approved comments could not be loaded.</p>
                <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
              </div>
            ) : comments.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <Badge variant="outline">A welcoming space</Badge>
                <p className="mt-2 text-sm text-muted-foreground">No approved comments yet. You can be the first to share a thoughtful note.</p>
              </div>
            ) : (
              <ul className="space-y-3" data-testid="list-approved-comments">
                {comments.map((comment) => (
                  <li key={comment.id} className="rounded-lg border border-border bg-card p-4" data-testid={`comment-approved-${comment.id}`}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{comment.authorName || "Brightside visitor"}</span>
                      <time className="text-xs text-muted-foreground" dateTime={comment.createdAt}>{format(new Date(comment.createdAt), "MMM d, yyyy")}</time>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
