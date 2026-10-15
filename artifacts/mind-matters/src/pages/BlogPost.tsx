import { Link, useParams } from "wouter";
import { useGetBlogPost, getGetBlogPostQueryKey } from "@workspace/api-client-react";
import { PublishedArticle } from "@workspace/mind-matters-ds/components/PublishedArticle";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { WaveFooter } from "@/components/WaveFooter";

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const { data: post, isLoading, isError, refetch } = useGetBlogPost(postId, {
    query: {
      enabled: Number.isFinite(postId) && postId > 0,
      retry: false,
      queryKey: getGetBlogPostQueryKey(postId),
    },
  });

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative">
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 mb-24 relative z-10">
        <Link href="/connect" className="mb-8 inline-block font-sans font-medium text-terracotta transition-colors hover:text-terracotta/80">
          ← Back to Blog
        </Link>

        {isLoading ? (
          <div className="animate-pulse rounded-2xl border border-card-border/50 bg-card p-6 md:p-10" aria-label="Loading article">
            <div className="mb-6 h-64 rounded-xl bg-card-border/30" />
            <div className="mb-6 h-10 w-3/4 rounded-md bg-card-border/30" />
            <div className="space-y-3">
              <div className="h-4 rounded-md bg-card-border/30" />
              <div className="h-4 rounded-md bg-card-border/30" />
              <div className="h-4 w-3/4 rounded-md bg-card-border/30" />
            </div>
          </div>
        ) : post ? (
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm md:p-10">
            <PublishedArticle
              title={post.title}
              content={post.content}
              authorDisplay={post.author ? `By ${post.author}${post.submittedAt ? ` · ${new Date(post.submittedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}` : ""}` : undefined}
              presentation="blog"
            />
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-card-border/50 bg-card p-8 text-center">
            <p className="mb-4 font-sans text-foreground/70" role="alert">This article could not be loaded.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-card-border/50 bg-card p-8 text-center">
            <p className="font-sans text-foreground/70">This article is not available.</p>
          </div>
        )}
      </div>
      <WaveFooter quote="Thanks for reading!" />
    </div>
  );
}
