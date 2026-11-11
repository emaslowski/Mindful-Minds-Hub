import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  BLOCK_PALETTE, codingLabAdminApi, type CodingLabBlockType, type CodingLabStep, type Lesson, type LessonInput, type TeacherLessonRow,
} from '@/lib/codingLabApi';
import { formatDistanceToNow } from 'date-fns';
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';

export default function CodingLabAdmin() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const [editing, setEditing] = useState<Lesson | 'new' | null>(null);
  if (isLoading || !user) return <div className="flex h-screen items-center justify-center text-[#453329]">Loading…</div>;

  return (
    <StudioLayout>
      <StudioPage
        title="Coding Lab"
        subtitle="Lessons about AI and how the website is built, with a click-to-build page maker"
        action={editing ? undefined : (
          <div className="flex gap-2">
            <Link href="/studio/coding-lab"><Button variant="outline" className="rounded-full border-[#d5cabe]"><Eye className="h-4 w-4" /> See it as a student</Button></Link>
            <Button className="rounded-full bg-[#c4622d] text-white hover:bg-[#a85226]" onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> New lesson</Button>
          </div>
        )}
      >
        {editing ? (
          <LessonEditor lesson={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
        ) : (
          <Tabs defaultValue="lessons">
            <TabsList className="bg-[#eee6d8]">
              <TabsTrigger value="lessons">Lessons</TabsTrigger>
              <TabsTrigger value="progress">Student progress</TabsTrigger>
              <TabsTrigger value="settings">AI helper</TabsTrigger>
            </TabsList>
            <TabsContent value="lessons" className="mt-4"><LessonsTab onEdit={setEditing} /></TabsContent>
            <TabsContent value="progress" className="mt-4"><ProgressTab /></TabsContent>
            <TabsContent value="settings" className="mt-4"><SettingsTab /></TabsContent>
          </Tabs>
        )}
      </StudioPage>
    </StudioLayout>
  );
}

