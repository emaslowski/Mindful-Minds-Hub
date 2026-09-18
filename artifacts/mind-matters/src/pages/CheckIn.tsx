import { useState, type ComponentType } from "react";
import { Link } from "wouter";
import { WaveFooter } from "@/components/WaveFooter";
import { useSubmitCheckin } from "@workspace/api-client-react";
import { SectionRecommendation } from "@workspace/api-client-react/src/generated/api.schemas";
import { CircleAlert, Frown, CloudRain, Flame, Waves, HeartCrack, Smile, Moon } from "lucide-react";

type Mood = { id: string; label: string; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; color: string };

const MOODS: Mood[] = [
  { id: "anxious", label: "Anxious", icon: CircleAlert, color: "bg-dusty-rose/20 text-foreground" },
  { id: "stressed", label: "Stressed", icon: Frown, color: "bg-terracotta/20 text-foreground" },
  { id: "sad", label: "Sad", icon: CloudRain, color: "bg-sage/20 text-foreground" },
  { id: "angry", label: "Angry", icon: Flame, color: "bg-red-500/20 text-foreground" },
  { id: "overwhelmed", label: "Overwhelmed", icon: Waves, color: "bg-amber/20 text-foreground" },
  { id: "lonely", label: "Lonely", icon: HeartCrack, color: "bg-dusty-rose/20 text-foreground" },
  { id: "happy", label: "Happy", icon: Smile, color: "bg-sage/30 text-foreground" },
  { id: "tired", label: "Tired", icon: Moon, color: "bg-amber/30 text-foreground" },
];

