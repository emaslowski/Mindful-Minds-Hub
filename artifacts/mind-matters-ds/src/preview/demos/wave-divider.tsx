import { GreenHillsFooter, WaveDivider } from '../../components/ui/wave-divider';

export function WaveDividerDemo() {
  return (
    <div className="space-y-10">
      {/* Standard wave */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="p-6">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Default — sage fill (fill-secondary)
          </p>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Use between a light section and a sage/green panel below it.
          </p>
        </div>
        <div className="bg-background pb-0">
          <WaveDivider />
          <div className="bg-secondary/30 py-8 text-center">
            <p className="font-mono text-lg text-secondary-foreground">Section below the wave</p>
          </div>
        </div>
      </section>

      {/* Terracotta fill */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="p-6">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Terracotta fill (fill-primary)
          </p>
        </div>
        <div className="bg-background">
          <WaveDivider fill="fill-primary" />
          <div className="bg-primary/20 py-8 text-center">
            <p className="font-sans text-sm text-primary">Section below</p>
          </div>
        </div>
      </section>

      {/* Flipped — opens downward */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="p-6">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Flipped (flipY) — opens downward
          </p>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Use at the top of a section to make the wave peel up from below.
          </p>
        </div>
        <div className="bg-secondary/20 py-8 text-center">
          <p className="font-sans text-sm text-secondary-foreground">Section above</p>
        </div>
        <WaveDivider flipY className="bg-secondary/20" />
      </section>

      {/* Green hills footer */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="p-6">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            GreenHillsFooter
          </p>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            The full three-layered botanical hills footer with the deep-forest band — used at
            the bottom of The Brightside Project Home page.
          </p>
        </div>
        <GreenHillsFooter />
      </section>
    </div>
  );
}
