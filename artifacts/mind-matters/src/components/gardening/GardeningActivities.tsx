import { Badge } from "@workspace/mind-matters-ds/components/ui/badge";
import { GardenObservation } from "./GardenObservation";
import { GrowingExperiments } from "./GrowingExperiments";
import { PlantGrowthJournal } from "./PlantGrowthJournal";
import { PlantCareQuiz } from "./PlantCareQuiz";
import { SeedGrowthPuzzle } from "./SeedGrowthPuzzle";

export default function GardeningActivities() {
  return (
    <section aria-labelledby="gardening-activities-title" className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="gardening-activities-title" className="font-serif text-3xl font-semibold italic">
            Garden activity nook
          </h2>
          <Badge variant="accent">Explore and learn</Badge>
        </div>
        <p className="max-w-3xl text-foreground/80">
          Take a quiz, solve a plant puzzle, or look closely at the world around you. Try activities at your own pace.
        </p>
        <p className="rounded-xl border border-border/60 bg-card/70 p-3 text-sm text-muted-foreground">
          Visit-only: the quiz, puzzle, and garden checklist are not saved. Their progress resets when you refresh the page. Only the optional plant growth journal below is saved, privately, to your own account.
        </p>
        <p className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm">
          Ask an adult before using gardening tools or chemicals, or before going outside. Never taste an unknown plant or mushroom.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PlantCareQuiz />
        <SeedGrowthPuzzle />
      </div>

      <GardenObservation />
      <GrowingExperiments />
      <PlantGrowthJournal />
    </section>
  );
}
