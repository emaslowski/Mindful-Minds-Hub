import { useState } from "react";
import { Check, Languages, Puzzle, RotateCcw, Sprout } from "lucide-react";

const plantingSteps = [
  "Find a small container with drainage and fill it with soil.",
  "Plant a seed at the depth listed on its packet.",
  "Give it a little water and place it where it gets light.",
];

const greetings = [
  { language: "Spanish", phrase: "Buenos días", meaning: "Good morning" },
  { language: "French", phrase: "Bonjour", meaning: "Hello / Good morning" },
  { language: "Japanese", phrase: "こんにちは", meaning: "Hello" },
];

const questions = [
  {
    prompt: "A classmate is sitting alone at lunch. What could you do?",
    choices: ["Ignore them", "Invite them to join you", "Laugh with your friends"],
    answer: 1,
    response: "An invitation can help someone feel included.",
  },
  {
    prompt: "Your friend is having a tough day. What might help?",
    choices: ["Listen and ask how they are", "Change the subject", "Tell everyone about it"],
    answer: 0,
    response: "Listening shows your friend you care.",
  },
  {
    prompt: "Someone makes a mistake during a game. What could you say?",
    choices: ["You ruined it", "Don't play again", "It's okay, let's try again"],
    answer: 2,
    response: "Encouragement makes games more fun for everyone.",
  },
];

const panelClass =
  "rounded-3xl border-2 border-primary/20 bg-card/90 p-6 md:p-8 shadow-md";
const optionClass =
  "w-full rounded-2xl border border-primary/25 bg-background/80 px-4 py-3 text-left font-sans text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-accent/25 focus-visible:ring-2 focus-visible:ring-ring";

function GardeningSection() {
  const [completed, setCompleted] = useState<number[]>([]);

  function toggleStep(index: number) {
    setCompleted((current) =>
      current.includes(index) ? current.filter((step) => step !== index) : [...current, index],
    );
  }

  return (
    <article className={`${panelClass} border-secondary/50 bg-secondary/10`} aria-labelledby="gardening-title">
      <div className="mb-4 flex items-center gap-3 text-secondary">
        <Sprout aria-hidden="true" className="h-8 w-8" />
        <h3 id="gardening-title" className="font-display text-3xl font-bold">Gardening</h3>
      </div>
      <p className="mb-5 text-foreground/85">Start small: grow a seed and watch what happens. Ask an adult before using tools or planting outside.</p>
      <p className="mb-3 font-bold text-foreground">Your seed-starting checklist</p>
      <div className="space-y-2">
        {plantingSteps.map((step, index) => (
          <button
            key={step}
            type="button"
            aria-pressed={completed.includes(index)}
            data-testid={`button-gardening-step-${index}`}
            onClick={() => toggleStep(index)}
            className={`${optionClass} flex items-start gap-3 ${completed.includes(index) ? "border-secondary bg-secondary/20" : ""}`}
          >
            <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-secondary">
              {completed.includes(index) && <Check className="h-3.5 w-3.5" />}
            </span>
            <span>{step}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm font-semibold text-secondary" aria-live="polite">
        {completed.length === plantingSteps.length
          ? "Ready to grow! Keep checking the soil and give your seed time."
          : `${completed.length} of ${plantingSteps.length} steps checked`}
      </p>
    </article>
  );
}

function LanguageSection() {
  const [selected, setSelected] = useState(0);
  const greeting = greetings[selected];

  return (
    <article className={`${panelClass} border-primary/45 bg-primary/10`} aria-labelledby="language-title">
      <div className="mb-4 flex items-center gap-3 text-primary">
        <Languages aria-hidden="true" className="h-8 w-8" />
        <h3 id="language-title" className="font-display text-3xl font-bold">Language Corner</h3>
      </div>
      <p className="mb-5 text-foreground/85">A new way to greet someone can be the start of a connection. Pick a language to learn a greeting.</p>
      <div className="flex flex-wrap gap-2" aria-label="Choose a language">
        {greetings.map((item, index) => (
          <button
            key={item.language}
            type="button"
            aria-pressed={selected === index}
            data-testid={`button-language-${item.language.toLowerCase()}`}
            onClick={() => setSelected(index)}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring ${selected === index ? "border-primary bg-primary text-primary-foreground hover:bg-primary" : "border-primary/40 bg-background text-foreground"}`}
          >
            {item.language}
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-primary/25 bg-background/85 p-5" aria-live="polite" data-testid="language-greeting">
        <p className="text-sm font-bold uppercase tracking-wider text-primary">{greeting.language}</p>
        <p lang={selected === 0 ? "es" : selected === 1 ? "fr" : "ja"} className="mt-2 font-display text-4xl font-bold break-words">{greeting.phrase}</p>
        <p className="mt-2 text-foreground/80">Means “{greeting.meaning}”</p>
      </div>
    </article>
  );
}

function GamesSection() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const question = questions[questionIndex];
  const correct = choice === question.answer;

  function nextQuestion() {
    setQuestionIndex((index) => (index + 1) % questions.length);
    setChoice(null);
  }

  return (
    <article className={`${panelClass} border-accent bg-accent/15`} aria-labelledby="games-title">
      <div className="mb-4 flex items-center gap-3 text-primary">
        <Puzzle aria-hidden="true" className="h-8 w-8" />
        <h3 id="games-title" className="font-display text-3xl font-bold">Games</h3>
      </div>
      <p className="mb-5 text-foreground/85">Play a quick kindness quiz. Choose what you would do, then try the next question!</p>
      <p className="mb-2 text-sm font-bold uppercase tracking-wider text-primary">Question {questionIndex + 1} of {questions.length}</p>
      <p className="mb-4 font-bold text-foreground">{question.prompt}</p>
      <div className="space-y-2">
        {question.choices.map((answer, index) => (
          <button
            key={answer}
            type="button"
            disabled={choice !== null}
            data-testid={`button-game-choice-${index}`}
            onClick={() => setChoice(index)}
            className={`${optionClass} disabled:cursor-default ${choice === index ? "border-primary bg-accent/50" : ""}`}
          >
            {answer}
          </button>
        ))}
      </div>
      {choice !== null && (
        <div className="mt-4" role="status" data-testid="game-feedback">
          <p className="font-bold text-foreground">{correct ? "You got it!" : "Good try!"} {question.response}</p>
          <button
            type="button"
            data-testid="button-next-game-question"
            onClick={nextQuestion}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" /> Next question
          </button>
        </div>
      )}
    </article>
  );
}

export function HomeActivitySections() {
  return (
    <section aria-labelledby="home-activities-title" className="relative z-10 mx-auto w-full max-w-6xl px-4 py-12 md:px-8 md:py-16">
      <div className="mb-8 text-center">
        <p className="font-handwritten text-2xl text-primary">A little something new to try</p>
        <h2 id="home-activities-title" className="font-display text-4xl font-bold text-foreground md:text-5xl">Explore together</h2>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <GardeningSection />
        <LanguageSection />
        <GamesSection />
      </div>
    </section>
  );
}