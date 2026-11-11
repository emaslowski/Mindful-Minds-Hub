/**
 * Renders the small subset of Markdown used by lessons and the assistant:
 * paragraphs, headings, bullet and numbered lists, block quotes, bold and
 * inline code. No HTML is ever injected.
 */
export function SimpleMarkdown({ text, className = '' }: { text: string; className?: string }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter((l) => l.trim());
        if (lines.length === 0) return null;
        if (lines.every((l) => /^\s*>/.test(l))) {
          const inner = lines.map((l) => l.replace(/^\s*>\s?/, '')).join('\n');
          return (
            <blockquote key={i} className="border-l-4 border-[#d4a44c] bg-[#fff8e6] rounded-r-lg px-4 py-2 text-[#453329] italic">
              <SimpleMarkdown text={inner} />
            </blockquote>
          );
        }
        if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
          return <ul key={i} className="list-disc pl-6 space-y-1">{lines.map((l, j) => <li key={j}><Inline text={l.replace(/^\s*[-*•]\s+/, '')} /></li>)}</ul>;
        }
        if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
          return <ol key={i} className="list-decimal pl-6 space-y-1">{lines.map((l, j) => <li key={j}><Inline text={l.replace(/^\s*\d+[.)]\s+/, '')} /></li>)}</ol>;
        }
        const heading = /^(#{1,3})\s+(.*)$/.exec(block.trim());
        if (heading) {
          return heading[1].length === 1
            ? <h3 key={i} className="font-serif text-xl font-semibold text-[#453329]">{heading[2]}</h3>
            : <h4 key={i} className="font-semibold text-[#453329]">{heading[2]}</h4>;
        }
        return <p key={i} className="whitespace-pre-wrap leading-relaxed"><Inline text={block} /></p>;
      })}
    </div>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (/^`[^`]+`$/.test(part)) return <code key={i} className="rounded bg-[#453329] px-1.5 py-0.5 font-mono text-[0.85em] text-[#f5efe5]">{part.slice(1, -1)}</code>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
