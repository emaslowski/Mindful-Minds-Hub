import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, CircleDot, Dumbbell, Heart, MoveUpRight, Sparkles, Star } from "lucide-react";
import { getListAthleteQueryKey, useListAthlete } from "@workspace/api-client-react";
import type { AthleteEntry } from "@workspace/api-client-react";
import { Alert, AlertDescription, AlertTitle } from "@workspace/mind-matters-ds/components/ui/alert";
import { Badge } from "@workspace/mind-matters-ds/components/ui/badge";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card, CardContent } from "@workspace/mind-matters-ds/components/ui/card";
import { Skeleton } from "@workspace/mind-matters-ds/components/ui/skeleton";
import { PublishedSection } from "@/components/PublishedSection";
import { WaveFooter } from "@/components/WaveFooter";

const categories = ["All", "Workouts", "Stretch breaks", "Sports skills", "Challenges"] as const;

const activities = [
  { title: "Morning Stretch", note: "A gentle five-minute start", category: "Workouts", path: "/move/morning-stretch", icon: MoveUpRight },
  { title: "Soccer Skills", note: "Practice skills and build confidence", category: "Sports skills", path: "/move/soccer-skills", icon: CircleDot },
  { title: "Basketball Drills", note: "Build your game one practice at a time", category: "Sports skills", path: "/move/basketball-drills", icon: Dumbbell },
  { title: "Yoga for Calm", note: "Relax, reset, and find your pace", category: "Workouts", path: "/move/yoga-for-calm", icon: Heart },
  { title: "Stretch Break", note: "A mindful mid-day movement break", category: "Stretch breaks", path: "/move/stretch-break", icon: Sparkles },
  { title: "Active Challenge", note: "Move your way and share a moment", category: "Challenges", path: "/move/active-challenge", icon: Star },
];

function AthleteOfTheMonth({ athlete }: { athlete: AthleteEntry }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:items-center">
        <img
          src={athlete.imageUrl || `/api/athlete/${athlete.id}/image`}
          alt={`Teacher-selected Athlete of the Month: ${athlete.athleteName}`}
          className="aspect-square w-full rounded-lg bg-muted object-cover"
          loading="lazy"
          data-testid="img-athlete-of-month"
        />
        <div className="space-y-3">
          <Badge variant="secondary">Teacher-selected · {athlete.featuredMonth}</Badge>
          <div>
            <h2 className="font-display text-3xl italic text-foreground">Athlete of the Month</h2>
            <p className="mt-1 text-lg font-semibold text-foreground">{athlete.athleteName}</p>
            <p className="text-sm text-foreground/70">{athlete.title}</p>
          </div>
          <p className="text-sm text-foreground/75">Celebrating movement, effort, and showing up in your own way.</p>
          <Button asChild variant="outline" size="sm" data-testid="link-athlete-gallery">
            <Link href="/move/active-challenge">Explore challenge photos<ArrowRight aria-hidden="true" /></Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Move() {
  const [filter, setFilter] = useState<(typeof categories)[number]>("All");
  const athleteQuery = useListAthlete({
    query: {
      queryKey: getListAthleteQueryKey(),
      staleTime: 30_000,
      retry: 1,
    },
  });
  const featured = athleteQuery.data?.featured?.status === "approved" ? athleteQuery.data.featured : null;
  const visibleActivities = filter === "All"
    ? activities
    : activities.filter((activity) => activity.category === filter);

  return (
    <div className="flex w-full flex-1 flex-col pt-6">
      <div className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 pb-16">
        <header className="mx-auto max-w-3xl space-y-3 text-center">
          <p className="font-sans text-sm font-bold uppercase tracking-widest text-primary">Move your body. Boost your mind.</p>
          <h1 className="font-display text-5xl italic text-foreground md:text-6xl">Exercise Center</h1>
          <p className="text-lg text-foreground/75">Choose a comfortable way to move. Every activity can be adapted to what feels right for you.</p>
        </header>

        <section className="space-y-4" aria-labelledby="athlete-recognition-heading">
          <h2 id="athlete-recognition-heading" className="sr-only">Athlete of the Month</h2>
          {athleteQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : athleteQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Athlete recognition could not be loaded</AlertTitle>
              <AlertDescription className="mt-2 flex items-center gap-3">
                <span>Please try again.</span>
                <Button variant="outline" size="sm" onClick={() => void athleteQuery.refetch()} data-testid="button-retry-athlete-recognition">Retry</Button>
              </AlertDescription>
            </Alert>
          ) : featured ? (
            <AthleteOfTheMonth athlete={featured} />
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl italic text-foreground">Athlete of the Month</h2>
                  <p className="text-sm text-foreground/70">A teacher will share this month’s recognition here.</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/move/active-challenge">See Active Challenge<ArrowRight aria-hidden="true" /></Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        <section className="space-y-5" aria-labelledby="activities-heading">
          <div className="space-y-1">
            <h2 id="activities-heading" className="font-display text-3xl italic text-foreground">Find your activity</h2>
            <p className="text-sm text-foreground/70">Pick a short break, skill practice, or challenge.</p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Filter activities">
            {categories.map((category) => (
              <Button
                key={category}
                type="button"
                size="sm"
                variant={filter === category ? "secondary" : "outline"}
                aria-pressed={filter === category}
                onClick={() => setFilter(category)}
                data-testid={`button-filter-${category.toLowerCase().replaceAll(" ", "-")}`}
              >
                {category}
              </Button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <Link
                  key={activity.path}
                  href={activity.path}
                  className="group rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  data-testid={`link-move-${activity.path.split("/").pop()}`}
                >
                  <Card className="h-full transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-md">
                    <CardContent className="flex h-full min-h-40 items-start gap-4 p-5">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
                        <Icon aria-hidden="true" className="h-6 w-6" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="font-display text-2xl italic text-foreground">{activity.title}</span>
                        <span className="text-sm text-foreground/70">{activity.note}</span>
                        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-primary">Explore<ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <PublishedSection section="move" heading="From Our Students" className="mt-8" />
      </div>
      <WaveFooter quote="Move your body. Boost your mind." />
    </div>
  );
}
