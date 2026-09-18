import React, { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Heart,
  HeartHandshake,
  Headphones,
  Menu,
  Palette,
  Sprout,
  Wind,
  X,
} from "lucide-react";
import "./HomeRefinedVariant.css";

const categories = [
  { name: "Learn", desc: "Strategies & tips", path: "/learn", Icon: BookOpen, color: "var(--refined-sage)", tint: "rgba(117,146,99,.13)" },
  { name: "Create", desc: "Art & expression", path: "/create", Icon: Palette, color: "var(--refined-terracotta)", tint: "rgba(200,107,67,.12)" },
  { name: "Connect", desc: "Community posts", path: "/connect", Icon: HeartHandshake, color: "var(--refined-rose)", tint: "rgba(223,159,154,.2)" },
  { name: "Move", desc: "Mindful activity", path: "/move", Icon: Wind, color: "var(--refined-amber)", tint: "rgba(219,176,95,.18)" },
  { name: "Listen", desc: "Music & podcasts", path: "/listen", Icon: Headphones, color: "var(--refined-sage)", tint: "rgba(117,146,99,.13)" },
  { name: "Grow", desc: "Personal journey", path: "/grow", Icon: Sprout, color: "var(--refined-terracotta)", tint: "rgba(200,107,67,.12)" },
];

export default function HomeRefinedVariant() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="refined-home">
      <div className="refined-orbit" aria-hidden="true" />
      <nav className="refined-nav relative z-10 flex items-center justify-between px-6 py-5 md:px-12 md:py-6">
        <a href="/" className="flex items-center gap-3" aria-label="Mind Matters home">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--refined-terracotta)] text-[var(--refined-terracotta)]">
            <Heart size={17} strokeWidth={1.6} />
          </span>
          <span className="refined-display text-xl font-semibold italic tracking-wide md:text-2xl">Mind Matters</span>
        </a>
        <button type="button" className="refined-menu rounded-full p-3" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={18} strokeWidth={1.6} /> : <Menu size={18} strokeWidth={1.6} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="relative z-20 flex justify-end border-b border-[var(--refined-line)] bg-[var(--refined-paper)]/90 px-6 py-3 md:px-12">
          <div className="flex gap-5 text-sm text-[var(--refined-muted)]">
            <a href="/about" className="transition-colors hover:text-[var(--refined-terracotta)]">About</a>
            <a href="/resources" className="transition-colors hover:text-[var(--refined-terracotta)]">Resources</a>
            <a href="/contact" className="transition-colors hover:text-[var(--refined-terracotta)]">Contact</a>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-5 pb-20 pt-14 md:px-10 md:pt-24">
        <section className="flex max-w-3xl flex-col items-center text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--refined-line)] bg-[var(--refined-paper)]/75 px-4 py-2 text-xs font-semibold uppercase tracking-[.14em] text-[var(--refined-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--refined-sage)]" />
            A student-run mental wellness center
          </div>
          <div className="mb-7 h-px w-16 bg-[var(--refined-terracotta)]" />
          <h1 className="refined-display text-6xl leading-[.98] md:text-8xl">
            You <em className="text-[var(--refined-sage)]">matter.</em>
            <br />
            We <em className="text-[var(--refined-amber)]">matter.</em>
            <br />
            Your mind <em className="text-[var(--refined-terracotta)]">matters.</em>
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-[var(--refined-muted)] md:text-lg">
            A safe place to learn, create, connect, and grow. Whatever you&apos;re facing, you don&apos;t have to face it alone.
          </p>
          <a href="/checkin" className="refined-cta mt-9 inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm font-semibold text-white">
            Begin check-in <ArrowRight size={16} strokeWidth={1.8} />
          </a>
        </section>

        <section className="mt-24 w-full md:mt-32">
          <div className="mb-7 flex items-end justify-between border-b border-[var(--refined-line)] px-2 pb-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[.16em] text-[var(--refined-terracotta)]">Take your time</p>
              <h2 className="refined-display text-3xl md:text-4xl">Explore your journey</h2>
            </div>
            <span className="hidden text-xs tracking-[.14em] text-[var(--refined-muted)] md:block">01 — 06</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-6">
            {categories.map(({ name, desc, path, Icon, color, tint }) => (
              <a key={name} href={path} className="refined-card group flex min-h-48 flex-col items-center justify-between rounded-2xl p-5 text-center md:min-h-56 md:p-6">
                <span className="grid h-14 w-14 place-items-center rounded-full transition-transform duration-200 group-hover:scale-105" style={{ backgroundColor: tint, color }}>
                  <Icon size={24} strokeWidth={1.45} />
                </span>
                <span>
                  <span className="refined-display block text-2xl font-semibold italic" style={{ color }}>{name}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[var(--refined-muted)]">{desc}</span>
                </span>
                <span className="grid h-7 w-7 place-items-center rounded-full border border-[var(--refined-line)] text-[var(--refined-ink)] transition-colors group-hover:border-[var(--refined-terracotta)] group-hover:text-[var(--refined-terracotta)]">
                  <ArrowRight size={13} strokeWidth={1.6} />
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}