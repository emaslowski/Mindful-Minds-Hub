/**
 * Content-type-specific workspace panels.
 * Stores content as formatted text sections (## Heading\nbody) so it remains
 * human-readable in the teacher review queue without any schema changes.
 */
import { useCallback, useId, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import type { WorkspaceConfig } from './workspaceConfig';
import { RESOURCE_WORKSPACE_CONFIGS } from './resourceWorkspaceConfigs';

// ── Section parsing ──────────────────────────────────────────────────────────

function parseSections(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const parts = text.split(/^## /m);
  for (const part of parts.slice(1)) {
    const nl = part.indexOf('\n');
    if (nl === -1) { result[part.trim()] = ''; continue; }
    let body = part.slice(nl + 1);
    // buildContent separates sections with two newlines. Remove only that
    // structural separator; trimming here would erase a space as the student
    // types the next word.
    if (body.endsWith('\n\n')) body = body.slice(0, -2);
    result[part.slice(0, nl).trim()] = body;
  }
  return result;
}

function buildContent(pairs: Array<[string, string]>): string {
  return pairs.map(([k, v]) => `## ${k}\n${v}`).join('\n\n');
}

// ── Per-type configs ──────────────────────────────────────────────────────────

const CONFIGS: Record<string, WorkspaceConfig> = {
  ...RESOURCE_WORKSPACE_CONFIGS,

  'Podcast': {
    jobGroup: 'Podcasters',
    emoji: '🎙️',
    accent: 'text-[#453329]',
    bg: 'bg-amber-50 border-amber-200',
    intro: 'Plan your episode from hook to sign-off.',
    tips: [
      'Start with a question your listeners are already asking.',
      'Keep each segment to 2–3 minutes in your head.',
      'End with one clear takeaway your audience will remember.',
      'Use natural language — write how you talk, not how you write.',
    ],
    sections: [
      { key: 'Episode Theme', label: 'Episode Theme', placeholder: 'What is this episode about? (e.g. "How stress affects your sleep")' },
      { key: 'Target Audience', label: 'Who Is This For?', placeholder: 'Who are you making this for? (e.g. middle schoolers dealing with test anxiety)', short: true },
      { key: 'Opening Hook', label: 'Opening Hook', placeholder: 'Grab your listener in the first 15 seconds. Start with a surprising fact, question, or story...', rows: 3 },
      { key: 'Segment 1 – Main Content', label: 'Segment 1 – Main Content', placeholder: 'What is the first big thing you want to cover? Write your talking points or script here...', rows: 5 },
      { key: 'Segment 2 – Deep Dive or Guest', label: 'Segment 2 – Deep Dive or Guest', placeholder: 'Go deeper, share a story, or write interview questions here...', rows: 5 },
      { key: 'Closing Message', label: 'Closing Message', placeholder: 'What do you want listeners to remember or do after hearing this episode?', rows: 3 },
      { key: 'Show Notes', label: 'Show Notes', placeholder: 'A short summary + any links or resources to mention at the end...', rows: 3 },
    ],
  },

  'Video production': {
    jobGroup: 'Video Producers',
    emoji: '🎬',
    accent: 'text-[#c4622d]',
    bg: 'bg-orange-50 border-orange-200',
    intro: 'Plan every scene before you hit record.',
    tips: [
      'Hook viewers in the first 5 seconds — start with action, not intro.',
      'Plan your shots: wide shot to set the scene, close-up for detail.',
      'Good lighting makes a bigger difference than a fancy camera.',
      'Write a script or bullet points so no one is standing around unsure what to say.',
    ],
    sections: [
      { key: 'Video Concept', label: 'Video Concept', placeholder: 'What is this video about? What message do you want viewers to leave with?', rows: 3 },
      { key: 'Target Audience', label: 'Who Is This For?', placeholder: 'Who will watch this? (e.g. 6th graders, the whole school, parents)', short: true },
      { key: 'Opening Scene', label: 'Opening Scene (Hook)', placeholder: 'Describe the first 5–10 seconds. What do viewers see and hear? Make it attention-grabbing!', rows: 4 },
      { key: 'Scene Breakdown / Script', label: 'Scene Breakdown / Script', placeholder: 'Write out each scene in order:\nScene 1: ...\nScene 2: ...\n\nInclude what people say, what the camera shows, and any text on screen.', rows: 8 },
      { key: 'Filming Notes', label: 'Filming Notes', placeholder: 'Where will you film? What props or people do you need? Who does what job?', rows: 3 },
      { key: 'Closing / Call to Action', label: 'Closing / Call to Action', placeholder: 'How does the video end? What do you want viewers to do or think about?', rows: 3 },
      { key: 'Production Notes', label: 'Production Notes', placeholder: 'Any music, graphics, or editing effects you want to include?', rows: 2 },
    ],
  },

  'Blog article': {
    jobGroup: 'Researchers and Content Writers',
    emoji: '✍️',
    accent: 'text-[#688a52]',
    bg: 'bg-green-50 border-green-200',
    intro: 'Write something your readers will actually want to read.',
    tips: [
      'Start with a question or surprising fact to pull readers in.',
      'One idea per paragraph — don\'t cram everything into one block.',
      'Use examples and real stories to back up your points.',
      'End with something actionable: a tip, a reflection question, or a challenge.',
    ],
    sections: [
      { key: 'Article Topic', label: 'Article Topic', placeholder: 'What is this article about? Be specific — "5 ways to calm down before a test" beats "stress"', short: true },
      { key: 'Target Reader', label: 'Target Reader', placeholder: 'Who is this for? What do they already know? What do they need?', short: true },
      { key: 'Opening Hook', label: 'Opening Hook', placeholder: 'Write your opening sentence or paragraph. Start with a story, question, or surprising fact...', rows: 4 },
      { key: 'Main Point 1', label: 'Main Point 1', placeholder: 'First big idea — what is it, and why does it matter?', rows: 4 },
      { key: 'Main Point 2', label: 'Main Point 2', placeholder: 'Second big idea — go deeper or show a different angle...', rows: 4 },
      { key: 'Main Point 3', label: 'Main Point 3', placeholder: 'Third big idea — add evidence, a story, or a how-to...', rows: 4 },
      { key: 'Evidence and Research', label: 'Evidence & Research', placeholder: 'Key facts, stats, or quotes that support your points. Note where they come from in the Sources tab.', rows: 3 },
      { key: 'Conclusion', label: 'Conclusion', placeholder: 'Wrap it up — remind readers of the key takeaway and why it matters.', rows: 3 },
      { key: 'Call to Action', label: 'Call to Action', placeholder: 'What should the reader do, try, or think about after reading this?', rows: 2 },
    ],
  },

  'Research summary': {
    jobGroup: 'Researchers and Content Writers',
    emoji: '🔬',
    accent: 'text-[#688a52]',
    bg: 'bg-green-50 border-green-200',
    intro: 'Turn your research into something students can actually use.',
    tips: [
      'State your research question clearly up front.',
      'Stick to credible sources — school sites, health organizations, research papers.',
      'Translate scientific language into plain English your peers can understand.',
      'Always say what the research means for real student life.',
    ],
    sections: [
      { key: 'Research Question', label: 'Research Question', placeholder: 'What question are you trying to answer? (e.g. "How does sleep affect academic performance?")', short: true },
      { key: 'Background', label: 'Background – What We Already Know', placeholder: 'Summarize what is generally understood about this topic before your research...', rows: 4 },
      { key: 'Key Findings', label: 'Key Findings', placeholder: 'What did the research say? List the most important results or discoveries...', rows: 5 },
      { key: 'Data and Evidence', label: 'Data & Evidence', placeholder: 'Specific stats, studies, or quotes that back up your findings. (Add full sources in the Sources tab)', rows: 4 },
      { key: 'What This Means for Students', label: 'What This Means for Students', placeholder: 'So what? How does this research apply to student life? What should students know or do differently?', rows: 4 },
      { key: 'Conclusion', label: 'Conclusion', placeholder: 'Summarize the main takeaway in 2–3 sentences.', rows: 3 },
    ],
  },

  'Artwork': {
    jobGroup: 'Artists and Chefs / Editors and Designers',
    emoji: '🎨',
    accent: 'text-[#c4829a]',
    bg: 'bg-pink-50 border-pink-200',
    intro: 'Plan your piece before you start creating.',
    tips: [
      'Brainstorm at least 3 different ideas before picking one.',
      'Think about what emotion or message you want your artwork to express.',
      'Color, shape, and texture all tell a story — use them on purpose.',
      'Your artist statement helps others understand what your work means.',
    ],
    sections: [
      { key: 'Artwork Concept', label: 'Artwork Concept', placeholder: 'What are you making? What does it show or express?', rows: 3 },
      { key: 'Inspiration', label: 'Inspiration', placeholder: 'What inspired this idea? A feeling, a place, a person, something you\'ve seen?', rows: 3 },
      { key: 'Brainstorm Sketches', label: 'Brainstorm / Sketch Notes', placeholder: 'Describe your rough sketch ideas here — what will be in the piece, how it\'ll be arranged, what stands out...', rows: 4 },
      { key: 'Color Palette', label: 'Color Palette', placeholder: 'List the colors you plan to use. Why did you choose them? What mood do they create?', rows: 2 },
      { key: 'Materials and Tools', label: 'Materials & Tools', placeholder: 'What will you use to make this? (pencil, paint, digital, collage, etc.)', rows: 2 },
      { key: 'Artist Statement', label: 'Artist Statement', placeholder: 'Write 2–4 sentences explaining what your artwork means and why you created it. This will appear alongside your piece.', rows: 4 },
    ],
  },

  'Directed drawing activity': {
    jobGroup: 'Artists and Chefs / Editors and Designers',
    emoji: '✏️',
    accent: 'text-[#c4829a]',
    bg: 'bg-pink-50 border-pink-200',
    intro: 'Create a step-by-step drawing guide other students can follow.',
    tips: [
      'Break the drawing into simple shapes — circles, ovals, lines, squares.',
      'Number every step clearly so no one gets lost.',
      'Add encouragement! Remind students that mistakes are part of creating.',
      'Test your instructions by drawing it yourself following your own steps.',
    ],
    sections: [
      { key: 'Activity Name', label: 'Activity Name', placeholder: 'What will students be drawing? (e.g. "Draw a Calming Landscape")', short: true },
      { key: 'What You Will Create', label: 'What You\'ll Create', placeholder: 'Describe the finished drawing — what will it look like?', rows: 2 },
      { key: 'Materials Needed', label: 'Materials Needed', placeholder: 'Paper, pencil, colored pencils, markers — what do students need?', rows: 2 },
      { key: 'Step-by-Step Instructions', label: 'Step-by-Step Instructions', placeholder: 'Step 1: Draw a large oval in the center...\nStep 2: Add two triangles on top for ears...\nStep 3: ...', rows: 10 },
      { key: 'Tips for Students', label: 'Tips for Students', placeholder: 'Helpful hints so students don\'t get stuck — encourage them!', rows: 3 },
      { key: 'Encouragement Note', label: 'Encouragement Note', placeholder: 'A kind message to close the activity with. Remind students to be proud of their work!', rows: 2 },
    ],
  },

  'Wellness activity': {
    jobGroup: 'Wellness Ambassadors and Peer Mentors',
    emoji: '🌿',
    accent: 'text-[#688a52]',
    bg: 'bg-emerald-50 border-emerald-200',
    intro: 'Design an activity that supports student wellbeing.',
    tips: [
      'Keep it simple — the best wellness activities take under 5 minutes.',
      'Explain the "why" so students know this is backed by science.',
      'Make it accessible to all students regardless of ability.',
      'Include a way for students to notice how they feel before and after.',
    ],
    sections: [
      { key: 'Activity Overview', label: 'Activity Overview', placeholder: 'What is this activity and what does it help with? (e.g. "A 5-minute breathing exercise that reduces test anxiety")', rows: 3 },
      { key: 'Who This Helps', label: 'Who This Helps', placeholder: 'Who would benefit most from this? When should they try it?', rows: 2 },
      { key: 'The Science Behind It', label: 'The Science Behind It', placeholder: 'Why does this work? Share a fact or brief explanation (you can add your research in the Sources tab)', rows: 3 },
      { key: 'Materials Needed', label: 'Materials Needed', placeholder: 'What do students need? (If nothing, write "No materials needed")', short: true },
      { key: 'Step-by-Step Instructions', label: 'Step-by-Step Instructions', placeholder: 'Step 1: Find a quiet spot and sit comfortably...\nStep 2: Close your eyes or look at something still...\nStep 3: ...', rows: 8 },
      { key: 'Wellness Tip', label: 'Wellness Tip', placeholder: 'One final encouraging tip or reminder to close the activity with.', rows: 2 },
    ],
  },

  'Coping strategy': {
    jobGroup: 'Wellness Ambassadors and Peer Mentors',
    emoji: '💚',
    accent: 'text-[#688a52]',
    bg: 'bg-emerald-50 border-emerald-200',
    intro: 'Share a strategy that helps students manage big feelings.',
    tips: [
      'Be honest about what this strategy does — and what it doesn\'t do.',
      'Always remind students to talk to a trusted adult for serious concerns.',
      'Use "you might try..." language — not everyone will respond the same way.',
      'Include a real example so students can picture using this strategy.',
    ],
    sections: [
      { key: 'Strategy Overview', label: 'Strategy Overview', placeholder: 'What is this coping strategy and what feelings does it help with?', rows: 3 },
      { key: 'When to Use It', label: 'When to Use It', placeholder: 'What situations or emotions is this strategy best for?', rows: 2 },
      { key: 'How It Works', label: 'How It Works (The Science)', placeholder: 'Why does this strategy help? Share the reasoning behind it...', rows: 3 },
      { key: 'Step-by-Step Instructions', label: 'Step-by-Step Instructions', placeholder: 'Step 1: ...\nStep 2: ...\nStep 3: ...', rows: 6 },
      { key: 'Real-Life Example', label: 'Real-Life Example', placeholder: 'Give an example of when a student might use this — make it relatable to middle schoolers.', rows: 3 },
      { key: 'Important Reminder', label: 'Important Reminder', placeholder: 'Remind students that coping strategies are helpful tools, but if they\'re struggling, they should talk to a trusted adult.', rows: 2 },
    ],
  },

  'Meditation activity': {
    jobGroup: 'Wellness Ambassadors and Peer Mentors',
    emoji: '🧘',
    accent: 'text-[#688a52]',
    bg: 'bg-emerald-50 border-emerald-200',
    intro: 'Write a guided meditation your classmates can follow along with.',
    tips: [
      'Speak slowly in your script — write pauses like "... breathe in slowly ... and out."',
      'Use peaceful imagery: nature, cozy spaces, calm colors.',
      'Keep the language simple and gentle — avoid anything that might make students uncomfortable.',
      'Aim for 3–5 minutes total — a great starting length for beginners.',
    ],
    sections: [
      { key: 'Meditation Theme', label: 'Meditation Theme', placeholder: 'What feeling or goal does this meditation focus on? (e.g. "Releasing test stress" or "Finding calm before bed")', short: true },
      { key: 'Setting the Scene', label: 'Setting the Scene', placeholder: 'Describe the ideal environment — what should the room feel like? Lights? Posture?', rows: 3 },
      { key: 'Breathing Instructions', label: 'Breathing Instructions', placeholder: 'Walk through the breathing technique you want students to use. Be specific about counts and rhythm.', rows: 3 },
      { key: 'Guided Imagery Script', label: 'Guided Imagery / Full Script', placeholder: 'Write out exactly what the guide (or recording) will say, word for word. Use "..." for pauses:\n\n"Close your eyes and take a slow breath in ... and out...\nImagine you are standing in a peaceful place..."', rows: 10 },
      { key: 'Closing Reflection', label: 'Closing Reflection', placeholder: 'How does the meditation end? What gentle prompt brings students back to the room?', rows: 3 },
      { key: 'How Often to Practice', label: 'How Often to Practice', placeholder: 'When and how often should students do this? Morning? Before tests? Daily?', rows: 2 },
    ],
  },

  'Movement activity': {
    jobGroup: 'Sports Enthusiasts',
    emoji: '⚡',
    accent: 'text-[#c4622d]',
    bg: 'bg-orange-50 border-orange-200',
    intro: 'Design a movement activity that gets the whole class energized.',
    tips: [
      'Make sure every student can participate regardless of fitness level.',
      'Include a warm-up and cool-down — especially important for school settings.',
      'Keep equipment simple — if it needs a gym, many classes won\'t use it.',
      'Connect the movement to mental wellness: why does moving our bodies help our minds?',
    ],
    sections: [
      { key: 'Activity Name', label: 'Activity Name', placeholder: 'Give your activity a catchy name!', short: true },
      { key: 'Activity Description', label: 'Activity Description', placeholder: 'Describe this activity in 2–3 sentences. What is it and why is it fun?', rows: 3 },
      { key: 'Equipment Needed', label: 'Equipment Needed', placeholder: 'What do students need? (If nothing, write "No equipment needed")', rows: 2 },
      { key: 'Warm-Up', label: 'Warm-Up (2–3 minutes)', placeholder: 'How do students get their bodies ready? (e.g. light stretching, jumping jacks, walking in place)', rows: 3 },
      { key: 'How to Play / Instructions', label: 'How to Play / Instructions', placeholder: 'Step 1: ...\nStep 2: ...\nExplain clearly enough that a student could lead it themselves.', rows: 7 },
      { key: 'Rules and Safety', label: 'Rules & Safety Tips', placeholder: 'What are the key rules? Any safety reminders? (e.g. "Make sure there\'s enough space between players")', rows: 3 },
      { key: 'Modifications', label: 'Modifications for All Levels', placeholder: 'How can students make this easier or harder? How can someone with a physical limitation still participate?', rows: 3 },
      { key: 'Why Movement Matters', label: 'Why Movement Matters', placeholder: 'Connect this to mental wellness — why does moving your body help your mind and mood?', rows: 3 },
    ],
  },

  'Healthy recipe': {
    jobGroup: 'Artists and Chefs',
    emoji: '🥗',
    accent: 'text-[#d4a44c]',
    bg: 'bg-yellow-50 border-yellow-200',
    intro: 'Share a recipe that is healthy, delicious, and student-friendly.',
    tips: [
      'Choose ingredients students can actually find and afford.',
      'Write quantities clearly — "a handful" is less useful than "½ cup."',
      'Explain why this food is good for you — not just that it is.',
      'Add a fun fact to make the recipe memorable and educational.',
    ],
    sections: [
      { key: 'Recipe Name', label: 'Recipe Name', placeholder: 'Give your recipe an appetizing name!', short: true },
      { key: 'Overview', label: 'Overview', placeholder: 'Describe this dish in 1–2 sentences. What does it taste like? When would you eat it?', rows: 2 },
      { key: 'Serving Size and Time', label: 'Serving Size & Time', placeholder: 'Serves: __ | Prep time: __ minutes | Cook time (if any): __ minutes', short: true },
      { key: 'Ingredients', label: 'Ingredients', placeholder: '1 cup rolled oats\n½ cup blueberries\n2 tbsp honey\n1 banana, sliced\n...', rows: 6 },
      { key: 'Step-by-Step Instructions', label: 'Step-by-Step Instructions', placeholder: 'Step 1: ...\nStep 2: ...\nStep 3: ...', rows: 7 },
      { key: 'Nutrition Highlights', label: 'Nutrition Highlights', placeholder: 'What makes this healthy? (e.g. "High in fiber, a good source of vitamin C, low in added sugar")', rows: 2 },
      { key: 'Health Benefits', label: 'Health Benefits', placeholder: 'What does this food do for your body and brain? How does it support wellness?', rows: 3 },
      { key: 'Fun Food Fact', label: 'Fun Food Fact', placeholder: 'Share an interesting fact about one of the main ingredients!', rows: 2 },
    ],
  },

  'Journaling activity': {
    jobGroup: 'All Groups',
    emoji: '📓',
    accent: 'text-[#453329]',
    bg: 'bg-stone-50 border-stone-200',
    intro: 'Create a journaling experience that helps students reflect and grow.',
    tips: [
      'Prompts should feel safe — avoid anything that might cause students to share trauma.',
      'Offer a variety of prompts so every student finds one that fits.',
      'Remind students that journaling is private — they decide what to share.',
      'Keep the tone warm, curious, and non-judgmental.',
    ],
    sections: [
      { key: 'Journal Theme', label: 'Journal Theme', placeholder: 'What is the focus of this journaling activity? (e.g. "Gratitude" or "Managing Change")', short: true },
      { key: 'Warm-Up Prompt', label: 'Warm-Up Prompt', placeholder: 'An easy, low-stakes prompt to get students writing. Something light and specific...', rows: 3 },
      { key: 'Main Prompt 1', label: 'Main Prompt 1', placeholder: 'A deeper question for students to explore...', rows: 3 },
      { key: 'Main Prompt 2', label: 'Main Prompt 2', placeholder: 'A second angle on the theme — push a little deeper...', rows: 3 },
      { key: 'Main Prompt 3', label: 'Main Prompt 3', placeholder: 'A third prompt that invites reflection or a personal connection...', rows: 3 },
      { key: 'Reflection Tip', label: 'Reflection Tip', placeholder: 'A helpful tip for students who feel stuck (e.g. "If you\'re not sure where to start, just describe how you\'re feeling right now.")', rows: 2 },
      { key: 'Closing Thought', label: 'Closing Thought', placeholder: 'A gentle, encouraging closing message for students who complete this activity.', rows: 2 },
    ],
  },

  'Community event': {
    jobGroup: 'Community Connection Team',
    emoji: '🤝',
    accent: 'text-[#688a52]',
    bg: 'bg-teal-50 border-teal-200',
    intro: 'Plan an event that brings your school community together.',
    tips: [
      'Be specific about date, time, and location — vague events don\'t get attended.',
      'Think about who might be left out and how to make this welcoming to all.',
      'Include a clear reason why students should care about this event.',
      'Make the sign-up or participation as easy as possible.',
    ],
    sections: [
      { key: 'Event Name', label: 'Event Name', placeholder: 'What is this event called?', short: true },
      { key: 'Event Description', label: 'What Is This Event?', placeholder: 'Describe the event in 2–3 sentences. What will happen? What makes it special?', rows: 3 },
      { key: 'Who It Is For', label: 'Who Is It For?', placeholder: 'Who should attend? All students? A specific grade? Family? Community members?', rows: 2 },
      { key: 'Date, Time, and Location', label: 'Date, Time & Location', placeholder: 'When and where will this happen? (Even if tentative, write your best plan)', rows: 2 },
      { key: 'How to Participate', label: 'How to Participate', placeholder: 'What do students need to do to join? Sign up? Show up? Bring something?', rows: 3 },
      { key: 'Why This Matters', label: 'Why This Matters for Our Community', placeholder: 'Why is this event important? What need does it meet? What will change because of it?', rows: 3 },
      { key: 'Contact and Sign-Up Info', label: 'Contact & Sign-Up Info', placeholder: 'Who can students contact with questions? How do they officially sign up?', rows: 2 },
    ],
  },

  'School resource': {
    jobGroup: 'Technology Team',
    emoji: '🏫',
    accent: 'text-[#453329]',
    bg: 'bg-slate-50 border-slate-200',
    intro: 'Help students find and use a resource that supports them at school.',
    tips: [
      'Test the resource yourself first — make sure it actually works and is appropriate.',
      'Use simple language — assume the student has never heard of this before.',
      'Include a step-by-step guide so even tech beginners can access it.',
      'Explain what problem this resource solves, not just what it is.',
    ],
    sections: [
      { key: 'Resource Name', label: 'Resource Name', placeholder: 'What is this resource called?', short: true },
      { key: 'What Is This Resource', label: 'What Is This Resource?', placeholder: 'Describe what this resource is and what it does in plain language.', rows: 3 },
      { key: 'Who Needs It', label: 'Who Needs It?', placeholder: 'Which students would benefit most from this? When would they need it?', rows: 2 },
      { key: 'How to Access It', label: 'How to Access or Sign Up', placeholder: 'Where do students go to find this? A link, a room, a person to ask?', rows: 2 },
      { key: 'Step-by-Step Guide', label: 'Step-by-Step Guide', placeholder: 'Step 1: Go to...\nStep 2: Click on...\nStep 3: Fill in...\nStep 4: ...', rows: 7 },
      { key: 'Helpful Tips', label: 'Helpful Tips', placeholder: 'Common questions or problems students might have — and the answers!', rows: 3 },
      { key: 'Contact and More Info', label: 'Contact & More Info', placeholder: 'Who can students contact if they need help? Any other useful info?', rows: 2 },
    ],
  },

  'Student resource': {
    jobGroup: 'Technology Team',
    emoji: '📚',
    accent: 'text-[#453329]',
    bg: 'bg-slate-50 border-slate-200',
    intro: 'Share a resource that helps students succeed and thrive.',
    tips: [
      'The best student resources solve a real problem students actually have.',
      'Write for your audience — use language a middle schooler would understand.',
      'If it\'s digital, include screenshots or a step-by-step walkthrough.',
      'Always explain WHY this resource is worth their time.',
    ],
    sections: [
      { key: 'Resource Name', label: 'Resource Name', placeholder: 'What is this resource called?', short: true },
      { key: 'What Is This Resource', label: 'What Is This Resource?', placeholder: 'What does it do? Why does it exist?', rows: 3 },
      { key: 'Who Needs It', label: 'Who Needs It?', placeholder: 'Which students should know about this? What problem does it solve for them?', rows: 2 },
      { key: 'How to Access It', label: 'How to Access It', placeholder: 'Where do students go to find or use this resource?', rows: 2 },
      { key: 'Step-by-Step Guide', label: 'Step-by-Step Guide', placeholder: 'Step 1: ...\nStep 2: ...\nStep 3: ...', rows: 7 },
      { key: 'Helpful Tips', label: 'Helpful Tips', placeholder: 'Tips, tricks, or common mistakes to avoid.', rows: 3 },
      { key: 'Contact and More Info', label: 'Contact & More Info', placeholder: 'Who can help if students have questions?', rows: 2 },
    ],
  },

  'Music production': {
    jobGroup: 'Music / Sound Keepers',
    emoji: '🎵',
    accent: 'text-[#c4829a]',
    bg: 'bg-purple-50 border-purple-200',
    intro: 'Plan your track — from concept to final sound.',
    tips: [
      'Start with the feeling you want the listener to have.',
      'Great songs have a clear structure: intro, verse, chorus, bridge, outro.',
      'Write lyrics like you\'re talking to one specific person.',
      'Think about how this music connects to wellness — what mood does it create?',
    ],
    sections: [
      { key: 'Song or Track Concept', label: 'Song / Track Concept', placeholder: 'What is this piece about? What emotion or message does it carry?', rows: 3 },
      { key: 'Mood and Vibe', label: 'Mood & Vibe', placeholder: 'How should this sound? (e.g. "calm and reflective," "energetic and uplifting," "bittersweet")', short: true },
      { key: 'Instruments and Equipment', label: 'Instruments & Equipment', placeholder: 'What instruments or tools will you use? (Guitar, beats, GarageBand, voice, etc.)', rows: 2 },
      { key: 'Song Structure', label: 'Song Structure', placeholder: 'Map out the structure:\nIntro: ...\nVerse 1: ...\nChorus: ...\nVerse 2: ...\nBridge: ...\nOutro: ...', rows: 6 },
      { key: 'Lyrics or Script', label: 'Lyrics / Script', placeholder: 'Write your lyrics or spoken word piece here. Don\'t worry about it being perfect — drafts are supposed to be rough!', rows: 10 },
      { key: 'Production Notes', label: 'Production Notes', placeholder: 'Any effects, transitions, or sound design ideas? What do you imagine the final mix sounding like?', rows: 3 },
    ],
  },

  'Social media campaign': {
    jobGroup: 'Social Media and Advertising',
    emoji: '📱',
    accent: 'text-[#c4622d]',
    bg: 'bg-rose-50 border-rose-200',
    intro: 'Plan a campaign that spreads your wellness message far and wide.',
    tips: [
      'Every post should have one clear message — don\'t try to say everything at once.',
      'Hook readers in the first line before they scroll past.',
      'Visuals matter: describe what the image or video should look like.',
      'End every post with a question or call to action to drive engagement.',
    ],
    sections: [
      { key: 'Campaign Theme', label: 'Campaign Theme / Message', placeholder: 'What is the main message of this campaign? What do you want people to think, feel, or do?', rows: 3 },
      { key: 'Target Audience', label: 'Target Audience', placeholder: 'Who is this campaign for? What do they care about? What platform do they use?', rows: 2 },
      { key: 'Platform', label: 'Platform', placeholder: 'Instagram, TikTok, school announcements, flyers — where will this campaign live?', short: true },
      { key: 'Post 1', label: 'Post Idea 1', placeholder: 'Caption:\n...\n\nVisual (what the image or video shows):\n...\n\nHashtags:\n...', rows: 6 },
      { key: 'Post 2', label: 'Post Idea 2', placeholder: 'Caption:\n...\n\nVisual (what the image or video shows):\n...\n\nHashtags:\n...', rows: 6 },
      { key: 'Post 3', label: 'Post Idea 3', placeholder: 'Caption:\n...\n\nVisual:\n...\n\nHashtags:\n...', rows: 6 },
      { key: 'Engagement Strategy', label: 'Engagement Strategy', placeholder: 'How will you get people to interact? (polls, questions, challenges, reposts?)', rows: 3 },
      { key: 'Campaign Goal', label: 'Campaign Goal', placeholder: 'What does success look like? How will you know if the campaign worked?', rows: 2 },
    ],
  },
};

// Blog Writer is a named content option for the seeded Blog Writer group.
// Keep the existing Blog article type intact for projects already using it.
CONFIGS['Blog Writer'] = CONFIGS['Blog article'];

// Fallback for any content type not in the map
const FALLBACK_CONFIG: WorkspaceConfig = {
  jobGroup: 'All Groups',
  emoji: '📝',
  accent: 'text-[#453329]',
  bg: 'bg-stone-50 border-stone-200',
  intro: 'Use the sections below to plan and write your content.',
  tips: [
    'Start with a clear idea of who will read or use this.',
    'Draft first — you can always improve it later.',
    'Save often so you don\'t lose your work.',
  ],
  sections: [
    { key: 'Overview', label: 'Overview', placeholder: 'Describe what this is about...', rows: 3 },
    { key: 'Main Content', label: 'Main Content', placeholder: 'Write your content here...', rows: 10 },
    { key: 'Additional Notes', label: 'Additional Notes', placeholder: 'Anything else to include?', rows: 4 },
  ],
};

// ── Main component ────────────────────────────────────────────────────────────

interface ContentWorkspaceProps {
  contentType: string;
  content: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ContentWorkspace({ contentType, content, onChange, disabled }: ContentWorkspaceProps) {
  const fieldPrefix = useId();
  const config = CONFIGS[contentType] ?? FALLBACK_CONFIG;

  const parsed = useMemo(() => parseSections(content), [content]);

  const handleChange = useCallback((key: string, value: string) => {
    const updated = config.sections.map((s) => [s.key, s.key === key ? value : (parsed[s.key] ?? '')] as [string, string]);
    onChange(buildContent(updated));
  }, [config.sections, parsed, onChange]);

  // Seed empty sections on first load if content is blank
  const getValue = (key: string) => parsed[key] ?? '';

  return (
    <div className="space-y-5">
      {/* Header banner */}
      <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${config.bg}`}>
        <span className="text-2xl leading-none mt-0.5">{config.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${config.accent}`}>{contentType}</p>
          <p className="text-xs text-[#8a6a55] mt-0.5">{config.intro}</p>
        </div>
        <span className="text-xs text-[#8a6a55] bg-white/70 px-2 py-0.5 rounded-full border border-[#d5cabe] whitespace-nowrap flex-shrink-0">
          {config.jobGroup}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-5">
        {/* Sections */}
        <div className="space-y-4">
          {config.sections.map((section, index) => (
            <div key={section.key} className="space-y-1.5">
              <Label htmlFor={`${fieldPrefix}-${index}`} className="text-sm font-medium text-[#453329]">{section.label}</Label>
              {section.prompt && (
                <p id={`${fieldPrefix}-${index}-prompt`} className="text-xs leading-relaxed text-[#8a6a55]">
                  {section.prompt}
                </p>
              )}
              {section.short ? (
                <Input
                  id={`${fieldPrefix}-${index}`}
                  aria-describedby={section.prompt ? `${fieldPrefix}-${index}-prompt` : undefined}
                  value={getValue(section.key)}
                  onChange={(e) => handleChange(section.key, e.target.value)}
                  placeholder={section.placeholder}
                  disabled={disabled}
                  className="bg-white border-[#d5cabe] focus-visible:ring-[#c4622d] text-sm"
                />
              ) : (
                <Textarea
                  id={`${fieldPrefix}-${index}`}
                  aria-describedby={section.prompt ? `${fieldPrefix}-${index}-prompt` : undefined}
                  value={getValue(section.key)}
                  onChange={(e) => handleChange(section.key, e.target.value)}
                  placeholder={section.placeholder}
                  disabled={disabled}
                  rows={section.rows ?? 4}
                  className="bg-white border-[#d5cabe] focus-visible:ring-[#c4622d] text-sm leading-relaxed resize-y"
                />
              )}
            </div>
          ))}
        </div>

        {/* Tips panel */}
        <div className="space-y-3">
          <Card className="bg-[#eee6d8] border-[#d5cabe] sticky top-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-[#d4a44c]" />
                <span className="text-sm font-semibold text-[#453329]">Pro Tips</span>
              </div>
              <ul className="space-y-2.5">
                {config.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-[#453329] leading-relaxed flex gap-2">
                    <span className="text-[#c4622d] font-bold flex-shrink-0 mt-0.5">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
