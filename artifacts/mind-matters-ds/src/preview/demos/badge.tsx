import { Badge } from '../../components/ui/badge';
import { Guidelines, Row } from '../parts';

export function BadgeDemo() {
  return (
    <div className="space-y-8">
      <Guidelines
        title="Badge usage"
        dos={[
          'Use badges to label mood, category, status, or activity type.',
          'Keep badge text very short — 1–3 words maximum.',
          'Use terracotta (default) for the most important status.',
          'Use sage (secondary) for positive/active states.',
          'Use amber (accent) for in-progress or creative activities.',
          'Use dusty rose (muted) for neutral or archived states.',
        ]}
        donts={[
          "Don't use badges as interactive controls — use Button for clickable actions.",
          "Don't stack more than 3 badges in one row without enough visual breathing room.",
          "Don't use destructive badges for anything other than error or alert states.",
        ]}
      />

      <section className="space-y-6 rounded-xl border bg-card p-6">
        <Row label="Palette variants">
          <Badge variant="default">Terracotta</Badge>
          <Badge variant="secondary">Sage</Badge>
          <Badge variant="accent">Amber</Badge>
          <Badge variant="muted">Dusty Rose</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Alert</Badge>
        </Row>

        <Row label="Mood labels">
          <Badge variant="secondary">😊 Great</Badge>
          <Badge variant="accent">😐 Okay</Badge>
          <Badge variant="muted">😔 Struggling</Badge>
          <Badge variant="default">🌟 Motivated</Badge>
          <Badge variant="destructive">🆘 Need help</Badge>
        </Row>

        <Row label="Activity categories">
          <Badge variant="default">Learn</Badge>
          <Badge variant="secondary">Move</Badge>
          <Badge variant="accent">Create</Badge>
          <Badge variant="muted">Connect</Badge>
          <Badge variant="secondary">Listen</Badge>
          <Badge variant="default">Grow</Badge>
        </Row>

        <Row label="Status chips">
          <Badge variant="secondary">Published</Badge>
          <Badge variant="accent">Pending review</Badge>
          <Badge variant="muted">Draft</Badge>
          <Badge variant="destructive">Flagged</Badge>
          <Badge variant="outline">Archived</Badge>
        </Row>
      </section>
    </div>
  );
}
