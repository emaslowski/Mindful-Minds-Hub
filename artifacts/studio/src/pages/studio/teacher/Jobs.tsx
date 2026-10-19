import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { teacherJobs, type Job } from '@/lib/studioApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Plus, Pencil, Trash2, KeyRound, CheckCircle2 } from 'lucide-react';

function JobForm({
  title, setTitle,
  description, setDescription,
  username, setUsername,
  password, setPassword,
  confirmPassword, setConfirmPassword,
  isEdit,
  hasPassword,
}: {
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  username: string; setUsername: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
  isEdit: boolean;
  hasPassword?: boolean;
}) {
  const passwordMismatch = password && confirmPassword && password !== confirmPassword;
  const passwordAlreadySet = isEdit && hasPassword && !password;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-[#453329]">Job title *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-white border-[#d5cabe]"
          placeholder="e.g. Video Producers"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-[#453329]">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-white border-[#d5cabe] resize-none"
          placeholder="What does this role do?"
          rows={2}
        />
      </div>

      <div className="border-t border-[#d5cabe] pt-3 space-y-3">
        <p className="text-xs font-medium text-[#453329] flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5 text-[#c4622d]" />
          Student Login Credentials
        </p>

        <div className="space-y-1.5">
          <Label className="text-xs text-[#453329]">Username</Label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
            className="bg-white border-[#d5cabe] font-mono"
            placeholder="e.g. videoproducers"
            autoComplete="off"
          />
          <p className="text-xs text-[#8a6a55]">Students type this to log in. Lowercase, no spaces.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-[#453329]">
            {isEdit ? 'Password' : 'Password'}
          </Label>

          {/* Show a "password is set" banner when editing a job that already has one */}
          {passwordAlreadySet && (
            <div className="flex items-center gap-2 bg-[#eee6d8] border border-[#d5cabe] rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-[#688a52] flex-shrink-0" />
              <span className="text-xs text-[#453329]">Password is set — type a new one below to change it, or leave blank to keep it.</span>
            </div>
          )}

          <Input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white border-[#d5cabe] font-mono"
            placeholder={isEdit ? (hasPassword ? 'Type new password to change' : 'Set a password') : 'Choose a strong password'}
            autoComplete="new-password"
          />
        </div>

        {password && (
          <div className="space-y-1.5">
            <Label className="text-xs text-[#453329]">Confirm password</Label>
            <Input
              type="text"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`bg-white border-[#d5cabe] font-mono ${passwordMismatch ? 'border-red-400' : ''}`}
              placeholder="Repeat the password"
              autoComplete="new-password"
            />
            {passwordMismatch && (
              <p className="text-xs text-red-500">Passwords don't match</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Jobs() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const qc = useQueryClient();
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data } = useQuery({
    queryKey: ['teacher-jobs'],
    queryFn: () => teacherJobs.list(),
    enabled: !!user,
  });

  function resetForm() {
    setTitle(''); setDescription(''); setUsername(''); setPassword(''); setConfirmPassword('');
  }

  const passwordMismatch = password && confirmPassword && password !== confirmPassword;

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: () => teacherJobs.create({
      title: title.trim(),
      description: description.trim() || undefined,
      username: username.trim() || undefined,
      password: password.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-jobs'] });
      toast({ title: 'Job created' });
      setShowCreate(false);
      resetForm();
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: () => teacherJobs.update(editJob!.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      username: username.trim() || undefined,
      password: password.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-jobs'] });
      toast({ title: 'Job updated' });
      setEditJob(null);
      resetForm();
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: number) => teacherJobs.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-jobs'] });
      toast({ title: 'Job deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  function openCreate() {
    resetForm();
    setShowCreate(true);
  }

  function openEdit(job: Job) {
    setTitle(job.title);
    setDescription(job.description ?? '');
    setUsername(job.username ?? '');
    setPassword('');
    setConfirmPassword('');
    setEditJob(job);
  }

  if (isLoading || !user) return null;

  const jobs: Job[] = data?.jobs ?? [];
  const formProps = { title, setTitle, description, setDescription, username, setUsername, password, setPassword, confirmPassword, setConfirmPassword };
  const editHasPassword = editJob?.hasPassword ?? false;

  return (
    <StudioLayout>
      <StudioPage
        title="Jobs"
        subtitle={`${jobs.length} job${jobs.length !== 1 ? 's' : ''}`}
        action={
          <Button
            className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full gap-2"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" /> New Job
          </Button>
        }
      >
        {jobs.length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardContent className="p-10 text-center text-sm text-[#688a52]">
              No jobs yet. Create roles and set login credentials for each group.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Card key={job.id} className="bg-[#eee6d8] border-[#d5cabe]">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Briefcase className="h-5 w-5 text-[#688a52] flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-[#453329] text-sm">{job.title}</p>
                      {job.description && (
                        <p className="text-xs text-[#688a52] mt-0.5 line-clamp-2">{job.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        {job.username ? (
                          <span className="text-xs font-mono bg-[#d5cabe] text-[#453329] px-1.5 py-0.5 rounded">
                            {job.username}
                          </span>
                        ) : (
                          <span className="text-xs text-red-400 italic">No login set</span>
                        )}
                        {job.hasPassword && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#688a52]" aria-label="Password set" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-[#688a52] hover:text-[#453329]"
                      onClick={() => openEdit(job)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-400 hover:text-red-600"
                      onClick={() => {
                        if (confirm(`Delete job "${job.title}"?`)) remove(job.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </StudioPage>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) { setShowCreate(false); resetForm(); } }}>
        <DialogContent className="bg-[#f5efe5] border-[#d5cabe]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#453329]">New Job</DialogTitle>
          </DialogHeader>
          <JobForm {...formProps} isEdit={false} hasPassword={false} />
          <Button
            className="w-full bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full"
            onClick={() => create()}
            disabled={creating || !title.trim() || !!passwordMismatch}
          >
            {creating ? 'Creating…' : 'Create Job'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editJob} onOpenChange={(o) => { if (!o) { setEditJob(null); resetForm(); } }}>
        <DialogContent className="bg-[#f5efe5] border-[#d5cabe]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#453329]">Edit Job</DialogTitle>
          </DialogHeader>
          <JobForm {...formProps} isEdit={true} hasPassword={editHasPassword} />
          <Button
            className="w-full bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full"
            onClick={() => update()}
            disabled={updating || !title.trim() || !!passwordMismatch}
          >
            {updating ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogContent>
      </Dialog>
    </StudioLayout>
  );
}
