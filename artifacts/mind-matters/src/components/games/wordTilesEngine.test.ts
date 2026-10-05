import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, evaluateMove, exchangeRack, findRackWord, passTurn, playMove, premiumAt,
  type GameState, type Placement,
} from './wordTilesEngine';

const values: Record<string, number> = { A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,
  N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10,'':0 };
function fixture(letters: string, mode: 'solo' | 'two-player' = 'solo'): GameState {
  const state = createGame(mode);
  state.racks[0] = [...letters].map((letter, i) => ({
    id: `test-${i}`, letter: letter === '_' ? '' : letter, points: values[letter === '_' ? '' : letter],
  }));
  return state;
}
const place = (index: number, row: number, col: number, blankLetter?: string): Placement =>
  ({ tileId: `test-${index}`, row, col, blankLetter });
const tileCount = (state: GameState) => state.bag.length + state.racks.flat().length +
  state.board.flat().filter(Boolean).length;

test('fresh games have 100 distinct tiles, seven per rack, and independent board rows', () => {
  for (const mode of ['solo', 'two-player'] as const) {
    const state = createGame(mode);
    assert.equal(tileCount(state), 100);
    assert.equal(new Set([...state.bag, ...state.racks.flat()].map((tile) => tile.id)).size, 100);
    assert.ok(state.racks.every((rack) => rack.length === 7));
    assert.equal(state.bag.length, mode === 'solo' ? 93 : 86);
    assert.equal([...state.bag, ...state.racks.flat()].filter((tile) => tile.letter === '').length, 2);
    state.board[0][0] = { letter:'A', points:1 };
    assert.equal(state.board[1][0], null);
  }
});

test('first play needs the center and at least a two-letter dictionary word', () => {
  const state = fixture('ATZ');
  assert.match(evaluateMove(state, [place(0,0,0),place(1,0,1)]).message, /center/);
  assert.equal(evaluateMove(state, [place(0,7,7)]).valid, false);
  assert.match(evaluateMove(state, [place(0,7,7),place(2,7,8)]).message, /dictionary/);
  const move = evaluateMove(state, [place(0,7,7),place(1,7,8)]);
  assert.deepEqual(move.words, ['AT']);
  assert.equal(move.points, 4);
  assert.equal(move.valid, true);
});

test('rejects duplicate IDs, occupied positions, diagonal moves and empty gaps', () => {
  const state = fixture('CATS');
  assert.equal(evaluateMove(state, [place(0,7,7),place(0,7,8)]).valid, false);
  assert.equal(evaluateMove(state, [place(0,7,7),place(1,7,7)]).valid, false);
  assert.equal(evaluateMove(state, [place(0,7,7),place(1,8,8)]).valid, false);
  assert.match(evaluateMove(state, [place(0,7,7),place(1,7,9)]).message, /gap/);
  assert.equal(evaluateMove(state, [place(0,-1,7)]).valid, false);
  assert.equal(evaluateMove(state, [place(0,7.5,7)]).valid, false);
  assert.equal(evaluateMove(state, [{tileId:'not-owned',row:7,col:7}]).valid, false);
});

test('scores every cross word and rejects a move when any cross word is invalid', () => {
  const state = fixture('A');
  state.board[6][8] = {letter:'T',points:1};
  state.board[7][7] = {letter:'N',points:1};
  const result = evaluateMove(state, [place(0,6,7)]);
  assert.equal(result.valid, true);
  assert.deepEqual(result.words, ['AT','AN']);
  assert.equal(result.points, 4);
  state.board[6][8] = {letter:'Q',points:10};
  assert.match(evaluateMove(state, [place(0,6,7)]).message, /AQ.*dictionary/);
});

test('existing center bonus is not reused, and separate words cannot be disconnected', () => {
  const state = fixture('S');
  state.board[7][6] = {letter:'C',points:3};
  state.board[7][7] = {letter:'A',points:1};
  state.board[7][8] = {letter:'T',points:1};
  assert.equal(evaluateMove(state, [place(0,7,9)]).points, 6);
  const disconnected = fixture('AT');
  disconnected.board[7][7] = {letter:'C',points:3};
  assert.match(evaluateMove(disconnected, [place(0,0,0),place(1,0,1)]).message, /Connect/);
});

