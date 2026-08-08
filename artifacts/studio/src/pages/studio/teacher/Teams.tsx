import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { teacherTeams } from '@/lib/studioApi';
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
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  description?: string | null;
}

export default function Teams() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const qc = useQueryClient();
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data } = useQuery({
    queryKey: ['teacher-teams'],
    queryFn: () => teacherTeams.list(),
    enabled: !!user,
  });

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: () => teacherTeams.create({ name: name.trim(), description: description.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-teams'] });
      toast({ title: 'Team created' });
      setShowCreate(false);
      setName('');
      setDescription('');
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: () =>
      teacherTeams.update(editTeam!.id, { name: name.trim(), description: description.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-teams'] });
      toast({ title: 'Team updated' });
      setEditTeam(null);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: number) => teacherTeams.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-teams'] });
      toast({ title: 'Team deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  function openCreate() {
    setName('');
    setDescription('');
    setShowCreate(true);
  }

  function openEdit(team: Team) {
    setName(team.name);
    setDescription(team.description ?? '');
    setEditTeam(team);
  }

  if (isLoading || !user) return null;

  const teams: Team[] = data?.teams ?? [];

  return (
    <StudioLayout>
      <StudioPage
        title="Teams"
        subtitle={`${teams.length} team${teams.length !== 1 ? 's' : ''}`}
        action={
          <Button
            className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full gap-2"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" /> New Team
          </Button>
        }
      >
        {teams.length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardContent className="p-10 text-center text-sm text-[#688a52]">
              No teams yet. Create your first team!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card key={team.id} className="bg-[#eee6d8] border-[#d5cabe]">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Users className="h-5 w-5 text-[#c4622d] flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-[#453329] text-sm truncate">{team.name}</p>
                      {team.description && (
                        <p className="text-xs text-[#688a52] mt-0.5 line-clamp-2">{team.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-[#688a52] hover:text-[#453329]"
                      onClick={() => openEdit(team)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-400 hover:text-red-600"
                      onClick={() => {
                        if (confirm(`Delete team "${team.name}"? Students assigned to it will be unaffected.`)) {
                          remove(team.id);
                        }
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
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#f5efe5] border-[#d5cabe]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#453329]">New Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#453329]">Team name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white border-[#d5cabe]"
                placeholder="e.g. Wildcats"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#453329]">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white border-[#d5cabe] resize-none"
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <Button
              className="w-full bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full"
              onClick={() => create()}
              disabled={creating || !name.trim()}
            >
              {creating ? 'Creating…' : 'Create Team'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTeam} onOpenChange={(o) => !o && setEditTeam(null)}>
        <DialogContent className="bg-[#f5efe5] border-[#d5cabe]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#453329]">Edit Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#453329]">Team name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white border-[#d5cabe]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#453329]">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white border-[#d5cabe] resize-none"
                rows={2}
              />
            </div>
            <Button
              className="w-full bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full"
              onClick={() => update()}
              disabled={updating || !name.trim()}
            >
              {updating ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </StudioLayout>
  );
}
