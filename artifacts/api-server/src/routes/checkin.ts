import { Router } from "express";

const router = Router();

interface Recommendation {
  section: string;
  path: string;
  reason: string;
}

const MOOD_RECOMMENDATIONS: Record<string, Recommendation[]> = {
  anxious: [
    { section: "Learn", path: "/learn", reason: "Try breathing exercises and grounding techniques to calm anxiety." },
    { section: "Listen", path: "/listen", reason: "Calming music and guided meditations can ease anxiety." },
    { section: "Move", path: "/move", reason: "Physical movement can reduce anxious energy." },
  ],
  stressed: [
    { section: "Learn", path: "/learn", reason: "Explore stress management strategies." },
    { section: "Grow", path: "/grow", reason: "Journaling can help you process and release stress." },
    { section: "Listen", path: "/listen", reason: "Focus sounds and nature sounds are great for unwinding." },
  ],
  sad: [
    { section: "Connect", path: "/connect", reason: "Read stories from peers who understand how you feel." },
    { section: "Grow", path: "/grow", reason: "The gratitude journal can gently shift your perspective." },
    { section: "Create", path: "/create", reason: "Creative expression through art can lift your mood." },
  ],
  angry: [
    { section: "Move", path: "/move", reason: "Channel that energy through physical activity." },
    { section: "Learn", path: "/learn", reason: "Learn how to manage big emotions safely." },
    { section: "Create", path: "/create", reason: "Art is a powerful outlet for strong feelings." },
  ],
  overwhelmed: [
    { section: "Learn", path: "/learn", reason: "Grounding and mindfulness techniques help when things feel like too much." },
    { section: "Listen", path: "/listen", reason: "Take a break with calm or focus sounds." },
    { section: "Grow", path: "/grow", reason: "Try today's journaling prompt to organize your thoughts." },
  ],
  lonely: [
    { section: "Connect", path: "/connect", reason: "The collaboration board lets you share and connect with peers." },
    { section: "Grow", path: "/grow", reason: "Journaling can remind you of your strengths and connections." },
    { section: "Create", path: "/create", reason: "Creative projects can give you a sense of belonging." },
  ],
  happy: [
    { section: "Grow", path: "/grow", reason: "Capture this good feeling in your gratitude journal!" },
    { section: "Connect", path: "/connect", reason: "Share your positivity on the collaboration board." },
    { section: "Create", path: "/create", reason: "Channel your good energy into something creative." },
  ],
  tired: [
    { section: "Listen", path: "/listen", reason: "Rest with calming music or a short meditation." },
    { section: "Move", path: "/move", reason: "A gentle stretch or yoga activity can re-energize you." },
    { section: "Learn", path: "/learn", reason: "Explore strategies for rest and recovery." },
  ],
};

const DEFAULT_RECOMMENDATIONS: Recommendation[] = [
  { section: "Learn", path: "/learn", reason: "Explore activities and strategies for any situation." },
  { section: "Connect", path: "/connect", reason: "See what your peers are sharing." },
  { section: "Grow", path: "/grow", reason: "Today's journaling prompt is a great place to start." },
];

const MOOD_MESSAGES: Record<string, string> = {
  anxious: "It's okay to feel anxious. Here are some things that might help you feel calmer.",
  stressed: "Stress is tough — you're not alone. Let's find something that helps.",
  sad: "Sadness is a normal feeling. Be gentle with yourself today.",
  angry: "It makes sense to feel angry sometimes. Let's channel that energy well.",
  overwhelmed: "When everything feels like too much, it helps to take it one step at a time.",
  lonely: "You are not alone, even when it feels that way. Here are ways to connect.",
  happy: "That's wonderful! Keep the good vibes going with these ideas.",
  tired: "Rest is important. Let's find something gentle for you.",
};

// POST /api/checkin
router.post("/checkin", (req, res) => {
  const { mood } = req.body;
  const normalizedMood = (mood ?? "").toLowerCase().trim();

  const recommendations =
    MOOD_RECOMMENDATIONS[normalizedMood] ?? DEFAULT_RECOMMENDATIONS;

  const message =
    MOOD_MESSAGES[normalizedMood] ??
    "Whatever you're feeling, Mind Matters is here for you. Here are some places to explore:";

  res.json({ message, recommendations });
});

export default router;
