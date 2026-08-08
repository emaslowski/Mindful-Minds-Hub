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
    <div className="w-full flex flex-col flex-1 pt-12 relative">

      {/* Feather — top left */}
      <div className="absolute top-6 left-4 md:left-14 pointer-events-none opacity-25 -rotate-12">
        <svg width="80" height="140" viewBox="0 0 80 140" fill="none">
          <path d="M40 135 Q38 90 30 50 Q20 20 10 5" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M10 5 Q30 25 45 55 Q58 82 40 135" fill="#688A52" opacity="0.35"/>
          <path d="M40 135 Q42 90 50 50 Q60 20 70 5" stroke="#688A52" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
          {/* Barbs */}
          <path d="M15 30 Q28 32 38 100" stroke="#688A52" strokeWidth="0.8" opacity="0.4"/>
          <path d="M22 18 Q33 22 39 110" stroke="#688A52" strokeWidth="0.8" opacity="0.4"/>
          <path d="M55 22 Q46 28 41 105" stroke="#688A52" strokeWidth="0.8" opacity="0.4"/>
          <path d="M62 34 Q50 38 42 95" stroke="#688A52" strokeWidth="0.8" opacity="0.4"/>
        </svg>
      </div>

      {/* Music notes — top right */}
      <div className="absolute top-4 right-4 md:right-14 pointer-events-none opacity-25">
        <svg width="120" height="110" viewBox="0 0 120 110" fill="none">
          {/* Note 1 */}
          <ellipse cx="22" cy="75" rx="10" ry="7" fill="#C4622D" transform="rotate(-15 22 75)"/>
          <line x1="32" y1="72" x2="32" y2="35" stroke="#C4622D" strokeWidth="2.5"/>
          <path d="M32 35 L70 25 L70 35 L32 45Z" fill="#C4622D"/>
          {/* Note 2 */}
          <ellipse cx="80" cy="85" rx="10" ry="7" fill="#D4A44C" transform="rotate(-15 80 85)"/>
          <line x1="90" y1="82" x2="90" y2="45" stroke="#D4A44C" strokeWidth="2.5"/>
          {/* Stars/dots */}
          <circle cx="15" cy="30" r="3" fill="#C4829A"/>
          <circle cx="50" cy="15" r="2.5" fill="#688A52"/>
          <circle cx="105" cy="25" r="2" fill="#C4622D"/>
          <path d="M100 55 L101.5 60 L107 61.5 L101.5 63 L100 68 L98.5 63 L93 61.5 L98.5 60Z" fill="#D4A44C" opacity="0.7"/>
        </svg>
      </div>

      {/* Sound wave rings — bottom left */}
      <div className="absolute bottom-32 left-2 md:left-10 pointer-events-none opacity-15">
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          <circle cx="55" cy="55" r="50" stroke="#C4622D" strokeWidth="1.5" strokeDasharray="4 4" fill="none"/>
          <circle cx="55" cy="55" r="36" stroke="#688A52" strokeWidth="1.5" strokeDasharray="4 4" fill="none"/>
          <circle cx="55" cy="55" r="22" stroke="#D4A44C" strokeWidth="1.5" strokeDasharray="4 4" fill="none"/>
          <circle cx="55" cy="55" r="9" fill="#C4829A" opacity="0.5"/>
        </svg>
      </div>

      {/* Botanical sprigs — bottom right */}
      <div className="absolute bottom-28 right-4 md:right-12 pointer-events-none opacity-20 rotate-6">
        <svg width="90" height="100" viewBox="0 0 90 100" fill="none">
          <path d="M45 100 Q45 60 45 10" stroke="#688A52" strokeWidth="2" strokeLinecap="round"/>
          <path d="M45 75 Q22 58 12 40" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M45 50 Q68 35 78 18" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <ellipse cx="13" cy="40" rx="10" ry="5" fill="#688A52" opacity="0.5" transform="rotate(-30 13 40)"/>
          <ellipse cx="77" cy="18" rx="10" ry="5" fill="#688A52" opacity="0.5" transform="rotate(28 77 18)"/>
          <circle cx="45" cy="10" r="7" fill="#C4829A" opacity="0.5"/>
          <circle cx="45" cy="10" r="3.5" fill="#D4A44C"/>
        </svg>
      </div>

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
