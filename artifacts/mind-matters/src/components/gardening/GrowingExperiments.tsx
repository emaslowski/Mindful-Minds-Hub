import { Badge } from "@workspace/mind-matters-ds/components/ui/badge";
import { Card, CardContent, CardHeader } from "@workspace/mind-matters-ds/components/ui/card";
import { growingExperiments } from "./gardeningActivityData";

export function GrowingExperiments() {
  return (
    <section aria-labelledby="growing-experiments-title" className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="growing-experiments-title" className="font-serif text-2xl font-semibold italic">
            Try a tiny growing experiment
          </h2>
          <Badge variant="outline">With an adult</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Pick one idea, make a prediction, and notice what happens. A drawing or a few words is enough.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {growingExperiments.map((experiment) => (
          <Card key={experiment.title} className="h-full border-secondary/25 bg-card/90">
            <CardHeader className="gap-3 pb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-serif text-xl font-semibold italic">{experiment.title}</h3>
                <Badge variant="secondary">{experiment.time}</Badge>
              </div>
              <p className="text-sm font-semibold">{experiment.question}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-bold">What you need</h4>
                <p className="mt-1 text-sm text-muted-foreground">{experiment.materials}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold">Try it</h4>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {experiment.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </div>
              <div className="rounded-xl border border-accent/30 bg-accent/10 p-3">
                <h4 className="text-sm font-bold">Safety first</h4>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{experiment.safety}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
