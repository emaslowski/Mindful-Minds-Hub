import { Link } from "wouter";
import { WaveFooter } from "@/components/WaveFooter";

export default function Learn() {
  const activities = [
    {
      name: "Breathing Exercises",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12">
          <path d="M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0M4.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5" />
          <path d="M12 4.5v-2" strokeDasharray="2 2" />
          <path d="M12 21.5v-2" strokeDasharray="2 2" />
          <path d="M4.5 12h-2" strokeDasharray="2 2" />
          <path d="M21.5 12h-2" strokeDasharray="2 2" />
        </svg>
      ),
      path: "/learn/breathing-exercises",
      color: "bg-sage/20 text-sage", 
      shadowColor: "rgba(104,138,82,0.15)",
      blobRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
    },
    {
      name: "Grounding Techniques",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12">
          <path d="M4 19 L20 19" strokeLinecap="round" />
          <path d="M12 4 L6 16 L18 16 Z" strokeLinejoin="round" />
        </svg>
      ),
      path: "/learn/grounding-techniques",
      color: "bg-dusty-rose/20 text-dusty-rose",
      shadowColor: "rgba(201,160,168,0.15)",
      blobRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
    },
    {
      name: "Positive Affirmations",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ),
      path: "/learn/positive-affirmations",
      color: "bg-amber/20 text-amber",
      shadowColor: "rgba(212,164,76,0.15)",
      blobRadius: "50% 50% 20% 80% / 25% 80% 20% 75%",
    },
    {
      name: "Mindfulness Activities",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12">
          <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      path: "/learn/mindfulness-activities",
      color: "bg-terracotta/15 text-terracotta",
      shadowColor: "rgba(196,98,45,0.15)",
      blobRadius: "70% 30% 50% 50% / 30% 30% 70% 70%",
    },
    {
      name: "Gratitude Challenges",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      ),
      path: "/learn/gratitude-challenges",
      color: "bg-amber/15 text-amber",
      shadowColor: "rgba(212,164,76,0.15)",
      isWide: true,
    },
    {
      name: "Calm Down Corner",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
      ),
      path: "/learn/calm-down-corner",
      color: "bg-sage/15 text-sage",
      shadowColor: "rgba(104,138,82,0.15)",
      isWide: true,
    },
  ];

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative overflow-hidden">
      
      {/* Decorative leaf branch left */}
      <div className="absolute top-24 -left-16 opacity-30 pointer-events-none transform -rotate-12">
        <svg width="150" height="200" viewBox="0 0 150 200" fill="none">
           <path d="M80 200 Q100 100 150 0" stroke="#688A52" strokeWidth="2" fill="none"/>
           <path d="M90 150 Q60 140 40 160 Q70 180 90 150" fill="#688A52"/>
           <path d="M100 100 Q60 80 30 110 Q70 130 100 100" fill="#688A52"/>
           <path d="M120 50 Q80 30 50 60 Q90 80 120 50" fill="#688A52"/>
        </svg>
      </div>

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 mb-24 text-center z-10">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-display italic text-foreground mb-4 drop-shadow-sm">
          Activities & Strategies
        </h1>
        <p className="text-2xl md:text-3xl text-terracotta/90 font-handwritten mb-16 max-w-xl mx-auto leading-relaxed">
          Things you can try anytime, anywhere!
        </p>

        <div className="flex flex-col items-center gap-16">
          {/* Top row - 4 blob shapes */}
          <div className="flex flex-wrap justify-center gap-10 md:gap-14">
            {activities.filter(a => !a.isWide).map((activity) => (
              <Link key={activity.path} href={activity.path} className="group outline-none">
                <div 
                  className={`
                    w-48 h-48 md:w-56 md:h-56 ${activity.color}
                    flex flex-col items-center justify-center p-6
                    transition-all duration-500 hover:-translate-y-2
                  `}
                  style={{ 
                    borderRadius: activity.blobRadius,
                    boxShadow: `4px 8px 24px ${activity.shadowColor}, inset 0 0 20px rgba(255,255,255,0.5)`
                  }}
                >
                  <div className="mb-4 transition-transform duration-500 group-hover:scale-110 opacity-80">
                    {activity.icon}
                  </div>
                  <span className="font-display italic text-xl md:text-2xl leading-tight text-foreground text-center px-4 font-medium">
                    {activity.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom row - 2 rounded rectangles */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 w-full max-w-4xl">
            {activities.filter(a => a.isWide).map((activity) => (
              <Link key={activity.path} href={activity.path} className="group outline-none flex-1 min-w-[280px]">
                <div 
                  className={`
                    ${activity.color} rounded-[2rem] h-32 md:h-36 w-full
                    flex flex-row items-center justify-center gap-6 p-8
                    transition-all duration-500 hover:-translate-y-2
                  `}
                  style={{
                    boxShadow: `4px 8px 24px ${activity.shadowColor}, inset 0 0 20px rgba(255,255,255,0.5)`
                  }}
                >
                  <div className="transition-transform duration-500 group-hover:rotate-12 opacity-80">
                    {activity.icon}
                  </div>
                  <span className="font-display italic text-2xl md:text-3xl leading-tight text-foreground text-left font-medium">
                    {activity.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      <WaveFooter quote="Even small steps move you forward." />
    </div>
  );
}
