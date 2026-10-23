import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetPlantJournalQueryKey,
  useCreatePlantObservation,
  useGetPlantJournal,
  useUpdatePlantObservation,
  type PlantJournal,
  type PlantObservation,
} from "@workspace/api-client-react";
import { Alert, AlertDescription, AlertTitle } from "@workspace/mind-matters-ds/components/ui/alert";
import { Badge } from "@workspace/mind-matters-ds/components/ui/badge";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card, CardContent, CardHeader } from "@workspace/mind-matters-ds/components/ui/card";
import { Input } from "@workspace/mind-matters-ds/components/ui/input";
import { Label } from "@workspace/mind-matters-ds/components/ui/label";
import { Skeleton } from "@workspace/mind-matters-ds/components/ui/skeleton";
import { Textarea } from "@workspace/mind-matters-ds/components/ui/textarea";

type FormState = { date: string; nickname: string; heightCm: string; leafCount: string; observations: string };

function today() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const emptyForm = (): FormState => ({ date: today(), nickname: "", heightCm: "", leafCount: "", observations: "" });

function isRealDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const dt = new Date(`${value}T00:00:00Z`);
  return value >= "0001-01-01" && Number.isFinite(dt.getTime()) && dt.toISOString().slice(0, 10) === value;
}

function validate(f: FormState): string | null {
  if (!isRealDate(f.date)) return "Please choose a real calendar date.";
  const nick = f.nickname.trim();
  if (nick.length < 1 || nick.length > 80) return "Plant nickname must be 1 to 80 characters.";
  if (f.heightCm.trim() !== "") {
    const h = Number(f.heightCm);
    if (!Number.isFinite(h) || h < 0 || h > 100000) return "Height must be between 0 and 100000 cm.";
  }
  if (f.leafCount.trim() !== "") {
    const l = Number(f.leafCount);
    if (!Number.isInteger(l) || l < 0 || l > 100000) return "Leaf count must be a whole number from 0 to 100000.";
  }
  if (f.observations.length > 1000) return "Notes must be 1000 characters or fewer.";
  return null;
}

function statusOf(err: unknown): number | undefined {
  return typeof err === "object" && err !== null && "status" in err ? Number((err as { status: unknown }).status) : undefined;
}

