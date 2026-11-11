import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useParams } from 'wouter';
import { StudioLayout } from '@/components/studio/StudioLayout';
import { SimpleMarkdown } from '@/components/studio/SimpleMarkdown';
import { BlockBuilder } from '@/components/studio/codingLab/BlockBuilder';
import { PromptBuilder } from '@/components/studio/codingLab/PromptBuilder';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StudioApiError } from '@/lib/studioApi';
import { buildMeetsStep, codingLabApi, type Build, type CodingLabBlock, type CodingLabStep } from '@/lib/codingLabApi';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, PartyPopper, Send } from 'lucide-react';

const STEP_LABEL: Record<CodingLabStep['type'], string> = { read: 'Read', quiz: 'Quiz', build: 'Build', prompt: 'Prompt' };

export default function CodingLabLesson() {
  const { user, isLoading } = useRequireStudioRole('student', 'teacher');
  const { slug = '' } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const detail = useQuery({ queryKey: ['coding-lab-lesson', slug], queryFn: () => codingLabApi.lesson(slug), enabled: !!user && !!slug });
  const lesson = detail.data?.lesson;
  const progress = detail.data?.progress;

  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  // Build and prompt steps report whether their requirements are met.
  const [ready, setReady] = useState<Record<number, boolean>>({});
  const setStepReady = useCallback((index: number, value: boolean) => {
    setReady((prev) => (prev[index] === value ? prev : { ...prev, [index]: value }));
  }, []);
  // Pick the first unfinished step on first load (or ?step=N from the lab page).
  useEffect(() => {
    if (!lesson || !progress || stepIndex != null) return;
    const wanted = Number(new URLSearchParams(window.location.search).get('step'));
    if (Number.isInteger(wanted) && wanted >= 0 && wanted < lesson.steps.length) { setStepIndex(wanted); return; }
    const first = lesson.steps.findIndex((_, i) => !progress.completedSteps.includes(i));
    setStepIndex(first === -1 ? 0 : first);
  }, [lesson, progress, stepIndex]);

  const complete = useMutation({
    mutationFn: ({ index, quizAnswer }: { index: number; quizAnswer?: number }) => codingLabApi.completeStep(slug, index, quizAnswer),
    onSuccess: (data) => {
      qc.setQueryData(['coding-lab-lesson', slug], (old: typeof detail.data) => (old ? { ...old, progress: data.progress } : old));
      qc.invalidateQueries({ queryKey: ['coding-lab'] });
    },
  });

  if (isLoading || !user) return <div className="flex h-screen items-center justify-center text-[#453329]">Loading…</div>;

  if (detail.isError) {
    return (
      <StudioLayout>
        <div className="mx-auto max-w-3xl p-6 text-[#453329]">
          <p>This lesson could not be loaded{detail.error instanceof StudioApiError && detail.error.status === 404 ? ' (it may have been unpublished)' : ''}.</p>
          <Link href="/studio/coding-lab" className="text-[#c4622d] underline">Back to the Coding Lab</Link>
        </div>
      </StudioLayout>
    );
  }
  if (!lesson || !progress || stepIndex == null) return <StudioLayout><div className="p-6 text-[#453329]">Loading lesson…</div></StudioLayout>;

  const step = lesson.steps[stepIndex];
  const isDone = progress.completedSteps.includes(stepIndex);
  const isLast = stepIndex === lesson.steps.length - 1;
  const canAdvance = isDone || step.type === 'read' || (step.type !== 'quiz' && ready[stepIndex] === true);

  const goNext = async (quizAnswer?: number) => {
    if (!isDone) {
      try {
        await complete.mutateAsync({ index: stepIndex, quizAnswer });
      } catch (err) {
        toast({ title: 'Not finished yet', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
        return;
      }
    }
    if (isLast) setFinished(true);
    else setStepIndex(stepIndex + 1);
    window.scrollTo({ top: 0 });
  };

  return (
    <StudioLayout>
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <Link href="/studio/coding-lab" className="inline-flex items-center gap-1 text-sm text-[#8a6a55] hover:text-[#453329]"><ArrowLeft className="h-4 w-4" /> Coding Lab</Link>
        </div>
        <div className="mb-5 flex items-start gap-3">
          <span className="text-4xl">{lesson.emoji ?? '📘'}</span>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#453329]">{lesson.title}</h1>
            <p className="text-sm text-[#688a52]">{lesson.summary}</p>
          </div>
        </div>

        {/* Step dots */}
        <ol className="mb-6 flex flex-wrap items-center gap-2">
          {lesson.steps.map((s, i) => {
            const done = progress.completedSteps.includes(i);
            const current = i === stepIndex && !finished;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => { setFinished(false); setStepIndex(i); }}
                  title={`${STEP_LABEL[s.type]}: ${s.title}`}
                  className={cn(
                    'flex h-8 min-w-8 items-center justify-center gap-1 rounded-full border px-2 text-xs font-medium transition',
                    current ? 'border-[#c4622d] bg-[#c4622d] text-white' : done ? 'border-emerald-300 bg-emerald-100 text-emerald-800' : 'border-[#d5cabe] bg-white text-[#8a6a55]',
                  )}
                >
                  {done && !current ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  <span className="hidden sm:inline">{STEP_LABEL[s.type]}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {finished ? (
          <div className="rounded-2xl border border-[#d5cabe] bg-white p-8 text-center">
            <PartyPopper className="mx-auto h-10 w-10 text-[#d4a44c]" />
            <h2 className="mt-3 font-serif text-2xl font-semibold text-[#453329]">Lesson complete!</h2>
            <p className="mt-1 text-[#688a52]">Nice work. You finished every step of “{lesson.title}”.</p>
            <div className="mt-5 flex justify-center gap-3">
              <Button variant="outline" className="rounded-full border-[#d5cabe]" onClick={() => { setFinished(false); setStepIndex(0); }}>Review the lesson</Button>
              <Button className="rounded-full bg-[#c4622d] text-white hover:bg-[#a85226]" onClick={() => navigate('/studio/coding-lab')}>Back to the Coding Lab</Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#d5cabe] bg-white p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6a55]">Step {stepIndex + 1} of {lesson.steps.length} · {STEP_LABEL[step.type]}</p>
            <h2 className="mb-4 mt-1 font-serif text-xl font-semibold text-[#453329]">{step.title}</h2>

            {step.type === 'read' && <ReadStep step={step} />}
            {step.type === 'quiz' && (
              <QuizStep key={`${slug}-${stepIndex}`} step={step} savedAnswer={progress.quizAnswers[String(stepIndex)]} onCorrect={(answer) => complete.mutate({ index: stepIndex, quizAnswer: answer })} />
            )}
            {step.type === 'build' && (
              <BuildStep
                key={`${slug}-${stepIndex}`}
                step={step}
                lessonId={lesson.id}
                stepIndex={stepIndex}
                existing={detail.data!.builds.find((b) => b.stepIndex === stepIndex) ?? null}
                onSaved={() => qc.invalidateQueries({ queryKey: ['coding-lab-lesson', slug] })}
                onReady={setStepReady}
              />
            )}
            {step.type === 'prompt' && (
              <PromptBuilder
                key={`${slug}-${stepIndex}`}
                step={step}
                aiEnabled={detail.data!.aiHelper}
                remaining={Math.max(0, detail.data!.aiDailyLimit - detail.data!.aiUsedToday)}
                onAsk={async (chips) => {
                  const r = await codingLabApi.askAi(slug, stepIndex, chips);
                  qc.setQueryData(['coding-lab-lesson', slug], (old: typeof detail.data) => (old ? { ...old, aiUsedToday: r.usedToday } : old));
                  return r;
                }}
                stepIndex={stepIndex}
                onReady={setStepReady}
              />
            )}

            <div className="mt-8 flex items-center justify-between border-t border-[#eee6d8] pt-4">
              <Button variant="ghost" disabled={stepIndex === 0} onClick={() => { setStepIndex(stepIndex - 1); window.scrollTo({ top: 0 }); }} className="text-[#8a6a55]">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {step.type === 'quiz' && !isDone ? (
                <span className="text-sm text-[#8a6a55]">Pick the right answer to continue</span>
              ) : (
                <Button onClick={() => goNext()} disabled={!canAdvance || complete.isPending} className="rounded-full bg-[#c4622d] text-white hover:bg-[#a85226]">
                  {complete.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isLast ? 'Finish lesson' : 'Next step'} <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </StudioLayout>
  );
}

function ReadStep({ step }: { step: Extract<CodingLabStep, { type: 'read' }> }) {
  return <SimpleMarkdown text={step.body} className="text-[#453329]" />;
}

function QuizStep({ step, savedAnswer, onCorrect }: { step: Extract<CodingLabStep, { type: 'quiz' }>; savedAnswer?: number; onCorrect: (answer: number) => void }) {
  const [chosen, setChosen] = useState<number | null>(savedAnswer ?? null);
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const correct = chosen === step.answer;
  const pick = (i: number) => {
    setChosen(i);
    if (i === step.answer) onCorrect(i);
    else setWrong((w) => new Set(w).add(i));
  };
  return (
    <div>
      <p className="mb-4 text-lg text-[#453329]">{step.question}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {step.options.map((opt, i) => {
          const isWrong = wrong.has(i) && !correct;
          const isRight = correct && i === step.answer;
          return (
            <button
              key={i}
              type="button"
              disabled={correct}
              onClick={() => pick(i)}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition',
                isRight ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : isWrong ? 'border-red-300 bg-red-50 text-red-900' : 'border-[#d5cabe] bg-white text-[#453329] hover:border-[#c4622d]',
              )}
            >
              <span className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold', isRight ? 'border-emerald-400 bg-emerald-200' : isWrong ? 'border-red-300 bg-red-100' : 'border-[#d5cabe] bg-[#eee6d8]')}>
                {isRight ? <Check className="h-4 w-4" /> : String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
      {chosen != null && !correct && <p className="mt-3 text-sm text-red-700">Not quite. Try another answer!</p>}
      {correct && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4" /> That's right!</p>
          {step.explanation && <p className="mt-1">{step.explanation}</p>}
        </div>
      )}
    </div>
  );
}

function BuildStep({ step, lessonId, stepIndex, existing, onSaved, onReady }: {
  step: Extract<CodingLabStep, { type: 'build' }>; lessonId: number; stepIndex: number; existing: Build | null;
  onSaved: () => void; onReady: (index: number, ready: boolean) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [blocks, setBlocks] = useState<CodingLabBlock[]>(existing?.blocks ?? []);
  const [buildId, setBuildId] = useState<number | null>(existing?.id ?? null);
  const [projectId, setProjectId] = useState<number | null>(existing?.projectId ?? null);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'error'>(existing ? 'saved' : 'unsaved');
  const dirty = useRef(false);
  const inFlight = useRef<Promise<number | null> | null>(null);

  const meets = useMemo(() => buildMeetsStep(blocks, step), [blocks, step]);
  useEffect(() => onReady(stepIndex, meets && saveState === 'saved'), [stepIndex, meets, saveState, onReady]);

  const save = useCallback(async (): Promise<number | null> => {
    if (inFlight.current) return inFlight.current;
    setSaveState('saving');
    const run = (async () => {
      try {
        let id = buildId;
        if (id == null) {
          const r = await codingLabApi.createBuild({ lessonId, stepIndex, title: title || 'My page', blocks });
          id = r.build.id;
          setBuildId(id);
        } else {
          await codingLabApi.updateBuild(id, { title: title || 'My page', blocks });
        }
        dirty.current = false;
        setSaveState('saved');
        onSaved();
        return id;
      } catch (err) {
        setSaveState('error');
        toast({ title: 'Could not save your page', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
        return null;
      } finally {
        inFlight.current = null;
      }
    })();
    inFlight.current = run;
    return run;
  }, [buildId, lessonId, stepIndex, title, blocks, onSaved, toast]);

  // Autosave 1.2s after the last change.
  useEffect(() => {
    if (!dirty.current) return;
    setSaveState('unsaved');
    const t = setTimeout(() => { void save(); }, 1200);
    return () => clearTimeout(t);
  }, [title, blocks, save]);

  const change = (next: CodingLabBlock[]) => { dirty.current = true; setBlocks(next); };
  const changeTitle = (t: string) => { dirty.current = true; setTitle(t); };

  const submit = useMutation({
    mutationFn: async () => {
      const id = dirty.current || buildId == null ? await save() : buildId;
      if (id == null) throw new Error('Your page has not been saved yet.');
      return codingLabApi.submitBuild(id);
    },
    onSuccess: (r) => {
      setProjectId(r.project.id);
      onSaved();
      toast({ title: r.updated ? 'Your project was updated' : 'Sent to your teacher!', description: `“${r.project.title}” is now in My Projects.` });
    },
    onError: (err) => toast({ title: 'Could not send your page', description: err instanceof Error ? err.message : undefined, variant: 'destructive' }),
  });

  const statusText = { saved: 'Saved', saving: 'Saving…', unsaved: 'Unsaved changes', error: 'Not saved' }[saveState];

  return (
    <div className="space-y-4">
      <SimpleMarkdown text={step.instructions} className="text-[#453329]" />
      <BlockBuilder
        title={title}
        onTitleChange={changeTitle}
        blocks={blocks}
        onChange={change}
        required={step.required}
        minBlocks={step.minBlocks}
        status={<span className={cn(saveState === 'error' && 'text-red-700')}>{statusText}</span>}
        footer={(
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#d5cabe] bg-[#eee6d8] p-3">
            <Button
              type="button"
              onClick={() => submit.mutate()}
              disabled={submit.isPending || blocks.length === 0}
              className="rounded-full bg-[#688a52] text-white hover:bg-[#577445]"
            >
              {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {projectId != null ? 'Send the latest version' : 'Send to my teacher'}
            </Button>
            {projectId != null ? (
              <Link href={`/studio/projects/${projectId}`} className="text-sm font-medium text-emerald-800 underline">Sent · open it in My Projects</Link>
            ) : (
              <span className="text-xs text-[#8a6a55]">This makes a project your teacher can review and publish. You can keep editing it in My Projects.</span>
            )}
          </div>
        )}
      />
    </div>
  );
}
