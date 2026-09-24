import { useEffect, useReducer, useRef } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Play, RotateCcw } from "lucide-react";

const SIZE = 16;
const HIGH_SCORE_KEY = "mind-matters-snake-best";
const initialSnake = [8 * SIZE + 7, 8 * SIZE + 6, 8 * SIZE + 5];
type Direction = "up" | "down" | "left" | "right";
type Status = "ready" | "running" | "paused" | "over" | "won";
type Game = {
  snake: number[];
  food: number;
  direction: Direction;
  nextDirection: Direction;
  status: Status;
  score: number;
  best: number;
};
type Action =
  | { type: "start"; random: number }
  | { type: "tick"; random: number }
  | { type: "turn"; direction: Direction }
  | { type: "pause" }
  | { type: "resume" };

const opposite: Record<Direction, Direction> = {
  up: "down", down: "up", left: "right", right: "left",
};

function foodFor(snake: number[], random: number) {
  const occupied = new Set(snake);
  const available = Array.from({ length: SIZE * SIZE }, (_, i) => i).filter((i) => !occupied.has(i));
  return available[Math.floor(random * available.length)] ?? -1;
}

function newGame(best: number, random: number): Game {
  return {
    snake: initialSnake,
    food: foodFor(initialSnake, random),
    direction: "right",
    nextDirection: "right",
    status: "ready",
    score: 0,
    best,
  };
}

function updateGame(game: Game, action: Action): Game {
  switch (action.type) {
    case "start":
      return { ...newGame(game.best, action.random), status: "running" };
    case "pause":
      return game.status === "running" ? { ...game, status: "paused" } : game;
    case "resume":
      return game.status === "paused" ? { ...game, status: "running" } : game;
    case "turn":
      return game.status === "running" && action.direction !== opposite[game.direction]
        ? { ...game, nextDirection: action.direction }
        : game;
    case "tick": {
      if (game.status !== "running") return game;
      const head = game.snake[0];
      const direction = game.nextDirection;
      const x = head % SIZE;
      const y = Math.floor(head / SIZE);
      const nextX = x + (direction === "right" ? 1 : direction === "left" ? -1 : 0);
      const nextY = y + (direction === "down" ? 1 : direction === "up" ? -1 : 0);
      if (nextX < 0 || nextX >= SIZE || nextY < 0 || nextY >= SIZE) {
        return { ...game, status: "over" };
      }
      const nextHead = nextY * SIZE + nextX;
      const eating = nextHead === game.food;
      // Moving into the current tail is safe when it moves away on this turn.
      if (game.snake.slice(0, eating ? undefined : -1).includes(nextHead)) {
        return { ...game, status: "over" };
      }
      const snake = [nextHead, ...game.snake.slice(0, eating ? undefined : -1)];
      const score = game.score + (eating ? 1 : 0);
      return {
        ...game,
        snake,
        direction,
        nextDirection: direction,
        score,
        best: Math.max(game.best, score),
        food: eating ? foodFor(snake, action.random) : game.food,
        status: snake.length === SIZE * SIZE ? "won" : "running",
      };
    }
  }
}

function initialGame(): Game {
  let best = 0;
  try {
    best = Math.max(0, Number(window.localStorage.getItem(HIGH_SCORE_KEY)) || 0);
  } catch {
    // Private browsing can disable localStorage; the game still works.
  }
  return newGame(best, Math.random());
}

const keys: Record<string, Direction> = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right",
};

