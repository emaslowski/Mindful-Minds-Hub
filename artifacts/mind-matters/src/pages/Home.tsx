import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card } from "@workspace/mind-matters-ds/components/ui/card";
import { PublicationVideo } from "@workspace/mind-matters-ds/components/PublicationVideo";
import { WaveFooter } from "@/components/WaveFooter";
import { HomeUpdates } from "@/components/HomeUpdates";
import { PublicationDiscussion } from "@/components/PublicationDiscussion";

const centers = [
  { title: "Student Stories & Blogs", description: "Ideas, encouragement, and student voices.", href: "/connect", image: "tile-1.jpg", color: "bg-muted/30" },
  { title: "Podcasts & Videos", description: "Listen, watch, and learn from peers.", href: "/listen/podcast", image: "tile-2.jpg", color: "bg-secondary/20" },
  { title: "Art & Drawing Studio", description: "Create art and follow drawing tutorials.", href: "/create", image: "tile-3.jpg", color: "bg-accent/25" },
  { title: "Games & Challenges", description: "Try quizzes, activities, and fun challenges.", href: "/games", image: "tile-4.jpg", color: "bg-accent/25" },
  { title: "Plants & Gardening", description: "Grow plants, learn gardening tips, and explore student projects.", href: "/gardening", image: "tile-5.jpg", color: "bg-secondary/20" },
  { title: "Journaling Center", description: "Reflect with private writing prompts.", href: "/grow/journal", image: "tile-6.jpg", color: "bg-muted/30" },
  { title: "Movement & Sports", description: "Stretch, move, and learn new skills.", href: "/move", image: "tile-7.jpg", color: "bg-secondary/20" },
  { title: "Music & Mindful Moments", description: "Find sounds and guided pauses.", href: "/listen", image: "tile-8.jpg", color: "bg-muted/30" },
  { title: "Cooking & Healthy Recipes", description: "Discover recipes and kitchen creativity.", href: "/create/cooking", image: "tile-9.jpg", color: "bg-accent/25" },
  { title: "Language Corner", description: "Play Spanish vocabulary and ASL handshape games.", href: "/language-corner", image: "tile-10.jpg", color: "bg-secondary/20" },
  { title: "Friendship & Belonging", description: "Practice kindness, teamwork, and inclusion.", href: "/connect", image: "tile-11.jpg", color: "bg-muted/30" },
  { title: "School & Community Events", description: "Discover events, clubs, and activities.", href: "/events", image: "tile-12.jpg", color: "bg-accent/25" },
  { title: "Groups & Connections", description: "Find teacher-approved ways to join in.", href: "/connect", image: "tile-13.jpg", color: "bg-secondary/20" },
  { title: "ASMR", description: "Listen to gentle, teacher-approved sounds created by students.", href: "/listen/asmr", image: "tile-8.jpg", color: "bg-muted/30" },
];

const creatorRoles = [
  "Writers", "Researchers", "Artists", "Podcasters", "Video Creators", "Designers", "Community Reporters",
];

const processSteps = [
  { title: "Listen to student ideas", image: "step-1.jpg" },
  { title: "Research", image: "step-2.jpg" },
  { title: "Create", image: "step-3.jpg" },
  { title: "Collaborate", image: "step-4.jpg" },
  { title: "Revise", image: "step-5.jpg" },
  { title: "Teacher review", image: "step-6.jpg" },
  { title: "Share", image: "step-7.jpg" },
];