test('a new double-letter tile bonus applies to the new tile only', () => {
  const state = fixture('C');
  state.board[7][4] = {letter:'A',points:1};
  state.board[7][5] = {letter:'T',points:1};
  assert.equal(premiumAt(7,3), 'DL');
  assert.equal(evaluateMove(state, [place(0,7,3)]).points, 8);
});

test('blank tiles require one chosen letter, score zero, and keep that letter after play', () => {
  const state = fixture('_T');
  assert.equal(evaluateMove(state,[place(0,7,7),place(1,7,8)]).valid, false);
  assert.equal(evaluateMove(state,[place(0,7,7,'AB'),place(1,7,8)]).valid, false);
  const moves = [place(0,7,7,'a'),place(1,7,8)];
  assert.equal(evaluateMove(state,moves).points,2);
  const result = playMove(state,moves);
  assert.equal(result.error, undefined);
  assert.deepEqual(result.state.board[7][7], {letter:'A',points:0});
});

test('using seven rack tiles earns a 50-point bonus', () => {
  const state = fixture('GARDENS');
  const moves = [...'GARDENS'].map((_,index) => place(index,7,index+4));
  const result = evaluateMove(state,moves);
  assert.equal(result.valid,true);
  assert.equal(result.points,68);
});

test('evaluating and committing moves do not mutate the prior game; tiles are conserved', () => {
  const state = createGame('two-player');
  const fixed = fixture('AT');
  const before = JSON.stringify(fixed);
  const moves = [place(0,7,7),place(1,7,8)];
  evaluateMove(fixed,moves);
  const next = playMove(fixed,moves);
  assert.equal(JSON.stringify(fixed),before);
  assert.equal(next.state.racks[0].length,7);
  assert.equal(next.state.scores[0],4);
  // Deal a guaranteed AT from the real 100-tile inventory, not a random hint.
  const pool = [...state.bag, ...state.racks.flat()];
  const a = pool.find((tile) => tile.letter === 'A')!;
  const t = pool.find((tile) => tile.letter === 'T')!;
  const remaining = pool.filter((tile) => tile.id !== a.id && tile.id !== t.id);
  state.racks = [[a,t,...remaining.splice(0,5)],remaining.splice(0,7)];
  state.bag = remaining;
  const played = playMove(state, [
    {tileId:a.id,row:7,col:7}, {tileId:t.id,row:7,col:8},
  ]);
  assert.equal(played.error,undefined);
  assert.equal(tileCount(played.state),100);
  assert.equal(played.state.currentPlayer,1);
});

test('pass and exchange advance players, preserve tiles and enforce exchange minimum', () => {
  const state = createGame('two-player');
  const before = JSON.stringify(state);
  const result = exchangeRack(state);
  assert.equal(result.error,undefined);
  assert.equal(result.state.currentPlayer,1);
  assert.equal(result.state.racks[0].length,7);
  assert.equal(tileCount(result.state),100);
  assert.equal(JSON.stringify(state),before);
  const returned = passTurn(result.state);
  assert.equal(returned.currentPlayer,0);
  assert.equal(returned.consecutivePasses,2);
  const smallBag = {...state,bag:state.bag.slice(0,6)};
  assert.ok(exchangeRack(smallBag).error);
});

test('six scoreless turns finish the game and disable further changes', () => {
  let state = fixture('AT');
  for (let i=0;i<6;i++) state = passTurn(state);
  assert.equal(state.finished,true);
  assert.equal(state.scores[0],-2);
  assert.match(state.result!,/Final score/);
  assert.strictEqual(passTurn(state),state);
  assert.ok(exchangeRack(state).error);
  assert.ok(playMove(state,[place(0,7,7)]).error);
});

test('using the last rack transfers remaining tile points in pass-and-play', () => {
  const state = fixture('AT','two-player');
  state.bag = [];
  state.racks[1] = [{id:'other-z',letter:'Z',points:10}];
  state.scores = [20,30];
  const result = playMove(state,[place(0,7,7),place(1,7,8)]).state;
  assert.equal(result.finished,true);
  assert.deepEqual(result.scores,[34,20]);
  assert.match(result.result!,/Player 1 wins/);
});

test('rack hints respect exact letter multiplicity and blank substitutions', () => {
  assert.equal(findRackWord(fixture('ZZZ').racks[0]),null);
  assert.equal(findRackWord(fixture('CAT').racks[0])?.length,3);
  const blankWord = findRackWord(fixture('_T').racks[0]);
  assert.ok(blankWord);
  assert.equal(blankWord.length,2);
});
