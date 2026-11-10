/**
 * Illustrated "product shots" of the four parts of the kit, drawn in SVG so
 * they stay crisp at any size and match the logo's palette. Replace any of
 * these with real photos later by swapping the component for an <img>.
 */
import clsx from 'clsx';

const COCOA = '#3a2d23';

function BrainMark({ size = 56 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path d="M19 40c-4 0-6-3-5-7 0-4 3-7 7-7 1-4 5-6 9-5 3-3 8-3 11 0 4-1 8 2 8 6 3 1 5 4 4 7-1 4-4 6-8 6H19z" fill="#f4b2a3" stroke={COCOA} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M25 31c1-1.5 3-1.5 4 0M35 31c1-1.5 3-1.5 4 0" stroke={COCOA} strokeWidth="2" strokeLinecap="round" />
      <path d="M29 36c2 1.5 4 1.5 6 0" stroke={COCOA} strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="35" r="1.8" fill="#e8907f" />
      <circle cx="40" cy="35" r="1.8" fill="#e8907f" />
    </svg>
  );
}

export function ManualArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 240" className={clsx('h-full w-full', className)} role="img" aria-label="Teacher manual">
      <ellipse cx="120" cy="206" rx="86" ry="12" fill="rgba(58,45,35,0.10)" />
      <g transform="rotate(-6 120 120)">
        <rect x="54" y="38" width="138" height="168" rx="14" fill="#8e9e82" />
        <rect x="62" y="30" width="138" height="168" rx="14" fill="#9ba06e" stroke={COCOA} strokeWidth="3" />
        <rect x="62" y="30" width="18" height="168" rx="6" fill={COCOA} opacity="0.85" />
        <rect x="92" y="52" width="92" height="64" rx="12" fill="#fbf4ee" />
        <g transform="translate(110 56)"><BrainMarkSmall /></g>
        <text x="138" y="140" textAnchor="middle" fontFamily="Fredoka, Nunito, sans-serif" fontWeight="700" fontSize="17" fill="#fbf4ee">Teacher</text>
        <text x="138" y="160" textAnchor="middle" fontFamily="Fredoka, Nunito, sans-serif" fontWeight="700" fontSize="17" fill="#fbf4ee">Manual</text>
        <rect x="100" y="172" width="76" height="4" rx="2" fill="#fbf4ee" opacity="0.7" />
        <rect x="110" y="181" width="56" height="4" rx="2" fill="#fbf4ee" opacity="0.5" />
      </g>
      <g transform="translate(176 30)">
        <path d="M12 2c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10z" fill="none" stroke="#d9a23a" strokeWidth="2" />
      </g>
    </svg>
  );
}

function BrainMarkSmall() {
  return (
    <g transform="scale(0.9)">
      <path d="M19 40c-4 0-6-3-5-7 0-4 3-7 7-7 1-4 5-6 9-5 3-3 8-3 11 0 4-1 8 2 8 6 3 1 5 4 4 7-1 4-4 6-8 6H19z" fill="#f4b2a3" stroke={COCOA} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M25 31c1-1.5 3-1.5 4 0M35 31c1-1.5 3-1.5 4 0" stroke={COCOA} strokeWidth="2" strokeLinecap="round" />
      <path d="M29 36c2 1.5 4 1.5 6 0" stroke={COCOA} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

export function SlidesArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 240" className={clsx('h-full w-full', className)} role="img" aria-label="Lesson slide decks">
      <ellipse cx="120" cy="208" rx="90" ry="12" fill="rgba(58,45,35,0.10)" />
      <g transform="rotate(5 120 120)">
        <rect x="48" y="70" width="150" height="100" rx="12" fill="#fbd9cf" stroke={COCOA} strokeWidth="2.5" />
      </g>
      <g transform="rotate(-3 120 120)">
        <rect x="38" y="56" width="160" height="106" rx="12" fill="#f6e3b5" stroke={COCOA} strokeWidth="2.5" />
      </g>
      <rect x="30" y="42" width="170" height="112" rx="12" fill="#fffdfa" stroke={COCOA} strokeWidth="3" />
      <rect x="30" y="42" width="170" height="26" rx="12" fill="#f4a995" />
      <rect x="30" y="58" width="170" height="10" fill="#f4a995" />
      <circle cx="46" cy="55" r="4" fill="#fffdfa" />
      <circle cx="60" cy="55" r="4" fill="#fffdfa" opacity="0.7" />
      <text x="48" y="96" fontFamily="Fredoka, Nunito, sans-serif" fontWeight="700" fontSize="15" fill={COCOA}>Lesson 3</text>
      <text x="48" y="114" fontFamily="Caveat, cursive" fontWeight="700" fontSize="17" fill="#d96b5a">Naming big feelings</text>
      <rect x="48" y="124" width="70" height="4" rx="2" fill={COCOA} opacity="0.35" />
      <rect x="48" y="133" width="54" height="4" rx="2" fill={COCOA} opacity="0.25" />
      <g transform="translate(140 80)"><BrainMarkSmall /></g>
      <rect x="110" y="166" width="20" height="28" rx="4" fill={COCOA} />
      <rect x="80" y="192" width="80" height="8" rx="4" fill={COCOA} />
    </svg>
  );
}

