import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/mind-matters-ds/components/ui/alert-dialog';
import { Input } from '@workspace/mind-matters-ds/components/ui/input';
import { Button } from '@workspace/mind-matters-ds/components/ui/button';

/**
 * School access code gate. When the hub has a code set (Command Center →
 * Settings → School access code, or HUB_ACCESS_CODE on the server), nothing
 * loads until the visitor types it. The server keeps a six-month cookie, so
 * this shows once per browser, and again whenever the teacher changes the code.
 */
type Status = 'checking' | 'open' | 'locked';

export function HubAccessGate({ children }: { children?: ReactNode }) {
  const [status, setStatus] = useState<Status>('checking');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/hub-access', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { granted: true }))
      .then((body: { granted?: boolean }) => {
        if (!cancelled) setStatus(body.granted === false ? 'locked' : 'open');
      })
      .catch(() => {
        if (!cancelled) setStatus('open');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/hub-access', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body = (await res.json().catch(() => ({}))) as { granted?: boolean; error?: string };
      if (res.ok && body.granted) {
        window.location.reload();
        return;
      }
      setError(body.error ?? 'That code did not match.');
    } catch {
      setError('We could not reach the hub. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (status === 'open') return <>{children}</>;

  return (
    <div className="min-h-screen bg-background">
      <AlertDialog open={status === 'locked'}>
        <AlertDialogContent
          className="w-[calc(100%-2rem)] max-w-md rounded-3xl border-border bg-background p-6 sm:p-8"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <form onSubmit={submit} className="space-y-5">
            <AlertDialogHeader className="text-left">
              <AlertDialogTitle className="font-display text-3xl font-bold leading-tight text-foreground">
                Welcome to your school&rsquo;s hub
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-relaxed text-foreground/80">
                This website is just for our school community. Type the school code your teacher gave you to come in.
                You only need to do this once on this device.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <label htmlFor="hub-access-code" className="text-sm font-bold text-foreground">
                School code
              </label>
              <Input
                id="hub-access-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                autoFocus
                placeholder="LINCOLN-2026"
                className="h-12 rounded-full border-border bg-background px-5 font-mono text-lg tracking-wider"
              />
              {error && (
                <p role="alert" className="text-sm font-semibold text-destructive">
                  {error}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={busy || code.trim().length < 4}
              className="w-full rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground hover:bg-primary/90"
            >
              {busy ? 'Checking…' : 'Enter the hub'}
            </Button>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
