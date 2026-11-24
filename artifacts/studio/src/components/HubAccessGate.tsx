import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/mind-matters-ds/components/ui/card';
import { Button } from '@workspace/mind-matters-ds/components/ui/button';
import { Input } from '@workspace/mind-matters-ds/components/ui/input';
import { Label } from '@workspace/mind-matters-ds/components/ui/label';

/**
 * School access code gate for the Student Studio. Same rule as the main site:
 * when the hub has a code, the login page waits until the visitor types it.
 * Teachers and students who are already signed in are let through by the server.
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
  if (status === 'checking') return <div className="min-h-screen bg-[#f5efe5]" />;

  return (
    <div className="min-h-screen bg-[#f5efe5] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-[#d5cabe] shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-[#c4622d]">
            <KeyRound className="h-5 w-5" />
            <CardTitle className="font-serif text-[#453329]">School code</CardTitle>
          </div>
          <CardDescription className="text-[#453329]/80">
            This Studio belongs to our school. Type the school code from your teacher to reach the sign-in page.
            You only need to do this once on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hub-access-code">School code</Label>
              <Input
                id="hub-access-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                autoFocus
                placeholder="LINCOLN-2026"
                className="font-mono tracking-wider"
              />
              {error && (
                <p role="alert" className="text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={busy || code.trim().length < 4}
              className="w-full bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full"
            >
              {busy ? 'Checking…' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