function LessonsTab({ onEdit }: { onEdit: (lesson: Lesson) => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const lessons = useQuery({ queryKey: ['coding-lab-admin-lessons'], queryFn: () => codingLabAdminApi.lessons().then((r) => r.lessons) });
  const [confirmDelete, setConfirmDelete] = useState<TeacherLessonRow | null>(null);
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['coding-lab-admin-lessons'] }); qc.invalidateQueries({ queryKey: ['coding-lab'] }); };
  const fail = (title: string) => (err: unknown) => toast({ title, description: err instanceof Error ? err.message : undefined, variant: 'destructive' });

  const toggle = useMutation({ mutationFn: (l: TeacherLessonRow) => codingLabAdminApi.update(l.id, { published: !l.published }), onSuccess: invalidate, onError: fail('Could not change the lesson') });
  const reorder = useMutation({
    mutationFn: ({ a, b }: { a: TeacherLessonRow; b: TeacherLessonRow }) => Promise.all([
      codingLabAdminApi.update(a.id, { sortOrder: b.sortOrder === a.sortOrder ? b.sortOrder + 1 : b.sortOrder }),
      codingLabAdminApi.update(b.id, { sortOrder: a.sortOrder }),
    ]),
    onSuccess: invalidate, onError: fail('Could not reorder'),
  });
  const remove = useMutation({ mutationFn: (id: number) => codingLabAdminApi.delete(id), onSuccess: () => { setConfirmDelete(null); invalidate(); }, onError: fail('Could not delete the lesson') });
  const restore = useMutation({
    mutationFn: () => codingLabAdminApi.restoreStarters(),
    onSuccess: (r) => { invalidate(); toast({ title: r.added ? `${r.added} starter lesson${r.added === 1 ? '' : 's'} restored` : 'All starter lessons are already here' }); },
    onError: fail('Could not restore the starter lessons'),
  });
  const open = useMutation({ mutationFn: (id: number) => codingLabAdminApi.lesson(id).then((r) => r.lesson), onSuccess: onEdit, onError: fail('Could not open the lesson') });

  const rows = lessons.data ?? [];
  return (
    <div className="space-y-3">
      {lessons.isLoading ? <p className="text-sm text-[#688a52]">Loading…</p> : rows.length === 0 ? (
        <Card className="border-[#d5cabe] bg-[#eee6d8]"><CardContent className="p-6 text-center text-sm text-[#688a52]">No lessons yet.</CardContent></Card>
      ) : rows.map((l, i) => (
        <Card key={l.id} className={cn('border-[#d5cabe]', l.published ? 'bg-white' : 'bg-[#eee6d8]')}>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <span className="text-2xl">{l.emoji ?? '📘'}</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[#453329]">{l.title} {!l.published && <span className="ml-1 rounded-full bg-[#d5cabe] px-2 py-0.5 text-[10px] uppercase text-[#453329]">hidden</span>}</p>
              <p className="text-xs text-[#8a6a55]">{l.stepCount} step{l.stepCount === 1 ? '' : 's'} · {l.started} started · {l.completed} finished · /studio/coding-lab/{l.slug}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Move up" disabled={i === 0 || reorder.isPending} onClick={() => reorder.mutate({ a: l, b: rows[i - 1] })}><ArrowUp className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Move down" disabled={i === rows.length - 1 || reorder.isPending} onClick={() => reorder.mutate({ a: l, b: rows[i + 1] })}><ArrowDown className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" className="h-8" title={l.published ? 'Hide from students' : 'Show to students'} disabled={toggle.isPending} onClick={() => toggle.mutate(l)}>
                {l.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" className="h-8 border-[#d5cabe]" disabled={open.isPending} onClick={() => open.mutate(l.id)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="Delete" onClick={() => setConfirmDelete(l)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="pt-2">
        <Button variant="outline" className="rounded-full border-[#d5cabe]" disabled={restore.isPending} onClick={() => restore.mutate()}>
          {restore.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Restore starter lessons
        </Button>
        <p className="mt-1 text-xs text-[#8a6a55]">Brings back any of the six built-in lessons you deleted. Lessons you edited are left alone.</p>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="bg-[#f5efe5]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{confirmDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>Student progress for this lesson is deleted too. Pages students built are kept.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={() => confirmDelete && remove.mutate(confirmDelete.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Lesson editor ──────────────────────────────────────────────────────────

const STEP_TEMPLATES: Record<CodingLabStep['type'], () => CodingLabStep> = {
  read: () => ({ type: 'read', title: 'New reading step', body: '' }),
  quiz: () => ({ type: 'quiz', title: 'Quick check', question: '', options: ['', ''], answer: 0, explanation: '' }),
  build: () => ({ type: 'build', title: 'Build a page', instructions: '', required: ['heading', 'paragraph'], minBlocks: 2 }),
  prompt: () => ({ type: 'prompt', title: 'Build a prompt', instructions: '', groups: [{ label: 'Task', chips: ['Write three tips'] }, { label: 'Topic', chips: ['about being a good friend'] }], allowAi: true }),
};
const STEP_NAMES: Record<CodingLabStep['type'], string> = { read: 'Reading', quiz: 'Quiz', build: 'Build a page', prompt: 'Prompt builder' };

function LessonEditor({ lesson, onClose }: { lesson: Lesson | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [emoji, setEmoji] = useState(lesson?.emoji ?? '');
  const [summary, setSummary] = useState(lesson?.summary ?? '');
  const [slug, setSlug] = useState(lesson?.slug ?? '');
  const [published, setPublished] = useState(lesson?.published ?? true);
  const [steps, setSteps] = useState<CodingLabStep[]>(lesson?.steps ?? [STEP_TEMPLATES.read()]);

  const save = useMutation({
    mutationFn: () => {
      const data: LessonInput = { title, emoji: emoji.trim() || null, summary, steps, published, ...(slug.trim() ? { slug: slug.trim() } : {}) };
      return lesson ? codingLabAdminApi.update(lesson.id, data) : codingLabAdminApi.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coding-lab-admin-lessons'] });
      qc.invalidateQueries({ queryKey: ['coding-lab'] });
      toast({ title: lesson ? 'Lesson saved' : 'Lesson created' });
      onClose();
    },
    onError: (err) => toast({ title: 'Could not save the lesson', description: err instanceof Error ? err.message : undefined, variant: 'destructive' }),
  });

  const setStep = (i: number, s: CodingLabStep) => setSteps(steps.map((x, j) => (j === i ? s : x)));
  const moveStep = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    setSteps(next);
  };
  const field = 'bg-white border-[#d5cabe]';

  return (
    <div className="space-y-5">
      <Card className="border-[#d5cabe] bg-white">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-[80px_1fr]">
          <div className="space-y-1.5">
            <Label>Emoji</Label>
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={2} className={cn(field, 'text-center text-2xl')} />
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. What is AI?" className={field} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Summary (shown on the lesson card)</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={500} rows={2} className={field} />
          </div>
          <div className="space-y-1.5">
            <Label>Web address</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto" className={cn(field, 'font-mono text-xs')} />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={published} onCheckedChange={setPublished} id="published" />
            <Label htmlFor="published">Visible to students</Label>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {steps.map((s, i) => (
          <Card key={i} className="border-[#d5cabe] bg-[#eee6d8]">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#453329] px-2.5 py-0.5 text-xs font-medium text-[#f5efe5]">Step {i + 1} · {STEP_NAMES[s.type]}</span>
                <span className="flex-1" />
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => moveStep(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === steps.length - 1} onClick={() => moveStep(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" disabled={steps.length <= 1} onClick={() => setSteps(steps.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="space-y-1.5">
                <Label>Step title</Label>
                <Input value={s.title} onChange={(e) => setStep(i, { ...s, title: e.target.value })} maxLength={120} className={field} />
              </div>
              <StepFields step={s} onChange={(next) => setStep(i, next)} />
            </CardContent>
          </Card>
        ))}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[#d5cabe] p-3">
          <span className="text-sm text-[#8a6a55]">Add a step:</span>
          {(Object.keys(STEP_TEMPLATES) as CodingLabStep['type'][]).map((t) => (
            <Button key={t} variant="outline" size="sm" className="border-[#d5cabe] bg-white" onClick={() => setSteps([...steps, STEP_TEMPLATES[t]()])}><Plus className="h-3.5 w-3.5" /> {STEP_NAMES[t]}</Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button className="rounded-full bg-[#c4622d] text-white hover:bg-[#a85226]" disabled={save.isPending || !title.trim()} onClick={() => save.mutate()}>
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} {lesson ? 'Save lesson' : 'Create lesson'}
        </Button>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        {lesson && <Link href={`/studio/coding-lab/${lesson.slug}`} className="text-sm text-[#c4622d] underline">Preview as a student</Link>}
      </div>
    </div>
  );
}

function StepFields({ step, onChange }: { step: CodingLabStep; onChange: (s: CodingLabStep) => void }) {
  const field = 'bg-white border-[#d5cabe]';
  switch (step.type) {
    case 'read':
      return (
        <div className="space-y-1.5">
          <Label>Text (Markdown: **bold**, `code`, - lists, &gt; quotes, ## headings)</Label>
          <Textarea value={step.body} onChange={(e) => onChange({ ...step, body: e.target.value })} rows={8} className={cn(field, 'font-mono text-sm')} />
        </div>
      );
    case 'quiz':
      return (
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Question</Label><Input value={step.question} onChange={(e) => onChange({ ...step, question: e.target.value })} className={field} /></div>
          <div className="space-y-1.5">
            <Label>Answers (pick the correct one)</Label>
            {step.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name={`answer-${step.title}`} checked={step.answer === i} onChange={() => onChange({ ...step, answer: i })} className="h-4 w-4 accent-[#c4622d]" />
                <Input value={o} onChange={(e) => onChange({ ...step, options: step.options.map((x, j) => (j === i ? e.target.value : x)) })} placeholder={`Answer ${String.fromCharCode(65 + i)}`} className={field} />
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={step.options.length <= 2} onClick={() => onChange({ ...step, options: step.options.filter((_, j) => j !== i), answer: Math.min(step.answer, step.options.length - 2) })}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="h-7 border-[#d5cabe] bg-white text-xs" disabled={step.options.length >= 6} onClick={() => onChange({ ...step, options: [...step.options, ''] })}><Plus className="h-3 w-3" /> Add answer</Button>
          </div>
          <div className="space-y-1.5"><Label>Explanation shown after the right answer</Label><Textarea value={step.explanation} onChange={(e) => onChange({ ...step, explanation: e.target.value })} rows={2} className={field} /></div>
        </div>
      );
    case 'build':
      return (
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Instructions (Markdown)</Label><Textarea value={step.instructions} onChange={(e) => onChange({ ...step, instructions: e.target.value })} rows={3} className={field} /></div>
          <div className="space-y-1.5">
            <Label>Blocks the page must include</Label>
            <div className="flex flex-wrap gap-2">
              {BLOCK_PALETTE.map((p) => {
                const on = step.required.includes(p.type);
                return (
                  <button key={p.type} type="button" onClick={() => onChange({ ...step, required: on ? step.required.filter((t) => t !== p.type) : [...step.required, p.type as CodingLabBlockType] })}
                    className={cn('rounded-full border px-3 py-1 text-sm', on ? 'border-[#c4622d] bg-[#c4622d] text-white' : 'border-[#d5cabe] bg-white text-[#453329]')}>
                    {p.emoji} {p.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="w-48 space-y-1.5"><Label>Minimum number of blocks</Label><Input type="number" min={0} max={50} value={step.minBlocks} onChange={(e) => onChange({ ...step, minBlocks: Number(e.target.value) || 0 })} className={field} /></div>
        </div>
      );
    case 'prompt':
      return (
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Instructions (Markdown)</Label><Textarea value={step.instructions} onChange={(e) => onChange({ ...step, instructions: e.target.value })} rows={3} className={field} /></div>
          <div className="space-y-2">
            <Label>Chip groups (students click one chip per group; one chip per line)</Label>
            {step.groups.map((g, gi) => (
              <div key={gi} className="grid gap-2 rounded-lg border border-[#d5cabe] bg-white p-3 sm:grid-cols-[160px_1fr_auto]">
                <Input value={g.label} onChange={(e) => onChange({ ...step, groups: step.groups.map((x, j) => (j === gi ? { ...x, label: e.target.value } : x)) })} placeholder="Group name, e.g. Task" className={field} />
                <Textarea value={g.chips.join('\n')} rows={3} onChange={(e) => onChange({ ...step, groups: step.groups.map((x, j) => (j === gi ? { ...x, chips: e.target.value.split('\n') } : x)) })} placeholder="One chip per line" className={field} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" disabled={step.groups.length <= 1} onClick={() => onChange({ ...step, groups: step.groups.filter((_, j) => j !== gi) })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="h-7 border-[#d5cabe] bg-white text-xs" disabled={step.groups.length >= 6} onClick={() => onChange({ ...step, groups: [...step.groups, { label: '', chips: [''] }] })}><Plus className="h-3 w-3" /> Add group</Button>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={step.allowAi} onCheckedChange={(v) => onChange({ ...step, allowAi: v })} id={`ai-${step.title}`} />
            <Label htmlFor={`ai-${step.title}`}>Let students send this prompt to the AI helper (when the helper is on)</Label>
          </div>
        </div>
      );
  }
}

// ── Progress ───────────────────────────────────────────────────────────────

function ProgressTab() {
  const report = useQuery({ queryKey: ['coding-lab-progress'], queryFn: codingLabAdminApi.progress, refetchInterval: 30_000 });
  if (report.isLoading) return <p className="text-sm text-[#688a52]">Loading…</p>;
  if (report.isError || !report.data) return <p className="text-sm text-red-700">Progress could not be loaded.</p>;
  const { lessons, students, builds, aiRuns } = report.data;
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 font-serif text-lg font-semibold text-[#453329]">Lessons</h3>
        {students.length === 0 ? <p className="text-sm text-[#688a52]">No student has started a lesson yet.</p> : (
          <div className="overflow-x-auto rounded-xl border border-[#d5cabe] bg-white">
            <table className="w-full text-sm">
              <thead className="bg-[#eee6d8] text-left text-xs uppercase tracking-wide text-[#8a6a55]">
                <tr><th className="px-3 py-2">Student</th>{lessons.map((l) => <th key={l.id} className="px-3 py-2 text-center" title={l.title}>{l.emoji ?? '📘'}</th>)}</tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.studentId} className="border-t border-[#eee6d8]">
                    <td className="px-3 py-2 font-medium text-[#453329]">{s.studentName ?? s.studentId}</td>
                    {lessons.map((l) => {
                      const p = s.lessons[l.id];
                      return (
                        <td key={l.id} className="px-3 py-2 text-center">
                          {!p ? <span className="text-[#d5cabe]">–</span> : p.completed ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">done</span> : <span className="text-xs text-[#8a6a55]">{p.completedSteps}/{l.stepCount}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-serif text-lg font-semibold text-[#453329]">Pages students built</h3>
        {builds.length === 0 ? <p className="text-sm text-[#688a52]">Nothing built yet.</p> : (
          <div className="space-y-2">
            {builds.map((b) => (
              <Card key={b.id} className="border-[#d5cabe] bg-white">
                <CardContent className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#453329]">{b.title} <span className="text-xs text-[#8a6a55]">· {b.studentName ?? b.studentId}</span></p>
                    <p className="text-xs text-[#8a6a55]">{b.blockCount} blocks · {lessonById.get(b.lessonId ?? -1)?.title ?? 'free build'} · {formatDistanceToNow(new Date(b.updatedAt), { addSuffix: true })}</p>
                  </div>
                  {b.projectId != null ? (
                    <Link href={`/studio/teacher/review/${b.projectId}`} className="text-xs font-medium text-[#c4622d] underline">Project: {b.projectStatus ?? 'open'} →</Link>
                  ) : <span className="text-xs text-[#8a6a55]">not sent yet</span>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-serif text-lg font-semibold text-[#453329]">AI helper conversations</h3>
        <p className="mb-2 text-xs text-[#8a6a55]">Every prompt a student sent and the answer they got. Prompts are built only from the chips you wrote.</p>
        {aiRuns.length === 0 ? <p className="text-sm text-[#688a52]">No AI runs yet.</p> : (
          <div className="space-y-2">
            {aiRuns.map((r) => (
              <Card key={r.id} className="border-[#d5cabe] bg-white">
                <CardContent className="p-3 text-sm">
                  <p className="text-xs text-[#8a6a55]">{r.studentName ?? r.studentId} · {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</p>
                  <p className="mt-1 font-medium text-[#453329]">“{r.prompt}”</p>
                  <p className="mt-1 whitespace-pre-wrap text-[#453329]/80">{r.response}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────────────────

function SettingsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const settings = useQuery({ queryKey: ['coding-lab-settings'], queryFn: codingLabAdminApi.settings });
  const [limit, setLimit] = useState<string>('');
  useEffect(() => { if (settings.data) setLimit(String(settings.data.aiDailyLimit)); }, [settings.data]);
  const update = useMutation({
    mutationFn: (data: { aiPlayground?: boolean; aiDailyLimit?: number }) => codingLabAdminApi.updateSettings(data),
    onSuccess: (data) => { qc.setQueryData(['coding-lab-settings'], data); qc.invalidateQueries({ queryKey: ['coding-lab'] }); toast({ title: 'Settings saved' }); },
    onError: (err) => toast({ title: 'Could not save', description: err instanceof Error ? err.message : undefined, variant: 'destructive' }),
  });
  if (!settings.data) return <p className="text-sm text-[#688a52]">Loading…</p>;
  const s = settings.data;
  return (
    <Card className="max-w-2xl border-[#d5cabe] bg-white">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start gap-4">
          <Switch checked={s.aiPlayground} disabled={!s.aiConfigured || update.isPending} onCheckedChange={(v) => update.mutate({ aiPlayground: v })} id="ai-on" />
          <div>
            <Label htmlFor="ai-on" className="text-base">AI helper for students</Label>
            <p className="mt-1 text-sm text-[#8a6a55]">
              In prompt-builder steps, students can send the prompt they built and read the AI's answer. Prompts are assembled only from the chips you wrote, the AI is told it is talking to a child at school, replies are short, and every exchange is listed under Student progress.
              {!s.aiConfigured && <span className="mt-1 block text-red-700">ANTHROPIC_API_KEY is not set on this site, so the helper cannot be turned on.</span>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40 space-y-1.5">
            <Label htmlFor="limit">Tries per student per day</Label>
            <Input id="limit" type="number" min={0} max={200} value={limit} onChange={(e) => setLimit(e.target.value)} className="bg-white border-[#d5cabe]" />
          </div>
          <Button variant="outline" className="border-[#d5cabe]" disabled={update.isPending || !Number.isInteger(Number(limit))} onClick={() => update.mutate({ aiDailyLimit: Number(limit) })}>Save limit</Button>
        </div>
        <p className="text-xs text-[#8a6a55]">Model: {s.model}. Each try is one short request, which costs a fraction of a cent.</p>
      </CardContent>
    </Card>
  );
}
