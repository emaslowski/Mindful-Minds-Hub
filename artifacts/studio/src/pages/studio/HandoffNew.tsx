import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { studioProjects, studioPortfolio } from '@/lib/studioApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function HandoffNew() {
  const { user, isLoading } = useRequireStudioRole('student');
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: projectsData } = useQuery({
    queryKey: ['studio-projects', user?.id, user?.jobId ?? null],
    queryFn: () => studioProjects.list(),
    enabled: !!user,
  });

  const [projectId, setProjectId] = useState('');
  const [completedWork, setCompletedWork] = useState('');
  const [remainingWork, setRemainingWork] = useState('');
  const [ideas, setIdeas] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { mutate: createHandoff, isPending } = useMutation({
    mutationFn: () =>
      studioPortfolio.createHandoff({
        projectId: Number(projectId),
        completedWork,
        remainingWork,
        ideas,
        notes,
      }),
    onSuccess: () => setSubmitted(true),
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  if (isLoading || !user) return null;

  const projects = (projectsData?.projects ?? []).filter((p) =>
    !['Published', 'Archived'].includes(p.status),
  );

  if (submitted) {
    return (
      <StudioLayout>
        <StudioPage title="Handoff Created">
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardContent className="p-10 text-center">
              <CheckCircle className="h-12 w-12 text-[#688a52] mx-auto mb-4" />
              <h2 className="font-serif text-xl text-[#453329] mb-2">Handoff record created!</h2>
              <p className="text-sm text-[#688a52] mb-6">
                Your teacher will review it and make it available to the next class when ready.
              </p>
              <Button
                className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full"
                onClick={() => navigate('/studio')}
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </StudioPage>
      </StudioLayout>
    );
  }

  return (
    <StudioLayout>
      <StudioPage
        title="Create Handoff"
        subtitle="Leave notes for the next class who will continue your work"
      >
        <div className="max-w-2xl space-y-5">
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[#453329]">Which project are you handing off? *</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="bg-white border-[#d5cabe]">
                    <SelectValue placeholder="Select a project…" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.title} — {p.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#453329]">What we completed</Label>
                <Textarea
                  value={completedWork}
                  onChange={(e) => setCompletedWork(e.target.value)}
                  className="bg-white border-[#d5cabe] min-h-24 text-sm"
                  placeholder="What did your team accomplish on this project?"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#453329]">What still needs to be done</Label>
                <Textarea
                  value={remainingWork}
                  onChange={(e) => setRemainingWork(e.target.value)}
                  className="bg-white border-[#d5cabe] min-h-24 text-sm"
                  placeholder="What does the next team need to finish or continue?"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#453329]">Ideas for the next team</Label>
                <Textarea
                  value={ideas}
                  onChange={(e) => setIdeas(e.target.value)}
                  className="bg-white border-[#d5cabe] min-h-20 text-sm"
                  placeholder="Any ideas, suggestions, or directions for the next group?"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#453329]">Important notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-white border-[#d5cabe] min-h-20 text-sm"
                  placeholder="Anything else the next team should know?"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            className="bg-[#688a52] hover:bg-[#557a43] text-white rounded-full px-8"
            onClick={() => createHandoff()}
            disabled={isPending || !projectId}
          >
            {isPending ? 'Submitting…' : 'Submit Handoff'}
          </Button>
        </div>
      </StudioPage>
    </StudioLayout>
  );
}