export function WorkbookArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 240" className={clsx('h-full w-full', className)} role="img" aria-label="Student workbooks">
      <ellipse cx="120" cy="208" rx="88" ry="12" fill="rgba(58,45,35,0.10)" />
      <g transform="rotate(8 120 120)">
        <rect x="70" y="46" width="126" height="160" rx="12" fill="#8e9e82" stroke={COCOA} strokeWidth="2.5" />
      </g>
      <g transform="rotate(-4 120 120)">
        <rect x="46" y="36" width="126" height="160" rx="12" fill="#f4a995" stroke={COCOA} strokeWidth="3" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={i} cx="58" cy={58 + i * 24} r="4.5" fill="#fbf4ee" stroke={COCOA} strokeWidth="1.5" />
        ))}
        <rect x="76" y="54" width="80" height="54" rx="10" fill="#fbf4ee" />
        <g transform="translate(90 56) scale(0.8)"><BrainMarkSmall /></g>
        <text x="116" y="134" textAnchor="middle" fontFamily="Fredoka, Nunito, sans-serif" fontWeight="700" fontSize="15" fill={COCOA}>My Brightside</text>
        <text x="116" y="152" textAnchor="middle" fontFamily="Caveat, cursive" fontWeight="700" fontSize="20" fill={COCOA}>Workbook</text>
        <rect x="84" y="164" width="64" height="4" rx="2" fill={COCOA} opacity="0.35" />
        <rect x="94" y="174" width="44" height="4" rx="2" fill={COCOA} opacity="0.25" />
      </g>
      <g transform="translate(184 160) rotate(40)">
        <rect x="-5" y="-30" width="10" height="56" rx="3" fill="#d9a23a" stroke={COCOA} strokeWidth="2" />
        <path d="M-5 26l5 10 5-10z" fill="#f6e3b5" stroke={COCOA} strokeWidth="2" />
      </g>
    </svg>
  );
}

export function HubArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 240" className={clsx('h-full w-full', className)} role="img" aria-label="The Brightside Project hub website">
      <ellipse cx="120" cy="210" rx="96" ry="12" fill="rgba(58,45,35,0.10)" />
      <rect x="34" y="52" width="172" height="118" rx="12" fill={COCOA} />
      <rect x="42" y="60" width="156" height="102" rx="8" fill="#fbf4ee" />
      <rect x="42" y="60" width="156" height="18" rx="8" fill="#fffdfa" />
      <rect x="42" y="70" width="156" height="8" fill="#fffdfa" />
      <circle cx="54" cy="69" r="3.5" fill="#f4a995" />
      <rect x="64" y="66" width="48" height="6" rx="3" fill={COCOA} opacity="0.2" />
      <rect x="52" y="86" width="60" height="14" rx="4" fill={COCOA} opacity="0.75" />
      <rect x="52" y="105" width="48" height="4" rx="2" fill={COCOA} opacity="0.3" />
      <rect x="52" y="113" width="40" height="4" rx="2" fill={COCOA} opacity="0.2" />
      <rect x="52" y="126" width="36" height="12" rx="6" fill="#d96b5a" />
      {[
        ['#f4a995', 122, 86],
        ['#d9a23a', 158, 86],
        ['#8e9e82', 122, 122],
        ['#e8a0a0', 158, 122],
      ].map(([c, x, y]) => (
        <rect key={`${x}-${y}`} x={x as number} y={y as number} width="30" height="30" rx="8" fill={c as string} />
      ))}
      <g transform="translate(134 90) scale(0.55)"><BrainMarkSmall /></g>
      <path d="M100 170h40l6 14H94z" fill={COCOA} />
      <rect x="60" y="184" width="120" height="6" rx="3" fill={COCOA} />
      <g transform="translate(196 36)">
        <path d="M12 2c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10z" fill="none" stroke="#8e9e82" strokeWidth="2" />
      </g>
      <g transform="translate(18 150)">
        <path d="M12 21s-7.5-4.6-9.5-9.6C1.2 8 3.3 4.5 6.8 4.5c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.5 0 5.6 3.5 4.3 6.9C19.5 16.4 12 21 12 21z" fill="#e8a0a0" />
      </g>
    </svg>
  );
}

export const KIT_ART = {
  manual: ManualArt,
  slides: SlidesArt,
  workbooks: WorkbookArt,
  hub: HubArt,
} as const;

export { BrainMark };
