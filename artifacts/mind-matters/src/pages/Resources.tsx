import { WaveFooter } from "@/components/WaveFooter";
import { Phone, MessageSquare, HeartHandshake, Info, ShieldAlert } from "lucide-react";

export default function Resources() {
  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative">

      {/* Olive/laurel branch — top left */}
      <div className="absolute top-4 left-2 md:left-10 pointer-events-none opacity-25 -rotate-6">
        <svg width="140" height="120" viewBox="0 0 140 120" fill="none">
          <path d="M10 110 Q40 75 70 50 Q100 25 130 10" stroke="#688A52" strokeWidth="2.5" strokeLinecap="round"/>
          <ellipse cx="30" cy="88" rx="14" ry="7" fill="#688A52" opacity="0.6" transform="rotate(-35 30 88)"/>
          <ellipse cx="48" cy="72" rx="14" ry="7" fill="#688A52" opacity="0.6" transform="rotate(-40 48 72)"/>
          <ellipse cx="65" cy="56" rx="13" ry="6.5" fill="#688A52" opacity="0.6" transform="rotate(-42 65 56)"/>
          <ellipse cx="83" cy="40" rx="13" ry="6" fill="#688A52" opacity="0.6" transform="rotate(-45 83 40)"/>
          <ellipse cx="100" cy="26" rx="12" ry="6" fill="#688A52" opacity="0.6" transform="rotate(-48 100 26)"/>
          <ellipse cx="118" cy="14" rx="11" ry="5.5" fill="#688A52" opacity="0.6" transform="rotate(-50 118 14)"/>
          {/* Berries */}
          <circle cx="36" cy="82" r="3.5" fill="#C4622D" opacity="0.7"/>
          <circle cx="72" cy="50" r="3" fill="#C4622D" opacity="0.7"/>
          <circle cx="107" cy="22" r="2.5" fill="#C4622D" opacity="0.7"/>
        </svg>
      </div>

      {/* Botanical leaf spray — bottom right */}
      <div className="absolute bottom-32 right-2 md:right-10 pointer-events-none opacity-20 rotate-6">
        <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
          <path d="M60 140 Q60 90 60 20" stroke="#688A52" strokeWidth="2" strokeLinecap="round"/>
          <path d="M60 110 Q35 90 18 75" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M60 85 Q38 68 25 50" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M60 60 Q42 45 35 28" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M60 100 Q84 82 100 68" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M60 76 Q83 60 98 44" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M60 52 Q80 37 92 22" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <ellipse cx="19" cy="75" rx="11" ry="5" fill="#688A52" opacity="0.5" transform="rotate(-40 19 75)"/>
          <ellipse cx="26" cy="50" rx="10" ry="5" fill="#688A52" opacity="0.5" transform="rotate(-35 26 50)"/>
          <ellipse cx="99" cy="68" rx="11" ry="5" fill="#688A52" opacity="0.5" transform="rotate(38 99 68)"/>
          <ellipse cx="97" cy="44" rx="10" ry="5" fill="#688A52" opacity="0.5" transform="rotate(32 97 44)"/>
        </svg>
      </div>

      {/* Heart cluster — top right */}
      <div className="absolute top-8 right-6 md:right-16 pointer-events-none opacity-20">
        <svg width="90" height="80" viewBox="0 0 90 80" fill="none">
          <path d="M25 20 Q25 12 33 12 Q41 12 41 20 Q41 28 25 38 Q9 28 9 20 Q9 12 17 12 Q25 12 25 20Z" fill="#C4829A"/>
          <path d="M65 35 Q65 29 71 29 Q77 29 77 35 Q77 41 65 49 Q53 41 53 35 Q53 29 59 29 Q65 29 65 35Z" fill="#C4622D" opacity="0.7"/>
          <path d="M45 60 Q45 56 48 56 Q51 56 51 60 Q51 64 45 68 Q39 64 39 60 Q39 56 42 56 Q45 56 45 60Z" fill="#D4A44C" opacity="0.7"/>
        </svg>
      </div>

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 mb-24 z-10">
        
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-display italic text-foreground mb-6 drop-shadow-sm">
            Resources & Help
          </h1>
          <h2 className="text-3xl md:text-5xl font-sans font-bold text-terracotta tracking-wide uppercase">
            You are not alone. Help is always available.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Student Section - High Priority */}
          <div className="flex flex-col gap-6">
            <div className="bg-amber/30 rounded-[3rem] p-8 md:p-10 border-2 border-amber/40 shadow-sm relative overflow-hidden">
              <div className="absolute -right-10 -top-10 text-amber/20 opacity-50">
                <ShieldAlert size={200} />
              </div>
              
              <h3 className="font-display italic text-4xl text-foreground mb-6 flex items-center gap-3 relative z-10">
                Need help right now?
              </h3>
              
              <div className="space-y-4 relative z-10">
                <a href="tel:988" className="flex items-center gap-4 bg-white/60 hover:bg-white p-4 rounded-2xl transition-colors group">
                  <div className="bg-terracotta text-white p-3 rounded-full group-hover:scale-110 transition-transform">
                    <Phone size={24} />
                  </div>
                  <div>
                    <div className="font-sans font-bold text-lg text-foreground">988 Suicide & Crisis Lifeline</div>
                    <div className="font-sans text-sm text-foreground/70">Call or text 988</div>
                  </div>
                </a>

                <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl">
                  <div className="bg-sage text-white p-3 rounded-full">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <div className="font-sans font-bold text-lg text-foreground">Crisis Text Line</div>
                    <div className="font-sans text-sm text-foreground/70">Text HOME to 741741</div>
                  </div>
                </div>

                <a href="tel:1-800-950-NAMI" className="flex items-center gap-4 bg-white/60 hover:bg-white p-4 rounded-2xl transition-colors group">
                  <div className="bg-dusty-rose text-white p-3 rounded-full group-hover:scale-110 transition-transform">
                    <HeartHandshake size={24} />
                  </div>
                  <div>
                    <div className="font-sans font-bold text-lg text-foreground">NAMI</div>
                    <div className="font-sans text-sm text-foreground/70">1-800-950-NAMI</div>
                  </div>
                </a>
                
                <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl border border-terracotta/30">
                  <div className="bg-white text-terracotta p-3 rounded-full border-2 border-terracotta">
                    <Info size={24} />
                  </div>
                  <div>
                    <div className="font-sans font-bold text-lg text-foreground">School Counselor</div>
                    <div className="font-sans text-sm text-foreground/70">Reach out via email or stop by the office</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl">
                  <div className="bg-foreground/80 text-white p-3 rounded-full">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <div className="font-sans font-bold text-lg text-foreground">Safe2Help</div>
                    <div className="font-sans text-sm text-foreground/70">Anonymous tip line</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Parent/Guardian Section */}
          <div className="flex flex-col gap-6">
            <div className="bg-sage/10 rounded-[3rem] p-8 md:p-10 border border-sage/20 shadow-sm h-full">
              <h3 className="font-display italic text-4xl text-foreground mb-6 flex items-center gap-3">
                For Parents & Guardians
              </h3>
              <p className="text-foreground/70 font-sans mb-8">
                Resources and guides for supporting your student's mental wellness journey.
              </p>
              
              <div className="space-y-4">
                <a href="#" className="block bg-white/50 hover:bg-white/80 p-5 rounded-2xl transition-colors border border-black/5">
                  <div className="font-sans font-bold text-lg text-foreground mb-1">How to talk to your child</div>
                  <div className="font-sans text-sm text-foreground/70">Tips for opening up conversations about mental health</div>
                </a>
                <a href="#" className="block bg-white/50 hover:bg-white/80 p-5 rounded-2xl transition-colors border border-black/5">
                  <div className="font-sans font-bold text-lg text-foreground mb-1">Warning signs to watch for</div>
                  <div className="font-sans text-sm text-foreground/70">Understanding what's normal stress vs what needs help</div>
                </a>
                <a href="#" className="block bg-white/50 hover:bg-white/80 p-5 rounded-2xl transition-colors border border-black/5">
                  <div className="font-sans font-bold text-lg text-foreground mb-1">Support Organizations</div>
                  <div className="font-sans text-sm text-foreground/70">Local and national groups offering family support</div>
                </a>
                <a href="#" className="block bg-white/50 hover:bg-white/80 p-5 rounded-2xl transition-colors border border-black/5">
                  <div className="font-sans font-bold text-lg text-terracotta mb-1">Contact the School Counselor</div>
                  <div className="font-sans text-sm text-foreground/70">Partner with us to support your student</div>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <WaveFooter quote="It's okay to ask for help." />
    </div>
  );
}
