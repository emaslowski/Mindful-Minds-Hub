import { Link, useParams } from "wouter";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { AthleteGallery } from "@/components/AthleteGallery";
import { PublishedSection } from "@/components/PublishedSection";
import { WaveFooter } from "@/components/WaveFooter";

const activities: Record<string, { title: string; description: string }> = {
  "morning-stretch": { title: "Morning Stretch", description: "Start the day with a little movement." },
  "soccer-skills": { title: "Soccer Skills", description: "Practice skills, build confidence, and have fun." },
  "basketball-drills": { title: "Basketball Drills", description: "Build your game one practice at a time." },
  "yoga-for-calm": { title: "Yoga for Calm", description: "Relax, reset, and find a comfortable pace." },
  "stretch-break": { title: "Stretch Break", description: "Take a mindful mid-day movement break." },
  "active-challenge": { title: "Active Challenge", description: "Try a new challenge and move your way." },
};

export default function MoveActivity() {
  const { category = "" } = useParams<{ category: string }>();
  const activity = activities[category];

  if (!activity) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-4 py-12 text-center">
        <h1 className="font-display text-4xl italic text-foreground">Activity not found</h1>
        <Button asChild variant="outline" className="mt-6"><Link href="/move">Back to Exercise Center</Link></Button>
      </main>
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col pt-8">
      <header className="mx-auto mb-10 w-full max-w-4xl px-4 text-center">
        <Button asChild variant="outline" size="sm" className="mb-6">
          <Link href="/move">Back to Exercise Center</Link>
        </Button>
        <p className="mb-2 font-sans text-sm font-bold uppercase tracking-widest text-sage">Move your body. Boost your mind.</p>
        <h1 className="font-display text-5xl italic text-foreground md:text-6xl">{activity.title}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-foreground/75">{activity.description}</p>
      </header>
      <PublishedSection section={`move-${category}`} heading={`${activity.title} activities`} featureVideos={category === "active-challenge"} className="mb-12" />
      {category === "active-challenge" && <AthleteGallery />}
      <WaveFooter quote="Move your body. Boost your mind." />
    </div>
  );
}
