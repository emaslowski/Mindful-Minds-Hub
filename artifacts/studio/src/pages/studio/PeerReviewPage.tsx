import { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { ContentPreview } from '@/components/studio/ContentPreview';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { studioProjects, studioPeerReviews, studioSources, type PeerReviewSubmission } from '@/lib/studioApi';
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

  const { data: sourcesData, isError: sourcesError } = useQuery({
    queryKey: ['studio-sources', pid],
    queryFn: () => studioSources.list(pid),
    enabled: !!user,
  });

  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean | undefined>>(
    Object.fromEntries(CHECKLIST.map((c) => [c.key, undefined])) as Record<ChecklistKey, boolean | undefined>,
  );
  const [compliment, setCompliment] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [encouragement, setEncouragement] = useState('');
  const [recommendRevision, setRecommendRevision] = useState(false);

  const project = projectData?.project;
  const alreadyReviewed = project?.status !== 'Peer Review' && (reviewsData?.reviews ?? []).length > 0;

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () =>
      studioPeerReviews.submit(pid, {
        ...checklist,
        compliment,
        suggestion,
        encouragement,
        recommendRevision,
      } as PeerReviewSubmission),
    onSuccess: () => {
      toast({ title: 'Sent to teacher!', description: 'Your feedback and the project are ready in the Teacher Command Center.' });
      queryClient.invalidateQueries({ queryKey: ['peer-review', pid] });
      queryClient.invalidateQueries({ queryKey: ['studio-peer-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['studio-projects'] });
      queryClient.invalidateQueries({ queryKey: ['studio-project', pid] });
      queryClient.invalidateQueries({ queryKey: ['teacher-review-queue'] });
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
              <p className="text-sm text-[#688a52] mt-1">The project and your feedback have been sent to the Teacher Command Center.</p>
              <p className="text-sm text-[#453329] mt-4 whitespace-pre-wrap text-left">{reviewsData?.reviews.at(-1)?.comments}</p>
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

        <Card className="bg-[#eee6d8] border-[#d5cabe] mb-6">
          <CardHeader><CardTitle className="font-serif text-[#453329] text-base">Design Preview</CardTitle></CardHeader>
          <CardContent><ContentPreview title={project.title} contentType={project.contentType} content={project.content} /></CardContent>
        </Card>
        <Card className="bg-[#eee6d8] border-[#d5cabe] mb-6">
          <CardHeader><CardTitle className="font-serif text-[#453329] text-base">Research Sources</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-[#453329]">
            {sourcesError ? <p>Sources could not be loaded. Refresh before checking the sources checklist item.</p> :
              !sourcesData ? <p>Loading sources…</p> :
              sourcesData.sources.length === 0 ? <p>No sources included.</p> :
              sourcesData.sources.map((source) => (
                <div key={source.id}>
                  <p className="font-medium">{source.title}</p>
                  <p className="text-xs text-[#688a52]">{[source.author, source.website, source.accessedDate].filter(Boolean).join(' · ')}</p>
                  {source.url && <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-[#c4622d] underline break-all">{source.url}</a>}
                </div>
              ))}
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
            <CardTitle className="font-serif text-[#453329] text-base">Compliment Sandwich</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[#688a52]">Start with a strength, offer a specific way to improve, and finish with encouragement. All three parts will accompany the project to your teacher.</p>
            {[
              { id: 'compliment', label: '1. Opening compliment', value: compliment, setValue: setCompliment, placeholder: 'What did this group do well? Give a specific example.' },
              { id: 'suggestion', label: '2. Constructive suggestion', value: suggestion, setValue: setSuggestion, placeholder: 'What could be clearer or stronger, and how could they improve it?' },
              { id: 'encouragement', label: '3. Encouraging closing', value: encouragement, setValue: setEncouragement, placeholder: 'End with another strength or encouragement for their next steps.' },
            ].map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="text-[#453329]">{field.label} *</Label>
                <Textarea id={field.id} required value={field.value} onChange={(e) => field.setValue(e.target.value)} className="bg-white border-[#d5cabe] min-h-24 text-sm" placeholder={field.placeholder} />
              </div>
            ))}
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
              I recommend revisions. The teacher will review my feedback and decide whether to return the project to the author.
            </Label>
          </CardContent>
        </Card>

        <Button
          className="bg-[#688a52] hover:bg-[#557a43] text-white rounded-full px-6"
          onClick={() => submit()}
          disabled={isPending || !compliment.trim() || !suggestion.trim() || !encouragement.trim() || project.status !== 'Peer Review'}
        >
          {isPending ? 'Sending…' : 'Send to Teacher Command Center'}
        </Button>
      </StudioPage>
    </StudioLayout>
  );
}
