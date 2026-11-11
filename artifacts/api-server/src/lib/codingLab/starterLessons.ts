import type { CodingLabStep } from '@workspace/db/schema';

export interface StarterLesson {
  slug: string;
  title: string;
  emoji: string;
  summary: string;
  sortOrder: number;
  steps: CodingLabStep[];
}

/**
 * The lessons every site starts with. Teachers can edit or delete them and
 * can bring them back with "Restore starter lessons".
 */
export const STARTER_LESSONS: StarterLesson[] = [
  {
    slug: 'what-is-ai',
    title: 'What is AI?',
    emoji: '🤖',
    summary: 'How a computer can learn from examples, what it is good at, and why it still makes mistakes.',
    sortOrder: 10,
    steps: [
      {
        type: 'read',
        title: 'Computers that learn from examples',
        body: `**AI** stands for **artificial intelligence**. It is a computer program that learned to do a job by looking at a huge number of examples instead of being told every rule.

Think about how you learned what a dog looks like. Nobody gave you a list of rules. You saw lots of dogs, and your brain noticed the patterns: four legs, a tail, fur, a wet nose.

AI works in a similar way:

- It is shown **millions of examples** (pictures, sentences, sounds).
- It looks for **patterns** in those examples.
- When it sees something new, it makes its **best guess** based on the patterns it found.

The AI that writes text (like the Site Assistant your teacher uses) learned patterns from a giant pile of writing. When you ask it something, it predicts, word by word, what a helpful answer would probably look like.`,
      },
      {
        type: 'read',
        title: 'What AI is good at, and where it slips',
        body: `AI is great at:

- Spotting patterns quickly (sorting photos, finding spelling mistakes)
- Writing a first draft you can improve
- Explaining something in a different way when you are stuck

AI is **not** a person and it does not actually understand the world. That means:

- It can sound very sure and still be **wrong**. It is making a guess.
- It can **make things up**, including facts, names and dates.
- It only knows what was in its examples. It does not know what happened at your school today.

That is why a **human always checks** what an AI makes before it goes on our website.`,
      },
      {
        type: 'quiz',
        title: 'Quick check',
        question: 'How does an AI learn to recognize a cat in a photo?',
        options: [
          'A programmer types in a list of rules about cats',
          'It looks at many examples and finds patterns',
          'It asks a real cat',
          'It searches the internet every time',
        ],
        answer: 1,
        explanation: 'AI learns from lots of examples. It finds the patterns itself, which is also why it can be fooled by something it has never seen before.',
      },
      {
        type: 'quiz',
        title: 'True or false',
        question: 'If an AI sounds confident, its answer must be correct.',
        options: ['True', 'False'],
        answer: 1,
        explanation: 'False. An AI can sound sure and still be wrong, because it is predicting a likely answer, not checking facts. Always verify important things with a trusted source or a teacher.',
      },
    ],
  },
  {
    slug: 'meet-the-site-assistant',
    title: 'Meet the Site Assistant',
    emoji: '✨',
    summary: 'How our teachers use an AI helper to change this website, and why a person always presses the button.',
    sortOrder: 20,
    steps: [
      {
        type: 'read',
        title: 'An AI helper for our website',
        body: `Our website has a helper called the **Site Assistant**. Teachers can type a request in plain English, such as:

> "Add a Jokes section to the website."

> "Fix the spelling on the gardening page."

The assistant reads the request, looks at the website, and works out what needs to change. Then it suggests the change on a **card**.`,
      },
      {
        type: 'read',
        title: 'Why a human always clicks Apply',
        body: `The assistant never changes the website on its own. Every suggestion is a card with an **Apply** button and a **Skip** button.

- **Apply**: the teacher agrees, and the change happens.
- **Skip**: the teacher says no, and nothing changes.

This is called keeping a **human in the loop**. It matters because:

1. The AI might misunderstand what was asked.
2. The AI might make a mistake nobody would want on a school website.
3. A person is responsible for what the site says, not a computer.

When you build pages in this Coding Lab, the same thing happens: your page goes to your teacher for review before it can be published.`,
      },
      {
        type: 'quiz',
        title: 'Quick check',
        question: 'A teacher asks the Site Assistant to add a new section. What happens next?',
        options: [
          'The section appears on the website right away',
          'The assistant shows a card, and the teacher decides whether to apply it',
          'The assistant emails the principal',
          'Students vote on it',
        ],
        answer: 1,
        explanation: 'The assistant proposes; the teacher decides. Nothing changes until a person clicks Apply.',
      },
    ],
  },
  {
    slug: 'how-a-web-page-is-built',
    title: 'How a web page is built',
    emoji: '🧱',
    summary: 'Pages are made of blocks. Learn the code behind headings, paragraphs and lists by clicking them into place.',
    sortOrder: 30,
    steps: [
      {
        type: 'read',
        title: 'Pages are made of blocks',
        body: `Every web page you have ever seen is built from **blocks**. A heading is a block. A paragraph is a block. A list is a block.

Web browsers read a language called **HTML** to know what each block is. HTML uses **tags**, which are words inside angle brackets:

- \`<h2>Hello</h2>\` is a heading
- \`<p>This is a paragraph.</p>\` is a paragraph
- \`<ul><li>Apples</li><li>Pears</li></ul>\` is a bulleted list

Notice that each block has an **opening tag** like \`<p>\` and a **closing tag** like \`</p>\`. The closing tag has a slash. Everything between them belongs to that block.

In the next step you will build a page by clicking blocks into place. Watch the **Code** tab: it shows the real HTML your clicks are creating.`,
      },
      {
        type: 'build',
        title: 'Build: a heading and two paragraphs',
        instructions: 'Click **Heading** and type a title for a page about something you like. Then click **Paragraph** twice and write a sentence or two in each. Open the **Code** tab to see the HTML you made.',
        required: ['heading', 'paragraph'],
        minBlocks: 3,
      },
      {
        type: 'quiz',
        title: 'Reading the code',
        question: 'Which tag makes a paragraph?',
        options: ['<h2>', '<p>', '<li>', '<ul>'],
        answer: 1,
        explanation: '<p> stands for paragraph. <h2> is a heading, and <ul> with <li> inside makes a list.',
      },
      {
        type: 'build',
        title: 'Build: add a list and a quote',
        instructions: 'Add a **List** with at least three items, and a **Quote** from someone you admire (a book character counts). Use the up and down arrows to put the blocks in the order you like.',
        required: ['heading', 'list', 'quote'],
        minBlocks: 4,
      },
    ],
  },
  {
    slug: 'build-a-page-for-the-site',
    title: 'Build a page for our website',
    emoji: '🚀',
    summary: 'Plan, build and send a real page to your teacher for review, the same way every page on this site gets published.',
    sortOrder: 40,
    steps: [
      {
        type: 'read',
        title: 'Plan before you build',
        body: `Good pages start with a plan. Before you click anything, decide:

1. **Who is it for?** Other students? Families? Younger kids?
2. **What is the one thing** you want them to know or do?
3. **What blocks do you need?** A heading to say what it is, a paragraph or two to explain, maybe a list of tips, and a tip box for the most important idea.

Remember the website rules: no last names, no private information, kind words only. Your teacher will check your page before anyone else sees it.`,
      },
      {
        type: 'build',
        title: 'Build your page',
        instructions: 'Build a page for our website about a wellness topic you care about: a way to calm down, a kindness idea, a favorite healthy snack, a game to play at recess. Use at least a **Heading**, a **Paragraph**, a **List** and a **Tip box**. When it is ready, click **Send to my teacher**.',
        required: ['heading', 'paragraph', 'list', 'tip'],
        minBlocks: 4,
      },
      {
        type: 'read',
        title: 'What happens next',
        body: `When you send your page, it becomes a **project** in your Studio, just like any other student project.

- You can find it under **My Projects** and keep editing it there.
- It goes through **peer review** and then **teacher review**.
- If your teacher approves it, they choose where it goes on the site and publish it.

That is exactly the path every page on this website has taken. You are now one of the people who builds it.`,
      },
    ],
  },
  {
    slug: 'talking-to-ai',
    title: 'Talking to AI: writing a good prompt',
    emoji: '💬',
    summary: 'A prompt is what you ask an AI. Build one by clicking the pieces, and see why clear prompts get better answers.',
    sortOrder: 50,
    steps: [
      {
        type: 'read',
        title: 'What is a prompt?',
        body: `A **prompt** is the message you give an AI. The clearer the prompt, the better the answer.

A vague prompt: "Write something about plants."

A clear prompt: "Write three short tips for a fifth grader who wants to keep a classroom plant alive. Use friendly words."

The second prompt tells the AI:

- **Who** the writing is for (a fifth grader)
- **What** to make (three short tips)
- **How** it should sound (friendly words)

Good prompts usually have a **task**, some **details**, and a **style** or **format**. In the next step you will build one by clicking.`,
      },
      {
        type: 'prompt',
        title: 'Build a prompt',
        instructions: 'Click one chip from each group to build a prompt. Watch how the prompt changes. If your teacher has turned on the AI helper, you can send your prompt and read the answer.',
        groups: [
          { label: 'Task', chips: ['Write three tips', 'Explain in two sentences', 'Make a short list', 'Write a friendly welcome message'] },
          { label: 'Topic', chips: ['about keeping a classroom plant alive', 'about calming down before a test', 'about being a good friend at recess', 'about why sleep helps your brain'] },
          { label: 'Audience', chips: ['for a fifth grader', 'for a kindergartener', 'for a new student at our school'] },
          { label: 'Style', chips: ['Use simple, friendly words.', 'Make it cheerful.', 'Keep it very short.'] },
        ],
        allowAi: true,
      },
      {
        type: 'quiz',
        title: 'Quick check',
        question: 'Which prompt will probably get the most useful answer?',
        options: [
          'Plants',
          'Tell me stuff about plants',
          'Give me three easy tips for keeping a classroom plant alive, for a fifth grader',
          'Why',
        ],
        answer: 2,
        explanation: 'It says what to make (three tips), the topic (a classroom plant) and who it is for (a fifth grader). Details help the AI guess what you really want.',
      },
    ],
  },
  {
    slug: 'be-a-smart-ai-user',
    title: 'Be a smart AI user',
    emoji: '🛡️',
    summary: 'Simple rules for using AI safely: protect private information, check facts, and keep your own voice.',
    sortOrder: 60,
    steps: [
      {
        type: 'read',
        title: 'Three rules',
        body: `**1. Keep private things private.** Never type your last name, address, phone number, passwords, or anything private about you or another person into an AI. It does not need that information to help you.

**2. Check before you trust.** AI can be wrong and can make things up. If something matters (a fact for a project, advice about health or safety), check it with a trusted source or ask a teacher.

**3. Keep your own voice.** AI can help you brainstorm or fix a sentence, but the ideas and the work should be yours. Copying an AI answer and calling it your own is not honest, and it is not learning.

**And one more:** if an AI ever says something that makes you uncomfortable or confused, stop and tell a trusted adult.`,
      },
      {
        type: 'quiz',
        title: 'Quick check',
        question: 'You want help fixing a sentence in your blog post. Which is the smart way to use AI?',
        options: [
          'Paste your whole post with your full name and school address',
          'Ask it to improve the one sentence, then decide whether you like the change',
          'Ask it to write the whole post and hand it in as yours',
          'Ask it for your friend\'s phone number',
        ],
        answer: 1,
        explanation: 'Ask for help with the specific part you are stuck on, keep private information out, and stay in charge of your own work.',
      },
      {
        type: 'quiz',
        title: 'True or false',
        question: 'If an AI gives you a health tip, you should check it with a trusted adult before following it.',
        options: ['True', 'False'],
        answer: 0,
        explanation: 'True. AI can be wrong, and health and safety advice should always be checked with a trusted adult.',
      },
    ],
  },
];
