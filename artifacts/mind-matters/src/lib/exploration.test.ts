import { test } from "node:test";
import assert from "node:assert/strict";
import { gamesAreUnlocked, isQualifyingGameComment, recordSection, sectionForPath, validVisitedSections, REQUIRED_SECTIONS } from "./exploration";

test("home, games, utility pages, and unknown routes never earn progress", () => {
  for (const path of ["/", "/games", "/games?tab=snake", "/contact", "/review", "/checkin", "/anonymous-access", "/unknown"]) {
    assert.equal(sectionForPath(path), null, path);
  }
});

test("related pages count as one section, not extra visits", () => {
  let visits: string[] = [];
  for (const path of ["/connect", "/connect/blog/1", "/connect/post/2", "/connect", "/create", "/create/coloring-pages", "/create/directed-draws"]) {
    visits = recordSection(visits, path);
  }
  assert.deepEqual(visits, ["connect", "art"]);
  assert.ok(visits.length < REQUIRED_SECTIONS);
  visits = recordSection(visits, "/gardening");
  assert.equal(visits.length, REQUIRED_SECTIONS);
});

test("distinct homepage activity sections count separately", () => {
  assert.equal(sectionForPath("/create/cooking/recipes/1"), "cooking");
  assert.equal(sectionForPath("/create/cooking/videos"), "cooking");
  assert.equal(sectionForPath("/listen/podcast"), "podcasts");
  assert.equal(sectionForPath("/listen/asmr"), "asmr");
  assert.equal(sectionForPath("/listen/meditations"), "music");
  assert.equal(sectionForPath("/grow/journal"), "journaling");
  assert.equal(sectionForPath("/gardening/?x=1#video"), "gardening");
});

test("restored progress accepts only known, unique sections", () => {
  assert.deepEqual(validVisitedSections(["connect", "connect", "games", "home", 3, "art"]), ["connect", "art"]);
  assert.deepEqual(validVisitedSections({ visited: ["art"] }), []);
  assert.deepEqual(validVisitedSections(null), []);
});

test("both three distinct visits and a successfully submitted comment are required", () => {
  const visited = ["connect", "art", "gardening"];
  assert.equal(gamesAreUnlocked(visited, false), false);
  assert.equal(gamesAreUnlocked([], true), false);
  assert.equal(gamesAreUnlocked(visited.slice(0, 2), true), false);
  assert.equal(gamesAreUnlocked(["connect", "connect", "art"], true), false);
  assert.equal(gamesAreUnlocked(visited, true), true);
  assert.equal(gamesAreUnlocked([...visited, "music"], true), true);
});

test("a comment must be outside Games; section and individual-item threads qualify", () => {
  for (const section of ["/games", "/games/", "/games?x=1", "/games/#comments"]) {
    assert.equal(isQualifyingGameComment(section), false);
  }
  for (const section of ["/", "/connect", "/grow/collab", "/content/publication/1", "/listen/podcast"]) {
    assert.equal(isQualifyingGameComment(section), true);
  }
});
