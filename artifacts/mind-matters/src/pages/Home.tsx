import { Link } from "wouter";

export default function Home() {
  const categories = [
    {
      name: "Learn",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-sage">
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 2.5 2.5 0 0 1-.98-4.5 2.5 2.5 0 0 1 1.5-4.1 2.5 2.5 0 0 1 4.9-3.76V4.5A2.5 2.5 0 0 1 9.5 2z" />
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 2.5 2.5 0 0 0 .98-4.5 2.5 2.5 0 0 0-1.5-4.1 2.5 2.5 0 0 0-4.9-3.76V4.5A2.5 2.5 0 0 0 14.5 2z" />
        </svg>
      ),
      path: "/learn"
    },
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
    <div className="w-full flex flex-col min-h-[calc(100vh-100px)] pt-12 md:pt-24 relative overflow-hidden">

      {/* Boho Sun Mandala — pinned to top-left screen edge */}
      <div className="absolute top-0 left-0 -z-10 animate-[spin_120s_linear_infinite] opacity-70 -translate-x-6 -translate-y-6">
        <svg width="280" height="280" viewBox="0 0 100 100">
          {Array.from({length: 12}).map((_, i) => (
            <polygon
              key={i}
              points="50,8 47,20 53,20"
              fill="#D4A44C"
              transform={`rotate(${i * 30} 50 50)`}
              opacity="0.7"
            />
          ))}
          <circle cx="50" cy="50" r="28" fill="none" stroke="#D4A44C" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"/>
          <circle cx="50" cy="50" r="22" fill="#D4A44C" opacity="0.8"/>
          <circle cx="50" cy="50" r="14" fill="#C4622D" opacity="0.6"/>
          <circle cx="50" cy="50" r="6" fill="#FAF3E3" opacity="0.9"/>
        </svg>
      </div>

      <div className="flex-1 flex flex-col items-center pb-32 relative z-10 w-full max-w-5xl mx-auto">

        {/* Hero Text */}
        <h1 className="text-7xl md:text-[110px] lg:text-[130px] font-display text-foreground text-center leading-[0.9] mt-8 mb-6 drop-shadow-sm">
          <span className="italic block mb-2">Mind</span> 
          <span>Matters</span>
        </h1>
        
        <p className="font-handwritten text-3xl md:text-5xl text-foreground/80 text-center max-w-2xl mb-12">
          Discover how to make your mind a nice place to be.
        </p>
        
        <h2 className="font-display italic font-bold text-2xl md:text-4xl text-terracotta mb-6 text-center px-4 max-w-3xl leading-snug">
          You Matter. We Matter. Your Mind Matters.
        </h2>
        
        <p className="font-sans font-medium text-lg md:text-xl text-foreground/70 text-center tracking-wide max-w-xl mx-auto border-t border-b border-terracotta/20 py-4 mb-8">
          A student-run mental wellness center.
          <br />
          <span className="italic opacity-80 block mt-1">You are not alone.</span>
        </p>

      </div>

      {/* Embedded footer/wave with cards */}
      <div className="w-full relative z-20 mt-auto -mx-0">
        {/* Double wave for earthy layered feel */}
        <svg viewBox="0 0 1440 300" preserveAspectRatio="none" className="w-full h-[300px] md:h-[350px] block">
          <path d="M0,150 C240,90 480,220 720,150 C960,80 1200,200 1440,120 L1440,300 L0,300 Z" fill="#688A52" opacity="0.3"/>
          <path d="M0,180 C200,100 400,240 600,170 C800,100 1000,220 1200,150 C1350,100 1420,180 1440,160 L1440,300 L0,300 Z" fill="#688A52"/>
        </svg>
        
        <div className="absolute bottom-12 md:bottom-20 left-0 w-full px-4 md:px-12 flex justify-center">
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 max-w-6xl w-full">
            {categories.map((cat, idx) => (
              <Link key={idx} href={cat.path} className="group relative">
                {/* Circle button */}
                <div className="w-28 h-28 md:w-36 md:h-36 bg-background rounded-full flex flex-col items-center justify-center p-4 transition-all duration-500 shadow-md group-hover:-translate-y-4 group-hover:shadow-2xl border border-background/50">
                  
                  {/* Line art Icon */}
                  <div className="w-10 h-10 md:w-14 md:h-14 transition-transform duration-300 group-hover:scale-110 mb-2">
                    {cat.icon}
                  </div>
                  
                  {/* Label */}
                  <div className="font-display italic text-lg md:text-xl text-foreground font-semibold text-center">
                    {cat.name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
