import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { StudioLayout, StudioPage, StatusBadge } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { teacherReview, teacherAnalytics, teacherModeration, teacherAnonymousAccess, teacherFriendship, type FriendshipJoinRequest, type ModerationItem } from '@/lib/studioApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users, FolderOpen, ClipboardCheck, Star, KeyRound, HeartHandshake,
  RefreshCw, AlertCircle, ChevronRight, Trash2, CheckCircle2, FileText, MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function CommandCenter() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmModerationItem, setConfirmModerationItem] = useState<ModerationItem | null>(null);
  const [declineFriendship, setDeclineFriendship] = useState<FriendshipJoinRequest | null>(null);

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

  const { data: moderationData } = useQuery({
    queryKey: ['teacher-moderation'],
    queryFn: () => teacherModeration.list(),
    enabled: !!user,
    refetchOnWindowFocus: true,
  });

  const { data: anonymousAccess, isLoading: accessLoading, isError: accessError, refetch: refetchAccess } = useQuery({
    queryKey: ['teacher-anonymous-access'],
    queryFn: teacherAnonymousAccess.list,
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  const { data: friendshipRequests, isLoading: friendshipLoading, isError: friendshipError, refetch: refetchFriendship } = useQuery({
    queryKey: ['teacher-friendship-requests'],
    queryFn: teacherFriendship.requests,
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  const { mutate: decideFriendship, isPending: decidingFriendship } = useMutation({
    mutationFn: ({ userId, decision }: { userId: string; decision: 'approve' | 'reject' }) =>
      teacherFriendship.decide(userId, decision),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-friendship-requests'] });
      setDeclineFriendship(null);
      toast({
        title: variables.decision === 'approve' ? 'Matchmaker request approved' : 'Matchmaker request declined',
        description: variables.decision === 'approve' ? 'The student can now see and appear in matches.' : 'The student will not appear in matches.',
      });
    },
    onError: (error: Error) => toast({ title: 'Could not update matchmaker request', description: error.message, variant: 'destructive' }),
  });

  const { mutate: deleteProject, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => teacherReview.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-all-projects'] });
      setConfirmId(null);
      toast({ title: 'Project deleted', description: 'The project was moved to Archived.' });
    },
    onError: (err: Error) => {
      setConfirmId(null);
      toast({ title: 'Could not delete project', description: err.message, variant: 'destructive' });
    },
  });

  const { mutate: approveModeration, isPending: isApproving } = useMutation({
    mutationFn: ({ type, id }: Pick<ModerationItem, 'type' | 'id'>) =>
      teacherModeration.approve(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-moderation'] });
      toast({ title: 'Content authorized', description: 'It is now visible to the public.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Could not authorize content', description: err.message, variant: 'destructive' });
    },
  });

  const { mutate: deleteModeration, isPending: isDeletingModeration } = useMutation({
    mutationFn: ({ type, id }: Pick<ModerationItem, 'type' | 'id'>) =>
      teacherModeration.delete(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-moderation'] });
      setConfirmModerationItem(null);
      toast({ title: 'Content deleted', description: 'The item was permanently removed.' });
    },
    onError: (err: Error) => {
      setConfirmModerationItem(null);
      toast({ title: 'Could not delete content', description: err.message, variant: 'destructive' });
    },
  });

  if (isLoading || !user) return null;

  const s = analytics?.summary;
  const queue = queueData?.projects ?? [];
  const pendingAccessRequests = (anonymousAccess?.requests ?? []).filter((request) => request.status === 'pending');
  const authorizationQueue = [
    ...(moderationData?.blogPosts ?? []),
    ...(moderationData?.collabPosts ?? []),
    ...(moderationData?.comments ?? []),
  ];
  const approvedBoardPosts = moderationData?.approvedCollabPosts ?? [];
  const moderationLabels = {
    blog: { label: 'Blog post', icon: <FileText className="h-4 w-4 text-[#c4622d]" /> },
    'collab-post': { label: 'Board post', icon: <MessageSquare className="h-4 w-4 text-[#688a52]" /> },
    comment: { label: 'Comment', icon: <MessageSquare className="h-4 w-4 text-[#d4a44c]" /> },
  };

  const summaryCards = [
    { label: 'Journal Access Requests', value: accessError ? '!' : accessLoading ? '…' : pendingAccessRequests.length, icon: <KeyRound className="h-5 w-5 text-[#c4622d]" />, href: '/studio/teacher/anonymous-access' },
    { label: 'Matchmaker Requests', value: friendshipError ? '!' : friendshipLoading ? '…' : friendshipRequests?.length ?? 0, icon: <HeartHandshake className="h-5 w-5 text-[#688a52]" />, href: '#friendship-requests' },
    { label: 'Active Students', value: s?.activeStudents ?? 0, icon: <Users className="h-5 w-5 text-[#c4622d]" />, href: '/studio/teacher/students' },
    { label: 'Projects In Progress', value: s?.totalProjects ?? 0, icon: <FolderOpen className="h-5 w-5 text-[#688a52]" />, href: '/studio/teacher/projects' },
    { label: 'Awaiting Review', value: s?.pendingReview ?? 0, icon: <ClipboardCheck className="h-5 w-5 text-orange-500" />, href: '/studio/teacher/review' },
    { label: 'Published This Cycle', value: s?.published ?? 0, icon: <Star className="h-5 w-5 text-[#d4a44c]" />, href: '/studio/teacher/projects?status=Published' },
    { label: 'Needs Revision', value: s?.revisionNeeded ?? 0, icon: <AlertCircle className="h-5 w-5 text-red-500" />, href: '/studio/teacher/projects?status=Revision+Needed' },
    { label: 'Handoff Projects', value: s?.handoffs ?? 0, icon: <RefreshCw className="h-5 w-5 text-blue-500" />, href: '/studio/teacher/handoffs' },
  ];

  return (
    <StudioLayout>
      <StudioPage title="Command Center" subtitle="Middle School Matters Teacher Dashboard">
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

        {/* Private journal access requests require teacher approval before credentials are issued. */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-serif text-lg font-semibold text-[#453329]">Private Journal Access Requests</h2>
            <p className="text-xs text-[#688a52] mt-0.5">
              Review requests before students receive their private journal sign-in details.
            </p>
          </div>
          <span
            aria-label={accessError ? 'Journal access requests could not be loaded' : accessLoading ? 'Loading journal access requests' : `${pendingAccessRequests.length} pending journal access requests`}
            className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-[#c4622d] text-white text-xs font-bold"
          >
            {accessError ? '!' : accessLoading ? '…' : pendingAccessRequests.length}
          </span>
        </div>
        {accessError ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe] mb-8">
            <CardContent className="p-6 text-sm text-red-700">
              Could not load journal access requests.{' '}
              <button type="button" className="underline font-semibold" onClick={() => refetchAccess()}>Try again</button>
            </CardContent>
          </Card>
        ) : accessLoading ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe] mb-8">
            <CardContent className="p-6 text-sm text-[#688a52]">Loading journal access requests…</CardContent>
          </Card>
        ) : pendingAccessRequests.length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe] mb-8">
            <CardContent className="p-6 flex items-center gap-3 text-sm text-[#688a52]">
              <CheckCircle2 className="h-5 w-5" />
              No private journal access requests are waiting for approval.
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#eee6d8] border-[#d5cabe] mb-8 overflow-hidden">
            <div className="divide-y divide-[#d5cabe]">
              {pendingAccessRequests.map((request) => (
                <div key={request.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                  <KeyRound className="h-5 w-5 shrink-0 text-[#c4622d]" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#453329]">
                      {[request.firstName, request.lastName].filter(Boolean).join(' ') || 'Student'}
                      <span className="ml-2 text-xs text-[#688a52]">Grade {request.grade || 'not provided'}</span>
                    </p>
                    <p className="text-xs text-[#688a52]">
                      Request {request.requestCode} · {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Link href="/studio/teacher/anonymous-access">
                    <Button size="sm" className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full">
                      Review &amp; Approve
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        )}

        <section id="friendship-requests" aria-labelledby="friendship-requests-heading" className="mb-8 scroll-mt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 id="friendship-requests-heading" className="font-serif text-lg font-semibold text-[#453329]">Friendship Matchmaker Requests</h2>
              <p className="text-xs text-[#688a52] mt-0.5">
                Students stay hidden from matches until you approve their request.
              </p>
            </div>
            <span
              aria-label={friendshipError ? 'Matchmaker requests could not be loaded' : `${friendshipRequests?.length ?? 0} pending matchmaker requests`}
              className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-[#688a52] text-white text-xs font-bold"
            >
              {friendshipError ? '!' : friendshipLoading ? '…' : friendshipRequests?.length ?? 0}
            </span>
          </div>
          {friendshipError ? (
            <Card className="bg-[#eee6d8] border-[#d5cabe]">
              <CardContent className="p-6 text-sm text-red-700">
                Could not load matchmaker requests.{' '}
                <button type="button" className="underline font-semibold" onClick={() => refetchFriendship()}>Try again</button>
              </CardContent>
            </Card>
          ) : friendshipLoading ? (
            <Card className="bg-[#eee6d8] border-[#d5cabe]">
              <CardContent className="p-6 text-sm text-[#688a52]">Loading matchmaker requests…</CardContent>
            </Card>
          ) : !friendshipRequests?.length ? (
            <Card className="bg-[#eee6d8] border-[#d5cabe]">
              <CardContent className="p-6 flex items-center gap-3 text-sm text-[#688a52]">
                <CheckCircle2 className="h-5 w-5" />
                No Friendship Matchmaker requests are waiting for approval.
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#eee6d8] border-[#d5cabe] overflow-hidden">
              <div className="divide-y divide-[#d5cabe]">
                {friendshipRequests.map((request) => (
                  <div key={request.userId} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                    <HeartHandshake className="h-5 w-5 shrink-0 text-[#688a52]" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#453329]">{request.displayName}</p>
                      <p className="text-xs text-[#688a52]">
                        Requested {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
                      </p>
                      <p className="text-sm text-[#453329] mt-1">
                        Interests: {request.interests.join(', ')} · Qualities: {request.qualities.join(', ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={decidingFriendship}
                        className="bg-[#688a52] hover:bg-[#557a43] text-white rounded-full"
                        onClick={() => decideFriendship({ userId: request.userId, decision: 'approve' })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={decidingFriendship}
                        className="border-red-200 text-red-600 rounded-full"
                        onClick={() => setDeclineFriendship(request)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>

        {/* Public content moderation */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-serif text-lg font-semibold text-[#453329]">Awaiting Authorization</h2>
            <p className="text-xs text-[#688a52] mt-0.5">
              Blog posts, collaboration board posts, and comments stay private until you approve them.
            </p>
          </div>
          <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-[#c4622d] text-white text-xs font-bold">
            {authorizationQueue.length}
          </span>
        </div>

        {authorizationQueue.length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe] mb-8">
            <CardContent className="p-6 flex items-center gap-3 text-sm text-[#688a52]">
              <CheckCircle2 className="h-5 w-5 text-[#688a52]" />
              No blog posts, board posts, or comments are waiting for authorization.
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#eee6d8] border-[#d5cabe] mb-8 overflow-hidden">
            <div className="divide-y divide-[#d5cabe]">
              {authorizationQueue.map((item) => {
                const metadata = moderationLabels[item.type];
                const contentPreview = item.content.length > 280
                  ? `${item.content.slice(0, 280)}…`
                  : item.content;
                return (
                  <div key={`${item.type}-${item.id}`} className="p-4 bg-[#eee6d8]">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#453329]">
                            {metadata.icon}
                            {metadata.label}
                          </span>
                          <span className="text-xs text-[#688a52]">by {item.author}</span>
                          <span className="text-xs text-[#688a52]">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {item.title && (
                          <p className="font-medium text-[#453329] mt-2">{item.title}</p>
                        )}
                        {item.type === 'comment' && item.postTitle && (
                          <p className="text-xs text-[#688a52] mt-1">
                            Comment on: {item.postTitle.length > 100 ? `${item.postTitle.slice(0, 100)}…` : item.postTitle}
                          </p>
                        )}
                        <p className="text-sm text-[#453329] whitespace-pre-wrap mt-2">{contentPreview}</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-[#688a52] hover:bg-[#557a43] text-white rounded-full self-start"
                        onClick={() => approveModeration({ type: item.type, id: item.id })}
                        disabled={isApproving}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Authorize
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-full self-start"
                        onClick={() => setConfirmModerationItem(item)}
                        disabled={isApproving || isDeletingModeration}
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Approved collaboration board posts */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-serif text-lg font-semibold text-[#453329]">Published Collaboration Posts</h2>
            <p className="text-xs text-[#688a52] mt-0.5">
              Approved board posts stay public until you permanently delete them.
            </p>
          </div>
          <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-[#688a52] text-white text-xs font-bold">
            {approvedBoardPosts.length}
          </span>
        </div>

        {approvedBoardPosts.length === 0 ? (
          <Card className="bg-[#eee6d8] border-[#d5cabe] mb-8">
            <CardContent className="p-6 flex items-center gap-3 text-sm text-[#688a52]">
              <MessageSquare className="h-5 w-5 text-[#688a52]" />
              No approved collaboration posts are currently published.
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#eee6d8] border-[#d5cabe] mb-8 overflow-hidden">
            <div className="divide-y divide-[#d5cabe]">
              {approvedBoardPosts.map((item) => (
                <div key={`approved-${item.id}`} className="p-4 bg-[#eee6d8]">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#453329]">
                          <MessageSquare className="h-4 w-4 text-[#688a52]" />
                          Board post
                        </span>
                        <span className="text-xs text-[#688a52]">by {item.author}</span>
                        <span className="text-xs text-[#688a52]">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-[#453329] whitespace-pre-wrap mt-2">
                        {item.content}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-full self-start"
                      onClick={() => setConfirmModerationItem(item)}
                      disabled={isApproving || isDeletingModeration}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

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
                        <Link
                          href={`/studio/teacher/review/${p.id}`}
                          className="hover:text-[#c4622d] hover:underline underline-offset-2"
                        >
                          {p.contentFlagged && (
                            <span className="inline-flex items-center gap-1 text-amber-600 text-xs mr-1">
                              <AlertCircle className="h-3.5 w-3.5" />
                            </span>
                          )}
                          {p.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#688a52]">{p.studentName ?? '—'}</td>
                      <td className="px-4 py-3 text-[#688a52]">{p.contentType}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-[#688a52] text-xs">
                        {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/studio/teacher/review/${p.id}`}>
                            <Button size="sm" className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full text-xs">
                              Review
                            </Button>
                          </Link>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-[#d5cabe] hover:text-red-500 hover:bg-red-50"
                            onClick={() => {
                              setConfirmId(p.id);
                              setConfirmTitle(p.title);
                            }}
                            title="Delete project"
                            aria-label={`Delete ${p.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </StudioPage>

      <AlertDialog open={confirmId !== null} onOpenChange={(open) => !open && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">"{confirmTitle}"</span> will be moved to Archived and removed from active work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => confirmId !== null && deleteProject(confirmId)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Yes, delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={declineFriendship !== null}
        onOpenChange={(open) => !open && setDeclineFriendship(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline this matchmaker request?</AlertDialogTitle>
            <AlertDialogDescription>
              {declineFriendship?.displayName} will not appear in or see friendship matches. They may ask for another review later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={decidingFriendship}
              onClick={() => declineFriendship && decideFriendship({ userId: declineFriendship.userId, decision: 'reject' })}
            >
              Decline request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmModerationItem !== null}
        onOpenChange={(open) => !open && setConfirmModerationItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this content permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This {confirmModerationItem?.type === 'blog'
                ? 'blog post'
                : confirmModerationItem?.type === 'comment'
                  ? 'comment'
                  : 'board post'} will be permanently deleted and cannot be restored.
              {confirmModerationItem?.title && (
                <span className="block font-semibold mt-2">"{confirmModerationItem.title}"</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() =>
                confirmModerationItem &&
                deleteModeration({
                  type: confirmModerationItem.type,
                  id: confirmModerationItem.id,
                })
              }
              disabled={isDeletingModeration}
            >
              {isDeletingModeration ? 'Deleting…' : 'Yes, permanently delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StudioLayout>
  );
}
