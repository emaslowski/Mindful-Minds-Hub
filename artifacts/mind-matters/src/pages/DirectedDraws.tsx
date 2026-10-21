import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Link } from "wouter";
import { PublishedSection } from "@/components/PublishedSection";
import { WaveFooter } from "@/components/WaveFooter";

export default function DirectedDraws() {
  return (
    <div className="flex w-full flex-1 flex-col pt-8">
      <header className="mx-auto mb-10 w-full max-w-4xl px-4 text-center">
        <Button asChild variant="outline" size="sm" className="mb-6"><Link href="/create">Back to Art Studio</Link></Button>
        <p className="mb-2 font-sans text-sm font-bold uppercase tracking-widest text-terracotta">Create, explore, and make it your own</p>
        <h1 className="font-display text-5xl italic text-foreground md:text-6xl">Directed Draws</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-foreground/75">Follow a drawing lesson, pause whenever you need, and add your own creative details.</p>
      </header>
      <PublishedSection section="directed-draws" heading="Drawing lessons and editions" className="mb-12" />
      <WaveFooter quote="There is no wrong way to create." />
    </div>
  );
}
