import { WaveFooter } from "@/components/WaveFooter";
import { Mic, PlayCircle } from "lucide-react";
import { Link } from "wouter";
import { useGetPublishedContent } from "@workspace/api-client-react";
import { format } from "date-fns";
import { PublishedArticle, type PublicationAppearance } from "@workspace/mind-matters-ds/components/PublishedArticle";

export default function ListenPodcast() {
  const { data, isLoading } = useGetPublishedContent({ section: "podcast" }, { query: { staleTime: 45_000, refetchOnWindowFocus: true } });
  const episodes = data?.publications ?? [];

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative">
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 mb-24 text-center relative z-10">
        <div className="absolute top-0 left-0 z-20">
          <Link href="/listen">
            <button className="px-6 py-2 rounded-full border border-terracotta text-terracotta font-sans text-sm tracking-wide transition-all hover:bg-terracotta hover:text-white">
              ← Back to Listen
            </button>
          </Link>
        </div>
        <h1 className="text-5xl md:text-7xl font-display italic text-foreground mb-4 drop-shadow-sm flex justify-center items-center gap-4">
          <Mic className="text-terracotta" size={48} />
          Middle School Matters Podcast
        </h1>
        <p className="text-xl md:text-2xl text-sage font-handwritten mb-16 max-w-2xl mx-auto">
          Student-run episodes dropping soon. Tune in for real conversations about middle school life.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse flex gap-4">
              <div className="w-4 h-4 bg-terracotta/40 rounded-full"></div>
              <div className="w-4 h-4 bg-terracotta/40 rounded-full"></div>
              <div className="w-4 h-4 bg-terracotta/40 rounded-full"></div>
            </div>
          </div>
        ) : episodes.length > 0 ? (
          <div className="flex flex-col gap-6 max-w-2xl mx-auto">
            {episodes.map((ep, idx) => (
              <div
                key={ep.id}
                className="bg-card rounded-[2rem] p-8 border border-card-border/50 text-left flex gap-6 items-start shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-terracotta/15 flex items-center justify-center">
                  <PlayCircle size={28} className="text-terracotta" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-sans text-xs font-bold text-terracotta uppercase tracking-widest">
                      Episode {idx + 1}
                    </span>
                    <span className="text-foreground/30">·</span>
                    <span className="font-sans text-xs text-foreground/50">
                      {format(new Date(ep.publishedAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  <PublishedArticle
                    title={ep.title}
                    content={ep.content}
                    appearance={(ep as typeof ep & { appearance?: PublicationAppearance }).appearance}
                    authorDisplay={ep.authorDisplay}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-[3rem] p-10 max-w-2xl mx-auto border border-card-border/50 relative">
            {/* Note taped to the card */}
            <div className="absolute -top-6 -right-6 md:-right-12 bg-amber/30 p-4 rounded-sm shadow-md transform rotate-6 border border-amber/20 w-48 z-10">
              <div className="w-4 h-4 bg-terracotta/40 rounded-full absolute top-2 left-1/2 -translate-x-1/2 shadow-inner"></div>
              <p className="font-handwritten text-lg text-terracotta mt-2 leading-tight">
                Student podcasters add your episodes here!
              </p>
            </div>
            <div className="bg-gradient-to-br from-terracotta/10 to-transparent rounded-3xl p-8 border-2 border-dashed border-terracotta/30 flex flex-col items-center justify-center min-h-[300px]">
              <PlayCircle size={64} className="text-terracotta/30 mb-6" />
              <h2 className="font-display italic text-3xl text-foreground/50 mb-2">Episode 1</h2>
              <p className="font-sans text-xl text-terracotta/60 font-medium uppercase tracking-widest">
                Coming Soon
              </p>
            </div>
          </div>
        )}
      </div>
      
      <WaveFooter quote="Press play. Take a breath. You've got this." />
    </div>
  );
}
