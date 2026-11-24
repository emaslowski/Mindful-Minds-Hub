import { ArrowUpRight, Scissors } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { CraftCard } from "@/components/CraftCard";
import { useCrafts } from "@/lib/crafts";

const HOME_LIMIT = 3;

/** Homepage Craft Corner: the newest crafts teachers posted, with a link to all of them. */
export function HomeCrafts() {
  const { data: crafts, isLoading, isError } = useCrafts();
  const shown = (crafts ?? []).slice(0, HOME_LIMIT);

  return (
    <section id="craft-corner" className="mx-auto mt-10 w-full max-w-6xl scroll-mt-6 px-1" aria-labelledby="craft-corner-title">
      <div className="mb-5 flex items-center justify-center gap-3 text-center">
        <span aria-hidden="true" className="text-primary text-2xl">⌁</span>
        <h2 id="craft-corner-title" className="font-serif text-3xl font-bold text-foreground md:text-4xl">Craft Corner</h2>
        <span aria-hidden="true" className="text-primary text-2xl">⌁</span>
      </div>
      <p className="mx-auto mb-5 max-w-2xl text-center text-sm leading-relaxed text-foreground/80 sm:text-base">
        Hands-on crafts your teachers picked for you. Grab some supplies, follow the steps, and make something to be proud of.
      </p>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading crafts">
          {Array.from({ length: HOME_LIMIT }, (_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted/40" />)}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
          <p className="font-semibold text-foreground">Crafts aren’t available right now.</p>
          <p className="mt-1 text-sm text-foreground/75">Please try again in a moment.</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
          <Scissors aria-hidden="true" className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-2 font-semibold text-foreground">No crafts posted yet.</p>
          <p className="mt-1 text-sm text-foreground/75">Your teachers will add craft ideas here. Check back soon!</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((craft, i) => <CraftCard key={craft.id} craft={craft} index={i} />)}
          </div>
          {(crafts?.length ?? 0) > HOME_LIMIT && (
            <div className="mt-5 flex justify-center">
              <Button asChild variant="secondary" size="sm">
                <Link href="/crafts" data-testid="link-all-crafts">See all {crafts!.length} crafts <ArrowUpRight aria-hidden="true" /></Link>
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
