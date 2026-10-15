import type { CSSProperties, ElementType, ReactNode } from "react";

export type PublicationAppearance = {
  fontFamily: "serif" | "sans";
  fontSize: "small" | "medium" | "large";
  alignment: "left" | "center";
  accent: "sage" | "terracotta" | "amber";
  spacing: "compact" | "comfortable" | "spacious";
  pageWidth?: "full" | "half";
};

export type PublicationEdition = {
  title: string;
  content: string;
  appearance: PublicationAppearance;
  blocks?: PublicationBlock[];
  pageOrder?: number;
};

export type PublicationBlock = {
  id: string;
  type: "text" | "image" | "video" | "audio" | "recipe";
  width: "full" | "half";
  text?: string;
  mediaId?: number;
  caption?: string;
  alt?: string;
  fit?: "contain" | "cover";
  recipe?: {
    name: string;
    description: string;
    servings: string;
    prepTime: string;
    cookTime: string;
    ingredients: string;
    steps: string;
  };
};

type PublishedArticleProps = {
  title: string;
  content: string;
  appearance?: PublicationAppearance;
  authorDisplay?: string;
  blocks?: PublicationBlock[];
  projectId?: number;
  mediaUrl?: (id: number) => string;
};

const DEFAULT_APPEARANCE: PublicationAppearance = {
  fontFamily: "serif",
  fontSize: "medium",
  alignment: "left",
  accent: "sage",
  spacing: "comfortable",
};

const colors = {
  sage: "#688a52",
  terracotta: "#c4622d",
  amber: "#d4a44c",
};

function inlineMarkdown(value: string, keyPrefix: string): ReactNode[] {
  const expression = /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_)/g;
  const result: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = expression.exec(value))) {
    if (match.index > cursor) result.push(value.slice(cursor, match.index));
    const key = `${keyPrefix}-${index++}`;
    if (match[2] && match[3]) {
      result.push(<a key={key} href={match[3]} target="_blank" rel="noopener noreferrer" style={{ color: "var(--article-accent)", textDecoration: "underline", textUnderlineOffset: "0.18em" }}>{match[2]}</a>);
    } else if (match[4] || match[5]) {
      result.push(<strong key={key}>{match[4] || match[5]}</strong>);
    } else {
      result.push(<em key={key}>{match[6] || match[7]}</em>);
    }
    cursor = expression.lastIndex;
  }
  if (cursor < value.length) result.push(value.slice(cursor));
  return result;
}

function renderMarkdown(content: string): ReactNode[] {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(<p key={`p-${blocks.length}`}>{inlineMarkdown(paragraph.join(" "), `p${blocks.length}`)}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    const List = list.ordered ? "ol" : "ul";
    blocks.push(<List key={`list-${blocks.length}`}>{list.items.map((item, index) => <li key={index}>{inlineMarkdown(item, `li${blocks.length}-${index}`)}</li>)}</List>);
    list = null;
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const trimmed = line.trim();
    if (!trimmed) { flushParagraph(); flushList(); continue; }
    const heading = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph(); flushList();
      const level = heading[1].length;
      const Heading = `h${level}` as ElementType;
      blocks.push(<Heading key={`h-${blocks.length}`}>{inlineMarkdown(heading[2], `h${blocks.length}`)}</Heading>);
      continue;
    }
    const bullet = /^[-*+]\s+(.+)$/.exec(trimmed);
    const numbered = /^\d+[.)]\s+(.+)$/.exec(trimmed);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push((bullet || numbered)![1]);
      continue;
    }
    if (/^>\s?/.test(trimmed)) {
      flushParagraph(); flushList();
      const quoteLines = [trimmed.replace(/^>\s?/, "")];
      while (lineIndex + 1 < lines.length && /^>\s?/.test(lines[lineIndex + 1].trim())) {
        lineIndex += 1;
        quoteLines.push(lines[lineIndex].trim().replace(/^>\s?/, ""));
      }
      blocks.push(<blockquote key={`quote-${blocks.length}`}>{inlineMarkdown(quoteLines.join(" "), `q${blocks.length}`)}</blockquote>);
      continue;
    }
    flushList();
    paragraph.push(trimmed);
  }
  flushParagraph(); flushList();
  return blocks;
}

