/**
 * ContentPreview — renders structured `## Section\nbody` content as a styled
 * website-like article preview so students can see how it will look when published.
 */

interface ContentPreviewProps {
  title: string;
  contentType: string;
  content: string;
}

function parseSections(text: string): Array<{ heading: string; body: string }> {
  if (!text.trim()) return [];
  const parts = text.split(/^## /m);
  return parts.slice(1).map((part) => {
    const nl = part.indexOf('\n');
    if (nl === -1) return { heading: part.trim(), body: '' };
    return { heading: part.slice(0, nl).trim(), body: part.slice(nl + 1).trim() };
  });
}

export function ContentPreview({ title, contentType, content }: ContentPreviewProps) {
  const sections = parseSections(content);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Browser chrome mock */}
      <div className="bg-[#3a2c22] rounded-t-xl px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <div className="w-3 h-3 rounded-full bg-green-400/70" />
        </div>
        <div className="flex-1 bg-[#2a1e16] rounded-md px-3 py-1 text-xs text-[#8a6a55] font-mono">
          The Brightside Project / {contentType.toLowerCase().replace(/ /g, '-')}
        </div>
      </div>

      {/* Page preview */}
      <div className="bg-white border border-[#d5cabe] rounded-b-xl overflow-hidden shadow-sm">
        {/* Site nav mock */}
        <div className="bg-[#eee6d8] px-6 py-3 flex items-center justify-between border-b border-[#d5cabe]">
          <span className="font-display italic text-[#453329] text-lg">The Brightside Project</span>
          <div className="flex gap-4 text-xs text-[#688a52]">
            <span>Grow</span><span>Learn</span><span>Create</span><span>Move</span>
          </div>
        </div>

        {/* Article body */}
        <div className="px-8 py-8">
          {/* Header */}
          <div className="mb-6 pb-5 border-b border-[#eee6d8]">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#c4622d] mb-2 block">
              {contentType}
            </span>
            <h1 className="font-display italic text-3xl text-[#453329] leading-snug mb-3">
              {title || <span className="text-[#d5cabe]">Untitled Project</span>}
            </h1>
            <div className="flex items-center gap-2 text-xs text-[#8a6a55]">
              <span className="bg-[#eee6d8] rounded-full px-2 py-0.5">The Brightside Project Student Team</span>
            </div>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-12 text-[#d5cabe]">
              <p className="text-sm italic">Content will appear here once you start writing in the Content tab.</p>
            </div>
          ) : (
            <div className="space-y-7">
              {sections.map((section, i) => (
                <div key={i}>
                  {/* Only show heading if it's not a single-section type */}
                  {sections.length > 1 && (
                    <h2 className="text-base font-semibold text-[#688a52] mb-2 uppercase tracking-wide text-xs">
                      {section.heading}
                    </h2>
                  )}
                  {section.body ? (
                    <p className="text-[#453329] leading-relaxed text-sm whitespace-pre-wrap font-sans">
                      {section.body}
                    </p>
                  ) : (
                    <p className="text-[#d5cabe] italic text-sm">— not filled in yet —</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer mock */}
          <div className="mt-10 pt-5 border-t border-[#eee6d8] flex items-center justify-between text-xs text-[#d5cabe]">
            <span>The Brightside Project School Wellness</span>
            <span>Student Team</span>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-[#8a6a55] mt-3 italic">
        This is a preview — your teacher will review and publish the final version.
      </p>
    </div>
  );
}
