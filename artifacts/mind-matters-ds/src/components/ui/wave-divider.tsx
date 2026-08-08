import { cn } from '../../lib/utils';

/**
 * WaveDivider — organic SVG wave / green-hills section separator.
 *
 * Extracted from the Mind Matters app (artifacts/mind-matters/src/pages/Home.tsx
 * and the WaveFooter component). Used to split page sections with a botanical,
 * hand-drawn feel. The wave fills with the provided color token so it blends
 * into the section below it.
 *
 * Props:
 *   fill      — Tailwind fill-* class or inline color for the wave shape.
 *               Defaults to fill-secondary (sage green, matching the footer hills).
 *   className — extra classes on the outer <div> wrapper.
 *   height    — SVG viewBox height scaling (default 120).
 *   flipY     — flip the wave upside-down so it opens downward instead of up.
 */
export interface WaveDividerProps {
  fill?: string;
  className?: string;
  height?: number;
  flipY?: boolean;
}

export function WaveDivider({
  fill = 'fill-secondary',
  className,
  height = 120,
  flipY = false,
}: WaveDividerProps) {
  return (
    <div
      className={cn(
        'w-full overflow-hidden leading-none',
        flipY && '-scale-y-100',
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 1440 ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height }}
      >
        {/* Front hill — opaque fill */}
        <path
          className={cn(fill)}
          d="M0,60 C180,20 360,100 540,60 C720,20 900,80 1080,50 C1260,20 1350,70 1440,40 L1440,120 L0,120 Z"
        />
        {/* Rear hill — 40% opacity for depth */}
        <path
          className={cn(fill, 'opacity-40')}
          d="M0,80 C200,40 400,110 600,70 C800,30 1000,90 1200,60 C1300,45 1380,80 1440,55 L1440,120 L0,120 Z"
        />
      </svg>
    </div>
  );
}

/**
 * GreenHillsFooter — the full-width botanical footer used on the Home page.
 * Three layered sage hills with a deep-forest footer band.
 */
export function GreenHillsFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('relative w-full overflow-hidden', className)} aria-label="Site footer">
      {/* Hills */}
      <svg
        viewBox="0 0 1440 200"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height: 200 }}
        aria-hidden="true"
      >
        {/* Back hill — lightest */}
        <path
          fill="#8aad6e"
          opacity="0.4"
          d="M0,100 C240,40 480,140 720,80 C960,20 1200,110 1440,70 L1440,200 L0,200 Z"
        />
        {/* Mid hill */}
        <path
          fill="#5a7a44"
          opacity="0.7"
          d="M0,130 C200,70 420,160 660,110 C900,60 1140,140 1440,100 L1440,200 L0,200 Z"
        />
        {/* Front hill — fully opaque */}
        <path
          fill="#3d5c2a"
          d="M0,155 C180,110 380,175 600,145 C820,115 1100,165 1440,130 L1440,200 L0,200 Z"
        />
      </svg>
      {/* Footer band */}
      <div className="bg-[#203520] px-8 py-6 text-center">
        <p className="font-mono text-lg text-white/80">
          You are never alone 🌿
        </p>
        <p className="mt-1 font-sans text-sm text-white/50">
          Mind Matters · Student Wellness
        </p>
      </div>
    </footer>
  );
}
