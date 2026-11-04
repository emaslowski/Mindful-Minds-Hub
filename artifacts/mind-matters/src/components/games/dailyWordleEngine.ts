import { CLASSROOM_WORDS } from "./wordTilesWords";

export type LetterMark = "correct" | "present" | "absent";

// Keep this ordered list stable: changing it changes the shared daily schedule.
export const DAILY_ANSWERS = `
APPLE BRAVE CLOUD DREAM EARTH FLAME GRAPE HAPPY IVORY JELLY
KOALA LEMON MAPLE NURSE OCEAN PIANO QUEEN RIVER SMILE TIGER
UNDER VOICE WATER YOUNG ZEBRA BEACH CHAIR DANCE EAGLE FROST
GIANT HEART LIGHT MAGIC NIGHT OLIVE PEACH QUIET ROUND SHINE
TABLE UNITY VIDEO WHEAT ACORN BREAD CHARM DAISY EARLY FIELD
GLOVE HONEY JUICE KITES LEARN MANGO NORTH OTTER PLANT QUICK
ROBIN SHELL TRAIL UPPER VISIT WHALE YOUTH AMBER BLOOM CHESS
DRIVE ENJOY FRESH GREEN HOUSE INNER JOLLY KNEEL LUNCH MOUSE
NOVEL ORBIT PEARL QUILT RAINY SUNNY TEACH URBAN VALUE WEAVE
ANGEL BERRY CLEAN DOZEN EVERY FRUIT GRASS HORSE IMAGE JOLTS
KNOCK LEAFY MUSIC NOBLE ORDER PUPPY RULER SEEDS TRAIN UNTIL
VIVID WHEEL AWAKE BRAIN CANDY DRINK EIGHT FLOAT GHOST HUMAN
IDEAL JOKER KNIFE LAUGH MELON NESTS OWLET PIZZA READY SHEEP
TRUST USUAL VINES WORLD ALBUM BLACK CREAM DRESS EVENT FAITH
GRAIN HABIT INPUT LAYER MIGHT NOISE OTHER PAPER RELAX SNAIL
TOAST WOVEN AGREE BLEND CORAL DOUBT EQUAL FABLE GLORY HOTEL
INDEX LARGE MOVIE NEVER OLDER PARTY RAISE SKATE THREE WHITE
`.trim().split(/\s+/);

const allowedWords = new Set([
  ...[...CLASSROOM_WORDS].filter((word) => word.length === 5),
  ...DAILY_ANSWERS,
  ...`ADIEU ARISE AUDIO CRANE SLATE STARE RAISE RATIO ROATE TEARS
  AROSE ALONE ALLOW ANGLE APPLY AVOID BAKER BASIC BEGAN BEGIN BEING
  BELOW BENCH BIRTH BLIND BLOCK BOUND BREAK BRING BROAD BROWN BUILD
  BUILT CARRY CAUSE CHASE CHEAP CHECK CHEEK CHIEF CHILD CLAIM CLASS
  CLEAR CLIMB CLOCK CLOSE COACH COAST COUNT COURT COVER CRAFT CYCLE
  DEALT DEPTH DOING DRAWN DRIED DROVE EMPTY ENEMY ENTER ENTRY EXACT
  EXIST EXTRA FALLS FALSE FAULT FENCE FIFTY FINAL FOCUS FORTH FOUND
  FRAME FRONT FULLY GIVEN GLASS GLOBE GRACE GRAND GREAT GROUP GUESS
  GUIDE HEARD HEAVY HELLO HILLS HOPES HOURS JOINS JUMPS KEEPS KINDS
  LATER LEAST LEAVE LEVEL LIVED LOCAL LOVED LOWER LUCKY LIVES MAKES
  MEANS METAL MILES MONEY MONTH MOUTH NEEDS NEWER NICER NOTES OUGHT
  OWNER PAGES PAIRS PAUSE PEACE PILOT PLAIN PLATE POINT POWER PRESS
  PRICE PRIDE PRIME PRINT PROUD PROVE PULLS REACT READS RIDES RISEN
  ROUGH RURAL SADLY SAUCE SAVER SAVVY SCARF SHARP SHOCK SHORE SHOUT
  SIDES SIXTH SIZES SKIES SMELL SOLVE SPEAK SPENT SPOTS STAIR STAYS
  STEEL STOCK SURELY TAKEN TAKES TELLS TERMS THANK THEIR THESE THICK
  THOSE THREW THUMB TIGHT TOWNS TRULY TYPES UNITE UNITS USERS VIEWS
  WAITS WALKS WANTS WIDER WIPES WIRED WORRY WROTE YEARS`.split(/\s+/).filter((word) => word.length === 5),
]);

export function getPuzzleDay(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((value) => value.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function getDailyAnswer(day: string): string {
  const dayNumber = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
  // A fixed, coprime stride mixes the curated list without runtime randomness.
  return DAILY_ANSWERS[((dayNumber * 37) % DAILY_ANSWERS.length + DAILY_ANSWERS.length) % DAILY_ANSWERS.length];
}

export function isAllowedGuess(word: string): boolean {
  return /^[A-Z]{5}$/.test(word) && allowedWords.has(word);
}

export function scoreGuess(guess: string, answer: string): LetterMark[] {
  const marks: LetterMark[] = Array(5).fill("absent");
  const remaining: Record<string, number> = {};
  for (let index = 0; index < 5; index++) {
    if (guess[index] === answer[index]) marks[index] = "correct";
    else remaining[answer[index]] = (remaining[answer[index]] ?? 0) + 1;
  }
  for (let index = 0; index < 5; index++) {
    if (marks[index] === "correct") continue;
    const letter = guess[index];
    if (remaining[letter] > 0) {
      marks[index] = "present";
      remaining[letter]--;
    }
  }
  return marks;
}

export function validateSavedGuesses(value: unknown, answer: string): string[] | null {
  if (!Array.isArray(value) || value.length > 6) return null;
  const guesses: string[] = [];
  for (const word of value) {
    if (typeof word !== "string" || !isAllowedGuess(word) || guesses.includes(answer)) return null;
    guesses.push(word);
  }
  return guesses;
}
