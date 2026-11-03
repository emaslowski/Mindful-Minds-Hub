import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";

type Puzzle = { word: string; category: string; hint: string };
type Round = { puzzle: Puzzle; guessed: string[]; usedWords: string[]; number: number };

const PUZZLES: Puzzle[] = [
  { word: "compass", category: "Exploration", hint: "Its needle has a preferred direction." },
  { word: "volcano", category: "Geology", hint: "Pressure can reshape its summit." },
  { word: "library", category: "Community", hint: "Quiet shelves are only part of what it offers." },
  { word: "habitat", category: "Ecology", hint: "A living thing depends on this particular place." },
  { word: "rhythm", category: "Sound", hint: "A steady pattern can be tapped or clapped." },
  { word: "planet", category: "Astronomy", hint: "It travels around a star." },
  { word: "courage", category: "Character", hint: "A strength that can show up even when you feel nervous." },
  { word: "puzzle", category: "Problem solving", hint: "Small clues or pieces come together." },
  { word: "rainbow", category: "Atmosphere", hint: "Light and water droplets can make an arc." },
  { word: "harvest", category: "Growing", hint: "A season's work can lead to this gathering." },
  { word: "octopus", category: "Marine life", hint: "A clever creature with flexible arms." },
  { word: "fraction", category: "Numbers", hint: "A numerator and denominator work together." },
  { word: "symmetry", category: "Design", hint: "Two sides can reflect a similar arrangement." },
  { word: "migration", category: "Animal behavior", hint: "A seasonal journey made by many species." },
  { word: "telescope", category: "Observation", hint: "A lens or mirror helps distant objects appear nearer." },
  { word: "ecosystem", category: "Ecology", hint: "Living things and their surroundings interact here." },
  { word: "blueprint", category: "Making", hint: "A plan can guide what gets built." },
  { word: "algorithm", category: "Computing", hint: "A set of steps arranged to solve a task." },
  { word: "molecule", category: "Chemistry", hint: "Atoms join together to form one." },
  { word: "constellation", category: "Astronomy", hint: "People connect stars into a familiar pattern." },
  { word: "metamorphosis", category: "Life cycles", hint: "A dramatic change during development." },
  { word: "biodiversity", category: "Nature", hint: "A rich variety of living forms in one place." },
  { word: "thermometer", category: "Measurement", hint: "Its scale can show how warm or cool something is." },
  { word: "architecture", category: "Design", hint: "The shape and planning of spaces people use." },
  { word: "camouflage", category: "Adaptation", hint: "A way to blend into surroundings." },
  { word: "photosynthesis", category: "Botany", hint: "Leaves use light in an important process." },
  { word: "amphibian", category: "Animal groups", hint: "Many members begin life in water." },
  { word: "peninsula", category: "Landforms", hint: "Water surrounds most, but not all, of this land." },
  { word: "longitude", category: "Geography", hint: "One coordinate runs between the poles." },
  { word: "evaporation", category: "Water cycle", hint: "A liquid changes state as it gains energy." },
  { word: "percussion", category: "Music", hint: "This family makes sound by striking or shaking." },
  { word: "choreography", category: "Movement", hint: "A sequence of motions arranged for performance." },
  { word: "onomatopoeia", category: "Language", hint: "A word can imitate a sound." },
  { word: "metaphor", category: "Writing", hint: "A comparison that does not use 'like' or 'as'." },
  { word: "democracy", category: "Civics", hint: "People have a voice in decisions." },
  { word: "renewable", category: "Energy", hint: "A resource can be replenished over time." },
  { word: "crystallize", category: "Materials", hint: "A substance can form an ordered solid pattern." },
  { word: "archipelago", category: "Geography", hint: "A cluster of islands belongs to this landform group." },
  { word: "equilibrium", category: "Science", hint: "Opposing effects can balance in this state." },
  { word: "observatory", category: "Research", hint: "Researchers gather data from a dedicated place." },
  { word: "perseverance", category: "Character", hint: "Continuing carefully after a setback." },
  { word: "invertebrate", category: "Animal groups", hint: "This broad group has no backbone." },
  { word: "topography", category: "Geography", hint: "A map may show the shape and elevation of land." },
  { word: "instrument", category: "Music", hint: "A crafted object can make musical sound." },
  { word: "biography", category: "Reading", hint: "A person's life story written by someone else." },
  { word: "microclimate", category: "Weather", hint: "A small area can have its own local conditions." },
  { word: "tributary", category: "Waterways", hint: "A smaller stream joins a larger one." },
  { word: "cartography", category: "Exploration", hint: "The craft of representing places on a map." },
  { word: "numerator", category: "Numbers", hint: "The upper part of a fraction." },
  { word: "resilience", category: "Wellbeing", hint: "The ability to recover and adapt after challenges." },
];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MAX_MISSES = 6;

function drawRound(usedWords: string[], number: number): Round {
  const available = PUZZLES.filter((puzzle) => !usedWords.includes(puzzle.word));
  const pool = available.length ? available : PUZZLES.filter((puzzle) => puzzle.word !== usedWords[usedWords.length - 1]);
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
  const [hintUsed, setHintUsed] = useState(false);
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
    setHintUsed(false);
    setRound((current) => drawRound(current.usedWords, current.number + 1));
  }

  function revealHint() {
    if (hintUsed || complete || misses >= MAX_MISSES - 1) return;
    setHintUsed(true);
    setHintVisible(true);
    setRound((current) => {
      const currentMisses = current.guessed.filter((letter) => !current.puzzle.word.includes(letter.toLowerCase())).length;
      const currentWon = [...current.puzzle.word].every((char) => current.guessed.includes(char.toUpperCase()));
      const chargeLetter = ALPHABET.find((letter) => !current.guessed.includes(letter) && !current.puzzle.word.includes(letter.toLowerCase()));
      if (currentWon || currentMisses >= MAX_MISSES - 1 || !chargeLetter) return current;
      return { ...current, guessed: [...current.guessed, chargeLetter] };
    });
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
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">A clue costs one incorrect guess. Use it only when you have at least two guesses left; there is one clue per round.</p>
        </div>
          <Button variant="outline" onClick={revealHint} disabled={hintUsed || complete || misses >= MAX_MISSES - 1} aria-expanded={hintVisible} data-testid="hangman-hint">
            {hintUsed ? "Clue used" : "Use charged clue"}
        </Button>
          {hintVisible && <p className="basis-full text-foreground/85" data-testid="hangman-hint-text">Clue: {round.puzzle.hint}</p>}
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
