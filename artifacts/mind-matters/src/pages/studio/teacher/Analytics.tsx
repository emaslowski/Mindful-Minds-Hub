import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { teacherAnalytics } from '@/lib/studioApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';

const IMPACT_LABELS: Record<string, string> = {
  resources_published: 'Resources Published',
  student_creators: 'Student Creators',
  resources_viewed: 'Resources Viewed',
  projects_continued: 'Projects Continued Between Classes',
  class_cycles: 'Class Cycles',
  articles: 'Articles',
  podcasts: 'Podcasts',
  activities: 'Activities',
};

const STATUS_COLORS: Record<string, string> = {
  'Assigned': '#d4a44c',
  'Researching': '#688a52',
  'Drafting': '#c4829a',
  'Peer Review': '#c4622d',
  'Revision Needed': '#c93b3b',
  'Ready for Teacher Review': '#688a52',
  'Teacher Reviewing': '#5a6a9a',
  'Approved': '#688a52',
  'Published': '#2d8a6a',
  'Archived': '#999',
};

export default function Analytics() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ['teacher-analytics'], queryFn: teacherAnalytics.get, enabled: !!user });

  const { mutate: updateSettings } = useMutation({
    mutationFn: (settings: Array<{ settingKey: string; isVisible: boolean }>) =>
      teacherAnalytics.updateImpactSettings(settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-analytics'] }),
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  if (isLoading || !user || !data) return null;

  const { summary, statusBreakdown, pubByType, impactSettings } = data;

  const summaryItems = [
    { label: 'Active Students', value: summary.activeStudents },
    { label: 'Total Projects', value: summary.totalProjects },
    { label: 'Pending Review', value: summary.pendingReview },
    { label: 'Published', value: summary.published },
    { label: 'Need Revision', value: summary.revisionNeeded },
    { label: 'Handoffs', value: summary.handoffs },
    { label: 'Class Cycles', value: summary.cycles },
  ];

  return (
    <StudioLayout>
      <StudioPage title="Impact & Analytics" subtitle="Private teacher view — not visible to the public">
        {/* Summary */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {summaryItems.map((s) => (
            <Card key={s.label} className="bg-[#eee6d8] border-[#d5cabe]">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-[#453329]">{s.value}</p>
                <p className="text-xs text-[#688a52] mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Projects by status */}
          {statusBreakdown.length > 0 && (
            <Card className="bg-[#eee6d8] border-[#d5cabe]">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-[#453329] text-base">Projects by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={statusBreakdown} margin={{ left: -20, right: 10 }}>
                    <XAxis dataKey="status" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statusBreakdown.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#c4622d'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Publications by type */}
          {pubByType.length > 0 && (
            <Card className="bg-[#eee6d8] border-[#d5cabe]">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-[#453329] text-base">Published by Content Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={pubByType} margin={{ left: -20, right: 10 }}>
                    <XAxis dataKey="contentType" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#688a52" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Public impact settings */}
        <Card className="bg-[#eee6d8] border-[#d5cabe]">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-[#453329] text-base">Public "Our Impact" Stats</CardTitle>
            <p className="text-xs text-[#688a52]">Toggle which aggregated statistics appear on the public website. Student-level data is never shared.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {impactSettings.map((setting) => (
              <div key={setting.settingKey} className="flex items-center justify-between">
                <Label className="text-sm text-[#453329]">
                  {IMPACT_LABELS[setting.settingKey] ?? setting.settingKey}
                </Label>
                <Switch
                  checked={setting.isVisible}
                  onCheckedChange={(v) =>
                    updateSettings([{ settingKey: setting.settingKey, isVisible: v }])
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </StudioPage>
    </StudioLayout>
  );
}
