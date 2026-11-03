import { Link } from "wouter";
import { WaveFooter } from "@/components/WaveFooter";
import { PublishedSection } from "@/components/PublishedSection";
import { Lock, BookOpen, Users, Heart } from "lucide-react";

export default function Grow() {
  const cards = [
    { 
      title: "Today's Prompt", 
      subtitle: "Personal Journal",
      icon: <BookOpen size={48} />,
      path: "/grow/journal", 
      colors: "from-amber/20 to-terracotta/10",
      requiresAuth: true
    },
    { 
      title: "Brightside Advice Column",
      subtitle: "Kind, teacher-approved discussions",
      icon: <Users size={48} />,
      path: "/grow/collab", 
      colors: "from-terracotta/20 to-sage/20",
      requiresAuth: false
    },
    { 
      title: "Gratitude Journal", 
      subtitle: "Focus on the good",
      icon: <Heart size={48} />,
      path: "/grow/gratitude", 
      colors: "from-sage/20 to-dusty-rose/20",
      requiresAuth: true
    },
  ];

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative">

      {/* Crescent moon + stars — top right */}
      <div className="absolute top-6 right-6 md:right-16 pointer-events-none opacity-30">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <path d="M75 25 Q95 45 85 70 Q70 90 45 85 Q65 80 70 60 Q78 40 65 22 Q70 20 75 25Z" fill="#D4A44C"/>
          <circle cx="25" cy="30" r="3" fill="#D4A44C"/>
          <circle cx="15" cy="50" r="2" fill="#D4A44C"/>
          <circle cx="40" cy="12" r="2.5" fill="#D4A44C"/>
          <path d="M95 10 L97 16 L103 18 L97 20 L95 26 L93 20 L87 18 L93 16Z" fill="#D4A44C"/>
          <path d="M108 40 L109.5 44.5 L114 46 L109.5 47.5 L108 52 L106.5 47.5 L102 46 L106.5 44.5Z" fill="#C4622D" opacity="0.6"/>
        </svg>
      </div>

      {/* Fern branch — bottom left */}
      <div className="absolute bottom-32 left-2 md:left-8 pointer-events-none opacity-25 -rotate-12">
        <svg width="130" height="160" viewBox="0 0 130 160" fill="none">
          <path d="M65 160 Q65 80 65 20" stroke="#688A52" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Left fronds */}
          <path d="M65 130 Q40 110 25 95" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M65 110 Q42 95 30 78" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M65 90 Q45 75 35 58" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M65 70 Q48 55 42 38" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          {/* Right fronds */}
          <path d="M65 120 Q88 102 100 88" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M65 100 Q87 87 98 72" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M65 80 Q85 68 95 52" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M65 60 Q82 48 90 34" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          {/* Leaf fills */}
          <ellipse cx="27" cy="95" rx="8" ry="4" fill="#688A52" opacity="0.5" transform="rotate(-30 27 95)"/>
          <ellipse cx="31" cy="78" rx="8" ry="4" fill="#688A52" opacity="0.5" transform="rotate(-25 31 78)"/>
          <ellipse cx="36" cy="58" rx="7" ry="3.5" fill="#688A52" opacity="0.5" transform="rotate(-20 36 58)"/>
          <ellipse cx="99" cy="88" rx="8" ry="4" fill="#688A52" opacity="0.5" transform="rotate(30 99 88)"/>
          <ellipse cx="97" cy="72" rx="8" ry="4" fill="#688A52" opacity="0.5" transform="rotate(25 97 72)"/>
          <ellipse cx="94" cy="52" rx="7" ry="3.5" fill="#688A52" opacity="0.5" transform="rotate(20 94 52)"/>
        </svg>
      </div>

      {/* Mushroom — mid left */}
      <div className="absolute top-64 left-4 md:left-12 pointer-events-none opacity-20">
        <svg width="60" height="70" viewBox="0 0 60 70" fill="none">
          <path d="M30 35 Q10 35 8 22 Q10 5 30 5 Q50 5 52 22 Q50 35 30 35Z" fill="#C4622D"/>
          <circle cx="20" cy="18" r="4" fill="white" opacity="0.6"/>
          <circle cx="35" cy="13" r="3" fill="white" opacity="0.6"/>
          <circle cx="38" cy="24" r="2.5" fill="white" opacity="0.6"/>
          <rect x="24" y="35" width="12" height="25" rx="4" fill="#FAF3E3"/>
          <path d="M20 50 Q30 55 40 50" stroke="#D4A44C" strokeWidth="1" fill="none"/>
          <path d="M22 44 Q30 48 38 44" stroke="#D4A44C" strokeWidth="1" fill="none"/>
        </svg>
      </div>

      {/* Scattered sparkles — top left */}
      <div className="absolute top-16 left-8 md:left-24 pointer-events-none opacity-25">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <path d="M20 10 L22 18 L30 20 L22 22 L20 30 L18 22 L10 20 L18 18Z" fill="#C4829A"/>
          <path d="M60 45 L61.5 50 L66 51.5 L61.5 53 L60 58 L58.5 53 L54 51.5 L58.5 50Z" fill="#D4A44C"/>
          <circle cx="45" cy="15" r="3" fill="#688A52"/>
          <circle cx="10" cy="55" r="2" fill="#C4622D"/>
          <circle cx="70" cy="20" r="2.5" fill="#C4829A"/>
        </svg>
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 mb-24 text-center relative z-10">
        
        <h1 className="text-6xl md:text-8xl font-display italic text-foreground mb-4 drop-shadow-sm">
          Grow
        </h1>
        <p className="text-2xl md:text-3xl text-sage font-handwritten mb-20">
          Personal growth starts here...
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {cards.map((card) => (
            <Link key={card.path} href={card.path} className="outline-none block h-full">
              <div className={`h-full bg-gradient-to-br ${card.colors} rounded-[3rem] flex flex-col items-center justify-center p-10 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-xl group border border-white/40 relative overflow-hidden`}>
                
                {card.requiresAuth && (
                  <div className="absolute top-6 right-6 text-foreground/40 bg-white/40 p-2 rounded-full" title="Requires login">
                    <Lock size={16} />
                  </div>
                )}
                
                <div className="text-foreground/80 mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:text-foreground bg-white/40 p-6 rounded-full">
                  {card.icon}
                </div>
                
                <h3 className="font-display italic text-3xl md:text-4xl text-foreground text-center leading-tight mb-2">
                  {card.title}
                </h3>
                <span className="font-sans text-sm font-bold uppercase tracking-widest text-foreground/60">
                  {card.subtitle}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <PublishedSection section="grow" heading="Student Journaling & Growth" className="mb-12" />
      <WaveFooter quote="Your thoughts matter. You matter." />
    </div>
  );
}
