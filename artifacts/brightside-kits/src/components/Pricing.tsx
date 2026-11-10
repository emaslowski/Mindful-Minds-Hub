import clsx from 'clsx';

import { ButtonLink, Check } from './ui';
import { KITS, SITE, formatPrice, type Kit } from '@/config';

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
            'relative flex flex-col rounded-[2rem] border bg-paper p-7 shadow-card',
            kit.highlight ? 'border-mustard ring-4 ring-mustard/25 lg:-my-3 lg:py-10' : 'border-cocoa/10',
          )}
        >
          {kit.highlight && (
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-mustard px-4 py-1 font-display text-sm font-semibold text-cocoa shadow">
              Most popular
            </span>
          )}
          <h3 className="font-display text-2xl font-semibold text-cocoa">{kit.name}</h3>
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
