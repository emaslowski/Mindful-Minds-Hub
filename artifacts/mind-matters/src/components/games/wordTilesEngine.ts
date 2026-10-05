import { CLASSROOM_WORDS } from './wordTilesWords';

export type GameMode = 'solo' | 'two-player';
export interface Tile { id: string; letter: string; points: number }
export interface BoardTile { letter: string; points: number }
export interface Placement { tileId: string; row: number; col: number; blankLetter?: string }
export interface GameState {
  board: (BoardTile | null)[][];
  bag: Tile[];
  racks: Tile[][];
  scores: number[];
  currentPlayer: number;
  mode: GameMode;
  turn: number;
  consecutivePasses: number;
  finished: boolean;
  history: { player: number; words: string[]; points: number }[];
  result?: string;
}
export interface MoveEvaluation { valid: boolean; message: string; points: number; words: string[] }
export interface ActionResult { state: GameState; error?: string }

export const BOARD_SIZE = 15;
const TILE_COUNTS: [string, number, number][] = [
  ['A',9,1],['B',2,3],['C',2,3],['D',4,2],['E',12,1],['F',2,4],['G',3,2],
  ['H',2,4],['I',9,1],['J',1,8],['K',1,5],['L',4,1],['M',2,3],['N',6,1],
  ['O',8,1],['P',2,3],['Q',1,10],['R',6,1],['S',4,1],['T',6,1],['U',4,1],
  ['V',2,4],['W',2,4],['X',1,8],['Y',2,4],['Z',1,10],['',2,0],
];
const tripleWord = new Set(['0,0','0,7','0,14','7,0','7,14','14,0','14,7','14,14']);
const doubleWord = new Set(['1,1','2,2','3,3','4,4','7,7','10,10','11,11','12,12','13,13',
  '1,13','2,12','3,11','4,10','10,4','11,3','12,2','13,1']);
const tripleLetter = new Set(['1,5','1,9','5,1','5,5','5,9','5,13','9,1','9,5','9,9','9,13','13,5','13,9']);
const doubleLetter = new Set(['0,3','0,11','2,6','2,8','3,0','3,7','3,14','6,2','6,6','6,8','6,12',
  '7,3','7,11','8,2','8,6','8,8','8,12','11,0','11,7','11,14','12,6','12,8','14,3','14,11']);

