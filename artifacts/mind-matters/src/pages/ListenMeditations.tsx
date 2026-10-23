import { WaveFooter } from "@/components/WaveFooter";
import { Headphones, Leaf } from "lucide-react";
import { Link } from "wouter";
import { useGetPublishedContent } from "@workspace/api-client-react";
import { PublishedArticle, type PublicationAppearance } from "@workspace/mind-matters-ds/components/PublishedArticle";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";

export default function ListenMeditations({ focus = false }: { focus?: boolean }) {
  const { data, isLoading, isError, refetch } = useGetPublishedContent({}, { query: { staleTime: 45_000, refetchOnWindowFocus: true } });
  const section = focus ? "focus-study" : "calm-corner";
  const meditations = (data?.publications ?? []).filter((post) => {
    // Keep the existing published edition and its media intact while moving
    // this previously miscategorized post to its requested listening page.
    const destination = post.destinationSection === "calm-corner"
      && post.title.trim().toLowerCase() === "music for studying"
      ? "focus-study" : post.destinationSection;
    return destination === section;
  });
  const title = focus ? "Focus & Study" : "Guided Meditations";
  const Icon = focus ? Headphones : Leaf;

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
            <Icon className="text-sage" size={48} />
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-sage font-handwritten max-w-2xl mx-auto">
            {focus ? "Music and focus sounds to keep you company while you study." : "Take a few minutes to breathe and recenter."}
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
        ) : isError ? (
          <div role="alert" className="text-center">
            <p className="mb-4 text-foreground/70">These posts could not be loaded.</p>
            <Button variant="outline" onClick={() => refetch()}>Try again</Button>
          </div>
        ) : meditations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {meditations.map((med) => (
              <div
                key={med.id}
                className="bg-gradient-to-br from-sage/20 to-dusty-rose/20 rounded-[2rem] p-8 flex flex-col border border-white/40 shadow-sm hover:shadow-md transition-shadow"
              >
                <PublishedArticle
                  title={med.title}
                  content={med.content}
                  blocks={med.blocks}
                  projectId={med.projectId}
                  appearance={(med as typeof med & { appearance?: PublicationAppearance }).appearance}
                  authorDisplay={med.authorDisplay}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-sage/10 to-dusty-rose/10 rounded-[3rem] p-12 text-center border-2 border-dashed border-sage/30 max-w-lg mx-auto">
            <div className="p-6 bg-white/40 rounded-full inline-flex mb-6">
              <Icon size={48} className="text-sage/50" />
            </div>
            <h2 className="font-display italic text-3xl text-foreground/50 mb-2">Coming Soon</h2>
            <p className="font-sans text-foreground/50">
              {focus ? "Focus and study content from our student team is on the way." : "Guided meditation content from our student team is on the way."}
            </p>
          </div>
        )}
      </div>

      <WaveFooter quote={focus ? "One task at a time. You've got this." : "Breathe in. Breathe out. You are enough."} />
    </div>
  );
}
