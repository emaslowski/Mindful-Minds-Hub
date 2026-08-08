import { useState } from "react";
import { WaveFooter } from "@/components/WaveFooter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetGratitudeEntries, useCreateGratitudeEntry } from "@workspace/api-client-react";
import { Lock, Heart, Plus } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

function BackButton() {
  return (
    <div className="mb-8">
      <Link href="/grow">
        <button className="px-6 py-2 rounded-full border border-terracotta text-terracotta font-sans text-sm tracking-wide transition-all hover:bg-terracotta hover:text-white">
          ← Back to Grow
        </button>
      </Link>
    </div>
  );
}

export default function GrowGratitude() {
  const { isAuthenticated, login, isLoading: authLoading } = useAuth();
  const { data: entries, refetch: refetchEntries } = useGetGratitudeEntries({ query: { enabled: isAuthenticated } });
  const { mutate: createEntry, isPending } = useCreateGratitudeEntry();
  
  const [content, setContent] = useState("");

  const handleAdd = () => {
    if (!content.trim()) return;
    createEntry(
      { data: { content } },
      {
        onSuccess: () => {
          setContent("");
          refetchEntries();
        }
      }
    );
  };

  if (authLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full flex flex-col flex-1 pt-12 relative overflow-hidden">
        <div className="flex-1 w-full max-w-2xl mx-auto px-4 mb-24 flex flex-col z-10">
          <BackButton />
          <div className="flex flex-col items-center justify-center text-center flex-1">
          <div className="bg-sage/10 p-6 rounded-full text-sage mb-8 border border-sage/20">
            <Lock size={64} />
          </div>
          <h1 className="text-5xl md:text-7xl font-display italic text-foreground mb-6">
            Gratitude Journal
          </h1>
          <p className="text-xl font-sans text-foreground/70 mb-10 max-w-lg leading-relaxed">
            Keep track of the good things. Log in to start building your personal gratitude collection.
          </p>
          <button 
            onClick={login}
            className="bg-sage hover:bg-sage/90 text-white px-10 py-4 rounded-full font-sans font-bold text-xl tracking-wide transition-all shadow-md hover:-translate-y-1 hover:shadow-lg"
          >
            Log In
          </button>
          </div>
        </div>
        <WaveFooter quote="Gratitude turns what we have into enough." />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative overflow-hidden">
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 mb-24 z-10">
        <BackButton />
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Heart className="text-dusty-rose fill-dusty-rose/30" size={48} />
          </div>
          <h1 className="text-5xl md:text-7xl font-display italic text-foreground">
            Gratitude Journal
          </h1>
        </div>

        {/* Input Area */}
        <div className="max-w-2xl mx-auto bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-card-border mb-16 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
             <label className="font-sans font-bold text-sm text-foreground/60 uppercase tracking-widest block mb-2">
               What are you grateful for today?
             </label>
             <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="A good conversation, my pet, sunny weather..."
                className="w-full bg-white/60 border border-black/10 rounded-2xl p-4 font-sans text-lg focus:outline-none focus:ring-2 focus:ring-sage/50 resize-none h-[80px]"
              />
          </div>
          <button
            onClick={handleAdd}
            disabled={isPending || !content.trim()}
            className="w-full sm:w-auto h-[80px] mt-auto shrink-0 bg-sage hover:bg-sage/90 text-white px-8 rounded-2xl font-sans font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Plus size={20} /> Add to my list
          </button>
        </div>

        {/* Sticky Notes Grid */}
        <div className="text-center mb-8">
          <p className="font-handwritten text-3xl text-terracotta">
            Come back each day to add to it!
          </p>
        </div>

        {entries && entries.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4 py-8">
            {entries.map((entry, idx) => {
              // Alternate colors and slight rotations for sticky note effect
              const colors = ["bg-amber/20", "bg-sage/20", "bg-dusty-rose/20", "bg-terracotta/20"];
              const color = colors[idx % colors.length];
              const rotation = idx % 2 === 0 ? "rotate-2" : "-rotate-2";
              
              return (
                <div 
                  key={entry.id} 
                  className={`${color} p-6 pb-8 rounded-sm shadow-md border border-black/5 transform ${rotation} hover:rotate-0 hover:scale-105 transition-all duration-300 relative flex flex-col`}
                  style={{ minHeight: "200px" }}
                >
                  <div className="w-full flex justify-center absolute -top-3 left-0">
                     <div className="w-10 h-3 bg-white/40 shadow-sm transform -rotate-1"></div>
                  </div>
                  <p className="font-handwritten text-2xl text-foreground leading-relaxed flex-1 mt-2">
                    {entry.content}
                  </p>
                  <span className="font-sans text-xs font-bold text-foreground/50 uppercase tracking-wider text-right mt-4 border-t border-black/5 pt-2">
                    {format(new Date(entry.createdAt), "MMM d")}
                  </span>
                </div>
              );
            })}
          </div>
        )}

      </div>
      <WaveFooter quote="Gratitude turns what we have into enough." />
    </div>
  );
}