export function premiumAt(row: number, col: number): 'TW' | 'DW' | 'TL' | 'DL' | null {
  const key = `${row},${col}`;
  return tripleWord.has(key) ? 'TW' : doubleWord.has(key) ? 'DW' :
    tripleLetter.has(key) ? 'TL' : doubleLetter.has(key) ? 'DL' : null;
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createGame(mode: GameMode = 'solo'): GameState {
  let id = 0;
  const bag = shuffled(TILE_COUNTS.flatMap(([letter, count, points]) =>
    Array.from({ length: count }, () => ({ id: `tile-${id++}`, letter, points }))));
  const racks = Array.from({ length: mode === 'solo' ? 1 : 2 }, () => bag.splice(0, 7));
  return {
    board: Array.from({ length: BOARD_SIZE }, () => Array<BoardTile | null>(BOARD_SIZE).fill(null)),
    bag, racks, scores: racks.map(() => 0), currentPlayer: 0, mode, turn: 1,
    consecutivePasses: 0, finished: false, history: [],
  };
}

const reject = (message: string): MoveEvaluation => ({ valid: false, message, points: 0, words: [] });
const inBounds = (row: number, col: number) => row >= 0 && col >= 0 && row < BOARD_SIZE && col < BOARD_SIZE;

export function evaluateMove(state: GameState, placements: Placement[]): MoveEvaluation {
  if (state.finished) return reject('This game is finished. Start a new game to play again.');
  if (!placements.length) return reject('Select a tile from your rack, then choose a board square.');
  const board = state.board.map((row) => [...row]);
  const rack = state.racks[state.currentPlayer];
  const newSquares = new Set<string>();
  const usedIds = new Set<string>();
  for (const placement of placements) {
    const { row, col, tileId } = placement;
    if (!Number.isInteger(row) || !Number.isInteger(col) || !inBounds(row, col)) return reject('Choose a square on the board.');
    const tile = rack.find((item) => item.id === tileId);
    if (!tile || usedIds.has(tileId)) return reject('Each tile in your rack can be used only once.');
    if (board[row][col]) return reject('That square already has a tile.');
    const letter = tile.letter || placement.blankLetter?.toUpperCase();
    if (!letter || !/^[A-Z]$/.test(letter)) return reject('Choose a letter for your blank tile.');
    usedIds.add(tileId);
    newSquares.add(`${row},${col}`);
    board[row][col] = { letter, points: tile.points };
  }
  const sameRow = placements.every((tile) => tile.row === placements[0].row);
  const sameCol = placements.every((tile) => tile.col === placements[0].col);
  if (!sameRow && !sameCol) return reject('Place all new tiles in one row or one column.');
  const row = placements[0].row, col = placements[0].col;
  if (sameRow) {
    const columns = placements.map((tile) => tile.col);
    for (let c = Math.min(...columns); c <= Math.max(...columns); c++) {
      if (!board[row][c]) return reject('Your word has an empty gap. Fill it with a tile.');
    }
  } else {
    const rows = placements.map((tile) => tile.row);
    for (let r = Math.min(...rows); r <= Math.max(...rows); r++) {
      if (!board[r][col]) return reject('Your word has an empty gap. Fill it with a tile.');
    }
  }
  const firstMove = !state.board.some((line) => line.some(Boolean));
  if (firstMove && !newSquares.has('7,7')) return reject('Your first word must cover the center star.');
  if (!firstMove && !placements.some(({ row: r, col: c }) =>
    [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].some(([nr,nc]) => inBounds(nr,nc) && state.board[nr][nc]))) {
    return reject('Connect your word to a tile already on the board.');
  }

  const formed = new Map<string, { word: string; cells: [number, number][] }>();
  for (const { row: r, col: c } of placements) {
    for (const [dr, dc] of [[0,1],[1,0]]) {
      let startR = r, startC = c;
      while (inBounds(startR-dr, startC-dc) && board[startR-dr][startC-dc]) {
        startR -= dr; startC -= dc;
      }
      const cells: [number,number][] = [];
      let nr = startR, nc = startC;
      while (inBounds(nr,nc) && board[nr][nc]) {
        cells.push([nr,nc]); nr += dr; nc += dc;
      }
      if (cells.length > 1) {
        formed.set(`${dr},${dc}:${startR},${startC}`, {
          word: cells.map(([rr,cc]) => board[rr][cc]!.letter).join(''), cells,
        });
      }
    }
  }
  if (!formed.size) return reject('Make a word with at least two letters.');
  const words = [...formed.values()].map((item) => item.word);
  const invalid = words.filter((word) => !CLASSROOM_WORDS.has(word));
  if (invalid.length) return reject(`${invalid.join(', ')} ${invalid.length > 1 ? 'are not' : 'is not'} in our classroom dictionary. Try another word.`);
  let points = 0;
  for (const { cells } of formed.values()) {
    let sum = 0, multiplier = 1;
    for (const [r,c] of cells) {
      const premium = newSquares.has(`${r},${c}`) ? premiumAt(r,c) : null;
      sum += board[r][c]!.points * (premium === 'DL' ? 2 : premium === 'TL' ? 3 : 1);
      multiplier *= premium === 'DW' ? 2 : premium === 'TW' ? 3 : 1;
    }
    points += sum * multiplier;
  }
  if (placements.length === 7) points += 50;
  return { valid: true, message: `${words.join(' + ')} earns ${points} points.`, points, words };
}

function finishIfNeeded(state: GameState): GameState {
  const emptyRack = state.bag.length === 0 ? state.racks.findIndex((rack) => rack.length === 0) : -1;
  if (emptyRack < 0 && state.consecutivePasses < 6) return state;
  const remaining = state.racks.map((rack) => rack.reduce((sum, tile) => sum + tile.points, 0));
  const scores = state.scores.map((score, i) => score - remaining[i]);
  if (emptyRack >= 0 && state.mode === 'two-player') {
    scores[emptyRack] += remaining.reduce((sum, points) => sum + points, 0);
  }
  const high = Math.max(...scores);
  const winners = scores.map((score, i) => score === high ? i + 1 : 0).filter(Boolean);
  return {
    ...state, scores, finished: true,
    result: state.mode === 'solo' ? `Practice complete! Final score: ${scores[0]}.` :
      winners.length > 1 ? `It is a tie! Each player scored ${high}.` : `Player ${winners[0]} wins with ${high} points!`,
  };
}

function advanceTurn(state: GameState): GameState {
  return finishIfNeeded({
    ...state, turn: state.turn + 1,
    currentPlayer: (state.currentPlayer + 1) % state.racks.length,
  });
}

export function playMove(state: GameState, placements: Placement[]): ActionResult {
  const evaluation = evaluateMove(state, placements);
  if (!evaluation.valid) return { state, error: evaluation.message };
  const board = state.board.map((line) => [...line]);
  const used = new Set(placements.map((tile) => tile.tileId));
  const rack = state.racks[state.currentPlayer];
  placements.forEach(({ row, col, tileId, blankLetter }) => {
    const tile = rack.find((item) => item.id === tileId)!;
    board[row][col] = { letter: tile.letter || blankLetter!.toUpperCase(), points: tile.points };
  });
  const bag = [...state.bag];
  const newRack = rack.filter((tile) => !used.has(tile.id));
  newRack.push(...bag.splice(0, Math.max(0, 7 - newRack.length)));
  const racks = state.racks.map((tiles, i) => i === state.currentPlayer ? newRack : tiles);
  const scores = state.scores.map((score, i) => i === state.currentPlayer ? score + evaluation.points : score);
  return { state: advanceTurn({
    ...state, board, bag, racks, scores, consecutivePasses: evaluation.points === 0 ? state.consecutivePasses + 1 : 0,
    history: [...state.history, { player: state.currentPlayer, words: evaluation.words, points: evaluation.points }],
  }) };
}

export function passTurn(state: GameState): GameState {
  if (state.finished) return state;
  return advanceTurn({ ...state, consecutivePasses: state.consecutivePasses + 1 });
}

export function exchangeRack(state: GameState): ActionResult {
  if (state.finished) return { state, error: 'Start a new game to exchange tiles.' };
  if (state.bag.length < 7) return { state, error: 'You need at least 7 tiles in the bag to exchange your rack.' };
  const bag = [...state.bag];
  const nextRack = bag.splice(0, 7);
  // Draw first, then return the old rack, so exchanged tiles cannot be redrawn immediately.
  bag.push(...state.racks[state.currentPlayer]);
  return { state: advanceTurn({
    ...state, bag: shuffled(bag),
    racks: state.racks.map((rack, i) => i === state.currentPlayer ? nextRack : rack),
    consecutivePasses: state.consecutivePasses + 1,
  }) };
}

export function findRackWord(rack: Tile[]): string | null {
  const counts = new Map<string, number>();
  rack.forEach((tile) => counts.set(tile.letter, (counts.get(tile.letter) ?? 0) + 1));
  const possible = [...CLASSROOM_WORDS].filter((word) => word.length >= 2 && word.length <= rack.length);
  possible.sort((a,b) => b.length - a.length || a.localeCompare(b));
  return possible.find((word) => {
    const available = new Map(counts);
    for (const letter of word) {
      const use = (available.get(letter) ?? 0) > 0 ? letter : '';
      if ((available.get(use) ?? 0) === 0) return false;
      available.set(use, available.get(use)! - 1);
    }
    return true;
  }) ?? null;
}
