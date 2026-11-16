import { CheckCircle2, Sparkles } from 'lucide-react';

import { ButtonLink, Eyebrow, Heading } from '@/components/ui';
import { ASSISTANT, SITE, formatPrice, type Kit } from '@/config';

const EXAMPLES = [
  '“Approve the three projects waiting for review and publish them under the Student Wellness Team.”',
  '“Add a Family Night event on March 12 at 6 pm.”',
  '“Which students still owe a draft this cycle?”',
  '“Change the welcome message on the home page to…”',
];

/** The Site Assistant plans, sold as a 12-month add-on to any kit. */
export function AssistantAddOn({ kit = 'school', compact = false }: { kit?: Kit['id']; compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-cocoa/10 bg-paper p-7 shadow-card sm:p-10">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div>
          <Eyebrow tone="sage">Add to any kit</Eyebrow>
          <Heading className="mt-2">{ASSISTANT.title}</Heading>
          <p className="mt-1 font-display text-lg font-semibold text-cocoa-soft">{ASSISTANT.tagline}</p>
          <p className="mt-4 text-lg leading-relaxed text-cocoa-soft">{ASSISTANT.summary}</p>
          {!compact && (
            <ul className="mt-5 space-y-2 text-[15px] text-cocoa">
              {EXAMPLES.map((e) => (
                <li key={e} className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-mustard" aria-hidden="true" />
                  <span className="italic">{e}</span>
                </li>
              ))}
            </ul>
          )}
          <ul className="mt-5 grid gap-2 text-sm text-cocoa sm:grid-cols-2">
            {[
              'Every change is previewed before it is applied',
              'Teachers stay in charge of what goes live',
              `Covers every teacher at the school for ${ASSISTANT.termMonths} months`,
              `Included in ${SITE.hubName} at no extra setup`,
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          {ASSISTANT.plans.map((p) => (
            <article key={p.id} className="rounded-2xl border border-cocoa/10 bg-cream p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-2xl font-semibold text-cocoa">{p.name}</h3>
                <p className="font-display text-3xl font-semibold text-cocoa">
                  +{formatPrice(p.price)}
                  <span className="ml-1 text-sm font-normal text-cocoa-soft">/ {ASSISTANT.termMonths} months</span>
                </p>
              </div>
              <p className="mt-1 font-semibold text-cocoa">{p.requestsPerMonth} requests a month</p>
              <p className="mt-1 text-cocoa-soft">{p.blurb}</p>
              <p className="mt-2 text-sm text-cocoa">
                <span className="font-semibold">Best for:</span> {p.bestFor}
              </p>
              <ButtonLink href={`/order?kit=${kit}&assistant=${p.id}`} variant="dark" className="mt-4">
                Add {p.name} to my order
              </ButtonLink>
            </article>
          ))}
          <p className="text-sm text-cocoa-soft">{ASSISTANT.note}</p>
        </div>
      </div>
    </div>
  );
}
