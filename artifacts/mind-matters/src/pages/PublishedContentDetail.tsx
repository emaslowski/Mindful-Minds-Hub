import { useParams } from "wouter";
import { useGetPublishedContent } from "@workspace/api-client-react";
import { PublishedArticle } from "@workspace/mind-matters-ds/components/PublishedArticle";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card, CardContent } from "@workspace/mind-matters-ds/components/ui/card";
import { Skeleton } from "@workspace/mind-matters-ds/components/ui/skeleton";

export default function PublishedContentDetail() {
  const { id } = useParams<{ id: string }>();
  const publicationId = Number(id);
  const validId = Number.isSafeInteger(publicationId) && publicationId > 0;
  const { data, isLoading, isError, refetch } = useGetPublishedContent(
    {},
    { query: { staleTime: 45_000, refetchOnWindowFocus: true } },
  );
  const publication = validId
    ? data?.publications.find((item) => item.projectId === publicationId || (item.projectId == null && item.id === publicationId))
    : undefined;

  return (
    <div className="w-full max-w-4xl py-8">
      {isLoading ? (
        <Card aria-label="Loading published content">
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ) : isError ? (
        <Card role="alert">
          <CardContent className="p-6 text-center">
            <p className="mb-4 text-sm text-muted-foreground">This published item could not be loaded.</p>
            <Button type="button" variant="outline" onClick={() => refetch()}>Try again</Button>
          </CardContent>
        </Card>
      ) : publication ? (
        <Card className="w-full">
          <CardContent className="p-6 sm:p-8">
            <PublishedArticle
              presentation={publication.destinationSection === "blog" ? "blog" : "default"}
              title={publication.title}
              content={publication.content}
              appearance={publication.appearance}
              authorDisplay={publication.authorDisplay}
              blocks={publication.blocks}
              projectId={publication.projectId}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="mb-2 font-serif text-2xl font-bold">Published item not found</h1>
            <p className="text-sm text-muted-foreground">
              This item may no longer be published or the link may be incorrect.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
