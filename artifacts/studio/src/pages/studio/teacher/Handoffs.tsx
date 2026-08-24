import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { teacherHandoffs, teacherJobs, teacherCycles } from '@/lib/studioApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Handoffs() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ['teacher-handoffs'], queryFn: teacherHandoffs.list, enabled: !!user });
  const { data: jobsData } = useQuery({ queryKey: ['teacher-jobs'], queryFn: teacherJobs.list, enabled: !!user });
  const { data: cyclesData } = useQuery({ queryKey: ['teacher-cycles'], queryFn: teacherCycles.list, enabled: !!user });

  const { mutate: update } = useMutation({
    mutationFn: ({ id, ...data }: { id: number; isVisible?: boolean; teacherNotes?: string }) =>
      teacherHandoffs.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-handoffs'] }),
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const { mutate: assign } = useMutation({
    mutationFn: ({ id, jobId, cycleId }: { id: number; jobId: number; cycleId?: number }) =>
      teacherHandoffs.assign(id, jobId, cycleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-handoffs'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-all-projects'] });
      toast({ title: 'Project assigned', description: 'The handoff project has been assigned to the job group.' });
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  if (isLoading || !user) return null;

  const handoffs = data?.handoffs ?? [];
  const jobs = jobsData?.jobs ?? [];
  const cycles = cyclesData?.cycles ?? [];

  return (
    <StudioLayout>
      <StudioPage
        title="Handoff Projects"
        subtitle="Projects from previous classes waiting to be continued"
      >
        {handoffs.length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardContent className="p-10 text-center text-sm text-[#688a52]">
              No handoffs yet. Students can create handoff records from their dashboard.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {handoffs.map((h) => (
              <HandoffCard
                key={h.id}
                handoff={h}
                jobs={jobs}
                cycles={cycles}
                onToggleVisible={(v) => update({ id: h.id, isVisible: v })}
                onSaveNotes={(notes) => update({ id: h.id, teacherNotes: notes })}
                onAssign={(jobId, cycleId) => assign({ id: h.id, jobId, cycleId })}
              />
            ))}
          </div>
        )}
      </StudioPage>
    </StudioLayout>
  );
}

function HandoffCard({ handoff, jobs, cycles, onToggleVisible, onSaveNotes, onAssign }: {
  handoff: any; jobs: any[]; cycles: any[];
  onToggleVisible: (v: boolean) => void;
  onSaveNotes: (n: string) => void;
  onAssign: (jobId: number, cycleId?: number) => void;
}) {
  const [teacherNotes, setTeacherNotes] = useState(handoff.teacherNotes);
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  const availableCycles = cycles.filter((c) => c.name === 'Even' || c.name === 'Odd');

  return (
    <Card className="bg-[#eee6d8] border-[#d5cabe]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="font-serif text-[#453329] text-base">{handoff.projectTitle}</CardTitle>
            <p className="text-xs text-[#688a52] mt-0.5">{handoff.contentType} · From: {handoff.previousCycleName ?? 'Unknown cycle'}</p>
          </div>
          <div className="flex items-center gap-2">
            {handoff.isVisible
              ? <Badge className="bg-[#688a52] text-white text-xs flex items-center gap-1"><Eye className="h-3 w-3" /> Visible to students</Badge>
              : <Badge variant="outline" className="text-xs flex items-center gap-1"><EyeOff className="h-3 w-3" /> Hidden</Badge>
            }
            <Switch checked={handoff.isVisible} onCheckedChange={onToggleVisible} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white rounded-lg p-3 border border-[#d5cabe]">
            <p className="text-xs font-medium text-[#453329] mb-1">✅ Completed</p>
            <p className="text-xs text-[#688a52]">{handoff.completedWork || 'Not specified'}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-[#d5cabe]">
            <p className="text-xs font-medium text-[#453329] mb-1">📋 Still needed</p>
            <p className="text-xs text-[#688a52]">{handoff.remainingWork || 'Not specified'}</p>
          </div>
          {handoff.ideas && (
            <div className="bg-white rounded-lg p-3 border border-[#d5cabe] col-span-2">
              <p className="text-xs font-medium text-[#453329] mb-1">💡 Ideas for next team</p>
              <p className="text-xs text-[#688a52]">{handoff.ideas}</p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-[#453329]">Teacher notes (private)</Label>
          <Textarea
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            className="bg-white border-[#d5cabe] text-sm min-h-16"
            placeholder="Add guidance for the next class…"
          />
          <Button size="sm" variant="outline" className="border-[#d5cabe] text-[#453329] rounded-full text-xs" onClick={() => onSaveNotes(teacherNotes)}>
            Save Notes
          </Button>
        </div>

        <div className="border-t border-[#d5cabe] pt-3">
          <p className="text-xs font-medium text-[#453329] mb-2">Assign to a job group</p>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger className="bg-white border-[#d5cabe] text-sm"><SelectValue placeholder="Select job…" /></SelectTrigger>
                <SelectContent>{jobs.map(j => <SelectItem key={j.id} value={j.id.toString()}>{j.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger className="bg-white border-[#d5cabe] text-sm"><SelectValue placeholder="Select cycle…" /></SelectTrigger>
                <SelectContent>{availableCycles.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              className="bg-[#688a52] hover:bg-[#557a43] text-white rounded-full gap-1"
              onClick={() => selectedJob && onAssign(Number(selectedJob), selectedCycle ? Number(selectedCycle) : undefined)}
              disabled={!selectedJob}
            >
              <Briefcase className="h-3.5 w-3.5" /> Assign
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
