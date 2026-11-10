import { Link, useParams } from "wouter";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { PublishedSection } from "@/components/PublishedSection";
import { WaveFooter } from "@/components/WaveFooter";
import { useSiteSections } from "@/lib/sections";

/**
 * A teacher-created section of the website (for example "Jokes"). The
 * section's title and intro come from the Studio; the pages listed are the
 * student projects teachers published to it.
 */
export default function SectionPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: sections, isLoading } = useSiteSections();
  const section = sections?.find((s) => s.slug === slug);

  if (isLoading) {
    return <div className="mx-auto w-full max-w-4xl px-4 py-16" aria-busy="true"><div className="h-10 w-2/3 animate-pulse rounded-lg bg-card" /></div>;
  }
  if (!section) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-foreground">This page isn't here yet</h1>
        <p className="mt-3 text-foreground/80">There's no section called "{slug}". It may have been renamed or removed.</p>
        <Button asChild className="mt-6"><Link href="/">Back to the homepage</Link></Button>
      </div>
    );
  }

  return (
    <div className="w-full pb-8">
      <section className="mx-auto w-full max-w-4xl px-4 pb-6 pt-8 text-center" aria-labelledby="section-title">
        {section.emoji && <div aria-hidden="true" className="mb-2 text-5xl">{section.emoji}</div>}
        <h1 id="section-title" className="font-serif text-4xl font-bold text-foreground md:text-5xl">{section.title}</h1>
        {section.intro && <p className="mx-auto mt-4 max-w-2xl whitespace-pre-line text-base leading-relaxed text-foreground/85 sm:text-lg">{section.intro}</p>}
      </section>
      <PublishedSection
        section={section.slug}
        heading="From Our Students"
        className="mb-12"
        emptyMessage="Nothing has been published here yet. Check back soon!"
      />
      <WaveFooter />
    </div>
  );
}
