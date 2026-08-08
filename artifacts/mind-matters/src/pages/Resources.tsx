import { WaveFooter } from "@/components/WaveFooter";
import { Phone, MessageSquare, HeartHandshake, Info, ShieldAlert } from "lucide-react";

export default function Resources() {
  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative overflow-hidden">
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
