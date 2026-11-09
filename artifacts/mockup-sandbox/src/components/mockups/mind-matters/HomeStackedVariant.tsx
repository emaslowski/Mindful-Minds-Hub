import React, { useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Heart,
  HeartHandshake,
  Headphones,
  Menu,
  Palette,
  Sprout,
  Wind,
} from "lucide-react";

type Category = {
  name: string;
  desc: string;
  tint: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

const categories: Category[] = [
  { name: "Learn", desc: "Strategies & tips", tint: "#e8dfeb", Icon: BookOpen },
  { name: "Create", desc: "Art & expression", tint: "#f1e2d6", Icon: Palette },
  { name: "Connect", desc: "Community posts", tint: "#ead9df", Icon: HeartHandshake },
  { name: "Move", desc: "Mindful activity", tint: "#e5e7d8", Icon: Wind },
  { name: "Listen", desc: "Music & podcasts", tint: "#e5e0ed", Icon: Headphones },
  { name: "Grow", desc: "Personal journey", tint: "#e9e5d1", Icon: Sprout },
];

export default function HomeStackedVariant() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen overflow-hidden"
      style={{
        background: "#fbfaf7",
        color: "#514258",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 md:px-10 md:py-8 lg:flex-row lg:gap-14">
        <aside className="flex shrink-0 flex-col lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:w-[42%]">
          <nav className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: "#e8dfeb", color: "#514258" }}
              >
                <Heart size={17} strokeWidth={1.5} />
              </span>
              <span className="text-xl italic tracking-wide md:text-2xl" style={{ fontFamily: "Georgia, serif" }}>
                The Brightside Project
              </span>
            </a>
            <button
              type="button"
              aria-label="Open navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-full border p-3 transition-colors hover:bg-[#e8dfeb]"
              style={{ borderColor: "#d9d0cc" }}
            >
              <Menu size={18} strokeWidth={1.5} />
            </button>
          </nav>

          {menuOpen && (
            <div className="mt-4 flex gap-4 border-y py-3 text-sm" style={{ borderColor: "#d9d0cc" }}>
              <a href="/about" className="hover:underline">About</a>
              <a href="/resources" className="hover:underline">Resources</a>
              <a href="/contact" className="hover:underline">Contact</a>
            </div>
          )}

          <div className="my-auto py-14 lg:py-20">
            <div className="mb-8 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em]" style={{ color: "#8f7e9d" }}>
              <span className="h-px w-12" style={{ background: "#8f7e9d" }} />
              A student-run mental wellness center
            </div>
            <h1 className="text-5xl leading-[1.04] md:text-7xl" style={{ fontFamily: "Georgia, serif" }}>
              You <em style={{ color: "#8f7e9d" }}>matter.</em>
              <br />
              We <em style={{ color: "#514258" }}>matter.</em>
              <br />
              Your mind <em style={{ color: "#8f7e9d" }}>matters.</em>
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed md:text-lg" style={{ color: "#514258", opacity: 0.72 }}>
              A quiet place to learn, create, connect, and grow. Whatever you&apos;re facing, you don&apos;t have to face it alone.
            </p>
            <a
              href="/checkin"
              className="mt-9 inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm font-medium transition-transform hover:-translate-y-0.5"
              style={{ background: "#514258", color: "#fbfaf7" }}
            >
              Begin check-in <ArrowUpRight size={16} strokeWidth={1.7} />
            </a>
          </div>

          <div className="hidden items-center gap-4 border-t pt-5 text-xs md:flex" style={{ borderColor: "#d9d0cc", opacity: 0.7 }}>
            <span className="h-2 w-2 rounded-full" style={{ background: "#8f7e9d" }} />
            Take a breath. Start wherever you are.
          </div>
        </aside>

        <main className="flex-1 border-t pt-10 lg:border-l lg:border-t-0 lg:pl-14 lg:pt-20" style={{ borderColor: "#d9d0cc" }}>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em]" style={{ color: "#8f7e9d" }}>Take your time</p>
              <h2 className="text-3xl md:text-4xl" style={{ fontFamily: "Georgia, serif" }}>Explore your journey</h2>
            </div>
            <span className="text-xs" style={{ opacity: 0.55 }}>01 — 06</span>
          </div>

          <div className="flex flex-col">
            {categories.map(({ name, desc, tint, Icon }, index) => (
              <a
                href={`/${name.toLowerCase()}`}
                key={name}
                className="group flex items-center gap-5 border-t py-5 transition-all hover:px-3"
                style={{ borderColor: "#d9d0cc" }}
              >
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105"
                  style={{ background: tint }}
                >
                  <Icon size={23} strokeWidth={1.35} />
                </span>
                <span className="flex-1">
                  <span className="block text-2xl italic" style={{ fontFamily: "Georgia, serif" }}>{name}</span>
                  <span className="mt-1 block text-sm" style={{ opacity: 0.62 }}>{desc}</span>
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors group-hover:bg-[#514258] group-hover:text-[#fbfaf7]" style={{ borderColor: "#d9d0cc" }}>
                  <ArrowUpRight size={16} strokeWidth={1.5} />
                </span>
                <span className="hidden w-6 text-right text-xs md:block" style={{ opacity: 0.45 }}>{String(index + 1).padStart(2, "0")}</span>
              </a>
            ))}
          </div>

          <div className="mt-10 rounded-2xl p-6 md:p-8" style={{ background: "#e8dfeb" }}>
            <p className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: "#8f7e9d" }}>A small reminder</p>
            <p className="mt-3 text-xl leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>
              There is no right order. Follow what feels useful today.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}