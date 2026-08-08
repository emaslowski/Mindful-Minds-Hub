import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { studioProjects, studioShared, CONTENT_TYPES } from '@/lib/studioApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FolderOpen, ClipboardCheck, RefreshCw, Send, CheckCircle, BookOpen } from 'lucide-react';
import { useState } from 'react';

const STATUS_GROUPS = {
  'My Assignments': ['Assigned', 'Researching', 'Drafting'],
  'Peer Reviews': ['Peer Review'],
  'Revision Needed': ['Revision Needed'],
  'Submitted for Teacher Review': ['Ready for Teacher Review', 'Teacher Reviewing'],
  'Completed Projects': ['Approved', 'Published'],
};

export default function StudentDashboard() {
  const { user, isLoading } = useRequireStudioRole('student');
  const [createOpen, setCreateOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['studio-projects'],
    queryFn: () => studioProjects.list(),
    enabled: !!user,
  });

  const { data: cyclesData } = useQuery({
    queryKey: ['studio-cycles'],
    queryFn: () => studioShared.cycles(),
    enabled: !!user,
  });

  if (isLoading || !user) return <div className="flex items-center justify-center h-screen text-[#453329]">Loading…</div>;

  const projects = data?.projects ?? [];

  const countFor = (statuses: string[]) => projects.filter((p) => statuses.includes(p.status)).length;

  return (
    <StudioLayout>
      <StudioPage
        title={`Welcome, ${user.displayName}`}
        subtitle={[user.jobTitle, user.teamName, user.cycleName].filter(Boolean).join(' · ')}
        action={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full gap-2">
                <Plus className="h-4 w-4" /> Create Content
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#eee6d8] border-[#d5cabe]">
              <DialogHeader>
                <DialogTitle className="font-serif text-[#453329]">New Project</DialogTitle>
              </DialogHeader>
              <CreateProjectForm
                cycleId={user.cycleId ?? undefined}
                teamId={user.teamId ?? undefined}
                onSuccess={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
      >
        {/* Status summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {Object.entries(STATUS_GROUPS).map(([label, statuses]) => {
            const count = countFor(statuses);
            const icons: Record<string, React.ReactNode> = {
              'My Assignments': <FolderOpen className="h-5 w-5 text-[#c4622d]" />,
              'Peer Reviews': <ClipboardCheck className="h-5 w-5 text-orange-500" />,
              'Revision Needed': <RefreshCw className="h-5 w-5 text-red-500" />,
              'Submitted for Teacher Review': <Send className="h-5 w-5 text-teal-500" />,
              'Completed Projects': <CheckCircle className="h-5 w-5 text-emerald-500" />,
            };
            return (
              <Link key={label} href={`/studio/projects?status=${encodeURIComponent(statuses[0])}`}>
                <Card className="bg-[#eee6d8] border-[#d5cabe] hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    {icons[label]}
                    <div>
                      <p className="text-2xl font-bold text-[#453329]">{count}</p>
                      <p className="text-xs text-[#688a52] font-medium">{label}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {/* Work from previous class */}
          <Link href="/studio/handoffs/incoming">
            <Card className="bg-[#eee6d8] border-[#d5cabe] hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-[#688a52]" />
                <div>
                  <p className="text-xs text-[#688a52] font-medium">Work From Previous Class</p>
                  <p className="text-xs text-[#453329] mt-0.5">View handoffs →</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent projects */}
        <div>
          <h2 className="font-serif text-lg font-semibold text-[#453329] mb-3">Continue Working</h2>
          {projects.filter((p) => ['Assigned', 'Researching', 'Drafting', 'Revision Needed'].includes(p.status)).length === 0 ? (
            <Card className="bg-[#eee6d8] border-[#d5cabe]">
              <CardContent className="p-8 text-center">
                <p className="text-[#688a52]">No active projects yet. Create your first one above!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {projects
                .filter((p) => ['Assigned', 'Researching', 'Drafting', 'Revision Needed'].includes(p.status))
                .slice(0, 5)
                .map((project) => (
                  <Link key={project.id} href={`/studio/projects/${project.id}`}>
                    <Card className="bg-[#eee6d8] border-[#d5cabe] hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[#453329] text-sm">{project.title}</p>
                          <p className="text-xs text-[#688a52] mt-0.5">{project.contentType}</p>
                        </div>
                        <StatusBadge status={project.status} />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
          )}
        </div>

        {/* Safety reminder */}
        <div className="mt-8 bg-[#eee6d8] border border-[#d5cabe] rounded-xl p-4 text-sm text-[#453329]">
          <p className="font-medium mb-1">📋 Reminder</p>
          <p className="text-[#688a52] leading-relaxed">
            Do not include private information about yourself or another student. Mind Matters provides
            general educational wellness information and does not replace help from a trusted adult or professional.
          </p>
        </div>
      </StudioPage>
    </StudioLayout>
  );
}

function CreateProjectForm({
  cycleId,
  teamId,
  onSuccess,
}: {
  cycleId?: number;
  teamId?: number;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('');
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { mutate: create, isPending } = useMutation({
    mutationFn: () =>
      studioProjects.create({ title: title.trim(), contentType, cycleId, teamId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['studio-projects'] });
      onSuccess();
      navigate(`/studio/projects/${data.project.id}`);
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-[#453329]">Project title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 5 Ways to Manage Test Stress"
          className="bg-white border-[#d5cabe]"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[#453329]">Content type</Label>
        <Select value={contentType} onValueChange={setContentType}>
          <SelectTrigger className="bg-white border-[#d5cabe]">
            <SelectValue placeholder="Choose a type…" />
          </SelectTrigger>
          <SelectContent>
            {CONTENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        className="w-full bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full"
        onClick={() => create()}
        disabled={isPending || !title.trim() || !contentType}
      >
        {isPending ? 'Creating…' : 'Create Project'}
      </Button>
    </div>
  );
}
