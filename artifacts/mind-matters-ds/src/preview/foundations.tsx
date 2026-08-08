import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Guidelines } from './parts';

const CORE_SWATCHES = [
  { name: 'Terracotta', role: 'Primary', hex: '#c4622d', className: 'bg-primary' },
  { name: 'Sage',       role: 'Secondary', hex: '#688a52', className: 'bg-secondary' },
  { name: 'Amber',      role: 'Accent', hex: '#d4a44c', className: 'bg-accent' },
] as const;

const SUPPORTING_SWATCHES = [
  { name: 'Parchment', role: 'Background', hex: '#f5efe5', className: 'border bg-background' },
  { name: 'Chocolate', role: 'Foreground', hex: '#453329', className: 'bg-foreground' },
  { name: 'Warm Beige', role: 'Card', hex: '#eee6d8', className: 'bg-card border' },
  { name: 'Dusty Rose', role: 'Muted', hex: '#c4829a', className: 'bg-muted' },
  { name: 'Brick Red', role: 'Destructive', hex: '#c93b3b', className: 'bg-destructive' },
  { name: 'Tan', role: 'Border', hex: '#d5cabe', className: 'bg-border' },
] as const;

const CHART_SWATCHES = [
  { name: 'Terracotta', className: 'bg-chart-1' },
  { name: 'Sage', className: 'bg-chart-2' },
  { name: 'Amber', className: 'bg-chart-3' },
  { name: 'Dusty Rose', className: 'bg-chart-4' },
  { name: 'Brown', className: 'bg-chart-5' },
] as const;

const TYPE_SCALE = [
  { label: 'Display', className: 'font-serif text-5xl italic font-semibold leading-tight' },
  { label: 'Heading', className: 'font-serif text-2xl font-semibold' },
  { label: 'Body', className: 'font-sans text-base' },
  { label: 'Label', className: 'font-sans text-sm font-semibold tracking-wide' },
  { label: 'Caption', className: 'font-sans text-sm text-muted-foreground' },
  { label: 'Handwritten', className: 'font-mono text-xl' },
] as const;

const SPACING_SCALE = [
  { label: '4', className: 'w-4' },
  { label: '8', className: 'w-8' },
  { label: '12', className: 'w-12' },
  { label: '16', className: 'w-16' },
  { label: '24', className: 'w-24' },
] as const;

function Swatch({
  name,
  role,
  hex,
  className,
}: {
  name: string;
  role?: string;
  hex?: string;
  className: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className={`h-16 rounded-xl ${className}`} />
      <p className="text-sm font-semibold">{name}</p>
      {role && <p className="text-xs text-muted-foreground">{role}</p>}
      {hex && <p className="font-mono text-xs text-muted-foreground">{hex}</p>}
    </div>
  );
}

