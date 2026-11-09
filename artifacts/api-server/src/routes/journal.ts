import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  anonymousAccessAccountsTable,
  journalEntriesTable,
  gratitudeEntriesTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import { getSiteContent } from "../lib/siteContent";

const router = Router();

// Fallback prompts, used only if the editable list is ever empty.
const DAILY_PROMPTS = [
  "What is something that made you smile today? Why?",
  "Describe a challenge you faced recently. How did you handle it?",
  "What is one thing you are proud of about yourself?",
  "If you could change one thing about your day, what would it be?",
  "Write about someone who made a positive difference in your life.",
  "What does a perfect day look like for you? Describe it.",
  "What are three things you want to accomplish this week?",
];

// Red-flag phrases for concerning content. These are intentionally broad:
// concerning language should prompt a trusted-adult check-in, not a diagnosis.
const RED_FLAG_KEYWORDS = [
  // Suicidal ideation
  "kill myself",
  "end my life",
  "suicide",
  "suicidal",
  "want to die",
  "want to kill",
  "don't want to live",
  "dont want to live",
  "don't want to be alive",
  "dont want to be alive",
  "rather be dead",
  "no reason to live",
  "not worth living",
  "i give up on life",
  "want to disappear forever",
  "wish i was dead",
  "wish i were dead",
  "better off dead",
  "better off without me",
  "can't go on",
  "cant go on",
  "i can't take it anymore",
  "i cant take it anymore",
  "ending it all",
  "end it all",
  // Self-harm
  "hurt myself",
  "harm myself",
  "self-harm",
  "self harm",
  "cut myself",
  "cutting myself",
  "cutting my",
  "burn myself",
  "burning myself",
  "hitting myself",
  "starving myself",
  // Thoughts of harming other people
  "hurt someone",
  "hurt somebody",
  "hurt other people",
  "hurt others",
  "harm someone",
  "harm somebody",
  "harm other people",
  "harm others",
  "kill someone",
  "kill somebody",
  "kill other people",
  "kill others",
  "want to hurt",
  "want to harm",
  "want to kill",
  // Abuse / unsafe situation
  "being abused",
  "someone hurts me",
  "someone is hurting me",
  "touches me",
  "touched me",
  // Hopelessness / despair
  "nobody cares",
  "no one cares",
  "everyone hates me",
  "i hate myself",
  "i'm worthless",
  "im worthless",
  "worthless",
  "i'm nothing",
  "im nothing",
  "i'm a burden",
  "im a burden",
  "i'm so alone",
  "im so alone",
  "no one would miss me",
  "nobody would miss me",
  // Self-deprecating language and isolation
  "i have no friends",
  "i don't have any friends",
  "i dont have any friends",
  "i don't have friends",
  "i dont have friends",
  "no friends",
  "nobody likes me",
  "no one likes me",
  "i don't belong",
  "i dont belong",
  "i don't fit in",
  "i dont fit in",
  "i'm unlovable",
  "im unlovable",
  "i am unlovable",
  "i'm useless",
  "im useless",
  "i am useless",
  "i'm a failure",
  "im a failure",
  "i am a failure",
  "i'm a loser",
  "im a loser",
  "i am a loser",
  "i'm pathetic",
  "im pathetic",
  "i am pathetic",
  "i'm stupid",
  "im stupid",
  "i am stupid",
  "i'm dumb",
  "im dumb",
  "i am dumb",
  "i'm ugly",
  "im ugly",
  "i am ugly",
  "i'm disgusting",
  "im disgusting",
  "i am disgusting",
  "i'm a bad person",
  "im a bad person",
  "i am a bad person",
  "i'm broken",
  "im broken",
  "i am broken",
  "i'm a disappointment",
  "im a disappointment",
  "i am a disappointment",
  "i'm not good enough",
  "im not good enough",
  "i am not good enough",
  "i can't do anything right",
  "i cant do anything right",
  "i can never do anything right",
  "i ruin everything",
  "i always ruin everything",
  "i hate my life",
];

const RED_FLAG_PATTERNS = [
  /\b(?:i|i'm|im|i am|i feel like|i've been feeling like)\s+(?:a\s+|an\s+)?(?:so\s+|really\s+|very\s+|complete(?:ly)?\s+|totally\s+|such\s+a\s+|like\s+a\s+|like\s+an\s+)?(?:failure|loser|burden|disappointment|pathetic|worthless|useless|unlovable|nobody|nothing|bad person|bad at everything)\b/,
  /\b(?:i|i'm|im|i am|i feel like)\s+(?:not|never)\s+(?:good enough|worth anything|going to be enough|going to matter)\b/,
  /\b(?:i|i'm|im|i am|i feel)\s+(?:so\s+|really\s+|very\s+|completely\s+|totally\s+)?(?:alone|unwanted|unimportant|unworthy|hated|hateful)\b/,
];

export function containsRedFlag(text: string): boolean {
  const lower = text.toLowerCase().replace(/[’]/g, "'");
  return RED_FLAG_KEYWORDS.some((kw) => lower.includes(kw)) ||
    RED_FLAG_PATTERNS.some((pattern) => pattern.test(lower));
}

async function sendRedFlagAlert(
  content: string,
  prompt: string,
  studentIdentity: string,
) {
  const smtpHost = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const teacherEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  if (teacherEmails.length === 0) return;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: teacherEmails.join(", "),
    subject: "⚠️ URGENT: Concerning Journal Entry — The Brightside Project",
    text: `A student has written something that may need immediate attention.\n\nPrompt: ${prompt}\n\nEntry:\n${content}\n\nStudent identity: ${studentIdentity}\n\nPlease check in with this student as soon as possible.`,
    html: `<h2 style="color:red">⚠️ URGENT: Concerning Student Journal Entry</h2>
      <p>A student has written something that may need immediate attention.</p>
      <p><strong>Prompt:</strong> ${prompt}</p>
      <p><strong>Journal Entry:</strong></p>
      <blockquote style="background:#fff3cd;padding:12px;border-left:4px solid red">${content.replace(/\n/g, "<br>")}</blockquote>
      <p><strong>Student identity:</strong> ${studentIdentity}</p>
      <p>Please check in with this student as soon as possible.</p>`,
  });
}