function SectionHeading({ children, id }: { children: string; id?: string }) {
  return (
    <div className="mb-5 flex items-center justify-center gap-3 text-center">
      <span aria-hidden="true" className="text-primary text-2xl">⌁</span>
      <h2 id={id} className="font-serif text-3xl font-bold text-foreground md:text-4xl">{children}</h2>
      <span aria-hidden="true" className="text-primary text-2xl">⌁</span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="home-page w-full pb-8">
      <section className="mx-auto grid w-full max-w-6xl items-center gap-5 px-2 pb-8 pt-5 md:grid-cols-2 md:gap-8 md:pb-10 md:pt-8" aria-labelledby="home-title">
        <div className="order-2 md:order-1">
          <h1 id="home-title" className="max-w-xl font-serif text-5xl font-bold leading-[0.93] tracking-tight text-foreground sm:text-6xl md:text-7xl">
            A brighter school starts with us.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-foreground/85 sm:text-lg">
            A student-created community hub to learn, create, connect, and feel a sense of belonging.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild size="sm" variant="secondary" data-testid="link-explore-centers">
              <a href="#bright-spots">Explore the Centers <ArrowDown aria-hidden="true" /></a>
            </Button>
          </div>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-foreground/85" data-testid="text-home-purpose">
            The Brightside Project is about connection and a sense of belonging with peers. Games are just one activity here—not the main focus of this website.
          </p>
        </div>
        <Card className="order-1 overflow-hidden border-0 bg-transparent shadow-none md:order-2">
          <img
            src="/api/public/homepage-image"
            alt="Hand-drawn Brightside Project illustration of students creating together, with a poster reading A kinder school, brighter tomorrow"
            className="h-auto w-full object-contain"
            fetchPriority="high"
          />
        </Card>
      </section>

      <div className="mx-auto mb-8 flex w-full max-w-6xl flex-col items-start gap-3 border-y border-border px-3 py-4 sm:flex-row sm:items-center md:mb-10 md:px-6">
        <div className="hidden shrink-0 items-center md:flex" aria-hidden="true">
          <img src="/assets/bright/tile-13.jpg" alt="" className="h-12 w-14 object-cover" />
        </div>
        <p className="font-serif text-lg font-semibold leading-snug md:w-2/5 md:text-xl">
          Created by students.<br />Connected by kindness.
        </p>
        <div className="hidden h-10 w-px bg-border md:block" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-foreground/80 md:flex-1">
          Students practice research, digital citizenship, collaboration, and creative communication while making useful content for our school community.
        </p>
      </div>

      <section className="mx-auto mb-8 w-full max-w-3xl px-1 md:mb-10" aria-label="The Brightside Project homepage video">
        <Card className="overflow-hidden border-border bg-card p-3 sm:p-4">
          <div className="[&_video]:mx-auto [&_video]:aspect-video [&_video]:max-h-[60dvh] [&_video]:w-full [&_video]:rounded-xl">
            <PublicationVideo
              src="/api/public/homepage-video"
              fallbackSrc="/api/public/homepage-video?format=webm"
              captions={{ src: "/media/homepage.en.vtt", srcLang: "en", label: "English" }}
            />
          </div>
        </Card>
        <PublicationDiscussion
          section="/content/featured/homepage-video"
          title="Homepage video"
          testId="featured-homepage-video"
        />
      </section>

      <HomeUpdates />

      <section id="bright-spots" className="mx-auto w-full max-w-6xl scroll-mt-6 px-1" aria-labelledby="bright-spots-title">
        <SectionHeading id="bright-spots-title">Find your bright spot</SectionHeading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {centers.map((center, index) => (
            <Link
              key={center.title}
              href={center.href}
              data-testid={`link-center-${index + 1}`}
              className="group rounded-2xl focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className={`flex min-h-24 items-center gap-3 border-border/70 ${center.color} p-3 transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md`}>
                <img
                  src={`/assets/bright/${center.image}`}
                  alt=""
                  className="h-16 w-20 shrink-0 rounded-xl object-cover sm:h-20 sm:w-24"
                  loading="lazy"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-lg font-bold leading-tight group-hover:text-primary sm:text-xl">{center.title}</span>
                  <span className="mt-1 block text-xs leading-snug text-foreground/75 sm:text-sm">{center.description}</span>
                </span>
                <ArrowUpRight aria-hidden="true" className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section id="student-creators" className="mx-auto mt-10 w-full max-w-6xl scroll-mt-6" aria-labelledby="creators-title">
        <SectionHeading id="creators-title">Behind every bright idea is a student creator</SectionHeading>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
          {creatorRoles.map((role, index) => (
            <div key={role} className="text-center">
              <Card className="overflow-hidden border-border bg-card">
                <img
                  src={`/assets/bright/creator-${index + 1}.jpg`}
                  alt={`Illustration of a student ${role.toLowerCase()}`}
                  className="h-24 w-full object-cover sm:h-28"
                  loading="lazy"
                />
              </Card>
              <p className="mt-1 inline-block rounded-full bg-muted/30 px-3 py-1 text-xs font-bold sm:text-sm">{role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 w-full max-w-6xl" aria-labelledby="process-title">
        <SectionHeading id="process-title">How we create</SectionHeading>
        <div className="w-full overflow-x-auto pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" role="region" aria-label="Creation process, scroll left to right" tabIndex={0}>
        <ol className="flex min-w-max items-center justify-center gap-8 px-1 py-2" aria-label="Our creation process, in order">
          {processSteps.map((step, index) => (
            <li key={step.title} className="relative flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-full border border-secondary/30 bg-card/70 p-2 text-center">
              <img src={`/assets/bright/${step.image}`} alt="" className="h-8 w-10 rounded-full object-contain" loading="lazy" />
              <span className="text-xs font-bold leading-tight">{step.title}</span>
              {index < processSteps.length - 1 && (
                <ArrowRight aria-hidden="true" className="absolute left-full top-1/2 ml-1 h-6 w-6 -translate-y-1/2 text-primary" />
              )}
            </li>
          ))}
        </ol>
        </div>
      </section>

      <section className="mx-auto mt-8 grid w-full max-w-6xl gap-3 md:grid-cols-2" aria-label="More ways to belong">
        <Link href="/review" data-testid="link-voice-matters" className="group rounded-2xl focus-visible:ring-2 focus-visible:ring-ring">
          <Card className="flex items-center gap-3 border-border bg-muted/25 p-3 transition-transform group-hover:-translate-y-0.5">
            <img src="/assets/bright/voice.jpg" alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" loading="lazy" />
            <span className="flex-1">
              <span className="block font-serif text-xl font-bold">Your voice matters</span>
              <span className="mt-1 block text-sm text-foreground/80">Student interest surveys and feedback help shape what comes next.</span>
            </span>
            <ArrowUpRight aria-hidden="true" className="h-5 w-5 text-primary" />
          </Card>
        </Link>
        <Link href="/grow/collab" data-testid="link-welcoming-space" className="group rounded-2xl focus-visible:ring-2 focus-visible:ring-ring">
          <Card className="flex items-center gap-3 border-border bg-secondary/15 p-3 transition-transform group-hover:-translate-y-0.5">
            <img src="/assets/bright/welcome.jpg" alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" loading="lazy" />
            <span className="flex-1">
              <span className="block font-serif text-xl font-bold">A welcoming digital space</span>
              <span className="mt-1 block text-sm text-foreground/80">Kind communication. Privacy respected. Helpful information you can trust.</span>
            </span>
            <ArrowUpRight aria-hidden="true" className="h-5 w-5 text-primary" />
          </Card>
        </Link>
      </section>
      <WaveFooter />
    </div>
  );
}
