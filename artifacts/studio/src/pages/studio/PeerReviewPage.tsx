import { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { studioProjects, studioPeerReviews, type PeerReviewSubmission } from '@/lib/studioApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle } from 'lucide-react';

const CHECKLIST = [
  { key: 'checklistInfoClear', label: 'The information is clear and easy to understand' },
  { key: 'checklistAgeAppropriate', label: 'The content is appropriate for students our age' },
  { key: 'checklistSourcesIncluded', label: 'At least one source is included' },
  { key: 'checklistFactsAccurate', label: 'The facts appear accurate and trustworthy' },
  { key: 'checklistLanguageRespectful', label: 'The language is respectful and kind' },
  { key: 'checklistNoPrivateInfo', label: 'No private information about any student is included' },
  { key: 'checklistGrammarChecked', label: 'Grammar and spelling appear to have been checked' },
  { key: 'checklistFitsMission', label: 'The content fits the Mind Matters mission' },
] as const;

type ChecklistKey = typeof CHECKLIST[number]['key'];

export default function PeerReviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId);
  const { user, isLoading } = useRequireStudioRole('student');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projectData } = useQuery({
    queryKey: ['studio-project', pid],
    queryFn: () => studioProjects.get(pid),
    enabled: !!user,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['peer-review', pid],
    queryFn: () => studioPeerReviews.getForProject(pid),
    enabled: !!user,
  });

  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean | undefined>>(
    Object.fromEntries(CHECKLIST.map((c) => [c.key, undefined])) as Record<ChecklistKey, boolean | undefined>,
  );
  const [comments, setComments] = useState('');
  const [recommendRevision, setRecommendRevision] = useState(false);

  const alreadyReviewed = (reviewsData?.reviews ?? []).length > 0;
  const project = projectData?.project;

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () =>
      studioPeerReviews.submit(pid, {
        ...checklist,
        comments,
        recommendRevision,
      } as PeerReviewSubmission),
    onSuccess: () => {
      toast({ title: 'Review submitted!', description: 'Thank you for your peer review.' });
      queryClient.invalidateQueries({ queryKey: ['peer-review', pid] });
      queryClient.invalidateQueries({ queryKey: ['studio-projects'] });
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  if (isLoading || !project) return null;

  if (alreadyReviewed) {
    return (
      <StudioLayout>
        <StudioPage title="Peer Review" subtitle={project.title}>
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-10 w-10 text-[#688a52] mx-auto mb-3" />
              <p className="text-[#453329] font-medium">You've already submitted your review for this project.</p>
              <p className="text-sm text-[#688a52] mt-1">The author will receive your feedback.</p>
            </CardContent>
          </Card>
        </StudioPage>
      </StudioLayout>
    );
  }

  return (
    <StudioLayout>
      <StudioPage title="Peer Review" subtitle={`Reviewing: ${project.title}`}>
        {/* Project content — read-only */}
        <Card className="bg-[#eee6d8] border-[#d5cabe] mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-[#453329] text-base">{project.title}</CardTitle>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-xs text-[#688a52]">{project.contentType}</p>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-[#453329] whitespace-pre-wrap bg-white rounded-lg p-4 border border-[#d5cabe] min-h-32 text-sm">
              {project.content || <span className="text-[#d5cabe] italic">No content yet.</span>}
            </div>
          </CardContent>
        </Card>

        {/* Safety reminder */}
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>Your feedback should be constructive and kind. Do not include private information in your comments.</span>
        </div>

        {/* Checklist */}
        <Card className="bg-[#eee6d8] border-[#d5cabe] mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-[#453329] text-base">Review Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {CHECKLIST.map((item) => (
              <div key={item.key} className="flex items-start gap-3">
                <Checkbox
                  id={item.key}
                  checked={checklist[item.key] === true}
                  onCheckedChange={(checked) =>
                    setChecklist((c) => ({ ...c, [item.key]: checked === true ? true : false }))
                  }
                  className="mt-0.5 border-[#d5cabe]"
                />
                <Label htmlFor={item.key} className="text-sm text-[#453329] leading-relaxed cursor-pointer">
                  {item.label}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Comments */}
        <Card className="bg-[#eee6d8] border-[#d5cabe] mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-[#453329] text-base">Constructive Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="bg-white border-[#d5cabe] min-h-28 text-sm"
              placeholder="Share specific, helpful feedback. What worked well? What could be improved?"
            />
          </CardContent>
        </Card>

        {/* Recommendation */}
        <Card className="bg-[#eee6d8] border-[#d5cabe] mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <Checkbox
              id="recommend-revision"
              checked={recommendRevision}
              onCheckedChange={(c) => setRecommendRevision(c === true)}
              className="mt-0.5 border-[#d5cabe]"
            />
            <Label htmlFor="recommend-revision" className="text-sm text-[#453329] cursor-pointer">
              I recommend this project be returned for revision before teacher review
            </Label>
          </CardContent>
        </Card>

        <Button
          className="bg-[#688a52] hover:bg-[#557a43] text-white rounded-full px-6"
          onClick={() => submit()}
          disabled={isPending}
        >
          {isPending ? 'Submitting…' : 'Submit Peer Review'}
        </Button>
      </StudioPage>
    </StudioLayout>
  );
}
