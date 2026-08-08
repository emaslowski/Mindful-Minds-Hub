import { Button } from '../../components/ui/button';
import { Guidelines, Row } from '../parts';

export function ButtonDemo() {
  return (
    <div className="space-y-8">
      <Guidelines
        title="Button usage"
        dos={[
          'Use the default (terracotta) button for the primary CTA on each page.',
          'Use secondary (sage) for paired or outlined actions.',
          'Use the amber variant for mood or creative actions.',
          'Keep button labels short and action-oriented — "Check In", "Explore", "Share".',
          'Use rounded-full (pill) shape — it reinforces the organic, wellness aesthetic.',
        ]}
        donts={[
          "Don't place two default (terracotta) buttons next to each other — pick a hierarchy.",
          "Don't use the destructive variant for anything other than delete/remove actions.",
          "Don't truncate button labels — pills should always show the full text.",
        ]}
      />

      <section className="space-y-6 rounded-xl border bg-card p-6">
        <Row label="Default sizes">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
        </Row>

        <Row label="Variants">
          <Button variant="default">Terracotta</Button>
          <Button variant="secondary">Sage</Button>
          <Button variant="amber">Amber</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
        </Row>

        <Row label="In-context examples">
          <Button>Check In</Button>
          <Button variant="secondary">Explore</Button>
          <Button variant="amber">Try an Activity</Button>
          <Button variant="outline">Learn More</Button>
          <Button variant="ghost">Skip for now</Button>
        </Row>

        <Row label="Disabled states">
          <Button disabled>Terracotta</Button>
          <Button variant="secondary" disabled>Sage</Button>
          <Button variant="outline" disabled>Outline</Button>
          <Button variant="ghost" disabled>Ghost</Button>
        </Row>

        <Row label="Icon button">
          <Button size="icon" aria-label="Favorite">
            <span aria-hidden="true">🌿</span>
          </Button>
          <Button variant="secondary" size="icon" aria-label="Like">
            <span aria-hidden="true">✨</span>
          </Button>
          <Button variant="outline" size="icon" aria-label="Share">
            <span aria-hidden="true">🔗</span>
          </Button>
        </Row>
      </section>
    </div>
  );
}
