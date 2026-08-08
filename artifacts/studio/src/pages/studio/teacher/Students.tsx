import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { teacherStudents, teacherTeams, teacherJobs, teacherCycles, type CreateStudentData } from '@/lib/studioApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, UserX, UserCheck, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Students() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<number | null>(null);

  const { data: studentsData } = useQuery({ queryKey: ['teacher-students'], queryFn: teacherStudents.list, enabled: !!user });
  const { data: teamsData } = useQuery({ queryKey: ['teacher-teams'], queryFn: teacherTeams.list, enabled: !!user });
  const { data: jobsData } = useQuery({ queryKey: ['teacher-jobs'], queryFn: teacherJobs.list, enabled: !!user });
  const { data: cyclesData } = useQuery({ queryKey: ['teacher-cycles'], queryFn: teacherCycles.list, enabled: !!user });

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'disabled' }) =>
      teacherStudents.update(id, { accountStatus: status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-students'] }),
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  if (isLoading || !user) return null;

  const students = studentsData?.students ?? [];
  const teams = teamsData?.teams ?? [];
  const jobs = jobsData?.jobs ?? [];
  const cycles = cyclesData?.cycles ?? [];

  return (
    <StudioLayout>
      <StudioPage
        title="Students & Teams"
        subtitle={`${students.length} student${students.length !== 1 ? 's' : ''}`}
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full gap-2">
                <Plus className="h-4 w-4" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#eee6d8] border-[#d5cabe]">
              <DialogHeader>
                <DialogTitle className="font-serif text-[#453329]">Add Student Account</DialogTitle>
              </DialogHeader>
              <AddStudentForm teams={teams} jobs={jobs} cycles={cycles} onSuccess={() => {
                setAddOpen(false);
                queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
              }} />
            </DialogContent>
          </Dialog>
        }
      >
        {students.length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardContent className="p-10 text-center text-sm text-[#688a52]">
              No students yet. Add your first student to get started!
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#eee6d8] border-[#d5cabe] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#d5cabe] text-[#453329]">
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Username</th>
                    <th className="text-left px-4 py-3 font-medium">Team</th>
                    <th className="text-left px-4 py-3 font-medium">Job</th>
                    <th className="text-left px-4 py-3 font-medium">Cycle</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id} className={i % 2 === 0 ? 'bg-[#eee6d8]' : 'bg-[#f5efe5]'}>
                      <td className="px-4 py-3 font-medium text-[#453329]">{s.displayName}</td>
                      <td className="px-4 py-3 text-[#688a52] font-mono text-xs">{s.username}</td>
                      <td className="px-4 py-3 text-[#688a52]">{s.teamName ?? '—'}</td>
                      <td className="px-4 py-3 text-[#688a52]">{s.jobTitle ?? '—'}</td>
                      <td className="px-4 py-3 text-[#688a52]">{s.cycleName ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.accountStatus === 'active' ? 'default' : 'secondary'} className={s.accountStatus === 'active' ? 'bg-[#688a52] text-white' : ''}>
                          {s.accountStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 flex items-center gap-1">
                        <Dialog open={editStudent === s.id} onOpenChange={(o) => setEditStudent(o ? s.id : null)}>
                          <DialogTrigger asChild>
                            <button className="p-1.5 text-[#688a52] hover:bg-[#d5cabe] rounded transition-colors">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="bg-[#eee6d8] border-[#d5cabe]">
                            <DialogHeader>
                              <DialogTitle className="font-serif text-[#453329]">Edit: {s.displayName}</DialogTitle>
                            </DialogHeader>
                            <EditStudentForm
                              student={s}
                              teams={teams}
                              jobs={jobs}
                              cycles={cycles}
                              onSuccess={() => {
                                setEditStudent(null);
                                queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                        <button
                          className={`p-1.5 rounded transition-colors ${s.accountStatus === 'active' ? 'text-red-400 hover:bg-red-50' : 'text-[#688a52] hover:bg-[#d5cabe]'}`}
                          onClick={() => toggleStatus({ id: s.id, status: s.accountStatus === 'active' ? 'disabled' : 'active' })}
                        >
                          {s.accountStatus === 'active' ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </StudioPage>
    </StudioLayout>
  );
}

function AddStudentForm({ teams, jobs, cycles, onSuccess }: {
  teams: any[]; jobs: any[]; cycles: any[]; onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<CreateStudentData>({ username: '', password: '', displayName: '', teamId: undefined, jobId: undefined, cycleId: undefined, className: '' });

  const { mutate: create, isPending } = useMutation({
    mutationFn: () => teacherStudents.create(form),
    onSuccess,
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2"><Label className="text-xs text-[#453329]">Display name *</Label><Input value={form.displayName} onChange={(e) => setForm(f => ({ ...f, displayName: e.target.value }))} className="bg-white border-[#d5cabe] text-sm" placeholder="Alex Smith" /></div>
        <div className="space-y-1"><Label className="text-xs text-[#453329]">Username *</Label><Input value={form.username} onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))} className="bg-white border-[#d5cabe] text-sm font-mono" placeholder="alexsmith" /></div>
        <div className="space-y-1"><Label className="text-xs text-[#453329]">Password *</Label><Input type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className="bg-white border-[#d5cabe] text-sm" placeholder="6+ characters" /></div>
        <div className="space-y-1"><Label className="text-xs text-[#453329]">Team</Label>
          <Select value={form.teamId?.toString() ?? ''} onValueChange={(v) => setForm(f => ({ ...f, teamId: v ? Number(v) : undefined }))}>
            <SelectTrigger className="bg-white border-[#d5cabe] text-sm"><SelectValue placeholder="No team" /></SelectTrigger>
            <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs text-[#453329]">Job</Label>
          <Select value={form.jobId?.toString() ?? ''} onValueChange={(v) => setForm(f => ({ ...f, jobId: v ? Number(v) : undefined }))}>
            <SelectTrigger className="bg-white border-[#d5cabe] text-sm"><SelectValue placeholder="No job" /></SelectTrigger>
            <SelectContent>{jobs.map(j => <SelectItem key={j.id} value={j.id.toString()}>{j.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1 col-span-2"><Label className="text-xs text-[#453329]">Cycle</Label>
          <Select value={form.cycleId?.toString() ?? ''} onValueChange={(v) => setForm(f => ({ ...f, cycleId: v ? Number(v) : undefined }))}>
            <SelectTrigger className="bg-white border-[#d5cabe] text-sm"><SelectValue placeholder="No cycle" /></SelectTrigger>
            <SelectContent>{cycles.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <Button className="w-full bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full" onClick={() => create()} disabled={isPending || !form.username || !form.password || !form.displayName}>
        {isPending ? 'Adding…' : 'Add Student'}
      </Button>
    </div>
  );
}

function EditStudentForm({ student, teams, jobs, cycles, onSuccess }: { student: any; teams: any[]; jobs: any[]; cycles: any[]; onSuccess: () => void }) {
  const { toast } = useToast();
  const [teamId, setTeamId] = useState(student.teamId?.toString() ?? '');
  const [jobId, setJobId] = useState(student.jobId?.toString() ?? '');
  const [cycleId, setCycleId] = useState(student.cycleId?.toString() ?? '');
  const [newPassword, setNewPassword] = useState('');

  const { mutate: update, isPending } = useMutation({
    mutationFn: () => teacherStudents.update(student.id, {
      teamId: teamId ? Number(teamId) : null,
      jobId: jobId ? Number(jobId) : null,
      cycleId: cycleId ? Number(cycleId) : null,
      ...(newPassword ? { newPassword } : {}),
    }),
    onSuccess,
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs text-[#453329]">Team</Label>
          <Select value={teamId} onValueChange={setTeamId}>
            <SelectTrigger className="bg-white border-[#d5cabe] text-sm"><SelectValue placeholder="No team" /></SelectTrigger>
            <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs text-[#453329]">Job</Label>
          <Select value={jobId} onValueChange={setJobId}>
            <SelectTrigger className="bg-white border-[#d5cabe] text-sm"><SelectValue placeholder="No job" /></SelectTrigger>
            <SelectContent>{jobs.map(j => <SelectItem key={j.id} value={j.id.toString()}>{j.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1 col-span-2"><Label className="text-xs text-[#453329]">Cycle</Label>
          <Select value={cycleId} onValueChange={setCycleId}>
            <SelectTrigger className="bg-white border-[#d5cabe] text-sm"><SelectValue placeholder="No cycle" /></SelectTrigger>
            <SelectContent>{cycles.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1 col-span-2"><Label className="text-xs text-[#453329]">Reset password (leave blank to keep current)</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-white border-[#d5cabe] text-sm" placeholder="New password…" /></div>
      </div>
      <Button className="w-full bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full" onClick={() => update()} disabled={isPending}>
        {isPending ? 'Saving…' : 'Save Changes'}
      </Button>
    </div>
  );
}
