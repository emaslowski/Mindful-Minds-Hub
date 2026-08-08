import { WaveFooter } from "@/components/WaveFooter";
import { Leaf, Star } from "lucide-react";
import { Link } from "wouter";
import { useGetPublishedContent } from "@workspace/api-client-react";
import { format } from "date-fns";

export default function ListenMeditations() {
  const { data, isLoading } = useGetPublishedContent({ section: "calm-corner" });
  const meditations = data?.publications ?? [];

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative">
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 mb-24 relative z-10">
        <div className="mb-8">
          <Link href="/listen">
            <button className="px-6 py-2 rounded-full border border-sage text-sage font-sans text-sm tracking-wide transition-all hover:bg-sage hover:text-white">
              ← Back to Listen
            </button>
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-display italic text-foreground mb-4 drop-shadow-sm flex justify-center items-center gap-4">
            <Leaf className="text-sage" size={48} />
            Guided Meditations
          </h1>
          <p className="text-xl md:text-2xl text-sage font-handwritten max-w-2xl mx-auto">
            Take a few minutes to breathe and recenter.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse flex gap-4">
              <div className="w-4 h-4 bg-sage/40 rounded-full"></div>
              <div className="w-4 h-4 bg-sage/40 rounded-full"></div>
              <div className="w-4 h-4 bg-sage/40 rounded-full"></div>
            </div>
          </div>
        ) : meditations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {meditations.map((med) => (
              <div
                key={med.id}
                className="bg-gradient-to-br from-sage/20 to-dusty-rose/20 rounded-[2rem] p-8 flex flex-col border border-white/40 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-sage/20 rounded-full">
                    <Leaf size={18} className="text-sage" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star size={12} className="text-amber fill-amber" />
                    <span className="font-sans text-xs font-bold text-amber uppercase tracking-widest">
                      Student Meditation
                    </span>
                  </div>
                </div>
                <h3 className="font-display italic text-2xl text-foreground mb-3 leading-tight">
                  {med.title}
                </h3>
                {med.content && (
                  <p className="font-sans text-sm text-foreground/70 leading-relaxed flex-1">
                    {med.content}
                  </p>
                )}
                <div className="flex items-center justify-between mt-4">
                  <span className="font-sans text-xs text-foreground/50">{med.authorDisplay}</span>
                  <span className="font-sans text-xs text-foreground/40">
                    {format(new Date(med.publishedAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-sage/10 to-dusty-rose/10 rounded-[3rem] p-12 text-center border-2 border-dashed border-sage/30 max-w-lg mx-auto">
            <div className="p-6 bg-white/40 rounded-full inline-flex mb-6">
              <Leaf size={48} className="text-sage/50" />
            </div>
            <h2 className="font-display italic text-3xl text-foreground/50 mb-2">Coming Soon</h2>
            <p className="font-sans text-foreground/50">
              Guided meditation content from our student team is on the way.
            </p>
          </div>
        )}
      </div>

      <WaveFooter quote="Breathe in. Breathe out. You are enough." />
    </div>
  );
}
