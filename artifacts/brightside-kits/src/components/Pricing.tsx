import clsx from 'clsx';
import { BadgePercent, CalendarDays, MapPin, Users } from 'lucide-react';

import { ButtonLink, Check, Eyebrow, Heading } from './ui';
import { KITS, LAUNCH_OFFER, PD, SITE, formatPrice, pdPresenter, type Kit } from '@/config';

export function buyHref(kit: Kit): string {
  return kit.checkoutUrl || `/order?kit=${kit.id}`;
}

export function buyLabel(kit: Kit): string {
  if (kit.price === null) return 'Request a quote';
  return kit.checkoutUrl ? 'Buy now' : 'Order this kit';
}

export function PricingGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
      {KITS.map((kit) => (
        <article
          key={kit.id}
          className={clsx(
            'relative flex flex-col rounded-2xl border bg-paper p-7 shadow-card',
            kit.highlight ? 'border-mustard ring-1 ring-mustard/40 lg:-my-3 lg:py-10' : 'border-cocoa/10',
          )}
        >
          {kit.highlight && (
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-mustard px-4 py-1 font-display text-sm font-semibold text-cocoa shadow">
              Most popular
            </span>
          )}
          {kit.id === 'district' && LAUNCH_OFFER.enabled && (
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-coral px-4 py-1 font-display text-sm font-semibold text-white shadow">
              First district: {LAUNCH_OFFER.discountPercent}% off
            </span>
          )}
          <h3 className="font-display text-2xl font-bold text-cocoa">{kit.name}</h3>
          <p className="mt-1 text-cocoa-soft">{kit.audience}</p>
          <p className="mt-5 flex items-baseline gap-2">
            <span className="font-display text-5xl font-semibold text-cocoa">{formatPrice(kit.price)}</span>
            {kit.price !== null && <span className="text-cocoa-soft">USD</span>}
          </p>
          <p className="mt-1 text-sm text-cocoa-soft">{kit.priceNote}</p>
          <dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-cream px-4 py-3 text-sm">
            <div>
              <dt className="text-cocoa-soft">Teachers</dt>
              <dd className="font-semibold text-cocoa">{kit.teachers}</dd>
            </div>
            <div>
              <dt className="text-cocoa-soft">Students</dt>
              <dd className="font-semibold text-cocoa">{kit.students}</dd>
            </div>
          </dl>
          {!compact && (
            <ul className="mt-5 space-y-2.5 text-[15px] text-cocoa">
              {kit.includes.map((line) => (
                <li key={line} className="flex gap-2.5">
                  <Check className="mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 rounded-xl border border-dashed border-mustard/60 bg-mustard-soft/40 px-3 py-2 text-sm text-cocoa">
            <span className="font-semibold">Add-on:</span> {PD.options[0].days} or {PD.options[1].days} days of on-site PD from{' '}
            {formatPrice(PD.options[0].price)}
          </p>
          <div className="mt-auto pt-7">
            <ButtonLink href={buyHref(kit)} variant={kit.highlight ? 'primary' : 'dark'} className="w-full">
              {buyLabel(kit)}
            </ButtonLink>
            <p className="mt-3 text-center text-xs text-cocoa-soft">
              {kit.price === null
                ? 'We reply within two school days.'
                : 'Purchase orders and card payments accepted.'}
            </p>
          </div>
        </article>
      ))}
      <p className="text-center text-sm text-cocoa-soft lg:col-span-3">
        Every kit includes {SITE.accessMonths} months of access to {SITE.hubName}. Renewals are available at a reduced rate.
      </p>
    </div>
  );
}

/** Callout for the launch discount. Renders nothing once the offer is disabled. */
export function FoundingOffer({ compact = false }: { compact?: boolean }) {
  if (!LAUNCH_OFFER.enabled) return null;
  return (
    <div className="rounded-2xl border border-coral/30 bg-peach-soft/50 p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-coral text-white">
            <BadgePercent className="h-6 w-6" />
          </span>
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-coral">Limited to one district</p>
            <h3 className="mt-1 font-display text-2xl font-bold text-cocoa">
              {LAUNCH_OFFER.name}: {LAUNCH_OFFER.discountPercent}% off for the first district to purchase
            </h3>
            <p className="mt-2 max-w-2xl text-cocoa-soft">{LAUNCH_OFFER.short} {LAUNCH_OFFER.fine}</p>
            {!compact && (
              <ul className="mt-4 grid gap-2 text-[15px] text-cocoa sm:grid-cols-2">
                {LAUNCH_OFFER.details.map((d) => (
                  <li key={d} className="flex gap-2.5">
                    <Check className="mt-0.5" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <ButtonLink href="/order?kit=district" className="shrink-0">Claim the Founding District offer</ButtonLink>
      </div>
    </div>
  );
}

/**
 * The professional-development add-on, shown under the pricing grid and on
 * the home page. `kit` preselects a kit when the buyer clicks through.
 */
export function PdAddOn({ kit = 'school', showAgenda = true }: { kit?: Kit['id']; showAgenda?: boolean }) {
  return (
    <div className="rounded-2xl border border-cocoa/10 bg-paper p-7 shadow-card sm:p-10">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div>
          <Eyebrow>Add to any kit</Eyebrow>
          <Heading className="mt-2">{PD.title}</Heading>
          <p className="mt-4 text-lg leading-relaxed text-cocoa-soft">
            Bring {pdPresenter()} to your school or district for two or three days of hands-on
            training. Teachers leave having taught the lessons, used the hub and planned their
            first month, and leaders leave with a rollout plan.
          </p>
          <ul className="mt-5 grid gap-3 text-[15px] text-cocoa sm:grid-cols-3">
            {[
              { icon: Users, text: PD.groupSize },
              { icon: MapPin, text: 'At your school or district office' },
              { icon: CalendarDays, text: 'Scheduled around your calendar' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-coral" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          {showAgenda && (
            <ol className="mt-7 space-y-4">
              {PD.days.map((d) => (
                <li key={d.day} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mustard font-display text-base font-bold text-cocoa">
                    {d.day}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-cocoa">{d.title}</h3>
                    <ul className="mt-1 space-y-1 text-sm text-cocoa-soft">
                      {d.points.map((p) => (
                        <li key={p} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mustard" aria-hidden="true" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="space-y-4">
          {PD.options.map((o) => (
            <article key={o.days} className="rounded-2xl border border-cocoa/10 bg-cream p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-2xl font-semibold text-cocoa">{o.name}</h3>
                <p className="font-display text-3xl font-semibold text-cocoa">
                  +{formatPrice(o.price)}
                  <span className="ml-1 text-sm font-normal text-cocoa-soft">USD</span>
                </p>
              </div>
              <p className="mt-2 text-cocoa-soft">{o.summary}</p>
              <p className="mt-2 text-sm text-cocoa">
                <span className="font-semibold">Best for:</span> {o.bestFor}
              </p>
              <ButtonLink href={`/order?kit=${kit}&pd=${o.days}`} variant={o.days === 3 ? 'primary' : 'dark'} className="mt-5 w-full">
                Add {o.days} days to my order
              </ButtonLink>
            </article>
          ))}
          <p className="text-sm text-cocoa-soft">{PD.travelNote}</p>
        </div>
      </div>
    </div>
  );
}