export function SnakeGame() {
  const [game, dispatch] = useReducer(updateGame, undefined, initialGame);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (game.status !== "running") return;
    const timer = window.setInterval(
      () => dispatch({ type: "tick", random: Math.random() }),
      Math.max(90, 190 - game.score * 5),
    );
    return () => window.clearInterval(timer);
  }, [game.status, game.score]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey ||
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement) return;
      const direction = keys[event.key] ?? keys[event.key.toLowerCase()];
      if (direction && game.status === "running") {
        event.preventDefault();
        dispatch({ type: "turn", direction });
      } else if (event.code === "Space" && (game.status === "running" || game.status === "paused")) {
        event.preventDefault();
        dispatch({ type: game.status === "running" ? "pause" : "resume" });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [game.status]);

  useEffect(() => {
    try {
      window.localStorage.setItem(HIGH_SCORE_KEY, String(game.best));
    } catch {
      // The score remains available until the page is closed.
    }
  }, [game.best]);

  const cells = new Set(game.snake);
  const message = {
    ready: "Ready to play?",
    running: "",
    paused: "Paused",
    over: "Game over!",
    won: "You filled the garden!",
  }[game.status];

  return (
    <section aria-labelledby="snake-title" className="rounded-3xl border-2 border-secondary/40 bg-secondary/10 p-4 shadow-md sm:p-7">
      <div className="mb-4 flex items-center gap-3 text-secondary">
        <span aria-hidden="true" className="text-3xl">🐍</span>
        <h1 id="snake-title" className="font-display text-4xl font-bold text-foreground">Snake</h1>
      </div>
      <p className="mb-5 text-foreground/85">Collect the golden snacks to grow. Avoid the walls and your own tail!</p>
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-background/80 px-4 py-3 font-bold text-foreground">
        <span data-testid="snake-score">Score: {game.score}</span>
        <span data-testid="snake-best">Best: {game.best}</span>
      </div>
      <div
        className="relative mx-auto grid aspect-square w-full max-w-[480px] touch-none overflow-hidden rounded-2xl border-4 border-secondary/70 bg-card p-1"
        style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
        aria-label={`Snake board. Score ${game.score}. ${game.status === "running" ? "Playing" : message}`}
        role="group"
        data-testid="snake-board"
        onTouchStart={(event) => {
          touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }}
        onTouchEnd={(event) => {
          if (!touchStart.current || game.status !== "running") return;
          const dx = event.changedTouches[0].clientX - touchStart.current.x;
          const dy = event.changedTouches[0].clientY - touchStart.current.y;
          touchStart.current = null;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
          dispatch({ type: "turn", direction: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up") });
        }}
      >
        {Array.from({ length: SIZE * SIZE }, (_, cell) => (
          <div
            key={cell}
            aria-hidden="true"
            className={`m-px rounded-[30%] ${
              cell === game.snake[0] ? "bg-secondary" :
              cells.has(cell) ? "bg-sage/75" :
              cell === game.food ? "rounded-full bg-amber shadow-sm" :
              "bg-background/75"
            }`}
          />
        ))}
        {game.status !== "running" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/85 p-5 text-center">
            <p className="font-display text-4xl font-bold text-foreground">{message}</p>
            <p className="mt-1 text-sm text-foreground/80">
              {game.status === "ready" ? "Press Play to start." : game.status === "paused" ? "Take your time." : `You scored ${game.score}.`}
            </p>
            <button
              type="button"
              onClick={() => dispatch(game.status === "paused" ? { type: "resume" } : { type: "start", random: Math.random() })}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary/85 focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="snake-play"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              {game.status === "paused" ? "Resume" : game.status === "ready" ? "Play" : "Play again"}
            </button>
          </div>
        )}
      </div>
      <p className="mt-5 text-center text-sm text-foreground/80">Use arrow keys or WASD on a keyboard, swipe the board, or tap the arrows below. Space pauses.</p>
      <div className="mx-auto mt-4 grid w-fit grid-cols-3 gap-2" aria-label="Snake controls">
        {([["up", ArrowUp], ["left", ArrowLeft], ["down", ArrowDown], ["right", ArrowRight]] as const).map(([direction, Icon], index) => (
          <button
            key={direction}
            type="button"
            disabled={game.status !== "running"}
            aria-label={`Move ${direction}`}
            data-testid={`snake-${direction}`}
            onClick={() => dispatch({ type: "turn", direction })}
            className={`flex h-14 w-16 items-center justify-center rounded-2xl border border-secondary/50 bg-background text-secondary shadow-sm hover:bg-secondary/15 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${index === 0 ? "col-start-2" : index === 1 ? "col-start-1 row-start-2" : "row-start-2"}`}
          >
            <Icon className="h-7 w-7" aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="mt-5 flex justify-center gap-3">
        <button
          type="button"
          disabled={game.status === "ready" || game.status === "over" || game.status === "won"}
          onClick={() => dispatch({ type: game.status === "running" ? "pause" : "resume" })}
          className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2 font-semibold text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          {game.status === "running" ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
          {game.status === "running" ? "Pause" : "Resume"}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "start", random: Math.random() })}
          className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2 font-semibold text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="snake-restart"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Restart
        </button>
      </div>
      <p className="sr-only" aria-live="polite">{game.status === "running" ? `Score ${game.score}` : message}</p>
    </section>
  );
}