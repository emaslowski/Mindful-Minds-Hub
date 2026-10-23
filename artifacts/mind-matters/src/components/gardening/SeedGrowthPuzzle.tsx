import { useState } from "react";
import { Badge } from "@workspace/mind-matters-ds/components/ui/badge";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@workspace/mind-matters-ds/components/ui/card";
import { growthStages } from "./gardeningActivityData";

const startingOrder = ["sprout", "seed", "leaves", "root"];
const correctOrder = ["seed", "root", "sprout", "leaves"];

export function SeedGrowthPuzzle() {
  const [order, setOrder] = useState(startingOrder);
  const [history, setHistory] = useState<string[][]>([]);
  const [checked, setChecked] = useState(false);
  const correct = order.every((id, index) => id === correctOrder[index]);
  const stagesById = new Map<string, (typeof growthStages)[number]>(growthStages.map((stage) => [stage.id, stage]));

  function moveStage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    setHistory((current) => [...current, order]);
    setOrder((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
    setChecked(false);
  }

  function undo() {
    const previous = history[history.length - 1];
    if (!previous) return;
    setOrder(previous);
    setHistory((current) => current.slice(0, -1));
    setChecked(false);
  }

  function reset() {
    setOrder(startingOrder);
    setHistory([]);
    setChecked(false);
  }

  return (
    <Card className="border-secondary/25 bg-secondary/5">
      <CardHeader className="gap-3 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-2xl font-semibold italic">Put growth in order</h2>
          <Badge variant="secondary">Tap to reorder</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Arrange the stages from a waking seed to a young plant. Use the buttons—no dragging needed.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-2" aria-label="Seed growth stages">
          {order.map((id, index) => {
            const stage = stagesById.get(id);
            if (!stage) return null;
            return (
              <li key={id} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/70 p-3 sm:flex-row sm:items-center">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/25 text-xs font-bold">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{stage.label}</p>
                  <p className="text-sm text-muted-foreground">{stage.detail}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => moveStage(index, -1)}
                    aria-label={`Move ${stage.label.toLowerCase()} earlier`}
                  >
                    Move up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === order.length - 1}
                    onClick={() => moveStage(index, 1)}
                    aria-label={`Move ${stage.label.toLowerCase()} later`}
                  >
                    Move down
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setChecked(true)}>Check my order</Button>
          <Button type="button" variant="outline" disabled={history.length === 0} onClick={undo}>Undo</Button>
          <Button type="button" variant="ghost" onClick={reset}>Reset puzzle</Button>
        </div>
        {checked && (
          <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-4" role="status" aria-live="polite">
            <p className="font-semibold">{correct ? "You got it!" : "Not quite yet—keep exploring."}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {correct
                ? "A seed takes in water, a root emerges, a shoot grows, and leaves open."
                : "Hint: a root often emerges before a shoot grows upward. Try moving a stage and check again."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
