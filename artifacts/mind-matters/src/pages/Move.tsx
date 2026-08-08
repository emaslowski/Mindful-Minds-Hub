import { useState } from "react";
import { Link } from "wouter";
import { WaveFooter } from "@/components/WaveFooter";
import { useGetPublishedContent } from "@workspace/api-client-react";
import { Star } from "lucide-react";

const MOVE_COLORS = [
  "from-terracotta/20 to-amber/20",
  "from-sage/20 to-dusty-rose/20",
  "from-amber/20 to-sage/20",
  "from-dusty-rose/20 to-terracotta/20",
];

function PublishedMovementSection() {
  const { data, isLoading } = useGetPublishedContent({ section: "move" });
  const items = data?.publications ?? [];

  if (isLoading || items.length === 0) return null;

  return (
    <div className="mt-16 w-full">
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="h-px flex-1 bg-sage/20 max-w-[120px]"></div>
        <h2 className="font-display italic text-2xl text-foreground">From Our Students</h2>
        <div className="h-px flex-1 bg-sage/20 max-w-[120px]"></div>
      </div>
      <div className="flex flex-wrap justify-center gap-8 px-4">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`bg-gradient-to-br ${MOVE_COLORS[idx % MOVE_COLORS.length]} rounded-[3rem] w-64 p-8 flex flex-col items-start border border-white/30 backdrop-blur-sm shadow-sm`}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Star size={12} className="text-amber fill-amber" />
              <span className="font-sans text-xs font-bold text-amber uppercase tracking-widest">
                Student Activity
              </span>
            </div>
            <h3 className="font-display italic font-semibold text-2xl text-foreground mb-3 leading-tight">
              {item.title}
            </h3>
            {item.content && (
              <p className="font-sans text-sm text-foreground/70 leading-relaxed line-clamp-4">
                {item.content}
              </p>
            )}
            <span className="mt-4 font-sans text-xs text-foreground/50">{item.authorDisplay}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Move() {
  const [filter, setFilter] = useState<string>("All");

  const categories = ["Workouts", "Stretch Breaks", "Sports Skills", "Active Challenges"];
  
  const exercises = [
    {
      id: 1,
      title: "Morning Stretch",
      subtitle: "5 min",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16">
          <circle cx="12" cy="5" r="2" />
          <path d="M12 9v7M8 11h8M8 20v-4h8v4" />
        </svg>
      ),
      category: "Workouts",
      path: "/move/morning-stretch",
      colors: "from-terracotta/20 to-amber/20"
    },
    {
      id: 2,
      title: "Soccer Skills",
      subtitle: "Learn & Play",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2v20M2 12h20M12 12l7.07-7.07M12 12L4.93 4.93M12 12l7.07 7.07M12 12l-7.07 7.07" />
        </svg>
      ),
      category: "Sports Skills",
      path: "/move/soccer-skills",
      colors: "from-sage/20 to-dusty-rose/20"
    },
    {
      id: 3,
      title: "Basketball Drills",
      subtitle: "Improve your game",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16">
          <circle cx="12" cy="12" r="10" />
          <path d="M5.636 5.636a9 9 0 0 1 12.728 12.728M2 12h20M12 2v20" />
        </svg>
      ),
      category: "Sports Skills",
      path: "/move/basketball-drills",
      colors: "from-amber/20 to-sage/20"
    },
    {
      id: 4,
      title: "Yoga for Calm",
      subtitle: "Relax & Reset",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16">
          <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <path d="M9 9h.01M15 9h.01" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      category: "Workouts",
      path: "/move/yoga-for-calm",
      colors: "from-dusty-rose/20 to-terracotta/20"
    },
    {
      id: 5,
      title: "Stretch Break",
      subtitle: "Mid-day boost",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16">
          <circle cx="12" cy="6" r="3" />
          <path d="M12 18v-9M8 12l4-3 4 3M8 22l4-4 4 4" />
        </svg>
      ),
      category: "Stretch Breaks",
      path: "/move/stretch-break",
      colors: "from-terracotta/20 to-dusty-rose/20"
    },
    {
      id: 6,
      title: "Active Challenge",
      subtitle: "Push yourself",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
      category: "Active Challenges",
      path: "/move/active-challenge",
      colors: "from-amber/20 to-terracotta/20"
    }
  ];

  const filteredExercises = filter === "All" 
    ? exercises 
    : exercises.filter(ex => ex.category === filter);

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative">

      {/* Sun rays — top left */}
      <div className="absolute top-2 left-2 md:left-10 pointer-events-none opacity-20">
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          <circle cx="55" cy="55" r="22" fill="#D4A44C"/>
          <circle cx="55" cy="55" r="15" fill="#FAF3E3" opacity="0.5"/>
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 55 + 26 * Math.cos(rad);
            const y1 = 55 + 26 * Math.sin(rad);
            const x2 = 55 + 48 * Math.cos(rad);
            const y2 = 55 + 48 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#D4A44C" strokeWidth={i % 2 === 0 ? 3 : 1.5} strokeLinecap="round"/>;
          })}
        </svg>
      </div>

      {/* Botanical stems — top right */}
      <div className="absolute top-4 right-4 md:right-12 pointer-events-none opacity-22 -rotate-6">
        <svg width="100" height="120" viewBox="0 0 100 120" fill="none">
          <path d="M50 120 Q50 70 50 10" stroke="#688A52" strokeWidth="2" strokeLinecap="round"/>
          <path d="M50 90 Q27 72 15 54" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M50 62 Q73 46 85 28" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M50 38 Q30 24 22 8" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <ellipse cx="15" cy="54" rx="11" ry="5" fill="#688A52" opacity="0.5" transform="rotate(-30 15 54)"/>
          <ellipse cx="84" cy="28" rx="11" ry="5" fill="#688A52" opacity="0.5" transform="rotate(28 84 28)"/>
          <ellipse cx="22" cy="8" rx="9" ry="4" fill="#688A52" opacity="0.5" transform="rotate(-36 22 8)"/>
          <circle cx="50" cy="10" r="8" fill="#C4622D" opacity="0.4"/>
          <circle cx="50" cy="10" r="4" fill="#D4A44C"/>
        </svg>
      </div>

      {/* Sparkle stars — bottom right */}
      <div className="absolute bottom-32 right-4 md:right-14 pointer-events-none opacity-22">
        <svg width="80" height="90" viewBox="0 0 80 90" fill="none">
          <path d="M20 15 L22 23 L30 25 L22 27 L20 35 L18 27 L10 25 L18 23Z" fill="#C4829A"/>
          <path d="M60 55 L61.5 60.5 L67 62 L61.5 63.5 L60 69 L58.5 63.5 L53 62 L58.5 60.5Z" fill="#D4A44C"/>
          <circle cx="55" cy="18" r="4" fill="#688A52" opacity="0.6"/>
          <circle cx="15" cy="62" r="3" fill="#C4622D" opacity="0.5"/>
          <circle cx="68" cy="32" r="2.5" fill="#C4829A"/>
          <circle cx="35" cy="78" r="2" fill="#D4A44C"/>
        </svg>
      </div>

      {/* Bottom left leaf cluster */}
      <div className="absolute bottom-36 left-2 md:left-8 pointer-events-none opacity-20 rotate-6">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <path d="M40 80 Q40 50 40 10" stroke="#688A52" strokeWidth="2" strokeLinecap="round"/>
          <path d="M40 60 Q20 44 12 30" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M40 40 Q60 26 68 12" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <ellipse cx="13" cy="30" rx="10" ry="5" fill="#688A52" opacity="0.5" transform="rotate(-30 13 30)"/>
          <ellipse cx="67" cy="12" rx="10" ry="5" fill="#688A52" opacity="0.5" transform="rotate(28 67 12)"/>
        </svg>
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 mb-24 text-center relative z-10">
        
        {/* Decorative elements */}
        <div className="absolute top-12 left-0 md:left-20 opacity-30 -z-10 pointer-events-none transform -rotate-12">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="#C4622D" strokeWidth="2">
            <circle cx="50" cy="50" r="40" strokeDasharray="8 8"/>
            <path d="M50 20 L50 80 M20 50 L80 50" opacity="0.5"/>
          </svg>
        </div>

        <h1 className="text-6xl md:text-8xl font-display italic text-foreground mb-4 drop-shadow-sm">
          Exercise Center
        </h1>
        <p className="text-xl md:text-2xl text-sage font-sans font-bold tracking-widest uppercase mb-12">
          Move your body. Boost your mind.
        </p>

        {/* Organic Pill Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-16 px-4">
          <button 
            onClick={() => setFilter("All")}
            className={`px-8 py-2 rounded-full font-sans font-medium text-lg transition-all duration-300 outline-none border border-transparent ${
              filter === "All" 
                ? "bg-sage text-white shadow-md" 
                : "bg-card text-foreground hover:bg-sage/10 border-card-border"
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-8 py-2 rounded-full font-sans font-medium text-lg transition-all duration-300 outline-none border border-transparent ${
                filter === cat 
                  ? "bg-terracotta text-white shadow-md" 
                  : "bg-card text-foreground hover:bg-terracotta/10 border-card-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Exercise Cards */}
        <div className="flex flex-wrap justify-center gap-8 px-4">
          {filteredExercises.length > 0 ? filteredExercises.map((ex) => (
            <Link key={ex.id} href={ex.path} className="outline-none">
              <div className={`bg-gradient-to-br ${ex.colors} rounded-[3rem] w-64 h-80 p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 hover:-translate-y-3 hover:shadow-xl group border border-white/30 backdrop-blur-sm relative overflow-hidden`}>
                
                {/* Background decorative ring */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>

                <div className="text-foreground mb-8 transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100">
                  {ex.icon}
                </div>
                <h3 className="font-display italic font-semibold text-2xl text-foreground mb-2 text-center leading-tight">
                  {ex.title}
                </h3>
                <span className="bg-white/40 text-foreground font-sans text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mt-auto">
                  {ex.subtitle}
                </span>
              </div>
            </Link>
          )) : (
            <div className="w-full text-center py-20 text-foreground/50 font-handwritten text-3xl">
              More activities coming soon!
            </div>
          )}
        </div>

        {/* Published student movement content */}
        <PublishedMovementSection />
      </div>

      <WaveFooter quote="Move your body. Boost your mind." />
    </div>
  );
}
