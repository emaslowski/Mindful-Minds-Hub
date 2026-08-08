import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { teacherReview, teacherAnalytics } from '@/lib/studioApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, FolderOpen, ClipboardCheck, Star,
  RefreshCw, AlertCircle, ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CommandCenter() {
  const { user, isLoading } = useRequireStudioRole('teacher');

  const { data: analytics } = useQuery({
    queryKey: ['teacher-analytics'],
    queryFn: () => teacherAnalytics.get(),
    enabled: !!user,
  });

  const { data: queueData } = useQuery({
    queryKey: ['teacher-review-queue'],
    queryFn: () => teacherReview.queue(),
    enabled: !!user,
  });

  if (isLoading || !user) return null;

  const s = analytics?.summary;
  const queue = queueData?.projects ?? [];

  const summaryCards = [
    { label: 'Active Students', value: s?.activeStudents ?? 0, icon: <Users className="h-5 w-5 text-[#c4622d]" />, href: '/studio/teacher/students' },
    { label: 'Projects In Progress', value: s?.totalProjects ?? 0, icon: <FolderOpen className="h-5 w-5 text-[#688a52]" />, href: '/studio/teacher/projects' },
    { label: 'Awaiting Review', value: s?.pendingReview ?? 0, icon: <ClipboardCheck className="h-5 w-5 text-orange-500" />, href: '/studio/teacher/review' },
    { label: 'Published This Cycle', value: s?.published ?? 0, icon: <Star className="h-5 w-5 text-[#d4a44c]" />, href: '/studio/teacher/projects?status=Published' },
    { label: 'Needs Revision', value: s?.revisionNeeded ?? 0, icon: <AlertCircle className="h-5 w-5 text-red-500" />, href: '/studio/teacher/projects?status=Revision+Needed' },
    { label: 'Handoff Projects', value: s?.handoffs ?? 0, icon: <RefreshCw className="h-5 w-5 text-blue-500" />, href: '/studio/teacher/handoffs' },
  ];

  return (
    <StudioLayout>
      <StudioPage title="Command Center" subtitle="Mind Matters Teacher Dashboard">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {summaryCards.map((c) => (
            <Link key={c.label} href={c.href}>
              <Card className="bg-[#eee6d8] border-[#d5cabe] hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  {c.icon}
                  <div>
                    <p className="text-2xl font-bold text-[#453329]">{c.value}</p>
                    <p className="text-xs text-[#688a52]">{c.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Awaiting approval table */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg font-semibold text-[#453329]">Awaiting Your Approval</h2>
          <Link href="/studio/teacher/review">
            <Button variant="ghost" size="sm" className="text-[#688a52] gap-1">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {queue.length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardContent className="p-8 text-center text-sm text-[#688a52]">
              No submissions awaiting review. 🎉
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#eee6d8] border-[#d5cabe] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#d5cabe] text-[#453329]">
                    <th className="text-left px-4 py-3 font-medium">Project</th>
                    <th className="text-left px-4 py-3 font-medium">Student</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Submitted</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {queue.slice(0, 10).map((p, i) => (
                    <tr key={p.id} className={i % 2 === 0 ? 'bg-[#eee6d8]' : 'bg-[#f5efe5]'}>
                      <td className="px-4 py-3 font-medium text-[#453329]">
                        {p.contentFlagged && (
                          <span className="inline-flex items-center gap-1 text-amber-600 text-xs mr-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {p.title}
                      </td>
                      <td className="px-4 py-3 text-[#688a52]">{p.studentName ?? '—'}</td>
                      <td className="px-4 py-3 text-[#688a52]">{p.contentType}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-[#688a52] text-xs">
                        {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/studio/teacher/review/${p.id}`}>
                          <Button size="sm" className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full text-xs">
                            Review
                          </Button>
                        </Link>
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
