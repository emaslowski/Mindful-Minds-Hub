import { useEffect, useState } from "react";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import {
  getDailyAnswer,
  getPuzzleDay,
  isAllowedGuess,
  scoreGuess,
  validateSavedGuesses,
  type LetterMark,
} from "@/components/games/dailyWordleEngine";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const STORAGE_PREFIX = "brightside-daily-wordle";
const MAX_GUESSES = 6;

type SavedPuzzle = {
  day: string;
  guesses: string[];
  storageWarning: string | null;
};

type LetterStatus = LetterMark | "unused";

function readPuzzle(day: string): SavedPuzzle {
  try {
    const saved = window.localStorage.getItem(`${STORAGE_PREFIX}:${day}`);
    if (!saved) return { day, guesses: [], storageWarning: null };
    const guesses = validateSavedGuesses(JSON.parse(saved), getDailyAnswer(day));
    return {
      day,
      guesses: guesses ?? [],
      storageWarning: guesses === null ? "The saved puzzle was not valid, so a fresh board was opened." : null,
    };
  } catch {
    return {
      day,
      guesses: [],
      storageWarning: "Saved guesses could not be read in this browser. You can keep playing, but this puzzle may not be saved.",
    };
  }
}

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

function statusLabel(status: LetterStatus) {
  if (status === "correct") return "correct letter in the correct place";
  if (status === "present") return "in the word, but in a different place";
  if (status === "absent") return "no unmatched copy of this letter in the word";
  return "not tried";
}

function statusStyle(status: LetterStatus) {
  if (status === "correct") return "border-secondary bg-secondary text-secondary-foreground";
  if (status === "present") return "border-accent bg-accent text-accent-foreground";
  if (status === "absent") return "border-muted bg-muted text-muted-foreground";
  return "border-secondary/40 bg-background text-foreground";
}