function JournalEditor({ journal, ownerId, isFetching, refetch }: {
  journal: PlantJournal; ownerId: string; isFetching: boolean; refetch: () => Promise<{ data?: PlantJournal; isError: boolean }>;
}) {
  const queryClient = useQueryClient();
  const createMutation = useCreatePlantObservation();
  const updateMutation = useUpdatePlantObservation();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const busy = createMutation.isPending || updateMutation.isPending || isFetching;

  const set = (key: keyof FormState) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  function reset() {
    setForm(emptyForm());
    setEditingId(null);
    setError(null);
  }

  async function startEdit(entry: PlantObservation) {
    setNotice(null);
    const fresh = await refetch();
    if (fresh.isError || fresh.data?.ownerId !== ownerId) return;
    const current = fresh.data.entries.find((item) => item.id === entry.id);
    if (!current) {
      setError("This observation is no longer available. Your journal has been refreshed.");
      return;
    }
    setEditingId(current.id);
    setError(null);
    setForm({
      date: current.date,
      nickname: current.nickname,
      heightCm: current.heightCm === null ? "" : String(current.heightCm),
      leafCount: current.leafCount === null ? "" : String(current.leafCount),
      observations: current.observations,
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const problem = validate(form);
    if (problem) { setError(problem); return; }
    setError(null);
    setNotice(null);
    const data = {
      ownerId,
      date: form.date,
      nickname: form.nickname.trim(),
      heightCm: form.heightCm.trim() === "" ? null : Number(form.heightCm),
      leafCount: form.leafCount.trim() === "" ? null : Number(form.leafCount),
      observations: form.observations,
    };
    const onError = (err: unknown) => {
      if (statusOf(err) === 409) {
        reset();
        setNotice("The signed-in private account changed. Your journal was reloaded for the current account.");
        void queryClient.resetQueries({ queryKey: getGetPlantJournalQueryKey() });
        return;
      }
      setError(statusOf(err) === 400 ? "Some details were not accepted. Please check them and try again." : "Could not save right now. Your entry is still here; please try again.");
    };
    const onSuccess = (saved: PlantObservation) => {
      queryClient.setQueryData<PlantJournal>(getGetPlantJournalQueryKey(), (old) => {
        if (!old || old.ownerId !== ownerId) return old;
        const others = old.entries.filter((x) => x.id !== saved.id);
        return { ...old, entries: [saved, ...others] };
      });
      setNotice(editingId === null ? "Observation saved." : "Changes saved.");
      setForm(emptyForm());
      setEditingId(null);
    };
    if (editingId === null) createMutation.mutate({ data }, { onSuccess, onError });
    else updateMutation.mutate({ id: editingId, data }, { onSuccess, onError });
  }

  const entries = [...journal.entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
  const accountLabel = journal.accessKind === "journal"
    ? "You are using your private Journal account. Use this same private Journal login when you come back."
    : "You are using your own individual account. Use this same login when you come back.";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground" data-testid="text-plant-journal-account">{accountLabel}</p>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border/60 bg-background/75 p-4" data-testid="form-plant-observation">
        <fieldset disabled={busy} className="space-y-4">
        <h3 className="font-semibold">{editingId === null ? "Add an observation" : "Edit observation"}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="plant-date">Date</Label>
            <Input id="plant-date" type="date" required value={form.date} onChange={(e) => set("date")(e.target.value)} data-testid="input-plant-date" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="plant-nickname">Plant nickname</Label>
            <Input id="plant-nickname" required maxLength={80} value={form.nickname} onChange={(e) => set("nickname")(e.target.value)} placeholder="Sunny the bean" data-testid="input-plant-nickname" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="plant-height">Height in cm (optional)</Label>
            <Input id="plant-height" type="number" min={0} max={100000} step="any" inputMode="decimal" value={form.heightCm} onChange={(e) => set("heightCm")(e.target.value)} data-testid="input-plant-height" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="plant-leaves">Number of leaves (optional)</Label>
            <Input id="plant-leaves" type="number" min={0} max={100000} step={1} inputMode="numeric" value={form.leafCount} onChange={(e) => set("leafCount")(e.target.value)} data-testid="input-plant-leaves" />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="plant-notes">What did you notice? (optional)</Label>
          <Textarea id="plant-notes" maxLength={1000} value={form.observations} onChange={(e) => set("observations")(e.target.value)} placeholder="New leaf, soil looks dry..." data-testid="input-plant-notes" />
          <p className="text-xs text-muted-foreground">{form.observations.length}/1000</p>
        </div>
        {error && (
          <Alert variant="destructive" data-testid="status-plant-save-error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {notice && <p className="text-sm text-muted-foreground" role="status" data-testid="status-plant-notice">{notice}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy} data-testid="button-save-plant-observation">
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingId === null ? "Save observation" : "Save changes"}
          </Button>
          {editingId !== null && (
            <Button type="button" variant="outline" disabled={createMutation.isPending || updateMutation.isPending} onClick={reset} data-testid="button-cancel-plant-edit">
              Cancel
            </Button>
          )}
        </div>
        </fieldset>
      </form>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center" data-testid="status-plant-journal-empty">
          <p className="font-semibold">No observations yet</p>
          <p className="text-sm text-muted-foreground">Add your first one above, then come back over several days to see your plant grow.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/75 p-3 sm:flex-row sm:items-start sm:justify-between" data-testid={`row-plant-observation-${entry.id}`}>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{entry.nickname}</span>
                  <Badge variant="outline">{entry.date}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Height: {entry.heightCm === null ? "not measured" : `${entry.heightCm} cm`} · Leaves: {entry.leafCount === null ? "not counted" : entry.leafCount}
                </p>
                {entry.observations && <p className="text-sm">{entry.observations}</p>}
              </div>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void startEdit(entry)} data-testid={`button-edit-plant-observation-${entry.id}`}>
                Edit
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PlantGrowthJournal() {
  const query = useGetPlantJournal({
    query: {
      queryKey: getGetPlantJournalQueryKey(),
      gcTime: 0,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: "always",
    },
  });
  const { data, isLoading, isError, isFetching, refetch } = query;
  const settled = !isLoading && !isError && !!data;

  return (
    <Card className="border-secondary/30 bg-secondary/10" data-testid="card-plant-growth-journal">
      <CardHeader className="gap-3 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-serif text-2xl font-semibold italic">Plant growth journal</h2>
          <Badge variant="secondary">Optional</Badge>
          <Badge variant="outline">Private and saved</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Track one or more plants over several days. Unlike the activities above, these entries are saved to your private account and only you can see them.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading || isFetching ? (
          <div className="space-y-3" data-testid="status-plant-journal-loading">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : isError ? (
          <Alert variant="destructive" data-testid="status-plant-journal-error">
            <AlertTitle>Could not load your plant journal</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>Something went wrong loading your saved entries. This is not a sign-in problem.</p>
              <Button size="sm" variant="outline" disabled={isFetching} onClick={() => void refetch()} data-testid="button-retry-plant-journal">
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : settled && data.ownerId === null ? (
          <div className="space-y-3 rounded-xl border border-border/60 bg-background/75 p-4" data-testid="status-plant-journal-signed-out">
            <p className="font-semibold">Sign in to your private Journal to keep a plant journal</p>
            <p className="text-sm text-muted-foreground">
              Use your own private Journal login. A shared Studio group login cannot save private plant entries. Everything else on this page works without signing in.
            </p>
            <Button asChild>
              <Link href="/anonymous-access?returnTo=/gardening" data-testid="link-plant-journal-login">Open my private Journal</Link>
            </Button>
          </div>
        ) : null}
        {data?.ownerId && (
          <div hidden={isFetching || isError}>
            <JournalEditor key={data.ownerId} journal={data} ownerId={data.ownerId} isFetching={isFetching} refetch={refetch} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
