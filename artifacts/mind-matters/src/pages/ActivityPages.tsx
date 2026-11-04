import type { ReactNode } from "react";
import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import {
  GardeningSection,
} from "@/components/HomeActivitySections";
import LanguageCenter from "@/components/language/LanguageCenter";
import { SnakeGame } from "@/components/SnakeGame";
import { HangmanGame } from "@/components/games/HangmanGame";
import { ScrabbleGame } from "@/components/games/ScrabbleGame";
import { DailyWordleGame } from "@/components/games/DailyWordleGame";
import { PublishedSection } from "@/components/PublishedSection";
import GardeningActivities from "@/components/gardening/GardeningActivities";
import { useExploration } from "@/components/ExplorationProvider";
import { gamesAreUnlocked } from "@/lib/exploration";
import { GamesExplorationGate } from "@/components/games/GamesExplorationGate";

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
  return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:py-14">
    <Link href="/" className="mb-6 inline-flex rounded-full border border-primary/40 px-5 py-2 font-semibold text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring">
      Back to home
    </Link>
    <header className="mb-8">
      <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">Plants &amp; Gardening</h1>
      <p className="mt-3 max-w-3xl text-foreground/80">Watch our student gardeners, try a growing experiment, and discover what plants need to thrive.</p>
      <Button asChild className="mt-6">
        <Link href="/gardening/bryan-the-plant-guy">Bryan the Plant Guy Videos</Link>
      </Button>
    </header>
    <PublishedSection section="gardening" heading="From Our Student Gardeners" videoFilter="exclude" className="mb-10" />
    <GardeningActivities />
    <section className="mt-10" aria-label="Start growing a seed">
      <GardeningSection />
    </section>
  </main>;
}

export function GardeningVideosPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:py-14">
      <Button asChild variant="outline" className="mb-6">
        <Link href="/gardening">Back to Gardening</Link>
      </Button>
      <header className="mb-8">
        <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">Bryan the Plant Guy Videos</h1>
        <p className="mt-3 max-w-3xl text-foreground/80">Browse all the gardening videos and follow along at your own pace.</p>
      </header>
      <PublishedSection
        section="gardening"
        heading="Watch All Videos"
        featureVideos
        videoFilter="only"
        emptyMessage="Bryan the Plant Guy videos will appear here when they are published."
      />
    </main>
  );
}

export function LanguageCornerPage() {
  return <LanguageCenter />;
}

export function GamesPage() {
  const { visited, hasSubmittedComment } = useExploration();
  if (!gamesAreUnlocked(visited, hasSubmittedComment)) return <GamesExplorationGate />;
  return <UnlockedGamesPage />;
}

function UnlockedGamesPage() {
  const [activeGame, setActiveGame] = useState<"wordle" | "snake" | "hangman" | "tiles">("wordle");
  const games = [
    { id: "wordle", label: "Daily Wordle" },
    { id: "snake", label: "Snake" },
    { id: "hangman", label: "Hangman" },
    { id: "tiles", label: "Scrabble-style" },
  ] as const;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 md:py-20">
      <Link href="/" className="mb-8 inline-flex rounded-full border border-primary/40 px-5 py-2 font-semibold text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring">
        Back to home
      </Link>
      <header className="mb-8">
        <p className="font-semibold uppercase tracking-wider text-secondary">A little learning, a lot of fun</p>
        <h1 className="mt-1 text-4xl font-bold text-foreground sm:text-5xl">Choose a game</h1>
        <p className="mt-2 max-w-2xl text-foreground/80">Play a quick round on your own or share a screen with someone nearby.</p>
      </header>
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Choose a game">
        {games.map((game) => (
          <Button
            key={game.id}
            type="button"
            aria-pressed={activeGame === game.id}
            aria-controls={`game-panel-${game.id}`}
            id={`game-tab-${game.id}`}
            variant={activeGame === game.id ? "default" : "outline"}
            onClick={() => setActiveGame(game.id)}
            data-testid={`game-tab-${game.id}`}
          >
            {game.label}
          </Button>
        ))}
      </div>
      <div id="game-panel-wordle" aria-label="Daily Wordle game" hidden={activeGame !== "wordle"}>
        <DailyWordleGame isActive={activeGame === "wordle"} />
      </div>
      <div id="game-panel-snake" aria-label="Snake game" hidden={activeGame !== "snake"}>
        <SnakeGame isActive={activeGame === "snake"} />
      </div>
      <div id="game-panel-hangman" aria-label="Hangman game" hidden={activeGame !== "hangman"}>
        <HangmanGame isActive={activeGame === "hangman"} />
      </div>
      <div id="game-panel-tiles" aria-label="Word tiles game" hidden={activeGame !== "tiles"}>
        <ScrabbleGame isActive={activeGame === "tiles"} />
      </div>
    </main>
  );
}