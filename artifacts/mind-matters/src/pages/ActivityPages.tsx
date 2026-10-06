import type { ReactNode } from "react";
import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  GardeningSection,
  LanguageSection,
} from "@/components/HomeActivitySections";
import { SnakeGame } from "@/components/SnakeGame";
import { HangmanGame } from "@/components/games/HangmanGame";
import { ScrabbleGame } from "@/components/games/ScrabbleGame";
import { ScratchPlayground } from "@/components/games/ScratchPlayground";

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
  const [activeGame, setActiveGame] = useState<"snake" | "hangman" | "tiles" | "coding">("snake");
  const games = [
    { id: "snake", label: "Snake" },
    { id: "hangman", label: "Hangman" },
    { id: "tiles", label: "Scrabble-style" },
    { id: "coding", label: "Coding playground" },
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
      <div id="game-panel-snake" aria-label="Snake game" hidden={activeGame !== "snake"}>
        <SnakeGame isActive={activeGame === "snake"} />
      </div>
      <div id="game-panel-hangman" aria-label="Hangman game" hidden={activeGame !== "hangman"}>
        <HangmanGame isActive={activeGame === "hangman"} />
      </div>
      <div id="game-panel-tiles" aria-label="Word tiles game" hidden={activeGame !== "tiles"}>
        <ScrabbleGame isActive={activeGame === "tiles"} />
      </div>
      <div id="game-panel-coding" aria-label="Coding playground" hidden={activeGame !== "coding"}>
        <ScratchPlayground isActive={activeGame === "coding"} />
      </div>
    </main>
  );
}