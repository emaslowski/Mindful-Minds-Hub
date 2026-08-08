import { useState } from "react";
import { Link } from "wouter";
import { WaveFooter } from "@/components/WaveFooter";

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
    <div className="w-full flex flex-col flex-1 pt-12 relative overflow-hidden">
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
      </div>

      <WaveFooter quote="Move your body. Boost your mind." />
    </div>
  );
}
