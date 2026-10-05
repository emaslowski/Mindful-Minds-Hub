import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Puzzle = { word: string; category: string; hint: string };
type Round = { puzzle: Puzzle; guessed: string[]; usedWords: string[]; number: number };

const PUZZLES: Puzzle[] = [
  { word: "compass", category: "School tools", hint: "It helps you find direction on a map." },
  { word: "volcano", category: "Earth science", hint: "A mountain that can release lava." },
  { word: "library", category: "Places", hint: "A quiet place to borrow books." },
  { word: "habitat", category: "Life science", hint: "The natural home of a plant or animal." },
  { word: "rhythm", category: "Music", hint: "A pattern of beats in music." },
  { word: "planet", category: "Space", hint: "Earth is one of these." },
  { word: "courage", category: "Character strengths", hint: "Being brave when something feels difficult." },
  { word: "puzzle", category: "Things to solve", hint: "A game or problem made of pieces or clues." },
  { word: "rainbow", category: "Weather", hint: "A colorful arc that may appear after rain." },
  { word: "harvest", category: "Gardening", hint: "Gathering crops when they are ready." },
  { word: "octopus", category: "Ocean animals", hint: "An intelligent sea animal with eight arms." },
  { word: "fraction", category: "Math", hint: "A way to show part of a whole." },
];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MAX_MISSES = 6;

function drawRound(usedWords: string[], number: number): Round {
  const available = PUZZLES.filter((puzzle) => !usedWords.includes(puzzle.word));
  const pool = available.length ? available : PUZZLES;
  const puzzle = pool[Math.floor(Math.random() * pool.length)];
  return {
    puzzle,
    guessed: [],
    usedWords: available.length ? [...usedWords, puzzle.word] : [puzzle.word],
    number,
  };
}

function initialRound(): Round {
  return drawRound([], 1);
}

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

function HangmanDrawing({ misses }: { misses: number }) {
  return (
    <svg viewBox="0 0 180 170" role="img" aria-label={`Friendly word puzzle drawing, ${misses} of ${MAX_MISSES} incorrect guesses`}>
      <path d="M22 154h112M48 154V18h72M48 42h43" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      {misses >= 1 && <circle cx="92" cy="58" r="16" fill="none" stroke="currentColor" strokeWidth="6" />}
      {misses >= 2 && <path d="M92 74v42" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />}
      {misses >= 3 && <path d="m92 84-19 18" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />}
      {misses >= 4 && <path d="m92 84 19 18" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />}
      {misses >= 5 && <path d="m92 116-17 24" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />}
      {misses >= 6 && <path d="m92 116 17 24" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />}
      {misses > 0 && <path d="M86 57h2m10 0h2m-9 8h4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}

export function HangmanGame({ isActive }: { isActive: boolean }) {
  const [round, setRound] = useState<Round>(initialRound);
  const [hintVisible, setHintVisible] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const misses = round.guessed.filter((letter) => !round.puzzle.word.includes(letter.toLowerCase())).length;
  const won = [...round.puzzle.word].every((letter) => round.guessed.includes(letter.toUpperCase()));
  const lost = misses >= MAX_MISSES;
  const complete = won || lost;
  const used = new Set(round.guessed);

  function guess(letter: string) {
    setRound((current) => {
      const currentMisses = current.guessed.filter((guess) => !current.puzzle.word.includes(guess.toLowerCase())).length;
      const currentWon = [...current.puzzle.word].every((char) => current.guessed.includes(char.toUpperCase()));
      if (currentWon || currentMisses >= MAX_MISSES || current.guessed.includes(letter)) return current;
      return { ...current, guessed: [...current.guessed, letter] };
    });
  }

  function nextRound() {
    setHintVisible(false);
    setRound((current) => drawRound(current.usedWords, current.number + 1));
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isActive || event.altKey || event.ctrlKey || event.metaKey || isEditableTarget(event.target)) return;
      const key = event.key.toUpperCase();
      if (key.length === 1 && ALPHABET.includes(key)) {
        event.preventDefault();
        guess(key);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isActive, complete, used]);

  return (
    <section ref={rootRef} aria-labelledby="hangman-title" className="rounded-3xl border-2 border-secondary/40 bg-secondary/10 p-4 shadow-md sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-secondary">Word puzzle · Round {round.number}</p>
          <h2 id="hangman-title" className="font-display text-4xl font-bold text-foreground">Hangman</h2>
        </div>
        <Button variant="outline" onClick={nextRound} data-testid="hangman-restart">
          <RotateCcw aria-hidden="true" /> New round
        </Button>
      </div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-background/80 p-4">
        <div>
          <p className="font-bold text-secondary">Category: {round.puzzle.category}</p>
          <p className="mt-1 text-sm text-foreground/75">Incorrect guesses: {misses} of {MAX_MISSES}</p>
        </div>
        <Button variant="outline" onClick={() => setHintVisible((visible) => !visible)} aria-expanded={hintVisible} data-testid="hangman-hint">
          {hintVisible ? "Hide hint" : "Show hint"}
        </Button>
        {hintVisible && <p className="basis-full text-foreground/85" data-testid="hangman-hint-text">{round.puzzle.hint}</p>}
      </div>
      <div className="grid gap-5 md:grid-cols-[minmax(180px,0.7fr)_1.3fr]">
        <div className="flex min-h-44 items-center justify-center rounded-2xl bg-background/75 p-4 text-secondary">
          <HangmanDrawing misses={misses} />
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex min-h-16 flex-wrap items-end justify-center gap-2" aria-label="Hidden word">
            {[...round.puzzle.word].map((letter, index) => (
              <span key={`${letter}-${index}`} className="flex h-14 w-9 items-center justify-center border-b-4 border-primary font-display text-3xl font-bold" aria-label={complete || used.has(letter.toUpperCase()) ? letter : "hidden letter"}>
                {complete || used.has(letter.toUpperCase()) ? letter.toUpperCase() : ""}
              </span>
            ))}
          </div>
          <p className="mt-4 min-h-6 text-center font-semibold" aria-live="polite" data-testid="hangman-status">
            {won ? "You solved it. Nice work!" : lost ? "Round complete. Here is the word." : "Choose a letter to uncover the word."}
          </p>
          {complete && (
            <Button onClick={nextRound} className="mx-auto mt-3" data-testid="hangman-next-round">Play next round</Button>
          )}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-7 gap-2 sm:grid-cols-9 md:grid-cols-13" aria-label="Choose a letter">
        {ALPHABET.map((letter) => (
          <Button
            key={letter}
            type="button"
            size="sm"
            variant={used.has(letter) ? "secondary" : "outline"}
            disabled={used.has(letter) || complete}
            onClick={() => guess(letter)}
            aria-label={`Guess ${letter}${used.has(letter) ? ", already used" : ""}`}
            data-testid={`hangman-letter-${letter.toLowerCase()}`}
          >
            {letter}
          </Button>
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-foreground/75">Use the letter buttons or type a letter while this game is selected. Keyboard input pauses while you type in a field.</p>
    </section>
  );
}
