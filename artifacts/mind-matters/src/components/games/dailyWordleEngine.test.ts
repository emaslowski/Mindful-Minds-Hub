import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DAILY_ANSWERS, getPuzzleDay, getDailyAnswer, isAllowedGuess, scoreGuess, validateSavedGuesses,
} from "./dailyWordleEngine";

test("daily date uses New York midnight, including both daylight saving transitions", () => {
  assert.equal(getPuzzleDay(new Date("2026-11-04T04:59:59Z")), "2026-11-03");
  assert.equal(getPuzzleDay(new Date("2026-11-04T05:00:00Z")), "2026-11-04");
  assert.equal(getPuzzleDay(new Date("2026-07-04T03:59:59Z")), "2026-07-03");
  assert.equal(getPuzzleDay(new Date("2026-07-04T04:00:00Z")), "2026-07-04");
  assert.equal(getPuzzleDay(new Date("2026-03-08T07:01:00Z")), "2026-03-08");
  assert.equal(getPuzzleDay(new Date("2026-11-01T06:01:00Z")), "2026-11-01");
});

test("daily answers are deterministic, valid, and different on consecutive days", () => {
  assert.ok(DAILY_ANSWERS.length > 100);
  for (const word of DAILY_ANSWERS) assert.ok(isAllowedGuess(word), word);
  for (let index = 0; index < 730; index++) {
    const day = new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10);
    const nextDay = new Date(Date.UTC(2026, 0, index + 2)).toISOString().slice(0, 10);
    const answer = getDailyAnswer(day);
    assert.equal(answer.length, 5);
    assert.equal(getDailyAnswer(day), answer);
    assert.notEqual(getDailyAnswer(nextDay), answer);
  }
});

test("scoring consumes exact matches before duplicate misplaced letters", () => {
  assert.deepEqual(scoreGuess("APPLE", "APPLE"), Array(5).fill("correct"));
  assert.deepEqual(scoreGuess("ALLEY", "APPLE"), ["correct", "present", "absent", "present", "absent"]);
  assert.deepEqual(scoreGuess("GEESE", "SHEEP"), ["absent", "present", "correct", "present", "absent"]);
  assert.deepEqual(scoreGuess("AAAAA", "APPLE"), ["correct", "absent", "absent", "absent", "absent"]);
  assert.deepEqual(scoreGuess("PUPPY", "APPLE"), ["present", "absent", "correct", "absent", "absent"]);
});

test("guesses require five alphabetic letters in the classroom vocabulary", () => {
  for (const word of ["CRANE", "APPLE", "ADIEU", "AUDIO", "STARE"]) assert.ok(isAllowedGuess(word));
  for (const word of ["apple", "XXXXX", "CAT", "12345", " WORD", "ABCDEF"]) assert.equal(isAllowedGuess(word), false);
});

test("saved games reject malformed data, too many guesses, and guesses after solving", () => {
  assert.deepEqual(validateSavedGuesses([], "APPLE"), []);
  assert.deepEqual(validateSavedGuesses(["CRANE", "APPLE"], "APPLE"), ["CRANE", "APPLE"]);
  assert.equal(validateSavedGuesses(["APPLE", "CRANE"], "APPLE"), null);
  assert.equal(validateSavedGuesses(Array(7).fill("CRANE"), "APPLE"), null);
  for (const value of [null, {}, [12], ["ZZZZZ"], ["apple"]]) assert.equal(validateSavedGuesses(value, "APPLE"), null);
});
