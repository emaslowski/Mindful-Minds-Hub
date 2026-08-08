import { Link } from "wouter";
import { WaveFooter } from "@/components/WaveFooter";
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
      title: "Collaboration Board", 
      subtitle: "Share & Connect",
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

      <WaveFooter quote="Your thoughts matter. You matter." />
    </div>
  );
}
