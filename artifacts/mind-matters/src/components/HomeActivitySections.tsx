import { useState } from "react";
import { Check, Languages, Sprout } from "lucide-react";

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

const panelClass =
  "rounded-3xl border-2 border-primary/20 bg-card/90 p-6 md:p-8 shadow-md";
const optionClass =
  "w-full rounded-2xl border border-primary/25 bg-background/80 px-4 py-3 text-left font-sans text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-accent/25 focus-visible:ring-2 focus-visible:ring-ring";

export function GardeningSection() {
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
         <h1 id="gardening-title" className="font-display text-3xl font-bold">Gardening</h1>
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
export function LanguageSection() {
  const [selected, setSelected] = useState(0);
  const greeting = greetings[selected];

  return (
    <article className={`${panelClass} border-primary/45 bg-primary/10`} aria-labelledby="language-title">
      <div className="mb-4 flex items-center gap-3 text-primary">
        <Languages aria-hidden="true" className="h-8 w-8" />
         <h1 id="language-title" className="font-display text-3xl font-bold">Language Corner</h1>
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