export const REQUIRED_SECTIONS = 3;
export const EXPLORATION_STORAGE_KEY = "brightside-explored-sections-v1";
export const COMMENT_STORAGE_KEY = "brightside-submitted-comment-v1";

export function gamesAreUnlocked(visited: string[], hasSubmittedComment: boolean): boolean {
  return validVisitedSections(visited).length >= REQUIRED_SECTIONS && hasSubmittedComment;
}

export function isQualifyingGameComment(section: string): boolean {
  const path = section.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return path !== "/games" && !path.startsWith("/games/");
}

export const EXPLORATION_SECTIONS = [
  { id: "connect", label: "Friendship & Student Stories", href: "/connect" },
  { id: "art", label: "Art & Drawing Studio", href: "/create" },
  { id: "gardening", label: "Plants & Gardening", href: "/gardening" },
  { id: "music", label: "Music & Mindful Moments", href: "/listen" },
  { id: "podcasts", label: "Podcasts & Videos", href: "/listen/podcast" },
  { id: "cooking", label: "Cooking & Healthy Recipes", href: "/create/cooking" },
  { id: "movement", label: "Movement & Sports", href: "/move" },
  { id: "journaling", label: "Journaling & Growth", href: "/grow/journal" },
  { id: "language", label: "Language Corner", href: "/language-corner" },
  { id: "events", label: "School & Community Events", href: "/events" },
  { id: "asmr", label: "ASMR", href: "/listen/asmr" },
  { id: "learning", label: "Learning Center", href: "/learn" },
] as const;

export function sectionForPath(path: string): string | null {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (/^\/create\/cooking(?:\/|$)/.test(clean)) return "cooking";
  if (/^\/create(?:\/|$)/.test(clean)) return "art";
  if (clean === "/listen/podcast") return "podcasts";
  if (clean === "/listen/asmr") return "asmr";
  if (/^\/listen(?:\/|$)/.test(clean)) return "music";
  if (/^\/connect(?:\/|$)/.test(clean)) return "connect";
  if (/^\/move(?:\/|$)/.test(clean)) return "movement";
  if (/^\/grow(?:\/|$)/.test(clean)) return "journaling";
  if (/^\/learn(?:\/|$)/.test(clean)) return "learning";
  return EXPLORATION_SECTIONS.find((section) => section.href === clean)?.id ?? null;
}

export function validVisitedSections(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(EXPLORATION_SECTIONS.map((section) => section.id));
  return [...new Set(value.filter((id): id is string => typeof id === "string" && allowed.has(id)))];
}

export function recordSection(visited: string[], path: string): string[] {
  const section = sectionForPath(path);
  return section && !visited.includes(section) ? [...visited, section] : visited;
}
