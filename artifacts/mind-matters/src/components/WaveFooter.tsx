interface WaveFooterProps {
  quote?: string;
}

export function WaveFooter({ quote = "A hub for 5th grade wellness and connection." }: WaveFooterProps) {
  return (
    <div className="relative z-20 mt-auto" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
      {/* Double wave */}
      <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className="w-full h-[160px] md:h-[220px] block">
        <path d="M0,100 C240,40 480,170 720,100 C960,30 1200,150 1440,70 L1440,220 L0,220 Z" fill="hsl(var(--secondary))" opacity="0.35"/>
        <path d="M0,130 C200,60 400,190 600,120 C800,50 1000,170 1200,100 C1350,50 1420,130 1440,110 L1440,220 L0,220 Z" fill="hsl(var(--secondary))"/>
      </svg>

      {/* Footer text area */}
      <div className="w-full bg-secondary flex flex-col items-center pb-12 pt-6 px-4 text-center relative overflow-hidden">

        {/* Botanical accents left */}
        <div className="absolute left-4 md:left-24 top-1/2 -translate-y-1/2 opacity-40">
          <svg width="40" height="60" viewBox="0 0 40 60" fill="none">
            <path d="M20 60 C20 60 20 20 20 0" stroke="#FAF3E3" strokeWidth="2" strokeLinecap="round"/>
            <ellipse cx="12" cy="20" rx="8" ry="4" fill="#FAF3E3" transform="rotate(-30 12 20)"/>
            <ellipse cx="28" cy="35" rx="8" ry="4" fill="#FAF3E3" transform="rotate(20 28 35)"/>
            <ellipse cx="14" cy="45" rx="6" ry="3" fill="#FAF3E3" transform="rotate(-15 14 45)"/>
          </svg>
        </div>

        {/* Quote */}
        <p className="font-display italic text-2xl md:text-4xl text-secondary-foreground max-w-3xl px-12 leading-relaxed">
          {quote}
        </p>

        {/* Botanical accents right */}
        <div className="absolute right-4 md:right-24 top-1/2 -translate-y-1/2 opacity-40">
          <svg width="40" height="60" viewBox="0 0 40 60" fill="none">
            <path d="M20 60 C20 60 20 20 20 0" stroke="#FAF3E3" strokeWidth="2" strokeLinecap="round"/>
            <ellipse cx="28" cy="20" rx="8" ry="4" fill="#FAF3E3" transform="rotate(30 28 20)"/>
            <ellipse cx="12" cy="35" rx="8" ry="4" fill="#FAF3E3" transform="rotate(-20 12 35)"/>
            <ellipse cx="26" cy="45" rx="6" ry="3" fill="#FAF3E3" transform="rotate(15 26 45)"/>
          </svg>
        </div>

      </div>
    </div>
  );
}
