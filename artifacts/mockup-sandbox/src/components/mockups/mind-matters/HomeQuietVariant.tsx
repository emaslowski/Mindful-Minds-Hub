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
} from "lucide-react";
import "./HomeQuietVariant.css";

export default function HomeQuietVariant() {
  const [menuOpen, setMenuOpen] = useState(false);

  const categories = [
    { name: "Learn", desc: "Strategies & tips", path: "/learn", Icon: BookOpen },
    { name: "Create", desc: "Art & expression", path: "/create", Icon: Palette },
    { name: "Connect", desc: "Community posts", path: "/connect", Icon: HeartHandshake },
    { name: "Move", desc: "Mindful activity", path: "/move", Icon: Wind },
    { name: "Listen", desc: "Music & podcasts", path: "/listen", Icon: Headphones },
    { name: "Grow", desc: "Personal journey", path: "/grow", Icon: Sprout },
  ];

  return (
    <div className="quiet-home">
      <div className="quiet-orbit" />

      <nav className="quiet-nav relative z-10 flex items-center justify-between px-6 py-5 md:px-12 md:py-7">
        <a href="/" className="flex items-center gap-3">
          <span className="quiet-mark" aria-hidden="true">
            <Heart size={17} strokeWidth={1.5} />
          </span>
          <span className="quiet-display text-xl italic tracking-wide md:text-2xl">Mind Matters</span>
        </a>
        <button
          type="button"
          className="quiet-menu rounded-full p-3"
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Menu size={19} strokeWidth={1.5} />
        </button>
      </nav>

      {menuOpen && (
        <div className="relative z-20 flex justify-end border-b border-[#d9d0cc] bg-[#fbfaf7] px-6 py-3 md:px-12">
          <div className="flex gap-4 text-sm text-[#514258]">
            <a href="/about" className="hover:underline">About</a>
            <a href="/resources" className="hover:underline">Resources</a>
            <a href="/contact" className="hover:underline">Contact</a>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 pb-24 pt-14 md:px-8 md:pt-24">
        <section className="flex max-w-4xl flex-col items-center text-center">
          <div className="quiet-pill mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.16em]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8f7e9d]" />
            A student-run mental wellness center
          </div>

          <div className="quiet-rule mb-8" />
          <h1 className="quiet-display text-5xl leading-[1.08] md:text-7xl lg:text-8xl">
            You <em className="text-[#8f7e9d]">matter.</em>
            <br />
            We <em className="text-[#514258]">matter.</em>
            <br />
            Your mind <em className="text-[#8f7e9d]">matters.</em>
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-[#514258]/75 md:text-lg">
            A quiet place to learn, create, connect, and grow. Whatever you&apos;re facing,
            you don&apos;t have to face it alone.
          </p>
          <a href="/checkin" className="quiet-cta mt-10 inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm font-medium">
            Begin check-in
            <ArrowRight size={16} strokeWidth={1.75} />
          </a>
        </section>

        <section className="mt-24 w-full md:mt-32">
          <div className="mb-8 flex items-end justify-between border-b border-[#d9d0cc] pb-4 px-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8f7e9d]">Take your time</p>
              <h2 className="quiet-display text-3xl md:text-4xl">Explore your journey</h2>
            </div>
            <span className="hidden text-xs text-[#514258]/60 md:block">01 — 06</span>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-6">
            {categories.map(({ name, desc, path, Icon }) => (
              <a href={path} key={name} className="quiet-card group flex min-h-48 flex-col items-center justify-between p-5 text-center md:min-h-56 md:p-6">
                <span className="quiet-icon transition-transform duration-200 group-hover:scale-105">
                  <Icon size={23} strokeWidth={1.35} />
                </span>
                <span>
                  <span className="quiet-display block text-xl italic text-[#514258] md:text-2xl">{name}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#514258]/65">{desc}</span>
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#d9d0cc] text-[#514258] transition-colors group-hover:border-[#514258]">
                  <ArrowRight size={13} strokeWidth={1.5} />
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}