import { Link } from "wouter";
import { ImpactStats } from "@/components/ImpactStats";

export default function Home() {
  const categories = [
    {
      name: "Create",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-terracotta">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M7.5 12.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z" />
          <path d="M12 16.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z" />
          <path d="M16.5 12.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z" />
          <path d="M12 8.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z" />
        </svg>
      ),
      path: "/create"
    },
    {
      name: "Connect",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-dusty-rose">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      ),
      path: "/connect"
    },
    {
      name: "Move",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-amber">
          <path d="M12 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
          <path d="M15 22v-5l-1.5-3-1.5 3v5" />
          <path d="M9 22v-5l1.5-3 1.5 3v5" />
          <path d="M12 14v-4" />
          <path d="M6 11l4.5-2.5 3 2.5L18 11" />
        </svg>
      ),
      path: "/move"
    },
    {
      name: "Listen",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-sage">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      ),
      path: "/listen"
    },
    {
      name: "Grow",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-terracotta">
          <path d="M12 22V8" />
          <path d="M5 13.5a4 4 0 0 0 7-1.5 4 4 0 0 0-7 1.5z" />
          <path d="M19 11.5a4 4 0 0 1-7-1.5 4 4 0 0 1 7 1.5z" />
          <path d="M12 2a3 3 0 0 0-3 3v2a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
        </svg>
      ),
      path: "/grow"
    },
  ];

  return (
    <div className="w-full flex flex-col min-h-[calc(100dvh-100px)] pt-12 md:pt-24 relative">

      {/* ── Full-bleed decoration layer — breaks out of max-w container ── */}
      <div className="absolute inset-0 pointer-events-none -z-10" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>

        {/* Sun Mandala — left edge */}
        <div className="absolute top-8 -left-20 animate-[spin_120s_linear_infinite] opacity-75">
          <svg width="320" height="320" viewBox="0 0 100 100">
            {Array.from({length: 16}).map((_, i) => (
              <polygon key={i} points="50,5 47,18 53,18" fill="#D4A44C"
                transform={`rotate(${i * 22.5} 50 50)`} opacity="0.75"/>
            ))}
            <circle cx="50" cy="50" r="30" fill="none" stroke="#D4A44C" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5"/>
            <circle cx="50" cy="50" r="24" fill="none" stroke="#C4622D" strokeWidth="1" strokeDasharray="2 4" opacity="0.4"/>
            <circle cx="50" cy="50" r="22" fill="#D4A44C" opacity="0.85"/>
            <circle cx="50" cy="50" r="14" fill="#C4622D" opacity="0.6"/>
            <circle cx="50" cy="50" r="7" fill="#FAF3E3" opacity="0.9"/>
          </svg>
        </div>

        {/* Crescent moon + stars — top right edge */}
        <div className="absolute top-2 right-0 opacity-60">
          <svg width="200" height="180" viewBox="0 0 200 180">
            <path d="M155 20 Q178 48 168 80 Q152 108 122 104 Q146 96 150 72 Q158 46 140 18 Q147 14 155 20Z" fill="#D4A44C" opacity="0.8"/>
            <path d="M55 22 L57.5 31 L67 33 L57.5 35 L55 44 L52.5 35 L43 33 L52.5 31Z" fill="#C4829A" opacity="0.9"/>
            <path d="M28 65 L29.5 71 L36 72.5 L29.5 74 L28 80 L26.5 74 L20 72.5 L26.5 71Z" fill="#D4A44C" opacity="0.8"/>
            <path d="M82 12 L83 16 L87 17 L83 18 L82 22 L81 18 L77 17 L81 16Z" fill="#688A52" opacity="0.8"/>
            <circle cx="100" cy="50" r="3.5" fill="#C4622D" opacity="0.5"/>
            <circle cx="38" cy="42" r="2.5" fill="#D4A44C" opacity="0.7"/>
            <circle cx="70" cy="75" r="2" fill="#C4829A" opacity="0.6"/>
          </svg>
        </div>

        {/* Botanical branch — right edge, mid height */}
        <div className="absolute top-56 right-0 opacity-30 rotate-6">
          <svg width="120" height="200" viewBox="0 0 120 200">
            <path d="M60 200 Q62 120 70 60 Q78 20 85 5" stroke="#688A52" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M68 160 Q45 140 30 120" stroke="#688A52" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M70 125 Q48 108 35 88" stroke="#688A52" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M73 90 Q95 72 108 52" stroke="#688A52" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M76 58 Q54 42 44 22" stroke="#688A52" strokeWidth="1.8" strokeLinecap="round"/>
            <ellipse cx="31" cy="120" rx="14" ry="6" fill="#688A52" opacity="0.55" transform="rotate(-35 31 120)"/>
            <ellipse cx="36" cy="88" rx="13" ry="6" fill="#688A52" opacity="0.55" transform="rotate(-30 36 88)"/>
            <ellipse cx="107" cy="52" rx="13" ry="6" fill="#688A52" opacity="0.55" transform="rotate(32 107 52)"/>
            <ellipse cx="45" cy="22" rx="11" ry="5" fill="#688A52" opacity="0.55" transform="rotate(-38 45 22)"/>
            <circle cx="32" cy="118" r="4" fill="#C4622D" opacity="0.6"/>
            <circle cx="108" cy="50" r="3.5" fill="#C4829A" opacity="0.6"/>
            <circle cx="46" cy="20" r="3" fill="#C4622D" opacity="0.6"/>
          </svg>
        </div>

        {/* Wildflower bunch — bottom left edge */}
        <div className="absolute bottom-36 left-4 opacity-40">
          <svg width="100" height="140" viewBox="0 0 100 140">
            <path d="M40 140 Q38 100 35 70 Q32 45 28 20" stroke="#688A52" strokeWidth="2" strokeLinecap="round"/>
            <path d="M50 140 Q50 95 50 60 Q50 35 50 10" stroke="#688A52" strokeWidth="2" strokeLinecap="round"/>
            <path d="M60 140 Q62 100 65 70 Q68 45 72 20" stroke="#688A52" strokeWidth="2" strokeLinecap="round"/>
            <ellipse cx="34" cy="90" rx="12" ry="5" fill="#688A52" opacity="0.6" transform="rotate(-30 34 90)"/>
            <ellipse cx="64" cy="95" rx="12" ry="5" fill="#688A52" opacity="0.6" transform="rotate(28 64 95)"/>
            <ellipse cx="48" cy="75" rx="10" ry="4.5" fill="#688A52" opacity="0.5" transform="rotate(-15 48 75)"/>
            <circle cx="28" cy="20" r="12" fill="#C4829A" opacity="0.5"/>
            <circle cx="28" cy="8" r="4.5" fill="#FAF3E3" opacity="0.8"/>
            <circle cx="28" cy="32" r="4.5" fill="#FAF3E3" opacity="0.8"/>
            <circle cx="16" cy="20" r="4.5" fill="#FAF3E3" opacity="0.8"/>
            <circle cx="40" cy="20" r="4.5" fill="#FAF3E3" opacity="0.8"/>
            <circle cx="20" cy="12" r="4.5" fill="#FAF3E3" opacity="0.8"/>
            <circle cx="36" cy="12" r="4.5" fill="#FAF3E3" opacity="0.8"/>
            <circle cx="28" cy="20" r="7" fill="#D4A44C"/>
            <circle cx="50" cy="10" r="10" fill="#C4622D" opacity="0.45"/>
            <circle cx="50" cy="0" r="4" fill="#FAF3E3" opacity="0.8"/>
            <circle cx="50" cy="20" r="4" fill="#FAF3E3" opacity="0.8"/>
            <circle cx="40" cy="10" r="4" fill="#FAF3E3" opacity="0.8"/>
            <circle cx="60" cy="10" r="4" fill="#FAF3E3" opacity="0.8"/>
            <circle cx="50" cy="10" r="6" fill="#D4A44C"/>
            <circle cx="72" cy="20" r="9" fill="#C4829A" opacity="0.4"/>
            <circle cx="72" cy="11" r="3.5" fill="#FAF3E3" opacity="0.8"/>
            <circle cx="72" cy="29" r="3.5" fill="#FAF3E3" opacity="0.8"/>
            <circle cx="63" cy="20" r="3.5" fill="#FAF3E3" opacity="0.8"/>
            <circle cx="81" cy="20" r="3.5" fill="#FAF3E3" opacity="0.8"/>
            <circle cx="72" cy="20" r="5.5" fill="#C4622D" opacity="0.7"/>
          </svg>
        </div>

        {/* Butterfly — bottom right edge */}
        <div className="absolute bottom-52 right-12 opacity-35 -rotate-12">
          <svg width="90" height="80" viewBox="0 0 90 80">
            <path d="M45 40 Q15 12 2 22 Q-2 42 22 52 Q36 57 45 40Z" fill="#C4829A" opacity="0.7"/>
            <path d="M45 40 Q14 50 8 66 Q18 82 38 72 Q50 62 45 40Z" fill="#D4A44C" opacity="0.6"/>
            <path d="M45 40 Q75 12 88 22 Q92 42 68 52 Q54 57 45 40Z" fill="#D4A44C" opacity="0.7"/>
            <path d="M45 40 Q76 50 82 66 Q72 82 52 72 Q40 62 45 40Z" fill="#C4829A" opacity="0.6"/>
            <ellipse cx="45" cy="44" rx="3" ry="16" fill="#5A3A1A" opacity="0.5"/>
            <path d="M45 28 Q38 16 34 10" stroke="#5A3A1A" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
            <circle cx="34" cy="10" r="2.5" fill="#C4622D" opacity="0.5"/>
            <path d="M45 28 Q52 16 56 10" stroke="#5A3A1A" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
            <circle cx="56" cy="10" r="2.5" fill="#C4622D" opacity="0.5"/>
            <circle cx="25" cy="34" r="5" fill="#FAF3E3" opacity="0.4"/>
            <circle cx="65" cy="34" r="5" fill="#FAF3E3" opacity="0.4"/>
          </svg>
        </div>

        {/* Sparkle cluster — upper center area */}
        <div className="absolute top-32 left-[28%] opacity-35">
          <svg width="100" height="80" viewBox="0 0 100 80">
            <path d="M18 12 L20 20 L28 22 L20 24 L18 32 L16 24 L8 22 L16 20Z" fill="#D4A44C" opacity="0.8"/>
            <path d="M75 40 L76.5 46 L83 47.5 L76.5 49 L75 55 L73.5 49 L67 47.5 L73.5 46Z" fill="#C4829A" opacity="0.8"/>
            <path d="M50 5 L51 8.5 L55 9.5 L51 10.5 L50 14 L49 10.5 L45 9.5 L49 8.5Z" fill="#688A52" opacity="0.8"/>
            <circle cx="88" cy="18" r="4" fill="#C4622D" opacity="0.5"/>
            <circle cx="35" cy="55" r="3" fill="#C4829A" opacity="0.6"/>
            <circle cx="60" cy="70" r="2.5" fill="#D4A44C" opacity="0.7"/>
            <circle cx="10" cy="55" r="2" fill="#688A52" opacity="0.6"/>
          </svg>
        </div>

        {/* Mushroom — left side mid */}
        <div className="absolute top-[52%] left-8 opacity-30 -rotate-6">
          <svg width="55" height="65" viewBox="0 0 55 65">
            <path d="M27 32 Q8 32 6 20 Q8 4 27 4 Q46 4 48 20 Q46 32 27 32Z" fill="#C4622D"/>
            <circle cx="18" cy="16" r="4" fill="white" opacity="0.55"/>
            <circle cx="32" cy="11" r="3" fill="white" opacity="0.55"/>
            <circle cx="36" cy="22" r="2.5" fill="white" opacity="0.55"/>
            <rect x="21" y="32" width="12" height="24" rx="4" fill="#FAF3E3"/>
            <path d="M17 46 Q27 51 37 46" stroke="#D4A44C" strokeWidth="1" fill="none"/>
            <path d="M19 40 Q27 44 35 40" stroke="#D4A44C" strokeWidth="1" fill="none"/>
          </svg>
        </div>

      </div>{/* end full-bleed decoration layer */}

      {/* Hero Text */}
      <div className="flex-1 flex flex-col items-center pb-12 relative z-10 w-full max-w-5xl mx-auto">
        <h1 className="text-6xl md:text-[96px] lg:text-[112px] font-display text-foreground text-center leading-[0.9] mt-8 mb-6 drop-shadow-sm">
          <span className="italic block mb-2">Middle School</span>
          <span>Matters</span>
        </h1>
        
        <p className="font-handwritten text-3xl md:text-5xl text-foreground/80 text-center max-w-2xl mb-12">
          A hub for 5th grade wellness and connection.
        </p>
        
        <p className="font-sans font-medium text-lg md:text-xl text-foreground/75 text-center leading-relaxed max-w-4xl mx-auto border-t border-b border-terracotta/20 py-5 px-4 mb-8">
          <span className="font-bold text-terracotta">Our Goal:</span>{" "}
          To create a student-run website that builds a stronger, kinder, and more connected middle school community by sharing helpful resources, ideas, and student voices.
        </p>
      </div>

      {/* Category buttons — above the hills */}
      <div className="w-full flex justify-center px-4 md:px-12 pb-10 relative z-10">
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 max-w-6xl w-full">
          {categories.map((cat, idx) => (
            <Link key={idx} href={cat.path} className="group relative">
              <div data-testid={`link-category-${cat.name.toLowerCase()}`} className="w-28 h-28 md:w-36 md:h-36 bg-card rounded-full flex flex-col items-center justify-center p-4 transition-all duration-500 shadow-md group-hover:-translate-y-4 group-hover:shadow-2xl group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 border border-card-border">
                <div className="w-10 h-10 md:w-14 md:h-14 transition-transform duration-300 group-hover:scale-110 mb-2">
                  {cat.icon}
                </div>
                <div className="font-display italic text-lg md:text-xl text-foreground font-semibold text-center">
                  {cat.name}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Our Impact */}
      <ImpactStats />

      {/* Hills — full-bleed, no buttons inside */}
      <div className="relative z-20 mt-auto" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
        <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className="w-full h-[160px] md:h-[220px] block">
          <path d="M0,100 C240,40 480,170 720,100 C960,30 1200,150 1440,70 L1440,220 L0,220 Z" fill="#5A7A44" opacity="0.35"/>
          <path d="M0,130 C200,60 400,190 600,120 C800,50 1000,170 1200,100 C1350,50 1420,130 1440,110 L1440,220 L0,220 Z" fill="#5A7A44"/>
        </svg>
      </div>
    </div>
  );
}
