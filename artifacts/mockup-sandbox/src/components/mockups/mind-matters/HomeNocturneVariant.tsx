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
import "./HomeNocturneVariant.css";

export default function HomeNocturneVariant() {
  const [menuOpen, setMenuOpen] = useState(false);
  const categories = [
    { name: "Learn", desc: "Strategies & tips", Icon: BookOpen, tone: "var(--sage)" },
    { name: "Create", desc: "Art & expression", Icon: Palette, tone: "var(--terracotta)" },
    { name: "Connect", desc: "Community posts", Icon: HeartHandshake, tone: "var(--rose)" },
    { name: "Move", desc: "Mindful activity", Icon: Wind, tone: "var(--amber)" },
    { name: "Listen", desc: "Music & podcasts", Icon: Headphones, tone: "var(--sage)" },
    { name: "Grow", desc: "Personal journey", Icon: Sprout, tone: "var(--terracotta)" },
  ];

  const scrollToJourney = () =>
    document.getElementById("nocturne-journey")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="nocturne-home">
      <div className="nocturne-glow" />
      <div className="nocturne-orbit" />

      <nav className="relative z-20 flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6" style={{ color: "var(--amber)" }} strokeWidth={1.5} />
          <span className="nocturne-display text-xl font-semibold italic tracking-wide md:text-2xl">
            The Brightside Project
          </span>
        </div>
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-full border border-[rgba(245,239,227,.25)] p-2 transition-colors hover:bg-[rgba(245,239,227,.12)]"
        >
          {menuOpen ? <X className="h-6 w-6" strokeWidth={1.5} /> : <Menu className="h-6 w-6" strokeWidth={1.5} />}
        </button>
        {menuOpen && (
          <div className="nocturne-menu rounded-2xl p-2">
            {["About The Brightside Project", "Resources", "Contact"].map((item) => (
              <button type="button" key={item} onClick={() => setMenuOpen(false)} className="block w-full rounded-xl px-4 py-3 text-left text-sm text-[var(--paper-muted)] hover:bg-[rgba(245,239,227,.1)] hover:text-[var(--paper)]">
                {item}
              </button>
            ))}
          </div>
        )}
      </nav>

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 pb-24 pt-10 md:px-8 md:pt-20">
        <section className="max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(245,239,227,.22)] bg-[rgba(245,239,227,.07)] px-4 py-2 text-sm tracking-wide text-[var(--paper-muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--sage)]" />
            A student-run mental wellness center
          </div>
          <h1 className="nocturne-display text-5xl font-medium leading-[.98] tracking-wide md:text-7xl lg:text-8xl">
            A quieter place to
            <span className="block italic text-[var(--amber)]">come back to yourself.</span>
          </h1>
          <p className="mx-auto mb-10 mt-8 max-w-xl text-lg font-normal leading-relaxed text-[var(--paper-muted)] md:text-xl">
            A safe space to learn, create, connect, and grow. Your mind deserves room to breathe.
          </p>
          <button type="button" onClick={scrollToJourney} className="group inline-flex items-center gap-3 rounded-full bg-[var(--amber)] px-8 py-4 font-semibold text-[var(--night)] transition-transform hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(219,176,95,.22)]">
            Begin check-in
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </section>

        <section id="nocturne-journey" className="mt-24 w-full md:mt-32">
          <div className="mb-8 flex items-center gap-5">
            <span className="text-xs font-semibold uppercase tracking-[.24em] text-[var(--sage)]">Find your way in</span>
            <div className="h-px flex-1 bg-[rgba(245,239,227,.18)]" />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-6">
            {categories.map(({ name, desc, Icon, tone }) => (
              <button type="button" key={name} className="nocturne-card group rounded-2xl p-5 text-left md:p-6">
                <Icon className="mb-8 h-8 w-8 transition-transform group-hover:rotate-[-8deg] group-hover:scale-110" style={{ color: tone }} strokeWidth={1.25} />
                <span className="nocturne-display block text-2xl font-semibold italic" style={{ color: tone }}>{name}</span>
                <span className="mt-1 block text-xs text-[var(--paper-muted)]">{desc}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <div className="relative h-32 overflow-hidden opacity-60 md:h-48">
        <svg viewBox="0 0 1440 300" preserveAspectRatio="none" className="absolute bottom-0 h-full w-full">
          <path d="M0,180 C240,80 480,240 720,140 C960,50 1200,220 1440,120 L1440,300 L0,300 Z" fill="var(--sage)" opacity=".34" />
          <path d="M0,220 C260,120 450,270 700,180 C950,95 1200,250 1440,160 L1440,300 L0,300 Z" fill="var(--sage)" opacity=".55" />
        </svg>
      </div>
    </div>
  );
}