import { Router } from "express";
import { db } from "@workspace/db";
import {
  journalEntriesTable,
  gratitudeEntriesTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

const router = Router();

// Rotating daily prompts (7 days)
const DAILY_PROMPTS = [
  "What is something that made you smile today? Why?",
  "Describe a challenge you faced recently. How did you handle it?",
  "What is one thing you are proud of about yourself?",
  "If you could change one thing about your day, what would it be?",
  "Write about someone who made a positive difference in your life.",
  "What does a perfect day look like for you? Describe it.",
  "What are three things you want to accomplish this week?",
];

// Red-flag keywords for concerning content
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
];

function containsRedFlag(text: string): boolean {
  const lower = text.toLowerCase();
  return RED_FLAG_KEYWORDS.some((kw) => lower.includes(kw));
}

async function sendRedFlagAlert(
  content: string,
  userId: string,
  userEmail: string | null | undefined,
  prompt: string,
) {
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) return;

  const loginEmail = userEmail || "Unavailable";
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
    to: "elittle9514@gmail.com",
    subject: "⚠️ URGENT: Concerning Journal Entry — Mind Matters",
    text: `A student has written something that may need immediate attention.\n\nPrompt: ${prompt}\n\nEntry:\n${content}\n\nStudent login email: ${loginEmail}\nStudent ID: ${userId}\n\nPlease check in with this student as soon as possible.`,
    html: `<h2 style="color:red">⚠️ URGENT: Concerning Student Journal Entry</h2>
      <p>A student has written something that may need immediate attention.</p>
      <p><strong>Prompt:</strong> ${prompt}</p>
      <p><strong>Journal Entry:</strong></p>
      <blockquote style="background:#fff3cd;padding:12px;border-left:4px solid red">${content.replace(/\n/g, "<br>")}</blockquote>
      <p><strong>Student login email:</strong> ${loginEmail}</p>
      <p><strong>Student ID:</strong> ${userId}</p>
      <p>Please check in with this student as soon as possible.</p>`,
  });
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
router.get("/today-prompt", (_req, res) => {
  const dayIndex = new Date().getDay(); // 0=Sun … 6=Sat
  const prompt = DAILY_PROMPTS[dayIndex];
  const date = new Date().toISOString().split("T")[0];
  res.json({ prompt, date });
});

// GET /api/journal-entries
router.get("/journal-entries", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const entries = await db
    .select()
    .from(journalEntriesTable)
    .where(eq(journalEntriesTable.userId, req.user.id))
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
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
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
      userId: req.user.id,
      prompt,
      content: content.trim(),
      flagged,
    })
    .returning();

  if (flagged) {
    sendRedFlagAlert(content, req.user.id, req.user.email, prompt).catch(() => {});
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
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const entries = await db
    .select()
    .from(gratitudeEntriesTable)
    .where(eq(gratitudeEntriesTable.userId, req.user.id))
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
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { content } = req.body;
  if (!content || content.trim().length === 0) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const entryDate = new Date().toISOString().split("T")[0];
  const [entry] = await db
    .insert(gratitudeEntriesTable)
    .values({
      userId: req.user.id,
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
