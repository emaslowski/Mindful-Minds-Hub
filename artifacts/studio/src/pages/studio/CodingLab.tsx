import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { useToast } from '@/hooks/use-toast';
import { codingLabApi } from '@/lib/codingLabApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, FileCode2, PlayCircle, Send, Trash2 } from 'lucide-react';

export default function CodingLab() {
  const { user, isLoading } = useRequireStudioRole('student', 'teacher');
  const qc = useQueryClient();
  const { toast } = useToast();
  const overview = useQuery({ queryKey: ['coding-lab'], queryFn: codingLabApi.overview, enabled: !!user });
  const deleteBuild = useMutation({
    mutationFn: (id: number) => codingLabApi.deleteBuild(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coding-lab'] }),
    onError: (err) => toast({ title: 'Could not delete the page', description: err instanceof Error ? err.message : undefined, variant: 'destructive' }),
  });

  if (isLoading || !user) return <div className="flex h-screen items-center justify-center text-[#453329]">Loading…</div>;

  const lessons = overview.data?.lessons ?? [];
  const builds = overview.data?.builds ?? [];
  const done = lessons.filter((l) => l.progress.completed).length;

  return (
    <StudioLayout>
      <StudioPage
        title="Coding Lab"
        subtitle={lessons.length ? `${done} of ${lessons.length} lessons complete` : 'Lessons about AI and how our website is built'}
        action={user.role === 'teacher' ? (
          <Link href="/studio/teacher/coding-lab"><Button variant="outline" className="rounded-full border-[#d5cabe]">Manage lessons</Button></Link>
        ) : undefined}
      >
        <div className="mb-6 rounded-xl border border-[#d5cabe] bg-[#eee6d8] p-4 text-sm text-[#453329]">
          <p className="font-medium">Welcome to the Coding Lab 🧪</p>
          <p className="mt-1 text-[#688a52]">
            Learn what AI is, how our website is put together, and how to build a page for it by clicking blocks into place.
            Pages you build can be sent to your teacher, just like any other project.
          </p>
        </div>

        {overview.isLoading ? (
          <p className="text-sm text-[#688a52]">Loading lessons…</p>
        ) : overview.isError ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe]"><CardContent className="p-4 text-sm">Lessons could not be loaded. <Button variant="outline" size="sm" onClick={() => overview.refetch()}>Retry</Button></CardContent></Card>
        ) : lessons.length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe]"><CardContent className="p-8 text-center text-sm text-[#688a52]">No lessons yet. Check back soon!</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {lessons.map((lesson, index) => {
              const doneSteps = lesson.progress.completedSteps.length;
              const pct = lesson.stepCount ? Math.round((doneSteps / lesson.stepCount) * 100) : 0;
              return (
                <Link key={lesson.id} href={`/studio/coding-lab/${lesson.slug}`}>
                  <Card className="h-full cursor-pointer border-[#d5cabe] bg-white transition hover:shadow-md">
                    <CardContent className="flex h-full flex-col p-5">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{lesson.emoji ?? '📘'}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6a55]">Lesson {index + 1}</p>
                          <h2 className="font-serif text-lg font-semibold leading-tight text-[#453329]">{lesson.title}</h2>
                        </div>
                        {lesson.progress.completed && <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />}
                      </div>
                      <p className="mt-2 flex-1 text-sm text-[#688a52]">{lesson.summary}</p>
                      <div className="mt-4">
                        <div className="h-2 overflow-hidden rounded-full bg-[#eee6d8]">
                          <div className="h-full rounded-full bg-[#688a52] transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-[#8a6a55]">
                          <span>{doneSteps} of {lesson.stepCount} steps</span>
                          <span className="inline-flex items-center gap-1 font-medium text-[#c4622d]">
                            <PlayCircle className="h-3.5 w-3.5" />
                            {lesson.progress.completed ? 'Review' : doneSteps > 0 ? 'Continue' : 'Start'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {builds.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-serif text-lg font-semibold text-[#453329]">Pages I built</h2>
            <div className="space-y-2">
              {builds.map((b) => {
                const lesson = lessons.find((l) => l.id === b.lessonId);
                return (
                  <Card key={b.id} className="border-[#d5cabe] bg-[#eee6d8]">
                    <CardContent className="flex flex-wrap items-center gap-3 p-4">
                      <FileCode2 className="h-5 w-5 text-[#c4622d]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#453329]">{b.title}</p>
                        <p className="text-xs text-[#8a6a55]">
                          {b.blocks.length} block{b.blocks.length === 1 ? '' : 's'}
                          {lesson ? ` · ${lesson.emoji ?? ''} ${lesson.title}` : ''}
                        </p>
                      </div>
                      {b.projectId != null ? (
                        <Link href={`/studio/projects/${b.projectId}`} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <Send className="h-3.5 w-3.5" /> Sent to teacher · open project
                        </Link>
                      ) : lesson && b.stepIndex != null ? (
                        <Link href={`/studio/coding-lab/${lesson.slug}?step=${b.stepIndex}`} className="text-xs font-medium text-[#c4622d]">Keep building →</Link>
                      ) : null}
                      {b.projectId == null && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" title="Delete this page" disabled={deleteBuild.isPending} onClick={() => { if (confirm('Delete this page? This cannot be undone.')) deleteBuild.mutate(b.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </StudioPage>
    </StudioLayout>
  );
}
