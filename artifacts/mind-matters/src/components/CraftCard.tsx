import { useState } from "react";
import { ExternalLink, Scissors } from "lucide-react";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card } from "@workspace/mind-matters-ds/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Craft } from "@/lib/crafts";

const CARD_TINTS = ["bg-accent/25", "bg-secondary/20", "bg-muted/30"];

function CraftPhoto({ craft, className }: { craft: Craft; className: string }) {
  if (craft.imageUrl) {
    return <img src={craft.imageUrl} alt={`Finished ${craft.title}`} className={`${className} object-cover`} loading="lazy" />;
  }
  return (
    <div className={`${className} grid place-items-center bg-primary/10 text-primary`} aria-hidden="true">
      <Scissors className="h-10 w-10" />
    </div>
  );
}

/** One craft on the homepage or the Crafts page; "How to make it" opens the full instructions. */
export function CraftCard({ craft, index = 0 }: { craft: Craft; index?: number }) {
  const [open, setOpen] = useState(false);
  const hasDetails = craft.materials.length > 0 || craft.steps.length > 0 || !!craft.link || craft.description.length > 160;

  return (
    <Card className={`flex h-full flex-col overflow-hidden border-border/70 ${CARD_TINTS[index % CARD_TINTS.length]}`} data-testid={`card-craft-${craft.id}`}>
      <CraftPhoto craft={craft} className="aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-serif text-xl font-bold leading-tight text-foreground">{craft.title}</h3>
        {craft.description && <p className="line-clamp-3 text-sm leading-relaxed text-foreground/80">{craft.description}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          {hasDetails && (
            <Button type="button" size="sm" onClick={() => setOpen(true)} data-testid={`button-craft-details-${craft.id}`}>
              How to make it
            </Button>
          )}
          {craft.link && (
            <Button asChild size="sm" variant="outline">
              <a href={craft.link} target="_blank" rel="noreferrer">Watch or read more <ExternalLink aria-hidden="true" /></a>
            </Button>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{craft.title}</DialogTitle>
            {craft.description && <DialogDescription className="whitespace-pre-line text-base text-foreground/85">{craft.description}</DialogDescription>}
          </DialogHeader>
          {craft.imageUrl && <img src={craft.imageUrl} alt={`Finished ${craft.title}`} className="max-h-72 w-full rounded-xl object-cover" />}
          <div className="grid gap-5 sm:grid-cols-[1fr_1.6fr]">
            {craft.materials.length > 0 && (
              <section aria-labelledby={`craft-${craft.id}-materials`}>
                <h4 id={`craft-${craft.id}-materials`} className="font-serif text-lg font-bold">You will need</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground/85">
                  {craft.materials.map((item, i) => <li key={`${i}-${item}`}>{item}</li>)}
                </ul>
              </section>
            )}
            {craft.steps.length > 0 && (
              <section aria-labelledby={`craft-${craft.id}-steps`}>
                <h4 id={`craft-${craft.id}-steps`} className="font-serif text-lg font-bold">Steps</h4>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground/85">
                  {craft.steps.map((item, i) => <li key={`${i}-${item}`}>{item}</li>)}
                </ol>
              </section>
            )}
          </div>
          {craft.link && (
            <Button asChild variant="outline" className="w-fit">
              <a href={craft.link} target="_blank" rel="noreferrer">Watch or read more <ExternalLink aria-hidden="true" /></a>
            </Button>
          )}
          <p className="text-xs text-foreground/65">Ask an adult before using scissors, hot glue or anything sharp.</p>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
