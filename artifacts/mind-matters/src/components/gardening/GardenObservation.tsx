import { useState } from "react";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card, CardContent, CardHeader } from "@workspace/mind-matters-ds/components/ui/card";
import { Checkbox } from "@workspace/mind-matters-ds/components/ui/checkbox";
import { observationPrompts } from "./gardeningActivityData";

export function GardenObservation() {
  const [checkedPrompts, setCheckedPrompts] = useState<boolean[]>(
    observationPrompts.map(() => false),
  );
  const totalChecked = checkedPrompts.filter(Boolean).length;

  function togglePrompt(index: number, checked: boolean) {
    setCheckedPrompts((current) =>
      current.map((value, promptIndex) => promptIndex === index ? checked : value),
    );
  }

  function clearFindings() {
    setCheckedPrompts(observationPrompts.map(() => false));
  }

  return (
    <Card className="border-accent/30 bg-accent/10">
      <CardHeader className="gap-3 pb-3">
        <h2 className="font-serif text-2xl font-semibold italic">Garden detective</h2>
        <p className="text-sm text-muted-foreground">
          Pick a few things to notice in a garden, yard, or through a window. No need to touch anything.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {observationPrompts.map((prompt, index) => (
            <label
              key={prompt}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background/75 p-3"
            >
              <Checkbox
                checked={checkedPrompts[index]}
                onCheckedChange={(checked) => togglePrompt(index, checked === true)}
                aria-label={prompt}
                className="mt-1"
              />
              <span className="text-sm leading-relaxed">{prompt}</span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold" aria-live="polite">
            {totalChecked} of {observationPrompts.length} observations found
          </p>
          <Button type="button" variant="outline" onClick={clearFindings} disabled={totalChecked === 0}>
            Clear my findings
          </Button>
        </div>
        <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
          Stay on safe paths, watch wildlife from a distance, and ask an adult before going outside.
        </p>
      </CardContent>
    </Card>
  );
}
