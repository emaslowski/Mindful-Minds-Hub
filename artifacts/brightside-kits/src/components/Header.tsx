import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';
import clsx from 'clsx';

import { ButtonLink, Container } from './ui';
import { SITE } from '@/config';

const NAV = [
  { href: '/#inside', label: "What's inside" },
  { href: '/#hub', label: 'The hub' },
  { href: '/#pd', label: 'Professional development' },
  { href: '/kits', label: 'Kits & pricing' },
  { href: '/#faq', label: 'FAQ' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-cocoa/10 bg-cream/85 backdrop-blur">
      <Container className="flex h-18 items-center justify-between gap-4 py-2">
        <Link href="/" className="flex items-center gap-3" aria-label={`${SITE.name} home`} onClick={() => setOpen(false)}>
          <img src="/logo.png" alt="" width={1000} height={796} className="h-12 w-auto" />
          <span className="font-display text-base font-bold leading-tight text-cocoa sm:text-lg">
            The Brightside
            <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-coral">Wellness Project</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'font-display text-[15px] font-medium text-cocoa-soft transition hover:text-cocoa',
                location === item.href && 'text-cocoa',
              )}
            >
              {item.label}
            </Link>
          ))}
          <ButtonLink href="/school-login" size="md" variant="ghost">School login</ButtonLink>
          <ButtonLink href="/order" size="md">Order a kit</ButtonLink>
        </nav>

        <button
          type="button"
          className="rounded-full p-2 text-cocoa lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </Container>

      {open && (
        <nav id="mobile-nav" className="border-t border-cocoa/10 bg-cream lg:hidden" aria-label="Main">
          <Container className="flex flex-col gap-1 py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 font-display text-lg font-medium text-cocoa hover:bg-paper"
              >
                {item.label}
              </Link>
            ))}
            <ButtonLink href="/school-login" className="mt-2" variant="ghost" onClick={() => setOpen(false)}>
              School login
            </ButtonLink>
            <ButtonLink href="/order" className="mt-2" onClick={() => setOpen(false)}>
              Order a kit
            </ButtonLink>
          </Container>
        </nav>
      )}
    </header>
  );
}