function renderBlock(block: PublicationBlock, resolveMedia: (id: number) => string) {
  const media = block.mediaId ? resolveMedia(block.mediaId) : undefined;
  const mediaFallback = media ? <a href={media} download className="published-media-download">Download this media</a> : null;
  if (block.type === "text") {
    return <div>{block.text ? renderMarkdown(block.text) : <p className="published-empty-block">Text block is empty.</p>}</div>;
  }
  if (block.type === "recipe") {
    const recipe = block.recipe;
    const ingredients = (recipe?.ingredients ?? "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    const steps = (recipe?.steps ?? "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    return (
      <section className="published-recipe">
        <h2>{recipe?.name || "Recipe"}</h2>
        {recipe?.description && <p>{recipe.description}</p>}
        <p className="published-recipe-meta">
          {recipe?.prepTime && <span>Prep: {recipe.prepTime}</span>}
          {recipe?.cookTime && <span>Cook: {recipe.cookTime}</span>}
          {recipe?.servings && <span>Serves: {recipe.servings}</span>}
        </p>
        <h3>Ingredients</h3>
        {ingredients.length ? <ul>{ingredients.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <p className="published-empty-block">No ingredients listed.</p>}
        <h3>Steps</h3>
        {steps.length ? <ol>{steps.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ol> : <p className="published-empty-block">No steps listed.</p>}
      </section>
    );
  }
  if (!media) return <p className="published-empty-block">Media is unavailable.</p>;
  if (block.type === "image") {
    return <figure className="published-media"><img src={media} alt={block.alt ?? ""} style={{ objectFit: block.fit ?? "contain" }} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
  }
  if (block.type === "video") {
    return <figure className="published-media"><video controls preload="metadata" playsInline src={media}>{mediaFallback}Your browser cannot play this video. {mediaFallback}</video>{block.caption && <figcaption>{block.caption}</figcaption>}{mediaFallback}</figure>;
  }
  return <figure className="published-media"><audio controls preload="metadata" src={media}>Your browser cannot play this audio. {mediaFallback}</audio>{block.caption && <figcaption>{block.caption}</figcaption>}{mediaFallback}</figure>;
}

export function PublishedArticle({ title, content, appearance, authorDisplay, blocks = [], projectId, mediaUrl }: PublishedArticleProps) {
  const style = { "--article-accent": colors[appearance?.accent ?? DEFAULT_APPEARANCE.accent] } as CSSProperties;
  const fontSize = { small: "0.9rem", medium: "1rem", large: "1.125rem" }[appearance?.fontSize ?? DEFAULT_APPEARANCE.fontSize];
  const lineHeight = { compact: 1.5, comfortable: 1.8, spacious: 2.05 }[appearance?.spacing ?? DEFAULT_APPEARANCE.spacing];
  const resolveMedia = mediaUrl ?? ((id: number) => projectId ? `/api/public/publications/${projectId}/media/${id}` : "");
  return (
    <article style={{ ...style, overflowWrap: "anywhere", fontFamily: (appearance?.fontFamily ?? DEFAULT_APPEARANCE.fontFamily) === "serif" ? '"Cormorant Garamond", Georgia, serif' : 'Nunito, Arial, sans-serif', fontSize, lineHeight, textAlign: appearance?.alignment ?? DEFAULT_APPEARANCE.alignment, color: "#453329" }}>
      <h1 style={{ color: "var(--article-accent)", fontSize: "2em", lineHeight: 1.15, margin: "0 0 0.35em", fontWeight: 700 }}>{title}</h1>
      {authorDisplay && <p style={{ fontSize: "0.82em", opacity: 0.72, margin: "0 0 1.5em" }}>{authorDisplay}</p>}
      <div className="published-article-content" style={{ display: "grid", gap: "0.8em" }}>
        {content && <div className="published-legacy-content">{renderMarkdown(content)}</div>}
        {blocks.map((block) => <div key={block.id} className={`published-block published-block-${block.width}`}>{renderBlock(block, resolveMedia)}</div>)}
        {!content && blocks.length === 0 && <p style={{ opacity: 0.6, fontStyle: "italic" }}>Your article preview will appear here.</p>}
      </div>
      <style>{`
        .published-article-content p { margin: 0; }
        .published-article-content h1,.published-article-content h2,.published-article-content h3,
        .published-article-content h4,.published-article-content h5,.published-article-content h6 {
          color: var(--article-accent); font-weight: 700; line-height: 1.25; margin: 0;
        }
        .published-article-content h1 { font-size: 1.8em; }
        .published-article-content h2 { font-size: 1.55em; }
        .published-article-content h3 { font-size: 1.3em; }
        .published-article-content ul,.published-article-content ol { margin: 0; padding-left: 1.5em; }
        .published-article-content ul { list-style: disc; }
        .published-article-content ol { list-style: decimal; }
        .published-article-content blockquote {
          border-left: 3px solid var(--article-accent); margin: 0; padding: 0.25em 0 0.25em 1em;
          opacity: 0.9; font-style: italic;
        }
        .published-article-content { grid-template-columns: repeat(2, minmax(0, 1fr)); text-align: inherit; }
        .published-legacy-content, .published-block-full { grid-column: 1 / -1; min-width: 0; }
        .published-block-half { grid-column: span 1; min-width: 0; }
        .published-media { margin: 0; }
        .published-media img, .published-media video { display: block; width: 100%; max-height: 36rem; border-radius: 0.5rem; }
        .published-media audio { width: 100%; }
        .published-media figcaption { margin-top: 0.35em; opacity: 0.75; font-size: 0.85em; }
        .published-media-download { color: var(--article-accent); text-decoration: underline; font-size: 0.85em; }
        .published-recipe { text-align: left; }
        .published-recipe h2, .published-recipe h3 { color: var(--article-accent); margin: 0.7em 0 0.3em; }
        .published-recipe-meta { display: flex; flex-wrap: wrap; gap: 0.5em 1em; font-size: 0.85em; opacity: 0.8; }
        .published-recipe ul, .published-recipe ol { padding-left: 1.5em; }
        .published-recipe ul { list-style: disc; }
        .published-recipe ol { list-style: decimal; }
        .published-empty-block { opacity: 0.65; font-style: italic; }
        @media (max-width: 767px) {
          .published-article-content { grid-template-columns: minmax(0, 1fr); }
          .published-block-half, .published-block-full, .published-legacy-content { grid-column: 1; }
        }
      `}</style>
    </article>
  );
}

export default PublishedArticle;
