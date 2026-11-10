import { Link } from 'wouter';

import { Container, Heart } from './ui';
import { SITE } from '@/config';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-cocoa/10 bg-cream-deep/60">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <img src="/logo.png" alt={SITE.name} width={1000} height={796} className="h-28 w-auto" />
          <p className="mt-4 max-w-sm text-cocoa-soft">
            Learning kits that help students learn, create, connect and belong. Built by educators,
            shaped by students.
          </p>
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-cocoa">Explore</h3>
          <ul className="mt-3 space-y-2 text-cocoa-soft">
            <li><Link href="/#inside" className="hover:text-cocoa">What's inside</Link></li>
            <li><Link href="/#hub" className="hover:text-cocoa">The hub</Link></li>
            <li><Link href="/kits" className="hover:text-cocoa">Kits & pricing</Link></li>
            <li><Link href="/#faq" className="hover:text-cocoa">FAQ</Link></li>
            <li><Link href="/order" className="hover:text-cocoa">Order a kit</Link></li>
            <li><Link href="/school-login" className="hover:text-cocoa">School login</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-cocoa">Contact</h3>
          <ul className="mt-3 space-y-2 text-cocoa-soft">
            <li><a href={`mailto:${SITE.contactEmail}`} className="hover:text-cocoa">{SITE.contactEmail}</a></li>
            <li><a href={SITE.hubUrl} target="_blank" rel="noreferrer" className="hover:text-cocoa">Visit {SITE.hubName}</a></li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-cocoa/10">
        <Container className="flex flex-col gap-2 py-5 text-sm text-cocoa-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with <Heart className="h-4 w-4" /> for students and teachers.
          </p>
        </Container>
      </div>
    </footer>
  );
}
