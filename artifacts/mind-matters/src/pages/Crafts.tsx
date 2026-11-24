import { Scissors } from "lucide-react";
import { CraftCard } from "@/components/CraftCard";
import { WaveFooter } from "@/components/WaveFooter";
import { useCrafts } from "@/lib/crafts";

/** Every craft teachers have posted, newest first. */
export default function Crafts() {
  const { data: crafts, isLoading, isError } = useCrafts();

  return (
    <div className="w-full pb-8">
      <section className="mx-auto w-full max-w-4xl px-4 pb-6 pt-8 text-center" aria-labelledby="crafts-title">
        <Scissors aria-hidden="true" className="mx-auto mb-2 h-10 w-10 text-primary" />
        <h1 id="crafts-title" className="font-serif text-4xl font-bold text-foreground md:text-5xl">Craft Corner</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-foreground/85 sm:text-lg">
          Crafts your teachers picked for you. Open one to see what you need and how to make it. Ask an adult before using
          scissors, hot glue or anything sharp.
        </p>
      </section>

      <section className="mx-auto w-full max-w-6xl px-3 pb-12" aria-label="All crafts">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading crafts">
            {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted/40" />)}
          </div>
        ) : isError ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center font-semibold text-foreground">
            Crafts aren’t available right now. Please try again in a moment.
          </p>
        ) : !crafts || crafts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-foreground/80">
            No crafts have been posted yet. Check back soon!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {crafts.map((craft, i) => <CraftCard key={craft.id} craft={craft} index={i} />)}
          </div>
        )}
      </section>
      <WaveFooter />
    </div>
  );
}
