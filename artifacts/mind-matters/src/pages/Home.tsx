import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card } from "@workspace/mind-matters-ds/components/ui/card";
import { WaveFooter } from "@/components/WaveFooter";
import { HomeUpdates } from "@/components/HomeUpdates";
import { useSiteContent } from "@/lib/siteContent";

const TILE_COLORS = ["bg-muted/30", "bg-secondary/20", "bg-accent/25", "bg-accent/25", "bg-secondary/20", "bg-muted/30", "bg-secondary/20", "bg-muted/30", "bg-accent/25", "bg-secondary/20", "bg-muted/30", "bg-accent/25", "bg-secondary/20", "bg-muted/30"];

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
  const hero = useSiteContent("home.hero");
  const centers = useSiteContent("home.centers");
  const creatorRoles = useSiteContent("home.creatorRoles");
  const processSteps = useSiteContent("home.processSteps");
  const [bannerLine1, ...bannerRest] = hero.bannerTagline.split(/(?<=\.)\s+/);
  return (
    <div className="home-page w-full pb-8">
      <section className="mx-auto w-full max-w-6xl px-2 pb-8 pt-5 md:pb-10 md:pt-8" aria-labelledby="home-title">
        <div className="max-w-3xl">
          <h1 id="home-title" className="font-serif text-5xl font-bold leading-[0.93] tracking-tight text-foreground sm:text-6xl md:text-7xl">
            {hero.headline}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/85 sm:text-lg">
            {hero.intro}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild size="sm" variant="secondary" data-testid="link-explore-centers">
              <a href="#bright-spots">{hero.exploreButton} <ArrowDown aria-hidden="true" /></a>
            </Button>
          </div>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/85" data-testid="text-home-purpose">
            {hero.purpose}
          </p>
        </div>
      </section>

      <div className="mx-auto mb-8 flex w-full max-w-6xl flex-col items-start gap-3 border-y border-border px-3 py-4 sm:flex-row sm:items-center md:mb-10 md:px-6">
        <div className="hidden shrink-0 items-center md:flex" aria-hidden="true">
          <img src="/assets/bright/tile-13.jpg" alt="" className="h-12 w-14 object-cover" />
        </div>
        <p className="font-serif text-lg font-semibold leading-snug md:w-2/5 md:text-xl">
          {bannerLine1}{bannerRest.length > 0 && <><br />{bannerRest.join(" ")}</>}
        </p>
        <div className="hidden h-10 w-px bg-border md:block" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-foreground/80 md:flex-1">
          {hero.bannerMission}
        </p>
      </div>

      <HomeUpdates />

      <section id="bright-spots" className="mx-auto w-full max-w-6xl scroll-mt-6 px-1" aria-labelledby="bright-spots-title">
        <SectionHeading id="bright-spots-title">{hero.centersTitle}</SectionHeading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {centers.map((center, index) => (
            <Link
              key={`${center.title}-${index}`}
              href={center.href}
              data-testid={`link-center-${index + 1}`}
              className="group rounded-2xl focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className={`flex min-h-24 items-center gap-3 border-border/70 ${TILE_COLORS[index % TILE_COLORS.length]} p-3 transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md`}>
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
        <SectionHeading id="creators-title">{hero.creatorsTitle}</SectionHeading>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
          {creatorRoles.map((role, index) => (
            <div key={`${role}-${index}`} className="text-center">
              <Card className="overflow-hidden border-border bg-card">
                <img
                  src={`/assets/bright/creator-${(index % 7) + 1}.jpg`}
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
        <SectionHeading id="process-title">{hero.processTitle}</SectionHeading>
        <div className="w-full overflow-x-auto pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" role="region" aria-label="Creation process, scroll left to right" tabIndex={0}>
        <ol className="flex min-w-max items-center justify-center gap-8 px-1 py-2" aria-label="Our creation process, in order">
          {processSteps.map((step, index) => (
            <li key={`${step.title}-${index}`} className="relative flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-full border border-secondary/30 bg-card/70 p-2 text-center">
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
