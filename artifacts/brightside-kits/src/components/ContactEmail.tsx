import { useState } from 'react';
import { Check, Copy, ExternalLink, Mail } from 'lucide-react';
import clsx from 'clsx';

import { SITE } from '@/config';

/**
 * The contact address with three ways to use it. A plain mailto: link only works
 * when the computer has a mail app set up, which school devices often do not,
 * so the address is shown as text with Copy, a Gmail web link, and the mail-app
 * link last.
 */
export function ContactEmail({ subject, tone = 'light', className }: { subject?: string; tone?: 'light' | 'dark'; className?: string }) {
  const [copied, setCopied] = useState(false);
  const email = SITE.contactEmail;
  const dark = tone === 'dark';
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}${subject ? `&su=${encodeURIComponent(subject)}` : ''}`;
  const mailto = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt('Copy this address:', email);
    }
  }

  const pill = clsx(
    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-display text-sm font-semibold transition',
    dark ? 'border-cream/30 text-cream hover:bg-cream/10' : 'border-cocoa/20 text-cocoa hover:border-coral hover:text-coral',
  );

  return (
    <div className={clsx('rounded-xl border p-4', dark ? 'border-cream/20 bg-cream/5 text-cream' : 'border-cocoa/10 bg-cream text-cocoa', className)}>
      <p className={clsx('text-xs font-bold uppercase tracking-[0.14em]', dark ? 'text-mustard' : 'text-coral')}>Email us</p>
      <p className="mt-1 select-all break-all font-mono text-base font-semibold sm:text-lg">{email}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className={pill} aria-live="polite">
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? 'Copied!' : 'Copy address'}
        </button>
        <a href={gmail} target="_blank" rel="noreferrer" className={pill}>
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> Open in Gmail
        </a>
        <a href={mailto} className={pill}>
          <Mail className="h-4 w-4" aria-hidden="true" /> Use my mail app
        </a>
      </div>
    </div>
  );
}
