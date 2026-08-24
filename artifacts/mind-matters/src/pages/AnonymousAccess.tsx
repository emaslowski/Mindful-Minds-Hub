import { useState } from 'react';
import { Link, useSearch } from 'wouter';
import { KeyRound, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { WaveFooter } from '@/components/WaveFooter';

function getSafeReturnTo(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/grow/journal';
}

export default function AnonymousAccess() {
  const search = useSearch();
  const returnTo = getSafeReturnTo(new URLSearchParams(search).get('returnTo'));
  const [requestCode, setRequestCode] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [grade, setGrade] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  async function requestAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequesting(true);
    setRequestError(null);
    try {
      const response = await fetch('/api/anonymous-access/requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, grade }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? 'Unable to request access right now');
      setRequestCode(body.requestCode);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to request access right now');
    } finally {
      setRequesting(false);
    }
  }

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const response = await fetch('/api/anonymous-access/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? 'Unable to sign in');
      window.location.assign(returnTo);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Unable to sign in');
      setLoggingIn(false);
    }
  }

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative">
      <div className="w-full max-w-5xl mx-auto px-4 mb-24 z-10">
        <Link href="/grow">
          <button className="px-6 py-2 rounded-full border border-terracotta text-terracotta font-sans text-sm tracking-wide transition-all hover:bg-terracotta hover:text-white">
            ← Back to Grow
          </button>
        </Link>

        <div className="text-center max-w-3xl mx-auto mt-10 mb-10">
          <div className="inline-flex p-4 rounded-full bg-sage/15 text-sage mb-5">
            <ShieldCheck size={42} />
          </div>
          <h1 className="text-5xl md:text-6xl font-display italic text-foreground mb-4">
            Your private access
          </h1>
          <p className="font-sans text-lg text-foreground/70 leading-relaxed">
            Use a private code from your teacher to keep your journal and gratitude journal separate from your regular sign-in.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <section className="bg-card rounded-[2.5rem] p-8 border border-card-border shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <KeyRound className="text-terracotta" size={28} />
              <h2 className="font-display italic text-3xl text-foreground">I have a code</h2>
            </div>
            <p className="font-sans text-sm text-foreground/65 mb-6">
              Enter the anonymous access code and password your teacher gave you.
            </p>
            <form className="space-y-4" onSubmit={signIn}>
              <label className="block font-sans text-sm font-bold text-foreground/70">
                Access code
                <input
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                  autoComplete="username"
                  placeholder="MM-1234ABCD"
                  required
                  className="mt-2 w-full bg-white/70 border border-card-border rounded-2xl px-4 py-3 font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-sage/50"
                />
              </label>
              <label className="block font-sans text-sm font-bold text-foreground/70">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="mt-2 w-full bg-white/70 border border-card-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sage/50"
                />
              </label>
              {loginError && <p className="text-sm text-red-700 bg-red-50 rounded-xl p-3">{loginError}</p>}
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-sage hover:bg-sage/90 text-white px-6 py-3 rounded-full font-sans font-bold transition-colors disabled:opacity-60"
              >
                {loggingIn ? 'Signing in…' : 'Open my journal'}
              </button>
            </form>
          </section>

          <section className="bg-white/55 rounded-[2.5rem] p-8 border border-card-border shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <UserRoundCheck className="text-amber" size={28} />
              <h2 className="font-display italic text-3xl text-foreground">I need a code</h2>
            </div>
            {requestCode ? (
              <div className="space-y-5">
                <p className="font-sans text-foreground/75 leading-relaxed">
                  Your request is ready. Show this ID to your teacher so they can give you a code and password.
                </p>
                <div className="bg-amber/20 border border-amber/30 rounded-2xl p-5 text-center">
                  <p className="font-sans text-xs uppercase tracking-widest text-foreground/55 mb-2">Your request ID</p>
                  <p className="font-mono text-3xl font-bold tracking-widest text-foreground">{requestCode}</p>
                </div>
                <p className="font-sans text-sm text-foreground/60">
                  Your teacher will review these details, approve the request, and hand you your private sign-in details.
                </p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={requestAccess}>
                <p className="font-sans text-foreground/75 leading-relaxed">
                  Request private journal access by sharing these three details with your teacher: your first name, last name, and grade.
                </p>
                <label className="block font-sans text-sm font-bold text-foreground/70">
                  First name
                  <input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    autoComplete="given-name"
                    required
                    maxLength={100}
                    className="mt-2 w-full bg-white/70 border border-card-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sage/50"
                  />
                </label>
                <label className="block font-sans text-sm font-bold text-foreground/70">
                  Last name
                  <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    autoComplete="family-name"
                    required
                    maxLength={100}
                    className="mt-2 w-full bg-white/70 border border-card-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sage/50"
                  />
                </label>
                <label className="block font-sans text-sm font-bold text-foreground/70">
                  Grade
                  <select
                    value={grade}
                    onChange={(event) => setGrade(event.target.value)}
                    required
                    className="mt-2 w-full bg-white/70 border border-card-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sage/50"
                  >
                    <option value="">Select your grade</option>
                    <option>Kindergarten</option>
                    {Array.from({ length: 12 }, (_, index) => (
                      <option key={index + 1}>{index + 1}{index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'} grade</option>
                    ))}
                  </select>
                </label>
                {requestError && <p className="text-sm text-red-700 bg-red-50 rounded-xl p-3">{requestError}</p>}
                <button
                  type="submit"
                  disabled={requesting}
                  className="w-full border border-terracotta text-terracotta hover:bg-terracotta hover:text-white px-6 py-3 rounded-full font-sans font-bold transition-colors disabled:opacity-60"
                >
                  {requesting ? 'Creating request…' : 'Request anonymous access'}
                </button>
                <p className="font-sans text-xs text-foreground/55 text-center">
                  Your teacher receives an alert with these details when this request is created.
                </p>
              </form>
            )}
          </section>
        </div>
      </div>
      <WaveFooter quote="Your thoughts deserve a private place to land." />
    </div>
  );
}