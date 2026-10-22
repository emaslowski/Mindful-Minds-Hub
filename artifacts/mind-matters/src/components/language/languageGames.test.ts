import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { buildPhrase, handshapeQuizLetters, phrasePuzzles, quizQuestions, shuffle, vocabulary } from "./languageGames";

test("Spanish vocabulary has unique pairs across four learning categories", () => {
  assert.equal(vocabulary.length, 24);
  assert.equal(new Set(vocabulary.map(word => word.spanish)).size, vocabulary.length);
  assert.equal(new Set(vocabulary.map(word => word.english)).size, vocabulary.length);
  assert.equal(new Set(vocabulary.map(word => word.category)).size, 4);
});

test("shuffle preserves input and each token, including repeated phrase tokens", () => {
  const input = ["la", "mochila", "está", "en", "la", "escuela"];
  const original = [...input];
  assert.deepEqual(shuffle(input).sort(), [...original].sort());
  assert.deepEqual(input, original);
});

test("phrase checking requires every token, in order, without losing repeated words", () => {
  for (const puzzle of phrasePuzzles) {
    assert(buildPhrase([...puzzle.spanish], puzzle.spanish));
    assert(!buildPhrase(puzzle.spanish.slice(1), puzzle.spanish));
    assert(!buildPhrase([...puzzle.spanish].reverse(), puzzle.spanish));
  }
  const repeated = phrasePuzzles.find(puzzle => puzzle.spanish.filter(word => word === "la").length === 2)!;
  assert(repeated);
  assert(!buildPhrase([...new Set(repeated.spanish)], repeated.spanish));
});

test("every Spanish quiz question has one correct option", () => {
  for (const question of quizQuestions) {
    assert.equal(question.choices.filter(option => option === question.answer).length, 1);
    assert.equal(new Set(question.choices).size, question.choices.length);
  }
});

test("static handshape quiz excludes movement letters and every diagram exists without answer text", () => {
  assert.equal(handshapeQuizLetters.length, 24);
  assert(!handshapeQuizLetters.includes("J"));
  assert(!handshapeQuizLetters.includes("Z"));
  for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    const svg = readFileSync(new URL(`../../../public/images/asl/${letter}.svg`, import.meta.url), "utf8");
    assert(svg.includes("<svg"));
    assert(!/<(?:\w+:)?(?:text|script)\b/.test(svg));
    assert(!/href=["']https?:/.test(svg));
  }
});
