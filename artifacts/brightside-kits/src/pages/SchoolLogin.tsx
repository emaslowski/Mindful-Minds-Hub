import { useEffect, useState, type FormEvent } from 'react';
import { GraduationCap, KeyRound, LogOut, School, Users } from 'lucide-react';

import { Button, ButtonLink, Container, Eyebrow, Heading, Section } from '@/components/ui';
import { BrainMark } from '@/components/KitArt';
import { SITE } from '@/config';

interface SchoolInfo {
  name: string;
  hubUrl: string;
  studioUrl: string;
  note: string;
}

const STORAGE_KEY = 'brightside-kits:school';

function readSaved(): { code: string; school: SchoolInfo } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { code: string; school: SchoolInfo }) : null;
  } catch {
    return null;
  }
}

function save(code: string, school: SchoolInfo) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, school }));
  } catch {
    // Private browsing or storage blocked: the page still works for this visit.
  }
}

function clearSaved() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export default function SchoolLogin() {
  const [code, setCode] = useState('');
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `School login — ${SITE.name}`;
    const saved = readSaved();
    if (saved) {
      setCode(saved.code);
      setSchool(saved.school);
    }
    return () => {
      document.title = `${SITE.name} — Learning Kits for Schools`;
    };
  }, []);

  async function lookup(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Enter your school access code.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch(`${SITE.apiBaseUrl}/api/kits/schools/${encodeURIComponent(trimmed)}`);
      const data = (await res.json().catch(() => ({}))) as Partial<SchoolInfo> & { error?: string };
      if (!res.ok || !data.hubUrl || !data.name) {
        throw new Error(data.error ?? 'Something went wrong. Please try again.');
      }
      const info: SchoolInfo = { name: data.name, hubUrl: data.hubUrl, studioUrl: data.studioUrl ?? `${data.hubUrl}/studio/`, note: data.note ?? '' };
      save(trimmed.toUpperCase(), info);
      setSchool(info);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  function signOut() {
    clearSaved();
    setSchool(null);
    setCode('');
    setStatus('idle');
    setError(null);
  }

  return (
    <Section className="pt-10">
      <Container className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-start">
        <div>
          <Eyebrow>Already a Brightside school?</Eyebrow>
          <Heading as="h1" className="mt-2">Find your school's hub</Heading>
          <p className="mt-4 max-w-xl text-lg text-cocoa-soft">
            Every school that buys a kit gets its own hub address. Enter the access code from your
            welcome email to get your links for students and teachers.
          </p>

          {school ? (
            <div className="mt-10 rounded-2xl border border-mustard bg-paper p-7 shadow-card ring-1 ring-mustard/40">
              <div className="flex items-start gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-peach-soft">
                  <BrainMark size={44} />
                </span>
                <div>
                  <Eyebrow>Welcome back</Eyebrow>
                  <h2 className="mt-2 font-display text-3xl font-bold text-cocoa">{school.name}</h2>
                  {school.note && <p className="mt-2 text-cocoa-soft">{school.note}</p>}
                </div>
              </div>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <a
                  href={school.hubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-xl border-2 border-cocoa/10 bg-cream p-5 transition hover:border-coral"
                >
                  <Users className="h-7 w-7 text-coral" />
                  <span className="mt-3 block font-display text-xl font-semibold text-cocoa">Student site</span>
                  <span className="block text-sm text-cocoa-soft">Centers, stories, journaling and the Student Studio.</span>
                  <span className="mt-3 block break-all font-mono text-xs text-cocoa-soft group-hover:text-coral">{school.hubUrl}</span>
                </a>
                <a
                  href={school.studioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-xl border-2 border-cocoa/10 bg-cream p-5 transition hover:border-coral"
                >
                  <GraduationCap className="h-7 w-7 text-coral" />
                  <span className="mt-3 block font-display text-xl font-semibold text-cocoa">Teacher sign-in</span>
                  <span className="block text-sm text-cocoa-soft">Command Center: rosters, review queue, settings and the Site Assistant.</span>
                  <span className="mt-3 block break-all font-mono text-xs text-cocoa-soft group-hover:text-coral">{school.studioUrl}</span>
                </a>
              </div>
              <p className="mt-5 text-sm text-cocoa-soft">
                Teachers and students sign in on the hub with their school Google accounts.
              </p>
              <button
                type="button"
                onClick={signOut}
                className="mt-4 inline-flex items-center gap-2 font-display text-sm font-semibold text-cocoa-soft hover:text-cocoa"
              >
                <LogOut className="h-4 w-4" /> Not your school? Use a different code
              </button>
            </div>
          ) : (
            <form onSubmit={lookup} className="mt-10 rounded-2xl border border-cocoa/10 bg-paper p-7 shadow-card" noValidate>
              <label htmlFor="code" className="mb-1.5 block font-display text-[15px] font-semibold text-cocoa">
                School access code
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cocoa/40" />
                  <input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="e.g. BRIGHT-DEMO"
                    className="w-full rounded-2xl border border-cocoa/15 bg-cream py-3 pl-12 pr-4 font-mono text-lg uppercase tracking-wider text-cocoa placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-cocoa/40 focus:border-mustard"
                  />
                </div>
                <Button type="submit" size="lg" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Looking up…' : 'Find my hub'}
                </Button>
              </div>
              {error && (
                <p role="alert" className="mt-3 text-sm font-semibold text-coral">
                  {error}
                </p>
              )}
              <p className="mt-4 text-sm text-cocoa-soft">
                The code is in the welcome email we sent when your kit shipped. Try <span className="font-mono">BRIGHT-DEMO</span> to see the demo hub.
              </p>
            </form>
          )}
        </div>

        <aside className="rounded-2xl bg-cocoa p-7 text-cream shadow-soft">
          <School className="h-8 w-8 text-peach" />
          <h2 className="mt-3 font-display text-2xl font-semibold">Can't find your code?</h2>
          <ul className="mt-4 space-y-3 text-cream/85">
            <li>Check the welcome email sent to the contact on your order. It has your access code and both links.</li>
            <li>Ask the teacher or administrator who placed the order. Every school has one code.</li>
            <li>Email us from a school address and we will look it up for you.</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent('School access code')}`} variant="secondary">
              Email {SITE.contactEmail}
            </ButtonLink>
          </div>
          <p className="mt-6 border-t border-cream/15 pt-5 text-sm text-cream/70">
            Not a Brightside school yet? <a href="/kits" className="font-semibold text-mustard underline-offset-4 hover:underline">See the kits</a>.
          </p>
        </aside>
      </Container>
    </Section>
  );
}
