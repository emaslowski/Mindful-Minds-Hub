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
  "kill myself",
  "end my life",
  "suicide",
  "suicidal",
  "hurt myself",
  "harm myself",
  "self-harm",
  "self harm",
  "don't want to live",
  "don't want to be alive",
  "want to die",
  "cut myself",
  "cutting myself",
  "no reason to live",
  "worthless",
  "not worth living",
  "nobody cares",
  "everyone hates me",
  "rather be dead",
];

function containsRedFlag(text: string): boolean {
  const lower = text.toLowerCase();
  return RED_FLAG_KEYWORDS.some((kw) => lower.includes(kw));
}

async function sendRedFlagAlert(content: string, userId: string, prompt: string) {
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) return;

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
    text: `A student has written something that may need immediate attention.\n\nPrompt: ${prompt}\n\nEntry:\n${content}\n\nStudent ID: ${userId}\n\nPlease check in with this student as soon as possible.`,
    html: `<h2 style="color:red">⚠️ URGENT: Concerning Student Journal Entry</h2>
      <p>A student has written something that may need immediate attention.</p>
      <p><strong>Prompt:</strong> ${prompt}</p>
      <p><strong>Journal Entry:</strong></p>
      <blockquote style="background:#fff3cd;padding:12px;border-left:4px solid red">${content.replace(/\n/g, "<br>")}</blockquote>
      <p><strong>Student ID:</strong> ${userId}</p>
      <p>Please check in with this student as soon as possible.</p>`,
  });
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
    sendRedFlagAlert(content, req.user.id, prompt).catch(() => {});
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
