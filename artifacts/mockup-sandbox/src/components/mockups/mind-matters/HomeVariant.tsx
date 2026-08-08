import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { 
  BookOpen, 
  Palette, 
  HeartHandshake, 
  Wind, 
  Headphones, 
  Sprout,
  ArrowRight,
  Menu,
  Heart
} from "lucide-react";
import "./HomeVariant.css";

export default function HomeVariant() {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const categories = [
    {
      name: "Learn",
      icon: <BookOpen strokeWidth={1.2} className="w-8 h-8 md:w-10 md:h-10 text-[#759263]" />,
      color: "var(--mm-sage)",
      bg: "rgba(117, 146, 99, 0.08)",
      path: "/learn",
      desc: "Strategies & tips"
    },
    {
      name: "Create",
      icon: <Palette strokeWidth={1.2} className="w-8 h-8 md:w-10 md:h-10 text-[#C86B43]" />,
      color: "var(--mm-terracotta)",
      bg: "rgba(200, 107, 67, 0.08)",
      path: "/create",
      desc: "Art & expression"
    },
    {
      name: "Connect",
      icon: <HeartHandshake strokeWidth={1.2} className="w-8 h-8 md:w-10 md:h-10 text-[var(--mm-rose)]" />,
      color: "var(--mm-rose)",
      bg: "rgba(223, 159, 154, 0.08)",
      path: "/connect",
      desc: "Community posts"
    },
    {
      name: "Move",
      icon: <Wind strokeWidth={1.2} className="w-8 h-8 md:w-10 md:h-10 text-[#DBB05F]" />,
      color: "var(--mm-amber)",
      bg: "rgba(219, 176, 95, 0.08)",
      path: "/move",
      desc: "Mindful activity"
    },
    {
      name: "Listen",
      icon: <Headphones strokeWidth={1.2} className="w-8 h-8 md:w-10 md:h-10 text-[#759263]" />,
      color: "var(--mm-sage)",
      bg: "rgba(117, 146, 99, 0.08)",
      path: "/listen",
      desc: "Music & podcasts"
    },
    {
      name: "Grow",
      icon: <Sprout strokeWidth={1.2} className="w-8 h-8 md:w-10 md:h-10 text-[#C86B43]" />,
      color: "var(--mm-terracotta)",
      bg: "rgba(200, 107, 67, 0.08)",
      path: "/grow",
      desc: "Personal journey"
    },
  ];

  return (
    <div className="mm-container">
      <div className="mm-noise-overlay" />
      <div className="mm-gradient-bg" />

      {/* Decorative Sun Mandala - Refined & Elegant */}
      <div className="absolute top-[-5%] left-[-5%] mm-animate-spin-slow opacity-60 pointer-events-none z-0">
        <svg width="400" height="400" viewBox="0 0 100 100">
          {Array.from({ length: 16 }).map((_, i) => (
            <polygon
              key={i}
              points="50,15 48,25 52,25"
              fill="var(--mm-amber)"
              transform={`rotate(${i * 22.5} 50 50)`}
              opacity="0.5"
            />
          ))}
          <circle cx="50" cy="50" r="22" fill="none" stroke="var(--mm-amber)" strokeWidth="0.5" opacity="0.6"/>
          <circle cx="50" cy="50" r="18" fill="var(--mm-amber)" opacity="0.4"/>
          <circle cx="50" cy="50" r="12" fill="var(--mm-terracotta)" opacity="0.3"/>
        </svg>
      </div>

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-[#C86B43]" strokeWidth={1.5} />
          <span className="mm-font-display italic font-semibold text-xl md:text-2xl tracking-wide text-[#4A3B32]">
            Mind Matters
          </span>
        </div>
        <button className="p-2 rounded-full hover:bg-[#E3D6C5] transition-colors duration-300">
          <Menu className="w-6 h-6 text-[#4A3B32]" strokeWidth={1.5} />
        </button>
      </nav>

      <main className="relative z-10 flex flex-col items-center justify-center pt-8 md:pt-16 pb-24 px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div 
          className={`flex flex-col items-center text-center max-w-4xl mx-auto transition-all duration-1000 ease-out transform ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E3D6C5] bg-white/40 backdrop-blur-md mb-8 mm-animate-float">
            <span className="w-2 h-2 rounded-full bg-[var(--mm-sage)] animate-pulse"></span>
            <span className="text-sm font-medium tracking-wide text-[#4A3B32]/80">A student-run mental wellness center</span>
          </div>

          <h1 className="mm-font-display font-medium text-4xl md:text-6xl lg:text-7xl leading-[1.15] text-[#4A3B32] mb-8">
            <span className="block mb-2">You <span className="italic text-[#759263]">Matter.</span></span>
            <span className="block mb-2">We <span className="italic text-[#DBB05F]">Matter.</span></span>
            <span className="block">Your Mind <span className="italic text-[#C86B43]">Matters.</span></span>
          </h1>

          <p className="text-lg md:text-xl text-[#4A3B32]/70 max-w-xl mx-auto font-light leading-relaxed mb-12">
            A safe space to learn, create, connect, and grow. Because no matter what you're facing, you are not alone.
          </p>

          <button className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#C86B43] text-white rounded-full font-medium overflow-hidden transition-all hover:shadow-[0_8px_30px_rgba(200,107,67,0.3)] hover:-translate-y-1">
            <span className="relative z-10">Begin Check-in</span>
            <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          </button>
        </div>

        {/* Categories Grid */}
        <div className="w-full mt-24 md:mt-32">
          <div className="flex items-center justify-between mb-8 px-2 md:px-6">
            <h2 className="mm-font-display text-2xl md:text-3xl font-medium text-[#4A3B32]">Explore your journey</h2>
            <div className="h-[1px] flex-1 mx-6 bg-gradient-to-r from-[#E3D6C5] to-transparent hidden md:block"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 px-2 md:px-0">
            {categories.map((cat, idx) => (
              <div 
                key={idx}
                className={`relative group mm-arch bg-white/60 backdrop-blur-sm border border-[#E3D6C5] p-6 md:p-8 flex flex-col items-center text-center transition-all duration-700 hover:shadow-xl hover:bg-white cursor-pointer transform hover:-translate-y-2`}
                style={{
                  transitionDelay: mounted ? `${idx * 100}ms` : '0ms',
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(20px)'
                }}
              >
                <div 
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                  style={{ backgroundColor: cat.bg }}
                >
                  {cat.icon}
                </div>
                
                <h3 className="mm-font-display italic text-2xl font-semibold mb-2" style={{ color: cat.color }}>
                  {cat.name}
                </h3>
                
                <p className="text-sm text-[#4A3B32]/60 font-medium">
                  {cat.desc}
                </p>

                <div className="absolute bottom-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center" style={{ color: cat.color }}>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
      
      {/* Footer decorative wave */}
      <div className="relative w-full h-[120px] md:h-[200px] overflow-hidden pointer-events-none opacity-40">
        <svg viewBox="0 0 1440 300" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full">
          <path d="M0,150 C240,90 480,220 720,150 C960,80 1200,200 1440,120 L1440,300 L0,300 Z" fill="var(--mm-sage)" opacity="0.4"/>
          <path d="M0,180 C200,100 400,240 600,170 C800,100 1000,220 1200,150 C1350,100 1420,180 1440,160 L1440,300 L0,300 Z" fill="var(--mm-sage)" opacity="0.6"/>
        </svg>
      </div>

    </div>
  );
}