export function OverviewPage() {
  return (
    <div className="space-y-4">
      {/* Core palette */}
      <section className="rounded-xl border bg-card p-5 text-card-foreground">
        <h2 className="font-serif text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Core palette
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {CORE_SWATCHES.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
      </section>

      {/* Typography + In-use */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5 text-card-foreground">
          <h2 className="font-serif text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Typography
          </h2>
          <div className="mt-4 space-y-3">
            <p className="font-serif text-4xl italic font-semibold leading-tight">Display</p>
            <p className="font-serif text-2xl">Heading</p>
            <p className="font-sans text-base">Body text — Nunito</p>
            <p className="font-mono text-lg">Handwritten accent</p>
            <p className="font-sans text-sm text-muted-foreground">Caption / muted text</p>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5 text-card-foreground">
          <h2 className="font-serif text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            In use
          </h2>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="font-serif italic">How are you feeling?</CardTitle>
              <CardDescription>Check in with your mood today.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="overview-name">Your name</Label>
                <Input id="overview-name" placeholder="Enter your name" />
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked id="overview-notify" />
                <Label htmlFor="overview-notify">Daily reminders</Label>
                <Badge className="ml-auto" variant="secondary">New</Badge>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button>Check In</Button>
              <Button variant="outline">Later</Button>
            </CardFooter>
          </Card>
        </section>
      </div>

      {/* Components */}
      <section className="space-y-4 rounded-xl border bg-card p-5 text-card-foreground">
        <h2 className="font-serif text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Components
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Badge>Terracotta</Badge>
          <Badge variant="secondary">Sage</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>
    </div>
  );
}

export function ColorsPage() {
  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">
      <Guidelines
        title="Color usage"
        dos={[
          'Lead with terracotta for primary actions — it carries the most energy.',
          'Use sage for secondary or outlined actions to keep visual hierarchy clear.',
          'Apply amber sparingly as a highlight accent, not a background color.',
          'Keep dusty rose surfaces subtle — it reads as "muted", not emphatic.',
          'Pair dark chocolate (#453329) text against parchment backgrounds for maximum warmth.',
        ]}
        donts={[
          "Don't use destructive red for non-error states — it breaks the calming palette.",
          "Don't stack multiple saturated palette colors side-by-side in the same UI region.",
          "Don't use pure black or white — stay within the earthy token set.",
        ]}
      />

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-lg font-semibold">Brand colors</h2>
          <p className="text-sm text-muted-foreground">
            The three core roles — terracotta (primary), sage (secondary), amber (accent).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {CORE_SWATCHES.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-lg font-semibold">Surface and semantic colors</h2>
          <p className="text-sm text-muted-foreground">
            Parchment, chocolate, warm beige, dusty rose, brick red, and tan border.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {SUPPORTING_SWATCHES.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-lg font-semibold">Data visualization</h2>
          <p className="text-sm text-muted-foreground">
            Five earthy series colors in harmony with the brand palette.
          </p>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {CHART_SWATCHES.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function FontsPage() {
  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">
      <Guidelines
        title="Typography usage"
        dos={[
          'Use Cormorant Garamond italic for hero headings and display text — it defines the editorial warmth.',
          'Use Nunito for all body copy, labels, buttons, and UI text.',
          'Use Caveat sparingly: prompts, pull-quotes, journal labels, and handwritten accents.',
          'Prefer large display sizes (5xl–7xl) for page heroes to set a generous, open feeling.',
          'Pair a serif heading with Nunito body on every card for typographic contrast.',
        ]}
        donts={[
          "Don't use Caveat for paragraphs or long-form text — it's an accent, not a reading face.",
          "Don't set Cormorant Garamond at small sizes (below 18px) — it loses legibility.",
          "Don't use font weights above 700 for any of the three families.",
        ]}
      />

      <section className="space-y-2">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Display · Cormorant Garamond
        </h2>
        <p className="font-serif text-5xl italic font-semibold leading-tight">
          Mind Matters
        </p>
        <p className="font-sans text-sm text-muted-foreground">
          Cormorant Garamond — editorial serif for hero headings (italic, 600 weight)
        </p>
      </section>

      <section className="space-y-2 border-t pt-6">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Body · Nunito
        </h2>
        <p className="font-sans text-lg">
          Your mental wellness journey starts here. You are not alone.
        </p>
        <p className="font-sans text-sm text-muted-foreground">
          Nunito — friendly rounded sans-serif for body copy, labels, and UI text
        </p>
      </section>

      <section className="space-y-2 border-t pt-6">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Accent · Caveat (font-mono token)
        </h2>
        <p className="font-mono text-2xl">How are you feeling today?</p>
        <p className="font-sans text-sm text-muted-foreground">
          Caveat — handwritten accent for prompts, pull-quotes, and mood labels
        </p>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Type scale
        </h2>
        {TYPE_SCALE.map((entry) => (
          <div key={entry.label} className="grid gap-2 sm:grid-cols-[110px_1fr]">
            <span className="pt-1 font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {entry.label}
            </span>
            <p className={entry.className}>Feel good, grow strong.</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export function LayoutPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <h2 className="font-serif text-lg font-semibold">Spacing</h2>
        <p className="mt-1 font-sans text-sm text-muted-foreground">
          4px base step — standard Tailwind scale used throughout.
        </p>
        <div className="mt-6 space-y-4">
          {SPACING_SCALE.map((space) => (
            <div key={space.label} className="flex items-center gap-4">
              <span className="w-8 font-sans text-xs text-muted-foreground">
                {space.label}
              </span>
              <div className={`h-3 rounded-full bg-primary ${space.className}`} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <h2 className="font-serif text-lg font-semibold">Radius</h2>
        <p className="mt-1 font-sans text-sm text-muted-foreground">
          Base 20px radius — generous rounding that reads as organic and soft.
          Major card panels use 48px (rounded-[3rem]).
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Small (16px)', className: 'rounded-sm' },
            { label: 'Medium (18px)', className: 'rounded-md' },
            { label: 'Large (20px)', className: 'rounded-lg' },
            { label: 'XL (24px)', className: 'rounded-xl' },
            { label: 'Full pill', className: 'rounded-full' },
            { label: 'Card (48px)', className: 'rounded-[3rem]' },
          ].map((radius) => (
            <div
              key={radius.label}
              className={`flex h-20 items-end border bg-muted p-3 ${radius.className}`}
            >
              <span className="font-sans text-xs font-medium">{radius.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
