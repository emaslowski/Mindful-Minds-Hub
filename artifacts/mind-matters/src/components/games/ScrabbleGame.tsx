import { useState } from "react";
import { ArrowDownUp, Lightbulb, RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createGame,
  evaluateMove,
  exchangeRack,
  findRackWord,
  passTurn,
  playMove,
  premiumAt,
  type GameMode,
  type GameState,
  type Placement,
  type Tile,
} from "@/components/games/wordTilesEngine";

const BOARD_SIZE = 15;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
type Bonus = "TW" | "DW" | "TL" | "DL";

function initialGame(): GameState {
  return createGame("solo");
}

function tileById(rack: Tile[], id: string) {
  return rack.find((tile) => tile.id === id);
}

export function ScrabbleGame({ isActive }: { isActive: boolean }) {
  const [game, setGame] = useState<GameState>(initialGame);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [blankTarget, setBlankTarget] = useState<{ row: number; col: number; tileId: string } | null>(null);
  const [message, setMessage] = useState("Select a rack tile, then choose a square on the board.");
  const [hint, setHint] = useState<string | null>(null);
  const [nextMode, setNextMode] = useState<GameMode>("solo");
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const currentRack = game.racks[game.currentPlayer] ?? [];
  const pendingIds = new Set(placements.map((placement) => placement.tileId));
  const tentativeByPosition = new Map(placements.map((placement) => [`${placement.row}-${placement.col}`, placement]));
  const finished = game.finished;

  function startNew(mode: GameMode) {
    setNextMode(mode);
    if (game.history.length > 0 || game.turn > 1 || placements.length > 0) {
      setRestartDialogOpen(true);
      return;
    }
    resetGame(mode);
  }

  function resetGame(mode: GameMode) {
    setGame(createGame(mode));
    setPlacements([]);
    setSelectedTile(null);
    setBlankTarget(null);
    setHint(null);
    setMessage("Select a rack tile, then choose a square on the board.");
    setRestartDialogOpen(false);
  }

  function chooseRackTile(tile: Tile) {
    if (finished || pendingIds.has(tile.id)) return;
    setSelectedTile((current) => current === tile.id ? null : tile.id);
    setMessage(tile.letter ? `${tile.letter} selected. Choose a square to place it.` : "Blank tile selected. Choose a square, then choose its letter.");
    setHint(null);
  }

  function chooseSquare(row: number, col: number) {
    const position = `${row}-${col}`;
    if (tentativeByPosition.has(position)) {
      setPlacements((current) => current.filter((placement) => placement.row !== row || placement.col !== col));
      setMessage("Tentative tile removed.");
      return;
    }
    if (game.board[row]?.[col] || !selectedTile || pendingIds.has(selectedTile)) return;
    const tile = tileById(currentRack, selectedTile);
    if (!tile) return;
    if (tile.letter === "") {
      setBlankTarget({ row, col, tileId: tile.id });
    } else {
      setPlacements((current) => [...current, { tileId: tile.id, row, col }]);
      setMessage("Tile placed tentatively. Tap it to remove it, or submit your turn.");
      setSelectedTile(null);
    }
  }

  function chooseBlankLetter(letter: string) {
    if (!blankTarget) return;
    setPlacements((current) => [...current, { ...blankTarget, blankLetter: letter }]);
    setBlankTarget(null);
    setSelectedTile(null);
    setMessage(`Blank set to ${letter}. Tap its square to remove it, or submit your turn.`);
  }

  function submitTurn() {
    if (!placements.length) {
      setMessage("Place at least one tile before submitting a turn.");
      return;
    }
    const evaluation = evaluateMove(game, placements);
    if (!evaluation.valid) {
      setMessage(evaluation.message || "That move is not valid. Adjust the tiles and try again.");
      return;
    }
    const result = playMove(game, placements);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setGame(result.state);
    setPlacements([]);
    setSelectedTile(null);
    setHint(null);
    const words = evaluation.words.length ? ` Words: ${evaluation.words.join(", ")}.` : "";
    setMessage(`${evaluation.message || "Turn submitted."} You earned ${evaluation.points} points.${words}`);
  }

  function handlePass() {
    if (placements.length) {
      setMessage("Recall tentative tiles before passing your turn.");
      return;
    }
    const next = passTurn(game);
    setGame(next);
    setSelectedTile(null);
    setHint(null);
    setMessage(next.finished ? next.result || "The game is complete." : "Turn passed.");
  }

  function handleExchange() {
    if (placements.length) {
      setMessage("Recall tentative tiles before exchanging your rack.");
      return;
    }
    const result = exchangeRack(game);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setGame(result.state);
    setSelectedTile(null);
    setHint(null);
    setMessage("Rack exchanged. Your turn is over.");
  }

  function recallAll() {
    setPlacements([]);
    setSelectedTile(null);
    setBlankTarget(null);
    setMessage("All tentative tiles returned to your rack.");
  }

  function revealHint() {
    const word = findRackWord(currentRack);
    setHint(word ? `Try building “${word.toUpperCase()}” from your rack.` : "No rack-only word was found. Try combining tiles with words already on the board.");
  }

  function squareBonus(row: number, col: number) {
    return premiumAt(row, col) as Bonus | null;
  }

  return (
    <section aria-labelledby="tiles-title" data-active={isActive} className="rounded-3xl border-2 border-secondary/40 bg-secondary/10 p-4 shadow-md sm:p-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-secondary">Classroom word-tile learning edition</p>
          <h2 id="tiles-title" className="font-display text-4xl font-bold text-foreground">Scrabble-style word tiles</h2>
          <p className="mt-1 max-w-xl text-foreground/80">Build connected words, learn from the board, and take turns on one device.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => startNew("solo")} data-testid="tiles-new-solo">New solo game</Button>
          <Button variant="outline" onClick={() => startNew("two-player")} data-testid="tiles-new-two-player">New pass-and-play</Button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {game.scores.map((score, index) => (
          <div key={index} className={`rounded-2xl border p-3 ${game.currentPlayer === index && !finished ? "border-primary bg-background" : "border-secondary/30 bg-background/70"}`} data-testid={`tiles-score-player-${index + 1}`}>
            <p className="text-sm font-semibold text-foreground/75">{game.mode === "solo" ? "Your score" : `Player ${index + 1}${game.currentPlayer === index && !finished ? " · your turn" : ""}`}</p>
            <p className="font-display text-3xl font-bold">{score}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-secondary/30 bg-background/70 p-3">
          <p className="text-sm font-semibold text-foreground/75">Tiles left in bag</p>
          <p className="font-display text-3xl font-bold" data-testid="tiles-bag-count">{game.bag.length}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Board bonus legend">
        <span className="text-sm font-bold">Bonus squares:</span>
        {([
          ["TW", "Triple word"],
          ["DW", "Double word"],
          ["TL", "Triple letter"],
          ["DL", "Double letter"],
        ] as const).map(([code, label]) => (
          <span key={code} className="rounded-md border border-secondary/40 bg-background px-2 py-1 text-xs font-bold" title={label}>{code}: {label}</span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border-2 border-secondary/50 bg-secondary/20 p-2" aria-label="Scrollable word tile board">
        <div
          className="grid w-fit border-l border-t border-secondary/50"
          style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 44px)` }}
          role="grid"
          aria-label="15 by 15 word tile board"
          data-testid="tiles-board"
        >
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
            const row = Math.floor(index / BOARD_SIZE);
            const col = index % BOARD_SIZE;
            const existing = game.board[row]?.[col];
            const tentative = tentativeByPosition.get(`${row}-${col}`);
            const placed = tentative && tileById(currentRack, tentative.tileId);
            const bonus = squareBonus(row, col);
            const label = existing
              ? `Row ${row + 1}, column ${col + 1}, ${existing.letter}, ${existing.points} points`
              : tentative && placed
                ? `Tentative ${tentative.blankLetter || placed.letter}, row ${row + 1}, column ${col + 1}, tap to remove`
                : `Empty row ${row + 1}, column ${col + 1}${bonus ? `, ${bonus}` : ""}`;
            return (
              <button
                key={`${row}-${col}`}
                type="button"
                role="gridcell"
                onClick={() => chooseSquare(row, col)}
                disabled={finished || Boolean(existing) || (!tentative && !selectedTile)}
                aria-label={label}
                data-testid={`tiles-square-${row}-${col}`}
                className={`relative flex h-11 w-11 min-h-11 items-center justify-center border-b border-r border-secondary/50 p-0 text-xs font-bold focus-visible:z-10 disabled:cursor-default disabled:opacity-100 ${
                  existing ? "bg-warm-sand text-foreground" :
                  tentative ? "bg-accent text-foreground" :
                  bonus === "TW" ? "bg-primary/25 text-foreground" :
                  bonus === "DW" ? "bg-dusty-rose/35 text-foreground" :
                  bonus === "TL" ? "bg-secondary/25 text-foreground" :
                  bonus === "DL" ? "bg-amber/35 text-foreground" : "bg-background/75 text-foreground/60"
                }`}
              >
                {existing ? (
                  <><span>{existing.letter}</span><span className="absolute bottom-0 right-0.5 text-xs">{existing.points}</span></>
                ) : tentative && placed ? (
                  <><span>{tentative.blankLetter || placed.letter}</span><span className="absolute bottom-0 right-0.5 text-xs">{tentative.blankLetter ? 0 : placed.points}</span></>
                ) : (
                  <span aria-hidden="true" className="text-xs">{row === 7 && col === 7 ? "START" : bonus || ""}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-sm text-foreground/70">On a phone, scroll inside the board to reach every square.</p>

      <div className="mt-5 rounded-2xl border border-secondary/30 bg-background/75 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold">{game.mode === "solo" ? "Your rack" : `Player ${game.currentPlayer + 1} rack`}</h3>
            <p className="text-sm text-foreground/75">Choose a tile, then tap an open board square. Tap any tentative tile to remove it.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={revealHint} disabled={finished} data-testid="tiles-hint"><Lightbulb aria-hidden="true" /> Rack hint</Button>
            <Button variant="outline" size="sm" onClick={recallAll} disabled={!placements.length || finished} data-testid="tiles-recall"><Undo2 aria-hidden="true" /> Recall all</Button>
            <Button variant="outline" size="sm" onClick={handleExchange} disabled={finished || game.bag.length < 7 || placements.length > 0 || !currentRack.length} data-testid="tiles-exchange"><ArrowDownUp aria-hidden="true" /> Exchange rack</Button>
          </div>
        </div>
        {hint && <p className="mt-3 rounded-xl bg-accent/30 p-3 font-semibold" data-testid="tiles-hint-message">{hint}</p>}
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Your rack">
          {currentRack.map((tile) => (
            <Button
              key={tile.id}
              type="button"
              variant={selectedTile === tile.id ? "default" : "outline"}
              disabled={finished || pendingIds.has(tile.id)}
              onClick={() => chooseRackTile(tile)}
              aria-pressed={selectedTile === tile.id}
              aria-label={`${tile.letter || "Blank"} tile, ${tile.points} points${pendingIds.has(tile.id) ? ", tentatively placed" : ""}`}
              data-testid={`tiles-rack-tile-${tile.id}`}
              className={`relative h-12 w-12 min-h-12 p-0 font-display text-xl font-bold ${pendingIds.has(tile.id) ? "opacity-40" : ""}`}
            >
              {tile.letter || "?"}<span className="absolute bottom-0.5 right-1 text-xs font-sans">{tile.points}</span>
            </Button>
          ))}
          {!currentRack.length && <p className="rounded-lg border border-dashed border-secondary/50 px-4 py-3 text-sm">No tiles in this rack.</p>}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={submitTurn} disabled={finished || !placements.length} data-testid="tiles-submit-turn">Submit turn</Button>
        <Button variant="outline" onClick={handlePass} disabled={finished || placements.length > 0} data-testid="tiles-pass-turn">Pass turn</Button>
        <Button variant="outline" onClick={() => startNew(game.mode)} data-testid="tiles-restart"><RotateCcw aria-hidden="true" /> Restart game</Button>
      </div>
      <p className="mt-4 min-h-6 rounded-xl bg-background/75 p-3 text-sm font-semibold" aria-live="polite" data-testid="tiles-message">{message}</p>
      {finished && <p className="mt-3 rounded-xl border border-primary/40 bg-primary/10 p-4 font-bold" role="status" data-testid="tiles-game-result">{game.result || "Game complete."}</p>}

      <details className="mt-5 rounded-2xl border border-secondary/30 bg-background/70 p-4">
        <summary className="cursor-pointer font-bold">How to play and board rules</summary>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-foreground/80">
          <li>Choose solo practice or pass-and-play with a partner on this device. Each rack has up to seven tiles.</li>
          <li>Place tiles to make connected words. The first word crosses the center square. Later plays connect to tiles already on the board.</li>
          <li>Tap a tentative tile on the board to remove it, or use Recall all. Blank tiles stand for a letter and are worth zero points.</li>
          <li>Submit a valid word to score and refill your rack. You may pass, or exchange your full rack when at least seven tiles remain in the bag.</li>
          <li>Bonus squares count only when a tile is first placed there. Using all seven tiles in one turn earns 50 extra points.</li>
          <li>The game ends when a player uses their last tiles and the bag is empty, or after six turns without scoring. Unplayed tile values are deducted from the final scores.</li>
          <li>Word checks use a classroom learning dictionary, not a full tournament Scrabble dictionary. This is an educational word-tile game, not an official Scrabble product.</li>
        </ol>
      </details>

      {game.history.length > 0 && (
        <div className="mt-5">
          <h3 className="font-bold">Recent turns</h3>
          <ul className="mt-2 space-y-1 text-sm text-foreground/80">
            {game.history.slice(-5).reverse().map((entry, index) => (
              <li key={`${entry.player}-${game.history.length - index}`} className="rounded-lg bg-background/60 px-3 py-2">
                {game.mode === "two-player" ? `Player ${entry.player + 1}: ` : "You: "}
                {entry.words.length ? entry.words.join(", ") : "Passed"} · {entry.points} points
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={Boolean(blankTarget)} onOpenChange={(open) => { if (!open) setBlankTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose a letter for your blank tile</DialogTitle>
            <DialogDescription>The blank tile counts as zero points and keeps the letter you choose for this play.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-7">
            {LETTERS.map((letter) => (
              <Button key={letter} variant="outline" onClick={() => chooseBlankLetter(letter)} data-testid={`tiles-blank-${letter.toLowerCase()}`}>{letter}</Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new game?</AlertDialogTitle>
            <AlertDialogDescription>This will clear the current board, scores, and turn history. Your new game will use {nextMode === "solo" ? "solo practice" : "two-player pass-and-play"} mode.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep playing</AlertDialogCancel>
            <AlertDialogAction onClick={() => resetGame(nextMode)}>Start new game</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
