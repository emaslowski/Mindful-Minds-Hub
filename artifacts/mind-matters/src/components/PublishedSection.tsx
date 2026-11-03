import { useGetPublishedContent } from "@workspace/api-client-react";
import { PublishedArticle, type PublicationAppearance, type PublicationBlock } from "@workspace/mind-matters-ds/components/PublishedArticle";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { BlogStoryPreview } from "./BlogStoryPreview";
import { PublicationDiscussion } from "./PublicationDiscussion";

type PublishedSectionProps = {
  section: string;
  heading?: string;
  className?: string;
  excludeProjectIds?: number[];
  featureVideos?: boolean;
  emptyMessage?: string;
};

type PublicEditionItem = {
  id: number;
  title: string;
  content: string;
  authorDisplay?: string;
  appearance?: PublicationAppearance;
  blocks?: PublicationBlock[];
  pageOrder?: number;
  projectId?: number;
};

export function PublishedSection({ section, heading = "From Our Students", className = "", excludeProjectIds = [], featureVideos = false, emptyMessage }: PublishedSectionProps) {
  const { data, isLoading, isError, refetch } = useGetPublishedContent(
    { section },
    { query: { staleTime: 45_000, refetchOnWindowFocus: true } },
  );
  const items = ((data?.publications ?? []) as PublicEditionItem[]).filter(
    (item) => !excludeProjectIds.includes(item.projectId ?? item.id),
  ).sort(
    (a, b) => {
      if (featureVideos) {
        const videoOrder = Number(b.blocks?.some((block) => block.type === "video") ?? false)
          - Number(a.blocks?.some((block) => block.type === "video") ?? false);
        if (videoOrder) return videoOrder;
      }
      return (a.pageOrder ?? 0) - (b.pageOrder ?? 0);
    },
  );

  if (isLoading) {
    return <div className={`mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 px-4 ${section === "blog" || featureVideos ? "" : "md:grid-cols-2"} ${className}`} aria-label="Loading published articles">
      {[0, 1].map((key) => <div key={key} className="h-52 animate-pulse rounded-2xl border border-card-border/50 bg-card p-6" />)}
    </div>;
  }
  if (isError) {
    return <div className={`mx-auto max-w-4xl px-4 text-center ${className}`} role="alert">
      <p className="mb-3 text-sm text-foreground/70">Published student content could not be loaded.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>;
  }
  if (!items.length && !emptyMessage) return null;

  return (
    <section className={`mx-auto w-full max-w-6xl px-4 ${className}`} aria-label={heading}>
      <div className="mb-8 flex items-center justify-center gap-3">
        <div className="h-px max-w-[120px] flex-1 bg-sage/20" />
        <h2 className="font-display text-2xl italic text-foreground">{heading}</h2>
        <div className="h-px max-w-[120px] flex-1 bg-sage/20" />
      </div>
      {!items.length && <p className="rounded-2xl border border-card-border/50 bg-card p-6 text-center text-foreground/70">{emptyMessage}</p>}
      <div className={`grid grid-cols-1 gap-6 ${section === "blog" || featureVideos ? "" : "md:grid-cols-2"}`}>
        {items.map((item, index) => {
          const projectId = item.projectId ?? item.id;
          return section === "blog" ? (
            <BlogStoryPreview
              key={item.id}
              {...item}
              blogCoverIndex={index}
              href={item.projectId ? undefined : `/connect/blog/${item.id}`}
            />
          ) : (
            <div key={item.id} className={`w-full rounded-2xl border border-card-border/50 bg-card p-6 shadow-sm ${!featureVideos && section !== "blog" && item.appearance?.pageWidth === "full" ? "md:col-span-2" : ""}`}>
              <PublishedArticle
                title={item.title}
                content={item.content}
                appearance={item.appearance}
                authorDisplay={item.authorDisplay}
                blocks={featureVideos ? item.blocks?.map((block) => block.type === "video" ? { ...block, width: "full" as const } : block) : item.blocks}
                projectId={projectId}
                presentation="default"
              />
              <PublicationDiscussion
                section={`/content/publication/${projectId}`}
                title={item.title}
                testId={`publication-${projectId}`}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
