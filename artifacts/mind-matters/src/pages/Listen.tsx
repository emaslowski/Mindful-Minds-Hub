import { Link } from "wouter";
import { WaveFooter } from "@/components/WaveFooter";
import { Mic, Headphones, Leaf, Activity } from "lucide-react";

export default function Listen() {
  const tabs = [
    { label: "Calm Music", path: "/listen/calm-music", icon: <Headphones size={18} /> },
    { label: "Focus Sounds", path: "/listen/focus-sounds", icon: <Activity size={18} /> },
    { label: "Meditations", path: "/listen/meditations", icon: <Leaf size={18} /> },
    { label: "Nature Sounds", path: "/listen/nature-sounds", icon: <Leaf size={18} /> }, // Replace Leaf with better if needed
  ];

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative overflow-hidden">
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 mb-24 text-center relative z-10">
        
        <h1 className="text-6xl md:text-8xl font-display italic text-foreground mb-4 drop-shadow-sm">
          Listen
        </h1>
        <p className="text-2xl md:text-3xl text-sage font-handwritten mb-12">
          Tune in to tune out...
        </p>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-16 px-4">
          {tabs.map((tab) => (
            <Link key={tab.path} href={tab.path}>
              <button className="flex items-center gap-2 px-6 py-2 rounded-full font-sans font-bold text-sm md:text-base transition-all duration-300 outline-none bg-card text-foreground hover:bg-sage/10 border border-card-border shadow-sm">
                {tab.icon}
                {tab.label}
              </button>
            </Link>
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Podcast Card (Large) */}
          <div className="md:col-span-2 bg-gradient-to-br from-terracotta/20 to-amber/20 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between border border-white/40 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-left mb-6 md:mb-0 md:mr-8 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-terracotta/20 rounded-full text-terracotta">
                  <Mic size={32} />
                </div>
                <h2 className="text-3xl md:text-5xl font-display italic text-foreground">
                  Mind Matters Podcast
                </h2>
              </div>
              <p className="text-lg font-sans text-foreground/80 mt-4 max-w-lg leading-relaxed">
                Join our student podcasters as they talk about life, stress, and everything in between. Real conversations for middle schoolers, by middle schoolers.
              </p>
              <Link href="/listen/podcast">
                <button className="mt-8 bg-terracotta hover:bg-terracotta/90 text-white px-8 py-3 rounded-full font-sans font-bold text-lg tracking-wide transition-colors inline-block">
                  Listen to Episodes
                </button>
              </Link>
            </div>
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-[2rem] bg-terracotta/10 flex flex-col items-center justify-center border-2 border-terracotta/20 shrink-0 relative overflow-hidden transform rotate-2">
               <svg viewBox="0 0 100 100" fill="none" className="absolute inset-0 opacity-10">
                 <circle cx="50" cy="50" r="40" stroke="#C4622D" strokeWidth="2" strokeDasharray="5 5"/>
                 <circle cx="50" cy="50" r="30" stroke="#C4622D" strokeWidth="2" strokeDasharray="5 5"/>
               </svg>
               <Mic size={64} className="text-terracotta opacity-80" />
            </div>
          </div>

          {/* Guided Meditations Card */}
          <div className="bg-gradient-to-br from-sage/20 to-dusty-rose/20 rounded-[3rem] p-8 flex flex-col items-center text-center border border-white/40 shadow-sm hover:shadow-md transition-shadow group">
             <div className="p-6 bg-white/30 rounded-full text-sage mb-6 transform group-hover:scale-110 transition-transform">
               <Leaf size={48} />
             </div>
             <h3 className="text-3xl font-display italic text-foreground mb-3">Guided Meditations</h3>
             <p className="text-foreground/70 font-sans mb-8 px-4 flex-1">
               Take a few minutes to breathe and recenter with these short, guided tracks.
             </p>
             <Link href="/listen/meditations">
               <button className="border-2 border-sage text-sage hover:bg-sage hover:text-white px-8 py-2.5 rounded-full font-sans font-bold uppercase tracking-wider text-sm transition-colors w-full">
                 Listen
               </button>
             </Link>
          </div>

          {/* Focus & Study Card */}
          <div className="bg-gradient-to-br from-amber/20 to-terracotta/10 rounded-[3rem] p-8 flex flex-col items-center text-center border border-white/40 shadow-sm hover:shadow-md transition-shadow group">
             <div className="p-6 bg-white/30 rounded-full text-amber mb-6 transform group-hover:scale-110 transition-transform">
               <Headphones size={48} />
             </div>
             <h3 className="text-3xl font-display italic text-foreground mb-3">Focus & Study</h3>
             <p className="text-foreground/70 font-sans mb-8 px-4 flex-1">
               Lo-fi beats and focus sounds to help you power through your homework.
             </p>
             <Link href="/listen/focus-sounds">
               <button className="border-2 border-amber text-amber-foreground hover:bg-amber hover:text-white px-8 py-2.5 rounded-full font-sans font-bold uppercase tracking-wider text-sm transition-colors w-full">
                 Listen
               </button>
             </Link>
          </div>
        </div>
      </div>

      <WaveFooter quote="Press play. Take a breath. You've got this." />
    </div>
  );
}
