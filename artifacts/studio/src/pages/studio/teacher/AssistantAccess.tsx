import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { assistantAdminApi, type AccessRequest, type AssistantPlan, type Membership } from '@/lib/assistantApi';
import { Check, Loader2, Pause, Play, Trash2, UserCheck, Users, X } from 'lucide-react';

export default function AssistantAccess() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const qc = useQueryClient();
  const { toast } = useToast();
  const overview = useQuery({ queryKey: ['assistant-admin'], queryFn: assistantAdminApi.overview, enabled: !!user?.isOwner });

  const refresh = () => qc.invalidateQueries({ queryKey: ['assistant-admin'] });
  const onError = (e: Error) => toast({ title: 'Something went wrong', description: e.message, variant: 'destructive' });

  const decide = useMutation({
    mutationFn: (v: { id: number; decision: 'approve' | 'decline'; plan?: string; monthlyRequestLimit?: number | null }) =>
      assistantAdminApi.decide(v.id, v),
    onSuccess: ({ request }) => { toast({ title: request.status === 'approved' ? 'Membership granted' : 'Request declined' }); refresh(); },
    onError,
  });
  const update = useMutation({
    mutationFn: (v: { teacherId: string; body: Parameters<typeof assistantAdminApi.updateMembership>[1] }) =>
      assistantAdminApi.updateMembership(v.teacherId, v.body),
    onSuccess: () => { toast({ title: 'Membership updated' }); refresh(); },
    onError,
  });
  const remove = useMutation({
    mutationFn: assistantAdminApi.removeMembership,
    onSuccess: () => { toast({ title: 'Membership removed' }); refresh(); },
    onError,
  });

  if (isLoading || !user) return null;
  if (!user.isOwner) {
    return (
      <StudioLayout>
        <StudioPage title="Assistant Access">
          <p className="text-sm text-[#453329]">Only the site owner can manage Site Assistant memberships.</p>
        </StudioPage>
      </StudioLayout>
    );
  }

  const plans = overview.data?.plans ?? [];
  const pending = (overview.data?.requests ?? []).filter((r) => r.status === 'pending');
  const decided = (overview.data?.requests ?? []).filter((r) => r.status !== 'pending').slice(0, 20);
  const memberships = overview.data?.memberships ?? [];

  return (
    <StudioLayout>
      <StudioPage title="Assistant Access" subtitle="Approve teachers for the Site Assistant and set their monthly allowance">
        <div className="space-y-6 max-w-4xl">
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-serif text-[#453329] flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[#c4622d]" /> Requests waiting ({pending.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pending.length === 0 && <p className="text-sm text-[#688a52] italic">No requests right now.</p>}
              {pending.map((r) => <RequestRow key={r.id} request={r} plans={plans} busy={decide.isPending} onDecide={(d) => decide.mutate({ id: r.id, ...d })} />)}
            </CardContent>
          </Card>

          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-serif text-[#453329] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#c4622d]" /> Members ({memberships.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {memberships.length === 0 && <p className="text-sm text-[#688a52] italic">Nobody has a membership yet. Approve a request above to add one.</p>}
              {memberships.map((m) => (
                <MemberRow key={m.teacherId} member={m} plans={plans} busy={update.isPending || remove.isPending}
                  onUpdate={(body) => update.mutate({ teacherId: m.teacherId, body })}
                  onRemove={() => { if (confirm(`Remove ${m.teacherName || m.teacherEmail || m.teacherId}'s membership?`)) remove.mutate(m.teacherId); }} />
              ))}
              <p className="text-xs text-[#688a52] pt-2">A request is one message a teacher sends to the assistant. Allowances reset on the 1st of each month. You, as the owner, are not limited.</p>
            </CardContent>
          </Card>

          {decided.length > 0 && (
            <Card className="bg-[#eee6d8] border-[#d5cabe]">
              <CardHeader className="pb-2"><CardTitle className="text-base font-serif text-[#453329]">Recent decisions</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {decided.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-[#453329]">{r.teacherName || r.teacherEmail || r.teacherId} · {r.requestedPlanLabel}</span>
                    <span className={cn('text-xs font-medium', r.status === 'approved' ? 'text-emerald-700' : 'text-[#9a8b7c]')}>{r.status} {r.decidedAt ? new Date(r.decidedAt).toLocaleDateString() : ''}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </StudioPage>
    </StudioLayout>
  );
}

function RequestRow({ request, plans, busy, onDecide }: {
  request: AccessRequest; plans: AssistantPlan[]; busy: boolean;
  onDecide: (d: { decision: 'approve' | 'decline'; plan?: string; monthlyRequestLimit?: number | null }) => void;
}) {
  const [plan, setPlan] = useState(request.requestedPlan);
  const planLimit = plans.find((p) => p.id === plan)?.monthlyRequests ?? null;
  const [limit, setLimit] = useState<string>(planLimit == null ? '' : String(planLimit));
  return (
    <div className="rounded-lg border border-[#d5cabe] bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#453329]">{request.teacherName || request.teacherEmail || request.teacherId}</p>
          {request.teacherEmail && request.teacherName && <p className="text-xs text-[#688a52]">{request.teacherEmail}</p>}
          <p className="text-xs text-[#688a52]">Asked for <strong>{request.requestedPlanLabel}</strong> on {new Date(request.createdAt).toLocaleDateString()}</p>
          {request.note && <p className="mt-1 text-sm text-[#453329]/85 italic">“{request.note}”</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={plan} onChange={(e) => { setPlan(e.target.value); const l = plans.find((p) => p.id === e.target.value)?.monthlyRequests; setLimit(l == null ? '' : String(l)); }}
            className="h-9 rounded-md border border-[#d5cabe] bg-white px-2 text-sm">
            {plans.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            <option value="custom">Custom</option>
          </select>
          <Input value={limit} onChange={(e) => setLimit(e.target.value)} inputMode="numeric" placeholder="unlimited" className="h-9 w-28 bg-white" aria-label="Requests per month" />
          <Button size="sm" className="bg-[#688a52] hover:bg-[#577544] text-white" disabled={busy}
            onClick={() => onDecide({ decision: 'approve', plan, monthlyRequestLimit: limit.trim() === '' ? null : Number(limit) })}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" />Approve</>}
          </Button>
          <Button size="sm" variant="outline" className="border-[#d5cabe]" disabled={busy} onClick={() => onDecide({ decision: 'decline' })}>
            <X className="h-4 w-4 mr-1" />Decline
          </Button>
        </div>
      </div>
    </div>
  );
}

function MemberRow({ member, plans, busy, onUpdate, onRemove }: {
  member: Membership; plans: AssistantPlan[]; busy: boolean;
  onUpdate: (body: { plan?: string; monthlyRequestLimit?: number | null; status?: 'active' | 'paused' }) => void;
  onRemove: () => void;
}) {
  const [limit, setLimit] = useState<string>(member.monthlyRequestLimit == null ? '' : String(member.monthlyRequestLimit));
  const limitChanged = (limit.trim() === '' ? null : Number(limit)) !== member.monthlyRequestLimit;
  const pct = member.monthlyRequestLimit ? Math.min(100, Math.round((member.usedThisMonth / member.monthlyRequestLimit) * 100)) : 0;
  return (
    <div className={cn('rounded-lg border border-[#d5cabe] bg-white p-3', member.status === 'paused' && 'opacity-70')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#453329]">{member.teacherName || member.teacherEmail || member.teacherId}
            {member.status === 'paused' && <span className="ml-2 rounded-full bg-[#f5efe5] px-2 py-0.5 text-[11px] text-[#9a8b7c]">paused</span>}
          </p>
          <p className="text-xs text-[#688a52]">
            {member.usedThisMonth} of {member.monthlyRequestLimit ?? '∞'} requests used this month
          </p>
          {member.monthlyRequestLimit != null && (
            <div className="mt-1 h-1.5 w-48 rounded-full bg-[#eee6d8]"><div className={cn('h-1.5 rounded-full', pct >= 90 ? 'bg-[#c4622d]' : 'bg-[#688a52]')} style={{ width: `${pct}%` }} /></div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={member.plan} disabled={busy} onChange={(e) => { const l = plans.find((p) => p.id === e.target.value)?.monthlyRequests; onUpdate({ plan: e.target.value, ...(e.target.value !== 'custom' ? { monthlyRequestLimit: l ?? null } : {}) }); }}
            className="h-9 rounded-md border border-[#d5cabe] bg-white px-2 text-sm">
            {plans.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            <option value="custom">Custom</option>
          </select>
          <Input value={limit} onChange={(e) => setLimit(e.target.value)} inputMode="numeric" placeholder="unlimited" className="h-9 w-24 bg-white" aria-label="Requests per month" />
          {limitChanged && (
            <Button size="sm" variant="outline" className="border-[#d5cabe]" disabled={busy} onClick={() => onUpdate({ plan: 'custom', monthlyRequestLimit: limit.trim() === '' ? null : Number(limit) })}>Save</Button>
          )}
          <Button size="icon" variant="ghost" disabled={busy} aria-label={member.status === 'paused' ? 'Resume' : 'Pause'}
            onClick={() => onUpdate({ status: member.status === 'paused' ? 'active' : 'paused' })}>
            {member.status === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" disabled={busy} aria-label="Remove membership" className="text-[#9a8b7c] hover:text-[#c4622d]" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
