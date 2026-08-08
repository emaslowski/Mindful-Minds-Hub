interface WaveFooterProps {
  quote?: string;
}

export function WaveFooter({ quote = "You Matter. We Matter. Your Mind Matters." }: WaveFooterProps) {
  return (
    <div className="w-full relative z-0 mt-auto">
      {/* SVG Double Wave */}
      <div className="w-full -mb-1 overflow-hidden">
        <svg viewBox="0 0 1440 250" preserveAspectRatio="none" className="w-full h-[120px] md:h-[180px] lg:h-[250px]">
          {/* Back wave — slightly darker deep sage */}
          <path d="M0,120 C180,60 360,180 540,120 C720,60 900,160 1080,100 C1260,40 1380,140 1440,110 L1440,250 L0,250 Z" fill="#4A6741" opacity="0.5"/>
          {/* Front wave — main deep sage */}
          <path d="M0,150 C200,80 400,200 600,140 C800,80 1000,180 1200,120 C1350,75 1420,160 1440,140 L1440,250 L0,250 Z" fill="#4A6741"/>
        </svg>
      </div>
      
      {/* Footer text area extending below the wave */}
      <div className="w-full bg-[#4A6741] flex flex-col items-center pb-16 pt-8 px-4 text-center relative overflow-hidden">
        
        {/* Botanical SVG accents left */}
        <div className="absolute left-4 md:left-24 top-1/2 -translate-y-1/2 opacity-40">
          <svg width="40" height="60" viewBox="0 0 40 60" fill="none">
            <path d="M20 60 C20 60 20 20 20 0" stroke="#FAF3E3" strokeWidth="2" strokeLinecap="round"/>
            <ellipse cx="12" cy="20" rx="8" ry="4" fill="#FAF3E3" transform="rotate(-30 12 20)"/>
            <ellipse cx="28" cy="35" rx="8" ry="4" fill="#FAF3E3" transform="rotate(20 28 35)"/>
            <ellipse cx="14" cy="45" rx="6" ry="3" fill="#FAF3E3" transform="rotate(-15 14 45)"/>
          </svg>
        </div>

        {/* Quote */}
        <p className="font-display italic text-2xl md:text-4xl text-[#FAF3E3] max-w-3xl px-12 leading-relaxed">
          {quote}
        </p>

        {/* Botanical SVG accents right */}
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
