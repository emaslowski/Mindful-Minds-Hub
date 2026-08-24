import { useState } from "react";
import { WaveFooter } from "@/components/WaveFooter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetTodayPrompt, useCreateJournalEntry, useGetJournalEntries } from "@workspace/api-client-react";
import { Lock, PenTool, Send, Info, Moon } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

/**
 * Returns true if the journal is currently open (7:00 AM – 9:00 PM Eastern Time).
 * Uses America/New_York so it handles both EST (UTC-5) and EDT (UTC-4) automatically.
 */
function isJournalOpen(): boolean {
  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
    10,
  );
  // Open from 7 (7:00 AM) through 20 (8:59 PM); closed at 21 (9:00 PM) and after
  return hour >= 7 && hour < 21;
}

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

export default function GrowJournal() {
  const journalOpen = isJournalOpen();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const { data: promptData } = useGetTodayPrompt({ query: { enabled: isAuthenticated && journalOpen } });
  const { data: entries, refetch: refetchEntries } = useGetJournalEntries({ query: { enabled: isAuthenticated && journalOpen } });
  
  const { mutate: createEntry, isPending } = useCreateJournalEntry();
  
  const [content, setContent] = useState("");

  const handleSave = () => {
    if (!content.trim()) return;
    createEntry(
      { data: { content, prompt: promptData?.prompt } },
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

  // Journal is closed 9 PM – 7 AM Eastern Time
  if (!journalOpen) {
    return (
      <div className="w-full flex flex-col flex-1 pt-12 relative">
        <div className="flex-1 w-full max-w-2xl mx-auto px-4 mb-24 flex flex-col z-10">
          <BackButton />
          <div className="flex flex-col items-center justify-center text-center flex-1">
            <div className="bg-sage/10 p-6 rounded-full text-sage mb-8 border border-sage/20">
              <Moon size={64} />
            </div>
            <h1 className="text-5xl md:text-7xl font-display italic text-foreground mb-6">
              Journal is Closed
            </h1>
            <p className="text-xl font-sans text-foreground/70 mb-4 max-w-lg leading-relaxed">
              The journal is available <strong>7:00 AM – 9:00 PM</strong> Eastern Time.
            </p>
            <p className="text-base font-sans text-foreground/50 max-w-md leading-relaxed">
              Come back during open hours to write, reflect, and grow. Rest well tonight. 🌙
            </p>
          </div>
        </div>
        <WaveFooter quote="Rest. Reflect. Return tomorrow." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full flex flex-col flex-1 pt-12 relative">
        <div className="flex-1 w-full max-w-2xl mx-auto px-4 mb-24 flex flex-col z-10">
          <BackButton />
          <div className="flex flex-col items-center justify-center text-center flex-1">
          <div className="bg-amber/10 p-6 rounded-full text-amber mb-8 border border-amber/20">
            <Lock size={64} />
          </div>
          <h1 className="text-5xl md:text-7xl font-display italic text-foreground mb-6">
            Your Private Space
          </h1>
          <p className="text-xl font-sans text-foreground/70 mb-10 max-w-lg leading-relaxed">
            The journal is a safe, private place just for you. Log in to write, reflect, and save your entries.
          </p>
          <Link href="/anonymous-access?returnTo=/grow/journal">
            <span className="inline-flex bg-sage hover:bg-sage/90 text-white px-10 py-4 rounded-full font-sans font-bold text-xl tracking-wide transition-all shadow-md hover:-translate-y-1 hover:shadow-lg">
              Open Your Private Journal
            </span>
          </Link>
          </div>
        </div>
        <WaveFooter quote="Write it out. Let it go. Grow from it." />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative">
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 mb-24 z-10">
        <BackButton />
        <div className="flex items-center gap-3 mb-10">
          <PenTool className="text-terracotta" size={32} />
          <h1 className="text-5xl md:text-6xl font-display italic text-foreground">
            Daily Journal
          </h1>
        </div>

        {/* Red Flag Warning */}
        <div className="bg-white/50 border border-black/5 rounded-2xl p-4 mb-8 flex gap-4 items-start shadow-sm">
          <Info size={24} className="text-sage shrink-0 mt-1" />
          <p className="font-sans text-sm text-foreground/70 leading-relaxed">
            <strong>This is your private space.</strong> Only you can see your entries. <br/>
            <em>Note: If your writing expresses something concerning (like wanting to hurt yourself or others), a trusted adult will be notified to check in and support you.</em>
          </p>
        </div>

        {/* Compose Entry */}
        <div className="bg-card rounded-[3rem] p-8 md:p-10 border border-card-border/50 shadow-sm mb-16 relative">
          
          {promptData && (
            <div className="bg-amber/20 border border-amber/30 p-6 rounded-3xl mb-8 transform -rotate-1">
              <h3 className="font-sans font-bold text-amber-foreground text-sm uppercase tracking-widest mb-2">
                Today's Prompt
              </h3>
              <p className="font-display italic text-3xl text-foreground">
                "{promptData.prompt}"
              </p>
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thoughts here..."
            className="w-full bg-transparent font-sans text-lg text-foreground placeholder:text-foreground/30 focus:outline-none resize-none min-h-[250px] leading-relaxed"
          />

          <div className="flex justify-end mt-6 border-t border-black/5 pt-6">
            <button
              onClick={handleSave}
              disabled={isPending || !content.trim()}
              className="flex items-center gap-2 bg-terracotta hover:bg-terracotta/90 text-white px-8 py-3 rounded-full font-sans font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} /> Save Entry
            </button>
          </div>
        </div>

        {/* Past Entries */}
        {entries && entries.length > 0 && (
          <div>
            <h2 className="text-3xl font-display italic text-foreground mb-8">Past Entries</h2>
            <div className="space-y-6">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-white/60 p-8 rounded-3xl border border-black/5 shadow-sm">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-black/5">
                    <span className="font-sans font-bold text-terracotta tracking-wide uppercase text-sm">
                      {format(new Date(entry.createdAt), "MMMM d, yyyy")}
                    </span>
                    <Lock size={16} className="text-foreground/30" />
                  </div>
                  {entry.prompt && (
                    <p className="font-display italic text-xl text-foreground/60 mb-4">
                      Q: {entry.prompt}
                    </p>
                  )}
                  <p className="font-sans text-foreground leading-relaxed whitespace-pre-wrap">
                    {entry.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      <WaveFooter quote="Write it out. Let it go. Grow from it." />
    </div>
  );
}
