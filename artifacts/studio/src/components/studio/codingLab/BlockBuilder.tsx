/**
 * The Coding Lab page builder. Students click a block type to add it, type
 * their words, reorder with arrows, and switch between a site-style preview
 * and the HTML their clicks produced.
 */
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  BLOCK_PALETTE, EXAMPLE_TEXT, blockToHtml, newBlock,
  type CodingLabBlock, type CodingLabBlockType,
} from '@/lib/codingLabApi';
import { ArrowDown, ArrowUp, Check, Code2, Eye, Plus, Trash2, Wand2 } from 'lucide-react';

interface BlockBuilderProps {
  title: string;
  onTitleChange: (title: string) => void;
  blocks: CodingLabBlock[];
  onChange: (blocks: CodingLabBlock[]) => void;
  required?: CodingLabBlockType[];
  minBlocks?: number;
  status?: ReactNode;
  footer?: ReactNode;
}

const PALETTE_BY_TYPE = Object.fromEntries(BLOCK_PALETTE.map((p) => [p.type, p])) as Record<CodingLabBlockType, typeof BLOCK_PALETTE[number]>;

export function BlockBuilder({ title, onTitleChange, blocks, onChange, required = [], minBlocks = 0, status, footer }: BlockBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const types = new Set(blocks.map((b) => b.type));

  const add = (type: CodingLabBlockType) => {
    const block = newBlock(type);
    onChange([...blocks, block]);
    setSelectedId(block.id);
  };
  const update = (id: string, patch: Partial<CodingLabBlock>) => onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const remove = (id: string) => onChange(blocks.filter((b) => b.id !== id));
  const move = (id: string, dir: -1 | 1) => {
    const i = blocks.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {(required.length > 0 || minBlocks > 0) && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-[#453329]">Your page needs:</span>
          {required.map((t) => (
            <span key={t} className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1', types.has(t) ? 'bg-emerald-100 text-emerald-800' : 'bg-white border border-[#d5cabe] text-[#8a6a55]')}>
              {types.has(t) ? <Check className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-current" />}
              {PALETTE_BY_TYPE[t].emoji} {PALETTE_BY_TYPE[t].label}
            </span>
          ))}
          {minBlocks > 0 && (
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1', blocks.length >= minBlocks ? 'bg-emerald-100 text-emerald-800' : 'bg-white border border-[#d5cabe] text-[#8a6a55]')}>
              {blocks.length >= minBlocks ? <Check className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-current" />}
              at least {minBlocks} blocks ({blocks.length} so far)
            </span>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        {/* Palette */}
        <aside className="rounded-xl border border-[#d5cabe] bg-[#eee6d8] p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8a6a55]">Click to add a block</p>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {BLOCK_PALETTE.map((p) => (
              <button
                key={p.type}
                type="button"
                onClick={() => add(p.type)}
                title={p.hint}
                className="flex min-w-[140px] items-center gap-2 rounded-lg border border-[#d5cabe] bg-white px-3 py-2 text-left text-sm text-[#453329] shadow-sm transition hover:border-[#c4622d] hover:shadow"
              >
                <span className="text-lg">{p.emoji}</span>
                <span className="flex-1">
                  <span className="block font-medium">{p.label}</span>
                  <span className="block font-mono text-[10px] text-[#8a6a55]">&lt;{p.tag}&gt;</span>
                </span>
                <Plus className="h-4 w-4 text-[#c4622d]" />
              </button>
            ))}
          </div>
        </aside>

        {/* Editor */}
        <div className="min-w-0 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Page title"
              maxLength={120}
              className="bg-white border-[#d5cabe] font-serif text-lg"
            />
            {status && <div className="text-xs text-[#8a6a55] whitespace-nowrap">{status}</div>}
          </div>

          {blocks.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-[#d5cabe] bg-white/60 p-8 text-center text-sm text-[#8a6a55]">
              Your page is empty. Click a block on the left to start building.
            </div>
          ) : (
            <div className="space-y-2">
              {blocks.map((b, i) => (
                <BlockEditor
                  key={b.id}
                  block={b}
                  index={i}
                  count={blocks.length}
                  selected={selectedId === b.id}
                  onSelect={() => setSelectedId(b.id)}
                  onChange={(patch) => update(b.id, patch)}
                  onRemove={() => remove(b.id)}
                  onMove={(dir) => move(b.id, dir)}
                />
              ))}
            </div>
          )}

          <Tabs defaultValue="preview" className="pt-2">
            <TabsList className="bg-[#eee6d8]">
              <TabsTrigger value="preview" className="gap-1.5"><Eye className="h-3.5 w-3.5" /> Preview</TabsTrigger>
              <TabsTrigger value="code" className="gap-1.5"><Code2 className="h-3.5 w-3.5" /> Code</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="mt-3">
              <PagePreview title={title} blocks={blocks} selectedId={selectedId} onSelect={setSelectedId} />
            </TabsContent>
            <TabsContent value="code" className="mt-3">
              <CodeView title={title} blocks={blocks} selectedId={selectedId} onSelect={setSelectedId} />
            </TabsContent>
          </Tabs>

          {footer}
        </div>
      </div>
    </div>
  );
}

function BlockEditor({ block, index, count, selected, onSelect, onChange, onRemove, onMove }: {
  block: CodingLabBlock; index: number; count: number; selected: boolean;
  onSelect: () => void; onChange: (patch: Partial<CodingLabBlock>) => void; onRemove: () => void; onMove: (dir: -1 | 1) => void;
}) {
  const meta = PALETTE_BY_TYPE[block.type];
  const field = 'bg-white border-[#d5cabe] text-sm';
  return (
    <div
      onClick={onSelect}
      className={cn('rounded-xl border bg-white p-3 shadow-sm transition', selected ? 'border-[#c4622d] ring-2 ring-[#c4622d]/20' : 'border-[#d5cabe]')}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-base">{meta.emoji}</span>
        <span className="text-sm font-medium text-[#453329]">{meta.label}</span>
        <span className="rounded bg-[#453329] px-1.5 py-0.5 font-mono text-[10px] text-[#f5efe5]">&lt;{meta.tag}&gt;</span>
        <span className="flex-1" />
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-[#8a6a55]" title="Fill with an example" onClick={(e) => { e.stopPropagation(); onChange(EXAMPLE_TEXT[block.type]); }}>
          <Wand2 className="h-3.5 w-3.5" /> Example
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Move up" disabled={index === 0} onClick={(e) => { e.stopPropagation(); onMove(-1); }}><ArrowUp className="h-3.5 w-3.5" /></Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Move down" disabled={index === count - 1} onClick={(e) => { e.stopPropagation(); onMove(1); }}><ArrowDown className="h-3.5 w-3.5" /></Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-600" title="Remove" onClick={(e) => { e.stopPropagation(); onRemove(); }}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>

      {block.type === 'heading' && (
        <Input value={block.text ?? ''} maxLength={200} onChange={(e) => onChange({ text: e.target.value })} placeholder="Type your heading" className={cn(field, 'font-serif text-base')} />
      )}
      {(block.type === 'paragraph' || block.type === 'tip') && (
        <Textarea value={block.text ?? ''} maxLength={4000} rows={3} onChange={(e) => onChange({ text: e.target.value })} placeholder={block.type === 'tip' ? 'The most important idea on your page' : 'Write a few sentences'} className={field} />
      )}
      {block.type === 'quote' && (
        <div className="space-y-2">
          <Textarea value={block.text ?? ''} maxLength={1000} rows={2} onChange={(e) => onChange({ text: e.target.value })} placeholder="The words someone said" className={field} />
          <Input value={block.by ?? ''} maxLength={100} onChange={(e) => onChange({ by: e.target.value })} placeholder="Who said it (no last names)" className={field} />
        </div>
      )}
      {block.type === 'list' && (
        <div className="space-y-1.5">
          {(block.items ?? []).map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[#8a6a55]">•</span>
              <Input
                value={item}
                maxLength={500}
                onChange={(e) => onChange({ items: (block.items ?? []).map((x, j) => (j === i ? e.target.value : x)) })}
                placeholder={`Item ${i + 1}`}
                className={field}
              />
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={(block.items ?? []).length <= 1} onClick={() => onChange({ items: (block.items ?? []).filter((_, j) => j !== i) })}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={(block.items ?? []).length >= 30} onClick={() => onChange({ items: [...(block.items ?? []), ''] })}><Plus className="h-3 w-3" /> Add item</Button>
        </div>
      )}
      {block.type === 'button' && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input value={block.label ?? ''} maxLength={80} onChange={(e) => onChange({ label: e.target.value })} placeholder="Button words, e.g. Visit the Games page" className={field} />
          <Input value={block.href ?? ''} maxLength={300} onChange={(e) => onChange({ href: e.target.value })} placeholder="Page on our site, e.g. /games" className={cn(field, 'font-mono')} />
        </div>
      )}
      {block.type === 'divider' && (
        <Input value={block.emoji ?? ''} maxLength={8} onChange={(e) => onChange({ emoji: e.target.value })} placeholder="Optional emoji, e.g. 🌱" className={cn(field, 'w-40')} />
      )}
    </div>
  );
}

/** How the page would look on the website. */
export function PagePreview({ title, blocks, selectedId, onSelect }: { title: string; blocks: CodingLabBlock[]; selectedId?: string | null; onSelect?: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#d5cabe] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#d5cabe] bg-[#eee6d8] px-5 py-2.5">
        <span className="font-serif italic text-[#453329]">The Brightside Wellness Project</span>
        <div className="flex gap-3 text-xs text-[#688a52]"><span>Grow</span><span>Learn</span><span>Create</span><span>Move</span></div>
      </div>
      <article className="px-6 py-6 sm:px-10">
        <h1 className="mb-5 font-serif text-3xl italic text-[#453329]">{title || <span className="text-[#d5cabe]">Untitled page</span>}</h1>
        {blocks.length === 0 && <p className="text-sm italic text-[#d5cabe]">Your blocks will show up here.</p>}
        <div className="space-y-4">
          {blocks.map((b) => (
            <div key={b.id} onClick={() => onSelect?.(b.id)} className={cn('rounded-md transition', selectedId === b.id && 'ring-2 ring-[#c4622d]/40 ring-offset-2')}>
              <PreviewBlock block={b} />
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

function PreviewBlock({ block }: { block: CodingLabBlock }) {
  const empty = <span className="italic text-[#d5cabe]">(empty)</span>;
  switch (block.type) {
    case 'heading': return <h2 className="font-serif text-2xl text-[#453329]">{block.text || empty}</h2>;
    case 'paragraph': return <p className="whitespace-pre-wrap leading-relaxed text-[#453329]">{block.text || empty}</p>;
    case 'list': return <ul className="list-disc space-y-1 pl-6 text-[#453329]">{(block.items ?? []).map((i, k) => <li key={k}>{i || empty}</li>)}</ul>;
    case 'quote': return (
      <blockquote className="border-l-4 border-[#688a52] pl-4 italic text-[#453329]">
        {block.text || empty}
        {block.by && <cite className="mt-1 block text-sm not-italic text-[#8a6a55]">— {block.by}</cite>}
      </blockquote>
    );
    case 'tip': return <aside className="rounded-xl border border-[#d4a44c] bg-[#fff8e6] px-4 py-3 text-[#453329]">💡 {block.text || empty}</aside>;
    case 'button': return <span className="inline-block rounded-full bg-[#c4622d] px-5 py-2 text-sm font-medium text-white">{block.label || 'Button'}</span>;
    case 'divider': return <hr className="border-[#d5cabe]" style={block.emoji ? { borderTop: 0, textAlign: 'center' } : undefined} />;
  }
}

/** The HTML the page is made of, one segment per block, highlighted when selected. */
export function CodeView({ title, blocks, selectedId, onSelect }: { title: string; blocks: CodingLabBlock[]; selectedId?: string | null; onSelect?: (id: string) => void }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-[#2a1e16] p-4 font-mono text-[13px] leading-6 text-[#f5efe5]">
      <Html text={`<!doctype html>\n<html>\n  <head>\n    <title>${title}</title>\n  </head>\n  <body>\n    <h1>${title}</h1>\n`} />
      {blocks.map((b) => (
        <div
          key={b.id}
          onClick={() => onSelect?.(b.id)}
          className={cn('-mx-2 cursor-pointer rounded px-2 transition', selectedId === b.id ? 'bg-[#c4622d]/30' : 'hover:bg-white/5')}
        >
          <Html text={blockToHtml(b).split('\n').map((l) => `    ${l}`).join('\n') + '\n'} />
        </div>
      ))}
      <Html text={'  </body>\n</html>'} />
    </pre>
  );
}

function Html({ text }: { text: string }) {
  const parts = text.split(/(<[^>]+>)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^<[^>]+>$/.test(part)) {
          const m = /^<(\/?)([a-zA-Z0-9!]+)(.*?)(\/?)>$/.exec(part);
          if (!m) return <span key={i} className="text-[#d4a44c]">{part}</span>;
          return (
            <span key={i}>
              <span className="text-[#d5cabe]">&lt;{m[1]}</span>
              <span className="text-[#d4a44c]">{m[2]}</span>
              <span className="text-[#9bc08a]">{m[3]}</span>
              <span className="text-[#d5cabe]">{m[4]}&gt;</span>
            </span>
          );
        }
        return <span key={i}>{part.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')}</span>;
      })}
    </>
  );
}
