/**
 * Prompt builder: students click one chip per group to assemble a prompt,
 * see a check of what a good prompt includes, and (if the teacher turned
 * the AI helper on) send it and read the answer.
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CodingLabStep } from '@/lib/codingLabApi';
import { Check, Loader2, Sparkles } from 'lucide-react';

type PromptStep = Extract<CodingLabStep, { type: 'prompt' }>;

interface PromptBuilderProps {
  step: PromptStep;
  stepIndex: number;
  aiEnabled: boolean;
  remaining: number;
  onAsk?: (chips: string[]) => Promise<{ reply: string }>;
  onReady: (index: number, ready: boolean) => void;
}

export function PromptBuilder({ step, stepIndex, aiEnabled, remaining, onAsk, onReady }: PromptBuilderProps) {
  const [picked, setPicked] = useState<Record<number, string | null>>({});
  const [reply, setReply] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chips = step.groups.map((_, i) => picked[i]).filter((c): c is string => Boolean(c));
  const ready = step.groups.every((_, i) => Boolean(picked[i]));
  useEffect(() => onReady(stepIndex, ready), [stepIndex, ready, onReady]);

  const ask = async () => {
    if (!onAsk) return;
    setAsking(true); setError(null); setReply(null);
    try {
      const r = await onAsk(chips);
      setReply(r.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The AI helper did not answer.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-5">
      {step.groups.map((group, gi) => (
        <div key={gi}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8a6a55]">
            {gi + 1}. {group.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.chips.map((chip) => {
              const on = picked[gi] === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => { setPicked({ ...picked, [gi]: on ? null : chip }); setReply(null); }}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-sm transition',
                    on ? 'border-[#c4622d] bg-[#c4622d] text-white shadow' : 'border-[#d5cabe] bg-white text-[#453329] hover:border-[#c4622d]',
                  )}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-[#d5cabe] bg-white p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#8a6a55]">Your prompt</p>
        <p className="min-h-[1.5rem] font-serif text-lg text-[#453329]">
          {chips.length ? chips.join(' ') : <span className="italic text-[#d5cabe]">Click chips above to build your prompt…</span>}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {step.groups.map((g, gi) => (
            <span key={gi} className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1', picked[gi] ? 'bg-emerald-100 text-emerald-800' : 'bg-[#eee6d8] text-[#8a6a55]')}>
              {picked[gi] ? <Check className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-current" />}
              {g.label}
            </span>
          ))}
        </div>
      </div>

      {step.allowAi && (
        aiEnabled ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={ask} disabled={!ready || asking || remaining <= 0} className="rounded-full bg-[#688a52] text-white hover:bg-[#577445]">
                {asking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Ask the AI
              </Button>
              <span className="text-xs text-[#8a6a55]">{remaining} {remaining === 1 ? 'try' : 'tries'} left today</span>
            </div>
            {error && <p className="text-sm text-red-700">{error}</p>}
            {reply && (
              <div className="rounded-xl border border-[#688a52]/40 bg-[#f1f5ec] p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#688a52]">The AI answered</p>
                <p className="whitespace-pre-wrap text-[#453329]">{reply}</p>
                <p className="mt-3 text-xs text-[#8a6a55]">Remember: AI can be wrong. Does this answer actually match what you asked for?</p>
              </div>
            )}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-[#d5cabe] bg-white/60 p-3 text-sm text-[#8a6a55]">
            The AI helper is turned off right now. Your teacher can turn it on in the Coding Lab settings so you can send your prompt and read the answer.
          </p>
        )
      )}
    </div>
  );
}