function displayDay(day: string) {
  const date = new Date(`${day}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  }).format(date);
}

export function DailyWordleGame({ isActive }: { isActive: boolean }) {
  const [initialPuzzle] = useState(() => readPuzzle(getPuzzleDay()));
  const [puzzleDay, setPuzzleDay] = useState(initialPuzzle.day);
  const [guesses, setGuesses] = useState<string[]>(initialPuzzle.guesses);
  const [storageWarning, setStorageWarning] = useState<string | null>(initialPuzzle.storageWarning);
  const [entry, setEntry] = useState("");
  const [message, setMessage] = useState("Think of a five-letter word, then submit your guess.");

  const answer = getDailyAnswer(puzzleDay);
  const won = guesses.some((guess) => guess === answer);
  const lost = guesses.length >= MAX_GUESSES && !won;
  const complete = won || lost;

  function refreshPuzzleDay() {
    const currentDay = getPuzzleDay();
    if (currentDay === puzzleDay) return false;
    const savedPuzzle = readPuzzle(currentDay);
    setPuzzleDay(currentDay);
    setGuesses(savedPuzzle.guesses);
    setStorageWarning(savedPuzzle.storageWarning);
    setEntry("");
    setMessage("A new daily puzzle is ready.");
    return true;
  }

  useEffect(() => {
    const checkDay = () => refreshPuzzleDay();
    const interval = window.setInterval(checkDay, 30_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkDay();
    };
    window.addEventListener("focus", checkDay);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", checkDay);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [puzzleDay]);

  function addLetter(letter: string) {
    if (complete || entry.length >= 5) return;
    setEntry((current) => `${current}${letter}`.slice(0, 5));
    setMessage("Keep going, or submit when your five-letter guess is ready.");
  }

  function removeLetter() {
    if (complete) return;
    setEntry((current) => current.slice(0, -1));
  }

  function submitGuess() {
    if (refreshPuzzleDay()) return;
    if (complete) return;
    if (entry.length !== 5) {
      setMessage("A guess needs exactly five letters.");
      return;
    }
    if (!isAllowedGuess(entry)) {
      setMessage("That word is not in the classroom word list. Try another five-letter word.");
      return;
    }
    if (guesses.includes(entry)) {
      setMessage("You have already tried that word. Choose a different guess.");
      return;
    }

    const nextGuesses = [...guesses, entry];
    const solved = entry === answer;
    const outOfGuesses = nextGuesses.length >= MAX_GUESSES && !solved;
    setGuesses(nextGuesses);
    setEntry("");
    setMessage(
      solved
        ? "You found today's word. Well done!"
        : outOfGuesses
          ? `Today's word was ${answer}. A new puzzle arrives tomorrow.`
          : `${MAX_GUESSES - nextGuesses.length} ${MAX_GUESSES - nextGuesses.length === 1 ? "guess" : "guesses"} left.`
    );
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}:${puzzleDay}`, JSON.stringify(nextGuesses));
      setStorageWarning(null);
    } catch {
      setStorageWarning("This browser could not save your guesses. You can continue playing, but reloading may clear this puzzle.");
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        !isActive ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isEditableTarget(event.target)
      ) return;

      if (event.key === "Enter") {
        // Preserve native activation of game tabs, links, and on-screen keys.
        if (event.target instanceof HTMLElement && event.target.closest("button, a, summary")) return;
        event.preventDefault();
        submitGuess();
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        removeLetter();
        return;
      }
      const letter = event.key.toUpperCase();
      if (letter.length === 1 && LETTERS.includes(letter)) {
        event.preventDefault();
        addLetter(letter);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isActive, puzzleDay, entry, guesses, complete]);

  const letterStatuses: Record<string, LetterStatus> = {};
  for (const letter of LETTERS) {
    const marks = guesses.flatMap((guess) =>
      scoreGuess(guess, answer)
        .map((mark, index) => guess[index] === letter ? mark : null)
        .filter((mark): mark is LetterMark => mark !== null)
    );
    letterStatuses[letter] = marks.includes("correct")
      ? "correct"
      : marks.includes("present")
        ? "present"
        : marks.includes("absent")
          ? "absent"
          : "unused";
  }

  return (
    <section aria-labelledby="daily-wordle-title" className="rounded-3xl border-2 border-secondary/40 bg-secondary/10 p-4 shadow-md sm:p-7">
      <header className="mb-5 text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-secondary">Daily word puzzle · {displayDay(puzzleDay)}</p>
        <h2 id="daily-wordle-title" className="font-display text-4xl font-bold text-foreground">Daily Wordle</h2>
        <p className="mx-auto mt-2 max-w-xl text-foreground/80">Find the shared five-letter word in six guesses. Take your time; today’s puzzle is the same for everyone.</p>
      </header>

      <div className="mx-auto mb-5 grid w-full max-w-xs grid-cols-5 gap-2" role="grid" aria-label="Six rows of five letters">
        {Array.from({ length: MAX_GUESSES * 5 }, (_, index) => {
          const row = Math.floor(index / 5);
          const column = index % 5;
          const guess = guesses[row];
          const isCurrentRow = row === guesses.length && !complete;
          const letter = guess?.[column] ?? (isCurrentRow ? entry[column] : "");
          const mark = guess ? scoreGuess(guess, answer)[column] : "unused";
          const spokenStatus = guess ? statusLabel(mark) : letter ? "not submitted" : "empty";
          return (
            <div
              key={`${row}-${column}`}
              role="gridcell"
              aria-label={`Row ${row + 1}, letter ${column + 1}: ${letter || "blank"}, ${spokenStatus}`}
              className={`flex aspect-square items-center justify-center rounded-lg border-2 font-display text-2xl font-bold sm:text-3xl ${statusStyle(mark)}`}
              data-testid={`wordle-tile-${row}-${column}`}
            >
              {letter}
            </div>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap justify-center gap-2 text-xs" aria-label="Letter feedback legend">
        <span className="rounded-full border border-secondary bg-secondary px-3 py-1 font-semibold text-secondary-foreground">Correct place</span>
        <span className="rounded-full border border-accent bg-accent px-3 py-1 font-semibold text-accent-foreground">In word, different place</span>
        <span className="rounded-full border border-muted bg-muted px-3 py-1 font-semibold text-muted-foreground">Not in word</span>
      </div>

      <div className="mx-auto grid w-full max-w-lg gap-1.5" aria-label="On-screen letter keyboard">
        {KEY_ROWS.map((row, rowIndex) => (
          <div key={row} className="flex justify-center gap-1">
            {rowIndex === 2 && (
              <Button type="button" size="sm" variant="outline" className="h-10 min-w-0 flex-1 px-1 text-xs sm:px-3" onClick={submitGuess} disabled={complete} aria-label="Submit guess" data-testid="wordle-submit">
                <span className="sm:hidden">Go</span><span className="hidden sm:inline">Enter</span>
              </Button>
            )}
            {row.split("").map((letter) => {
              const status = letterStatuses[letter];
              return (
                <Button
                  key={letter}
                  type="button"
                  size="sm"
                  variant="outline"
                  className={`h-10 min-w-0 flex-1 px-0 text-xs ${statusStyle(status)}`}
                  onClick={() => addLetter(letter)}
                  disabled={complete || entry.length >= 5}
                  aria-label={`${letter}, ${statusLabel(status)}`}
                  data-testid={`wordle-key-${letter.toLowerCase()}`}
                >
                  {letter}
                </Button>
              );
            })}
            {rowIndex === 2 && (
              <Button type="button" size="sm" variant="outline" className="h-10 min-w-0 flex-1 px-1 text-xs sm:px-3" onClick={removeLetter} disabled={complete || !entry.length} aria-label="Delete last letter" data-testid="wordle-delete">
                <span className="sm:hidden">Del</span><span className="hidden sm:inline">Delete</span>
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col items-center gap-3">
        <p className="min-h-6 text-center text-sm font-semibold" role="status" aria-live="polite" data-testid="wordle-message">
          {won ? "You found today's word. Well done!" : lost ? `Today's word was ${answer}. A new puzzle arrives tomorrow.` : message}
        </p>
        {complete && (
          <p className="rounded-xl border border-secondary/40 bg-background/75 px-4 py-2 text-sm font-semibold" data-testid="wordle-answer">
            Today’s answer: <span className="font-display text-lg font-bold tracking-widest">{answer}</span>
          </p>
        )}
      </div>

      {storageWarning && (
        <p className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-foreground" role="alert" data-testid="wordle-storage-warning">
          {storageWarning} Shared-device note: saved guesses stay in this browser and may be visible to others using this device.
        </p>
      )}
      <p className="mt-4 text-center text-xs text-foreground/70">
        Guesses are saved on this browser for today’s puzzle only. This is a shared-device activity, not a private account; anyone using this browser may see the saved guesses. The next puzzle begins at midnight Eastern Time.
      </p>

      <details className="mt-5 rounded-2xl border border-secondary/30 bg-background/70 p-4">
        <summary className="cursor-pointer font-bold" data-testid="wordle-instructions">How to play and feedback guide</summary>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foreground/80">
          <li>Enter any accepted five-letter word, then choose Enter or press the Enter key. You have six guesses.</li>
          <li>Use the on-screen keys or your physical keyboard. Backspace removes the last letter.</li>
          <li>Correct place means the letter is right and in the right position. In word, different place means it belongs elsewhere. Not in word means there is no unmatched copy left: if you repeat a letter, only the copies in the answer earn a clue.</li>
          <li>Letters include written status descriptions, so feedback is not conveyed by color alone.</li>
          <li>Everyone gets the same daily puzzle. A new word starts at midnight in America/New_York.</li>
          <li>Saved guesses are stored only in this browser on this device. Avoid using this activity on a shared device if you do not want others to see your guesses.</li>
        </ul>
      </details>
    </section>
  );
}
