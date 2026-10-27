import { Mic } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { PublishedSection } from "@/components/PublishedSection";
import { WaveFooter } from "@/components/WaveFooter";

export default function ListenPodcast() {
  return (
    <div className="flex w-full flex-1 flex-col pt-8">
      <header className="mx-auto mb-10 w-full max-w-4xl px-4 text-center">
        <Button asChild variant="outline" size="sm" className="mb-6">
          <Link href="/listen">Back to Listening Station</Link>
        </Button>
        <Mic className="mx-auto mb-4 text-terracotta" size={40} aria-hidden="true" />
        <h1 className="font-display text-4xl italic text-foreground md:text-6xl">
          The Brightside Project Podcast
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground/75">
          Browse all our student podcasts. Watch video episodes or listen to audio
          episodes right here.
        </p>
      </header>
      <PublishedSection
        section="podcast"
        heading="All Podcast Episodes"
        featureVideos
        emptyMessage="No podcast episodes have been published yet. Check back soon!"
        className="mb-16"
      />
      <WaveFooter quote="Press play. Take a breath. You've got this." />
    </div>
  );
}