async function getWellnessUser(
  req: Request,
  res: Response,
): Promise<{ userId: string; identity: string } | null> {
  const wellnessUser = req.anonymousUser ?? req.user;
  if (!wellnessUser) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const [anonymousAccount] = await db
    .select({
      accessCode: anonymousAccessAccountsTable.accessCode,
      status: anonymousAccessAccountsTable.status,
    })
    .from(anonymousAccessAccountsTable)
    .where(eq(anonymousAccessAccountsTable.userId, wellnessUser.id))
    .limit(1);

  if (anonymousAccount?.status === "disabled") {
    res.status(403).json({ error: "This access code is currently disabled. Please ask your teacher for help." });
    return null;
  }

  return {
    userId: wellnessUser.id,
    identity: anonymousAccount
      ? `Anonymous access code: ${anonymousAccount.accessCode}`
      : wellnessUser.email
        ? `Student login email: ${wellnessUser.email}`
        : `Student ID: ${wellnessUser.id}`,
  };
}

/** Returns true if the journal is currently open (7 AM – 9 PM America/New_York). */
function isJournalOpen(): boolean {
  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
    10,
  );
  return hour >= 7 && hour < 21;
}

// GET /api/today-prompt
router.get("/today-prompt", async (_req, res) => {
  // Teachers can edit the prompt list in the Studio (Site Assistant / site
  // content). The day of the year cycles through however many prompts exist.
  const prompts = await getSiteContent("journal.dailyPrompts");
  const pool = prompts.length > 0 ? prompts : DAILY_PROMPTS;
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86_400_000);
  const prompt = pool[dayOfYear % pool.length];
  const date = now.toISOString().split("T")[0];
  res.json({ prompt, date });
});

// GET /api/journal-entries
router.get("/journal-entries", async (req, res) => {
  const wellnessUser = await getWellnessUser(req, res);
  if (!wellnessUser) return;
  const entries = await db
    .select()
    .from(journalEntriesTable)
    .where(eq(journalEntriesTable.userId, wellnessUser.userId))
    .orderBy(journalEntriesTable.createdAt);
  res.json(
    entries.map((e) => ({
      id: e.id,
      prompt: e.prompt,
      content: e.content,
      flagged: e.flagged,
      createdAt: e.createdAt.toISOString(),
    })),
  );
});

// POST /api/journal-entries
router.post("/journal-entries", async (req, res) => {
  const wellnessUser = await getWellnessUser(req, res);
  if (!wellnessUser) return;
  if (!isJournalOpen()) {
    res.status(403).json({ error: "The journal is closed. It is available 7:00 AM – 9:00 PM Eastern Time." });
    return;
  }
  const { prompt = "", content } = req.body;
  if (!content || content.trim().length === 0) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const flagged = containsRedFlag(content);

  const [entry] = await db
    .insert(journalEntriesTable)
    .values({
      userId: wellnessUser.userId,
      prompt,
      content: content.trim(),
      flagged,
    })
    .returning();

  if (flagged) {
    sendRedFlagAlert(content, prompt, wellnessUser.identity).catch(() => {});
  }

  res.status(201).json({
    id: entry.id,
    prompt: entry.prompt,
    content: entry.content,
    flagged: entry.flagged,
    createdAt: entry.createdAt.toISOString(),
  });
});

// GET /api/gratitude-entries
router.get("/gratitude-entries", async (req, res) => {
  const wellnessUser = await getWellnessUser(req, res);
  if (!wellnessUser) return;
  const entries = await db
    .select()
    .from(gratitudeEntriesTable)
    .where(eq(gratitudeEntriesTable.userId, wellnessUser.userId))
    .orderBy(gratitudeEntriesTable.createdAt);
  res.json(
    entries.map((e) => ({
      id: e.id,
      content: e.content,
      entryDate: e.entryDate,
      createdAt: e.createdAt.toISOString(),
    })),
  );
});

// POST /api/gratitude-entries
router.post("/gratitude-entries", async (req, res) => {
  const wellnessUser = await getWellnessUser(req, res);
  if (!wellnessUser) return;
  const { content } = req.body;
  if (!content || content.trim().length === 0) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const entryDate = new Date().toISOString().split("T")[0];
  const [entry] = await db
    .insert(gratitudeEntriesTable)
    .values({
      userId: wellnessUser.userId,
      content: content.trim(),
      entryDate,
    })
    .returning();

  res.status(201).json({
    id: entry.id,
    content: entry.content,
    entryDate: entry.entryDate,
    createdAt: entry.createdAt.toISOString(),
  });
});

export default router;
