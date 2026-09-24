import type { ReactNode } from "react";
import { Link } from "wouter";
import {
  GardeningSection,
  LanguageSection,
  GamesSection,
} from "@/components/HomeActivitySections";

function ActivityPage({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 md:py-20">
      <Link href="/" className="mb-8 inline-flex rounded-full border border-primary/40 px-5 py-2 font-semibold text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring">
        ← Back to home
      </Link>
      {children}
    </main>
  );
}

export function GardeningPage() {
  return <ActivityPage><GardeningSection /></ActivityPage>;
}

export function LanguageCornerPage() {
  return <ActivityPage><LanguageSection /></ActivityPage>;
}

export function GamesPage() {
  return <ActivityPage><GamesSection /></ActivityPage>;
}