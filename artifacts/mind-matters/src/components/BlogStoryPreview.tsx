import { Link } from "wouter";
import {
  PublishedArticle,
  stripBlogPlanningSections,
  type PublicationAppearance,
  type PublicationBlock,
} from "@workspace/mind-matters-ds/components/PublishedArticle";
import { getBlogCover } from "@workspace/mind-matters-ds/components/BlogCovers";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card } from "@workspace/mind-matters-ds/components/ui/card";
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@workspace/mind-matters-ds/components/ui/dialog";

type BlogStoryPreviewProps = {
  title: string;
  content: string;
  authorDisplay?: string;
  appearance?: PublicationAppearance;
  blocks?: PublicationBlock[];
  projectId?: number;
  excerpt?: string;
  href?: string;
  blogCoverIndex?: number;
  compact?: boolean;
};

export function BlogStoryPreview({ excerpt, href, compact = false, ...story }: BlogStoryPreviewProps) {
  const cover = story.blocks?.find(block => block.type === "image");
  const fallbackCover = getBlogCover(story.title, story.blogCoverIndex);
  const coverUrl = cover?.mediaId && story.projectId
    ? `/api/public/publications/${story.projectId}/media/${cover.mediaId}`
    : fallbackCover.src;
  const text = excerpt ?? [
    story.content,
    ...(story.blocks ?? []).filter(block => block.type === "text").map(block => block.text ?? ""),
  ].map(stripBlogPlanningSections).join("\n\n")
    .replace(/^\s*#{1,6}\s+.*$/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const preview = text.length > 220 ? `${text.slice(0, 220).replace(/\s+\S*$/, "")}…` : text;

  return (
    <Dialog>
      <Card className={`mx-auto w-full overflow-hidden ${compact ? "" : "max-w-3xl"}`}>
        <div className={compact ? "flex items-start gap-3 p-3 sm:gap-4" : "flex flex-col"}>
          <img
            src={coverUrl}
            alt={cover?.alt ?? (cover?.mediaId ? "" : fallbackCover.alt)}
            className={compact ? "size-20 shrink-0 rounded-lg object-cover sm:size-24" : "h-36 w-full object-cover sm:h-48"}
            loading="lazy"
          />
          <div className={`min-w-0 flex-1 text-left ${compact ? "" : "p-5"}`}>
            <h3 className={`font-display font-bold leading-tight text-foreground ${compact ? "text-lg" : "text-2xl"}`}>{story.title}</h3>
            {story.authorDisplay && <p className="mt-1 text-xs text-foreground/70">{story.authorDisplay}</p>}
            {preview && <p className={`text-sm leading-relaxed text-foreground/80 ${compact ? "mt-1 line-clamp-2" : "mt-3 line-clamp-3"}`}>{preview}</p>}
            <div className={compact ? "mt-2" : "mt-4"}>
              {href ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={href}>Read the full story</Link>
                </Button>
              ) : (
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" aria-label={`Read the full story: ${story.title}`}>Read the full story</Button>
                </DialogTrigger>
              )}
            </div>
          </div>
        </div>
      </Card>
      {!href && (
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{story.title}</DialogTitle>
            <DialogDescription>The complete student blog story.</DialogDescription>
          </DialogHeader>
          <PublishedArticle {...story} presentation="blog" />
          <DialogClose asChild>
            <Button variant="outline" className="mt-4 justify-self-start">Back to stories</Button>
          </DialogClose>
        </DialogContent>
      )}
    </Dialog>
  );
}
