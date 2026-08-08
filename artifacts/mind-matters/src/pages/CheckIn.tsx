import { useState } from "react";
import { Link } from "wouter";
import { WaveFooter } from "@/components/WaveFooter";
import { useSubmitCheckin } from "@workspace/api-client-react";
import { SectionRecommendation } from "@workspace/api-client-react/src/generated/api.schemas";

type Mood = { id: string; label: string; icon: string; color: string };

const MOODS: Mood[] = [
  { id: "anxious", label: "Anxious", icon: "😬", color: "bg-dusty-rose/20 text-foreground" },
  { id: "stressed", label: "Stressed", icon: "😫", color: "bg-terracotta/20 text-foreground" },
  { id: "sad", label: "Sad", icon: "😢", color: "bg-sage/20 text-foreground" },
  { id: "angry", label: "Angry", icon: "😠", color: "bg-red-500/20 text-foreground" },
  { id: "overwhelmed", label: "Overwhelmed", icon: "😵‍💫", color: "bg-amber/20 text-foreground" },
  { id: "lonely", label: "Lonely", icon: "🥺", color: "bg-dusty-rose/20 text-foreground" },
  { id: "happy", label: "Happy", icon: "😊", color: "bg-sage/30 text-foreground" },
  { id: "tired", label: "Tired", icon: "🥱", color: "bg-amber/30 text-foreground" },
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
    <div className="w-full flex flex-col flex-1 pt-12 relative overflow-hidden">
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
                <span className="text-4xl md:text-5xl">{mood.icon}</span>
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
