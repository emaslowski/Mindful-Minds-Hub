import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { teacherCycles } from '@/lib/studioApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Cycles() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(false);

  const { data } = useQuery({ queryKey: ['teacher-cycles'], queryFn: teacherCycles.list, enabled: !!user });

  const { mutate: create, isPending } = useMutation({
    mutationFn: () => teacherCycles.create({ name, startDate: startDate || undefined, endDate: endDate || undefined, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-cycles'] });
      setAddOpen(false);
      setName(''); setStartDate(''); setEndDate(''); setIsActive(false);
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      teacherCycles.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-cycles'] }),
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  if (isLoading || !user) return null;
  const cycles = data?.cycles ?? [];

  return (
    <StudioLayout>
      <StudioPage
        title="Class Cycles"
        subtitle="Manage 10-week class groups"
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full gap-2">
                <Plus className="h-4 w-4" /> New Cycle
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#eee6d8] border-[#d5cabe]">
              <DialogHeader>
                <DialogTitle className="font-serif text-[#453329]">Create Class Cycle</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label className="text-xs text-[#453329]">Cycle name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white border-[#d5cabe]" placeholder="e.g. Fall Group 1" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-xs text-[#453329]">Start date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white border-[#d5cabe]" /></div>
                  <div className="space-y-1.5"><Label className="text-xs text-[#453329]">End date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white border-[#d5cabe]" /></div>
                </div>
                <div className="flex items-center gap-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label className="text-sm text-[#453329]">Set as active cycle</Label></div>
                <Button className="w-full bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full" onClick={() => create()} disabled={isPending || !name}>{isPending ? 'Creating…' : 'Create Cycle'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      >
        {cycles.length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe]"><CardContent className="p-10 text-center text-sm text-[#688a52]">No cycles yet. Create your first class cycle!</CardContent></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {cycles.map((c) => (
              <Card key={c.id} className="bg-[#eee6d8] border-[#d5cabe]">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-5 w-5 text-[#c4622d] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#453329] text-sm">{c.name}</p>
                        {c.isActive && <Badge className="bg-[#688a52] text-white text-xs">Active</Badge>}
                      </div>
                      {(c.startDate || c.endDate) && (
                        <p className="text-xs text-[#688a52] mt-0.5">
                          {c.startDate} {c.startDate && c.endDate && '→'} {c.endDate}
                        </p>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={c.isActive}
                    onCheckedChange={(v) => toggleActive({ id: c.id, isActive: v })}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </StudioPage>
    </StudioLayout>
  );
}
