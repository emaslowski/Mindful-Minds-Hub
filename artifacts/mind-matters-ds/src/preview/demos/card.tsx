import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Guidelines } from '../parts';

export function CardDemo() {
  return (
    <div className="space-y-8">
      <Guidelines
        title="Card usage"
        dos={[
          'Use rounded-2xl (default) for list cards, input panels, and content rows.',
          'Use rounded-[3rem] for large hero panels and full-page feature sections.',
          'Pair a serif italic CardTitle with Nunito body text for typographic warmth.',
          'Use translucent white (bg-white/40–60) over colored backgrounds for layered depth.',
          'Generous padding (p-8 to p-12) signals a calm, spacious feel — do not compress.',
        ]}
        donts={[
          "Don't use sharp corners (rounded-none or rounded-sm) — they break the organic aesthetic.",
          "Don't put too many competing actions in one card footer.",
          "Don't use pure white (#ffffff) card backgrounds — the warm beige token (#eee6d8) is correct.",
        ]}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Standard card */}
        <Card>
          <CardHeader>
            <CardTitle>How are you feeling?</CardTitle>
            <CardDescription>
              Take a moment to check in with yourself today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-sans text-sm text-muted-foreground">
              Your mental wellness matters. Spending just 5 minutes reflecting can
              make a real difference in your day.
            </p>
          </CardContent>
          <CardFooter>
            <Button>Check In</Button>
            <Button variant="ghost">Later</Button>
          </CardFooter>
        </Card>

        {/* Activity card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle>Breathing Exercise</CardTitle>
              <Badge variant="secondary">Move</Badge>
            </div>
            <CardDescription>5-minute guided session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-20 items-center justify-center rounded-xl bg-secondary/20">
              <span className="font-mono text-3xl">🌿</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="secondary">Start</Button>
            <Button variant="ghost">Save for later</Button>
          </CardFooter>
        </Card>

        {/* Large hero card (3rem rounding) */}
        <Card className="col-span-full rounded-[3rem] bg-primary/10 p-4">
          <CardHeader>
            <CardTitle className="font-serif text-3xl">
              You are not alone in this.
            </CardTitle>
            <CardDescription className="text-base">
              The Brightside Project connects you with tools, resources, and a community
              of peers who understand what you're going through.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button>Explore resources</Button>
            <Button variant="outline">Meet the team</Button>
          </CardFooter>
        </Card>

        {/* Translucent white card */}
        <Card className="col-span-full bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Today's journal prompt</CardTitle>
            <CardDescription>Grow · Daily reflection</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-lg text-foreground">
              "What's one thing you're grateful for today?"
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="amber">Write your response</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