export default function CheckIn() {
  const { mutate, isPending } = useSubmitCheckin();
  const [result, setResult] = useState<{ message: string; recommendations: SectionRecommendation[] } | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleMoodClick = (moodId: string) => {
    setSelectedMood(moodId);
    setResult(null);
    mutate(
      { data: { mood: moodId } },
      {
        onSuccess: (data) => setResult(data),
      }
    );
  };

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative">

      {/* Lotus flower — top left */}
      <div className="absolute top-8 left-4 md:left-14 pointer-events-none opacity-25">
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          {/* Petals */}
          <ellipse cx="55" cy="70" rx="10" ry="22" fill="#C4829A" opacity="0.7"/>
          <ellipse cx="55" cy="70" rx="10" ry="22" fill="#C4829A" opacity="0.7" transform="rotate(30 55 70)"/>
          <ellipse cx="55" cy="70" rx="10" ry="22" fill="#C4829A" opacity="0.7" transform="rotate(-30 55 70)"/>
          <ellipse cx="55" cy="70" rx="10" ry="22" fill="#C4829A" opacity="0.5" transform="rotate(60 55 70)"/>
          <ellipse cx="55" cy="70" rx="10" ry="22" fill="#C4829A" opacity="0.5" transform="rotate(-60 55 70)"/>
          <ellipse cx="55" cy="70" rx="10" ry="22" fill="#C4622D" opacity="0.4" transform="rotate(90 55 70)"/>
          {/* Center */}
          <circle cx="55" cy="58" r="10" fill="#D4A44C" opacity="0.8"/>
          <circle cx="55" cy="58" r="6" fill="#FAF3E3" opacity="0.6"/>
          {/* Stem */}
          <path d="M55 80 Q50 95 48 108" stroke="#688A52" strokeWidth="2" strokeLinecap="round"/>
          {/* Leaves */}
          <path d="M48 108 Q30 95 32 80" stroke="#688A52" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <ellipse cx="32" cy="80" rx="12" ry="6" fill="#688A52" opacity="0.5" transform="rotate(-20 32 80)"/>
        </svg>
      </div>

      {/* Crescent + stars — top right */}
      <div className="absolute top-4 right-4 md:right-14 pointer-events-none opacity-25">
        <svg width="130" height="100" viewBox="0 0 130 100" fill="none">
          <path d="M90 15 Q108 30 100 55 Q88 72 65 68 Q82 62 86 45 Q93 28 80 12 Q85 10 90 15Z" fill="#D4A44C"/>
          {/* Stars */}
          <path d="M30 20 L32 27 L39 29 L32 31 L30 38 L28 31 L21 29 L28 27Z" fill="#C4829A"/>
          <path d="M15 55 L16.5 60 L22 61.5 L16.5 63 L15 68 L13.5 63 L8 61.5 L13.5 60Z" fill="#D4A44C"/>
          <circle cx="50" cy="10" r="3" fill="#C4622D" opacity="0.6"/>
          <circle cx="110" cy="75" r="2.5" fill="#688A52" opacity="0.7"/>
          <circle cx="20" cy="85" r="2" fill="#D4A44C"/>
        </svg>
      </div>

      {/* Crystal cluster — bottom right */}
      <div className="absolute bottom-36 right-4 md:right-10 pointer-events-none opacity-20 rotate-12">
        <svg width="80" height="100" viewBox="0 0 80 100" fill="none">
          <path d="M40 10 L55 40 L40 90 L25 40Z" fill="#C4829A" opacity="0.7"/>
          <path d="M40 10 L55 40 L40 90 L25 40Z" stroke="#C4829A" strokeWidth="1.5" fill="none"/>
          <path d="M55 20 L65 45 L55 85 L45 45Z" fill="#D4A44C" opacity="0.5"/>
          <path d="M25 25 L35 50 L20 80 L10 50Z" fill="#688A52" opacity="0.5"/>
          {/* Shine lines */}
          <line x1="38" y1="15" x2="35" y2="25" stroke="white" strokeWidth="1.5" opacity="0.7"/>
          <line x1="52" y1="25" x2="49" y2="33" stroke="white" strokeWidth="1" opacity="0.5"/>
        </svg>
      </div>

      {/* Small scattered dots + tiny flowers — bottom left */}
      <div className="absolute bottom-40 left-4 md:left-10 pointer-events-none opacity-20">
        <svg width="70" height="80" viewBox="0 0 70 80" fill="none">
          <circle cx="20" cy="20" r="4" fill="#C4622D"/>
          <circle cx="35" cy="12" r="3" fill="#688A52"/>
          <circle cx="50" cy="22" r="3.5" fill="#D4A44C"/>
          <circle cx="15" cy="40" r="2.5" fill="#C4829A"/>
          {/* Tiny daisy */}
          <circle cx="45" cy="55" r="5" fill="#D4A44C"/>
          <circle cx="45" cy="44" r="3.5" fill="#FAF3E3" opacity="0.8"/>
          <circle cx="45" cy="66" r="3.5" fill="#FAF3E3" opacity="0.8"/>
          <circle cx="34" cy="55" r="3.5" fill="#FAF3E3" opacity="0.8"/>
          <circle cx="56" cy="55" r="3.5" fill="#FAF3E3" opacity="0.8"/>
          <circle cx="37" cy="47" r="3.5" fill="#FAF3E3" opacity="0.8"/>
          <circle cx="53" cy="47" r="3.5" fill="#FAF3E3" opacity="0.8"/>
          <circle cx="45" cy="55" r="4" fill="#D4A44C"/>
        </svg>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 mb-24 relative z-10 flex flex-col items-center">
        
        <h1 className="text-5xl md:text-7xl font-display italic text-foreground mb-4 text-center">
          How are you feeling today?
        </h1>
        <p className="text-xl md:text-2xl text-sage font-sans text-center mb-16 max-w-xl">
          Select a mood to check in and get some ideas on where to go next.
        </p>

        {!result ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full">
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                onClick={() => handleMoodClick(mood.id)}
                disabled={isPending}
                className={`
                  ${mood.color} rounded-full py-6 px-4 flex flex-col items-center justify-center gap-3
                  transition-all duration-300 hover:scale-105 hover:shadow-md border border-white/40
                  ${selectedMood === mood.id ? 'ring-2 ring-terracotta ring-offset-2' : ''}
                  ${isPending && selectedMood !== mood.id ? 'opacity-50' : ''}
                `}
                style={{ borderRadius: '60% 40% 50% 50% / 50% 50% 60% 40%' }} // organic blob shape
              >
                <mood.icon aria-hidden="true" className="h-10 w-10 md:h-12 md:w-12 text-primary" />
                <span className="font-display font-bold text-xl md:text-2xl tracking-wide">{mood.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="w-full bg-card rounded-[3rem] p-8 md:p-12 shadow-sm border border-card-border/50 text-center animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl md:text-4xl font-display italic text-terracotta mb-6">
              {result.message}
            </h2>
            
            <p className="text-lg font-sans text-foreground/80 mb-8">
              Based on how you're feeling, here are some spots on the site that might help:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {result.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-white/50 rounded-2xl p-6 border border-black/5 flex flex-col h-full">
                  <h3 className="font-display font-bold text-2xl text-foreground mb-2">
                    {rec.section}
                  </h3>
                  <p className="font-sans text-foreground/70 mb-6 flex-1">
                    {rec.reason}
                  </p>
                  <Link href={rec.path}>
                    <button className="w-full bg-sage/20 hover:bg-sage/30 text-sage font-sans font-bold py-3 rounded-full transition-colors flex items-center justify-center gap-2">
                      Go there <span>→</span>
                    </button>
                  </Link>
                </div>
              ))}
            </div>

            <button 
              onClick={() => { setResult(null); setSelectedMood(null); }}
              className="mt-12 font-sans font-bold text-foreground/50 hover:text-foreground transition-colors underline underline-offset-4"
            >
              Start over
            </button>
          </div>
        )}

      </div>
      
      <WaveFooter quote="Whatever you're feeling, it's valid." />
    </div>
  );
}
