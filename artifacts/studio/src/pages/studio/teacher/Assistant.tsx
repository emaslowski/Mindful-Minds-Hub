import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StudioLayout } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  assistantApi,
  streamAssistantMessage,
  type AssistantAccess,
  type AssistantAction,
  type AssistantPlan,
  type TranscriptItem,
} from '@/lib/assistantApi';
import {
  AlertTriangle, Check, ChevronDown, ChevronRight, Loader2, MessageSquarePlus, Plus,
  Search, Send, Sparkles, Trash2, X,
} from 'lucide-react';

const STARTERS = [
  'What is waiting for my review right now?',
  'Approve all pending comments that are kind and on topic.',
  'Fix the spelling in the Learn page titled "…"',
  'Who is this month\'s Featured Artist?',
];

export default function Assistant() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [liveItems, setLiveItems] = useState<TranscriptItem[]>([]);
  const [liveText, setLiveText] = useState('');
  const [liveActions, setLiveActions] = useState<Record<number, AssistantAction>>({});
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const status = useQuery({ queryKey: ['assistant-status'], queryFn: assistantApi.status, enabled: !!user });
  const conversations = useQuery({
    queryKey: ['assistant-conversations'],
    queryFn: () => assistantApi.listConversations().then((r) => r.conversations),
    enabled: !!user,
  });
  const conversation = useQuery({
    queryKey: ['assistant-conversation', activeId],
    queryFn: () => assistantApi.getConversation(activeId!),
    enabled: !!user && activeId != null,
  });

  // Reset the live (in-progress) view whenever the stored conversation reloads.
  useEffect(() => {
    setLiveItems([]); setLiveText(''); setLiveActions({});
  }, [conversation.dataUpdatedAt, activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [liveText, liveItems.length, conversation.dataUpdatedAt]);

  const createConversation = useMutation({
    mutationFn: assistantApi.createConversation,
    onSuccess: ({ conversation: c }) => {
      qc.invalidateQueries({ queryKey: ['assistant-conversations'] });
      setActiveId(c.id); setSidebarOpen(false);
    },
    onError: (e: Error) => toast({ title: 'Could not start a conversation', description: e.message, variant: 'destructive' }),
  });

  const deleteConversation = useMutation({
    mutationFn: assistantApi.deleteConversation,
    onSuccess: (_r, id) => {
      qc.invalidateQueries({ queryKey: ['assistant-conversations'] });
      if (activeId === id) setActiveId(null);
    },
    onError: (e: Error) => toast({ title: 'Could not delete', description: e.message, variant: 'destructive' }),
  });

  const decideAction = useMutation({
    mutationFn: ({ id, apply }: { id: number; apply: boolean }) =>
      apply ? assistantApi.applyAction(id) : assistantApi.declineAction(id),
    onSuccess: ({ action }) => {
      setLiveActions((prev) => ({ ...prev, [action.id]: action }));
      qc.setQueryData<Awaited<ReturnType<typeof assistantApi.getConversation>>>(
        ['assistant-conversation', action.conversationId],
        (old) => old ? { ...old, actions: old.actions.map((a) => (a.id === action.id ? action : a)) } : old,
      );
      if (action.status === 'applied') toast({ title: 'Change applied', description: action.summary });
      if (action.status === 'failed') toast({ title: 'Change failed', description: action.error ?? 'Unknown error', variant: 'destructive' });
    },
    onError: (e: Error) => toast({ title: 'Could not update the change', description: e.message, variant: 'destructive' }),
  });

  const actionsById = useMemo(() => {
    const map: Record<number, AssistantAction> = {};
    for (const a of conversation.data?.actions ?? []) map[a.id] = a;
    return { ...map, ...liveActions };
  }, [conversation.data, liveActions]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || streaming) return;
    let id = activeId;
    if (id == null) {
      const { conversation: c } = await assistantApi.createConversation();
      qc.invalidateQueries({ queryKey: ['assistant-conversations'] });
      id = c.id; setActiveId(id);
    }
    setDraft('');
    setStreaming(true);
    const at = new Date().toISOString();
    setLiveItems((items) => [...items, { kind: 'user', text: message, at }]);
    let buffer = '';
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      for await (const event of streamAssistantMessage(id, message, controller.signal)) {
        if (event.type === 'text') {
          buffer += event.delta; setLiveText(buffer);
        } else if (event.type === 'tool') {
          if (buffer.trim()) { const t = buffer; buffer = ''; setLiveText(''); setLiveItems((items) => [...items, { kind: 'assistant', text: t, at }]); }
          setLiveItems((items) => [...items, { kind: 'tool', name: event.name, summary: event.summary, ok: event.ok, at }]);
        } else if (event.type === 'action') {
          if (buffer.trim()) { const t = buffer; buffer = ''; setLiveText(''); setLiveItems((items) => [...items, { kind: 'assistant', text: t, at }]); }
          setLiveActions((prev) => ({ ...prev, [event.action.id]: event.action }));
          setLiveItems((items) => [...items, { kind: 'action', actionId: event.action.id, at }]);
        } else if (event.type === 'error') {
          setLiveItems((items) => [...items, { kind: 'error', text: event.message, at }]);
        }
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setLiveItems((items) => [...items, { kind: 'error', text: err instanceof Error ? err.message : 'Something went wrong.', at }]);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      // Reload the stored transcript; the server saved it at the end of the turn.
      await qc.invalidateQueries({ queryKey: ['assistant-conversation', id] });
      qc.invalidateQueries({ queryKey: ['assistant-conversations'] });
      qc.invalidateQueries({ queryKey: ['assistant-status'] });
    }
  }

  function onSubmit(e: FormEvent) { e.preventDefault(); void send(draft); }
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(draft); }
  }

  if (isLoading || !user) return null;

  const items: TranscriptItem[] = [...(conversation.data?.transcript ?? []), ...liveItems];
  const configured = status.data?.configured ?? true;
  const access = status.data?.access;
  const plans = status.data?.plans ?? [];
  const blocked = access ? !access.allowed : false;
  const canType = configured && !blocked && !streaming;

  if (access && !access.isOwner && !access.membership && !streaming) {
    return (
      <StudioLayout>
        <div className="p-4 sm:p-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-6 w-6 text-[#c4622d]" />
            <div>
              <h1 className="text-2xl font-serif font-semibold text-[#453329]">Site Assistant</h1>
              <p className="text-sm text-[#688a52]">Ask in plain English to look things up and change the website. Nothing changes until you click Apply.</p>
            </div>
          </div>
          <RequestAccessPanel access={access} plans={plans} onDone={() => qc.invalidateQueries({ queryKey: ['assistant-status'] })} />
        </div>
      </StudioLayout>
    );
  }

  return (
    <StudioLayout>
      <div className="flex h-full min-h-0">
        {/* Conversation list */}
        <aside className={cn(
          'w-64 flex-shrink-0 border-r border-[#d5cabe] bg-[#eee6d8] flex-col',
          sidebarOpen ? 'flex absolute inset-y-0 left-0 z-20 md:static' : 'hidden lg:flex',
        )}>
          <div className="p-3 border-b border-[#d5cabe] flex items-center gap-2">
            <Button size="sm" className="flex-1 bg-[#c4622d] hover:bg-[#a9521f] text-white" onClick={() => createConversation.mutate()} disabled={createConversation.isPending}>
              <Plus className="h-4 w-4 mr-1" /> New conversation
            </Button>
            <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close list"><X className="h-4 w-4" /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {(conversations.data ?? []).map((c) => (
              <div key={c.id} className={cn('group flex items-center rounded-lg text-sm', activeId === c.id ? 'bg-white shadow-sm' : 'hover:bg-white/60')}>
                <button className="flex-1 min-w-0 text-left px-3 py-2 text-[#453329] truncate" onClick={() => { setActiveId(c.id); setSidebarOpen(false); }} title={c.title}>
                  {c.title}
                </button>
                <button
                  className="p-2 text-[#9a8b7c] opacity-0 group-hover:opacity-100 hover:text-[#c4622d]"
                  aria-label="Delete conversation"
                  onClick={() => { if (confirm('Delete this conversation? Applied changes stay on the site.')) deleteConversation.mutate(c.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {conversations.data?.length === 0 && (
              <p className="text-xs text-[#688a52] px-3 py-4">Your conversations will appear here.</p>
            )}
          </div>
          {access && (
            <div className="p-3 border-t border-[#d5cabe] text-[11px] text-[#688a52]">
              {access.isOwner
                ? <>Site owner · {access.usedThisMonth} request{access.usedThisMonth === 1 ? '' : 's'} this month</>
                : access.membership?.monthlyRequestLimit != null
                  ? <>{access.membership.planLabel} plan · {access.usedThisMonth} of {access.membership.monthlyRequestLimit} requests used · renews {new Date(access.renewsOn).toLocaleDateString()}</>
                  : <>{access.membership?.planLabel ?? 'Member'} · {access.usedThisMonth} request{access.usedThisMonth === 1 ? '' : 's'} this month</>}
            </div>
          )}
        </aside>

        {/* Chat */}
        <section className="flex-1 min-w-0 flex flex-col">
          <header className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-[#d5cabe] bg-[#f5efe5]">
            <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Show conversations"><MessageSquarePlus className="h-5 w-5" /></Button>
            <Sparkles className="h-5 w-5 text-[#c4622d]" />
            <div className="min-w-0">
              <h1 className="text-xl font-serif font-semibold text-[#453329] leading-tight">Site Assistant</h1>
              <p className="text-xs text-[#688a52]">Ask in plain English. Nothing changes until you click Apply.</p>
            </div>
          </header>

          {!configured && (
            <div className="mx-4 sm:mx-6 mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              The assistant is not set up yet. The site owner needs to add the ANTHROPIC_API_KEY setting on the server.
            </div>
          )}
          {access && blocked && (
            <div className="mx-4 sm:mx-6 mt-4">
              <RequestAccessPanel access={access} plans={plans} compact onDone={() => qc.invalidateQueries({ queryKey: ['assistant-status'] })} />
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {items.length === 0 && !liveText && (
                <Welcome onPick={(s) => setDraft(s)} />
              )}
              {items.map((item, i) => (
                <TranscriptRow key={i} item={item} action={item.kind === 'action' ? actionsById[item.actionId] : undefined}
                  onDecide={(id, apply) => decideAction.mutate({ id, apply })} deciding={decideAction.isPending} />
              ))}
              {liveText && <AssistantBubble text={liveText} streaming />}
              {streaming && !liveText && (
                <div className="flex items-center gap-2 text-sm text-[#688a52]"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <form onSubmit={onSubmit} className="border-t border-[#d5cabe] bg-[#f5efe5] px-4 sm:px-6 py-3">
            <div className="max-w-3xl mx-auto flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={!configured ? 'Assistant not available yet' : blocked ? 'Your plan has no requests left this month' : 'Ask the assistant to look something up or change the website…'}
                disabled={!canType}
                rows={2}
                className="flex-1 resize-none bg-white border-[#d5cabe] focus-visible:ring-[#c4622d]"
              />
              {streaming ? (
                <Button type="button" variant="outline" onClick={() => abortRef.current?.abort()} className="border-[#d5cabe]">Stop</Button>
              ) : (
                <Button type="submit" disabled={!draft.trim() || !canType} className="bg-[#c4622d] hover:bg-[#a9521f] text-white" aria-label="Send">
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="max-w-3xl mx-auto mt-1.5 text-[11px] text-[#9a8b7c]">Enter to send, Shift+Enter for a new line. The assistant can make mistakes; read each change before applying it.</p>
          </form>
        </section>
      </div>
    </StudioLayout>
  );
}

function RequestAccessPanel({ access, plans, compact, onDone }: { access: AssistantAccess; plans: AssistantPlan[]; compact?: boolean; onDone: () => void }) {
  const { toast } = useToast();
  const [plan, setPlan] = useState(plans[1]?.id ?? plans[0]?.id ?? 'starter');
  const [note, setNote] = useState('');
  const request = useMutation({
    mutationFn: () => assistantApi.requestAccess(plan, note),
    onSuccess: () => { toast({ title: 'Request sent', description: 'The site owner will review it.' }); setNote(''); onDone(); },
    onError: (e: Error) => toast({ title: 'Could not send the request', description: e.message, variant: 'destructive' }),
  });
  return (
    <div className={cn('rounded-xl border border-[#d4a44c] bg-[#fff8e8] p-4', !compact && 'p-5')}>
      <p className="text-sm text-[#453329]">{access.message}</p>
      {access.pendingRequest ? (
        <p className="mt-3 text-sm text-[#688a52]">
          Your request for the <strong>{plans.find((p) => p.id === access.pendingRequest!.requestedPlan)?.label ?? access.pendingRequest.requestedPlan}</strong> plan
          was sent {new Date(access.pendingRequest.createdAt).toLocaleDateString()} and is waiting for the site owner.
        </p>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); request.mutate(); }}>
          <div className={cn('grid gap-2', compact ? 'sm:grid-cols-3' : 'sm:grid-cols-3')}>
            {plans.map((p) => (
              <label key={p.id} className={cn('cursor-pointer rounded-lg border bg-white p-3 text-sm', plan === p.id ? 'border-[#c4622d] ring-1 ring-[#c4622d]' : 'border-[#d5cabe]')}>
                <input type="radio" name="plan" value={p.id} checked={plan === p.id} onChange={() => setPlan(p.id)} className="sr-only" />
                <span className="block font-medium text-[#453329]">{p.label}</span>
                <span className="block text-xs text-[#688a52]">{p.monthlyRequests == null ? 'Unlimited' : `${p.monthlyRequests} requests a month`}</span>
                {!compact && <span className="mt-1 block text-xs text-[#453329]/75">{p.blurb}</span>}
              </label>
            ))}
          </div>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000}
            placeholder="Optional note for the site owner (what you plan to use it for)" className="bg-white border-[#d5cabe]" />
          <Button type="submit" disabled={request.isPending} className="bg-[#c4622d] hover:bg-[#a9521f] text-white">
            {request.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : access.reason === 'limit_reached' ? 'Request more' : 'Request access'}
          </Button>
        </form>
      )}
    </div>
  );
}

function Welcome({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="rounded-xl border border-[#d5cabe] bg-[#eee6d8] p-5">
      <h2 className="font-serif text-lg text-[#453329]">What can I help with?</h2>
      <p className="text-sm text-[#453329]/80 mt-1">
        I can look things up and propose changes to published pages, moderation, galleries, students, teams, jobs and class cycles.
        Each change shows up as a card for you to apply or skip.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {STARTERS.map((s) => (
          <button key={s} type="button" onClick={() => onPick(s)}
            className="text-left text-sm rounded-lg border border-[#d5cabe] bg-white px-3 py-2 text-[#453329] hover:border-[#c4622d]">
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function TranscriptRow({ item, action, onDecide, deciding }: {
  item: TranscriptItem; action?: AssistantAction;
  onDecide: (id: number, apply: boolean) => void; deciding: boolean;
}) {
  switch (item.kind) {
    case 'user':
      return (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#453329] text-[#f5efe5] px-4 py-2.5 text-sm whitespace-pre-wrap">{item.text}</div>
        </div>
      );
    case 'assistant':
      return <AssistantBubble text={item.text} />;
    case 'tool':
      return (
        <div className="flex items-center gap-2 text-xs text-[#688a52] pl-1">
          <Search className="h-3.5 w-3.5" />
          <span>{item.summary}</span>
          {!item.ok && <span className="text-red-700">(failed)</span>}
        </div>
      );
    case 'action':
      return action ? <ActionCard action={action} onDecide={onDecide} deciding={deciding} /> : null;
    case 'error':
      return (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />{item.text}
        </div>
      );
  }
}

function AssistantBubble({ text, streaming }: { text: string; streaming?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="h-7 w-7 flex-shrink-0 rounded-full bg-[#c4622d]/15 text-[#c4622d] flex items-center justify-center mt-0.5"><Sparkles className="h-4 w-4" /></div>
      <div className={cn('min-w-0 flex-1 text-sm text-[#453329] leading-relaxed', streaming && 'after:inline-block after:w-1.5 after:h-4 after:ml-0.5 after:align-text-bottom after:bg-[#c4622d] after:animate-pulse')}>
        <SimpleMarkdown text={text} />
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<AssistantAction['status'], string> = {
  pending: 'border-[#d4a44c] bg-[#fff8e8]',
  applied: 'border-emerald-300 bg-emerald-50',
  declined: 'border-[#d5cabe] bg-[#f5efe5] opacity-75',
  failed: 'border-red-300 bg-red-50',
};

function ActionCard({ action, onDecide, deciding }: { action: AssistantAction; onDecide: (id: number, apply: boolean) => void; deciding: boolean }) {
  const [open, setOpen] = useState(false);
  const details = useMemo(() => JSON.stringify(action.input, null, 2), [action.input]);
  return (
    <div className={cn('ml-10 rounded-xl border p-3', STATUS_STYLES[action.status])}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#453329]">{action.summary}</p>
          <p className="text-[11px] text-[#688a52] mt-0.5">
            {action.status === 'pending' && 'Proposed change — not applied yet'}
            {action.status === 'applied' && <><Check className="inline h-3 w-3 mr-1" />Applied {action.decidedAt ? new Date(action.decidedAt).toLocaleString() : ''}</>}
            {action.status === 'declined' && 'Skipped'}
            {action.status === 'failed' && <span className="text-red-700">Failed: {action.error}</span>}
          </p>
        </div>
        {action.status === 'pending' && (
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" className="border-[#d5cabe] bg-white" disabled={deciding} onClick={() => onDecide(action.id, false)}>Skip</Button>
            <Button size="sm" className="bg-[#688a52] hover:bg-[#577544] text-white" disabled={deciding} onClick={() => onDecide(action.id, true)}>
              {deciding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" />Apply</>}
            </Button>
          </div>
        )}
      </div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="mt-2 flex items-center gap-1 text-[11px] text-[#688a52] hover:text-[#453329]">
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />} Details
      </button>
      {open && (
        <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-white/70 p-2 text-[11px] text-[#453329] whitespace-pre-wrap break-words">{details}</pre>
      )}
    </div>
  );
}

/** Renders the small subset of Markdown the assistant uses: paragraphs, lists, bold, inline code. */
function SimpleMarkdown({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter((l) => l.trim());
        if (lines.length === 0) return null;
        if (lines.every((l) => /^\s*>/.test(l))) {
          const inner = lines.map((l) => l.replace(/^\s*>\s?/, '')).join('\n');
          return (
            <blockquote key={i} className="border-l-2 border-[#c4622d]/50 pl-3 text-[#453329]/90">
              <SimpleMarkdown text={inner} />
            </blockquote>
          );
        }
        if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
          return <ul key={i} className="list-disc pl-5 space-y-0.5">{lines.map((l, j) => <li key={j}><Inline text={l.replace(/^\s*[-*•]\s+/, '')} /></li>)}</ul>;
        }
        if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
          return <ol key={i} className="list-decimal pl-5 space-y-0.5">{lines.map((l, j) => <li key={j}><Inline text={l.replace(/^\s*\d+[.)]\s+/, '')} /></li>)}</ol>;
        }
        const heading = /^#{1,3}\s+(.*)$/.exec(block.trim());
        if (heading) return <p key={i} className="font-semibold">{heading[1]}</p>;
        return <p key={i} className="whitespace-pre-wrap"><Inline text={block} /></p>;
      })}
    </div>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (/^`[^`]+`$/.test(part)) return <code key={i} className="rounded bg-[#eee6d8] px-1 py-0.5 text-[12px]">{part.slice(1, -1)}</code>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
