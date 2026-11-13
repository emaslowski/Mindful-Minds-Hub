import { Link } from 'wouter';
import { BookOpenText, Presentation, NotebookPen, Globe2, PackageCheck, Users, Rocket, ShieldCheck, CheckCircle2, Send } from 'lucide-react';

import { ButtonLink, Card, Container, Eyebrow, Heading, Section } from '@/components/ui';
import { KIT_ART } from '@/components/KitArt';
import { PdAddOn, PricingGrid } from '@/components/Pricing';
import { Faq } from '@/components/Faq';
import { HUB_CENTERS, KIT_PARTS, SITE, TESTIMONIALS } from '@/config';

const PART_ICONS = {
  manual: BookOpenText,
  slides: Presentation,
  workbooks: NotebookPen,
  hub: Globe2,
} as const;

const PART_TINT = {
  manual: 'bg-sage-soft',
  slides: 'bg-mustard-soft',
  workbooks: 'bg-peach-soft',
  hub: 'bg-cream-deep',
} as const;

export default function Home() {
  return (
    <>
      {/* Hero */}
      <Section className="relative overflow-hidden pb-10 pt-10 sm:pt-16">
        <Container className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div className="order-2 lg:order-1">
            <Eyebrow>For teachers, schools and districts</Eyebrow>
            <Heading as="h1" className="mt-3">
              A complete wellness curriculum, ready for your classroom.
            </Heading>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cocoa-soft">
              The Brightside Wellness Project learning kit gives teachers everything they need to
              help students learn, create, connect and belong: a teacher manual, lesson slide
              decks, student workbooks, and access to a live student-led wellness website. Buy one
              kit for your classroom, or roll it out district-wide with on-site professional
              development.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/kits" size="lg">See kits & pricing</ButtonLink>
              <ButtonLink href="/order?kit=district" size="lg" variant="ghost">Request a district quote</ButtonLink>
            </div>
            <p className="mt-4 text-sm text-cocoa-soft">
              Already a Brightside school?{' '}
              <Link href="/school-login" className="font-semibold text-coral underline-offset-4 hover:underline">Find your school's hub</Link>
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-cocoa-soft">
              {['Teacher manual', 'Slide decks', 'Student workbooks', `${SITE.accessMonths}-month hub access`, 'Optional on-site PD'].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-mustard" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 flex justify-center lg:order-2">
            <div className="rounded-2xl border border-cocoa/10 bg-paper p-8 shadow-card sm:p-12">
              <img
                src="/logo.png"
                alt="The Brightside Wellness Project"
                width={1000}
                height={796}
                className="w-[260px] max-w-full sm:w-[340px] lg:w-[420px]"
                fetchPriority="high"
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Trust band */}
      <div className="border-y border-cocoa/10 bg-paper/70">
        <Container className="grid gap-6 py-8 sm:grid-cols-3">
          {[
            { icon: Users, title: 'Any teacher can lead it', text: 'Scripted lessons and speaker notes mean no specialist is required.' },
            { icon: ShieldCheck, title: 'Teacher-reviewed publishing', text: 'Nothing goes live on the hub until a teacher approves it.' },
            { icon: Rocket, title: 'Up and running in a week', text: 'Order, receive your kit and accounts, and teach lesson one.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-cream text-coral">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-cocoa">{title}</h3>
                <p className="text-sm text-cocoa-soft">{text}</p>
              </div>
            </div>
          ))}
        </Container>
      </div>

      {/* What's inside */}
      <Section id="inside" className="scroll-mt-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>What's inside the box</Eyebrow>
            <Heading className="mt-2">Four parts. One bright, connected curriculum.</Heading>
            <p className="mt-4 text-lg text-cocoa-soft">
              Printed materials for the classroom, slides for the screen, and a website where
              students' work comes to life.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {KIT_PARTS.map((part) => {
              const Art = KIT_ART[part.key];
              const Icon = PART_ICONS[part.key];
              return (
                <Card key={part.key} className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className={`${PART_TINT[part.key]} h-44 w-full shrink-0 rounded-xl p-3 sm:h-44 sm:w-44`}>
                    <Art />
                  </div>
                  <div>
                    <h3 className="flex items-center gap-2 font-display text-2xl font-semibold text-cocoa">
                      <Icon className="h-5 w-5 text-coral" />
                      {part.title}
                    </h3>
                    <p className="mt-1 text-cocoa-soft">{part.short}</p>
                    <ul className="mt-3 space-y-1.5 text-sm text-cocoa">
                      {part.details.map((d) => (
                        <li key={d} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mustard" aria-hidden="true" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href="/kits" variant="secondary" size="lg">Compare the kits</ButtonLink>
          </div>
        </Container>
      </Section>

      {/* How it works */}
      <Section className="bg-cocoa text-cream">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow tone="mustard">How it works</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">From order to first lesson in three steps</h2>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: PackageCheck, title: 'Order your kit', text: 'Pay by card, or send a purchase order and we will invoice your district. Kits ship within 5 business days.' },
              { icon: Users, title: 'Receive materials & accounts', text: 'Manuals and workbooks arrive at your school. Teachers get hub accounts and a short onboarding session.' },
              { icon: Send, title: 'Teach, create, publish', text: 'Follow the manual, present the slides, and watch students publish stories, art and podcasts on your hub.' },
            ].map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative rounded-2xl border border-cream/15 bg-cream/5 p-7">
                <span className="absolute -top-4 left-7 grid h-9 w-9 place-items-center rounded-lg bg-mustard font-display text-base font-bold text-cocoa">
                  {i + 1}
                </span>
                <Icon className="mt-2 h-7 w-7 text-peach" />
                <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
                <p className="mt-2 text-cream/80">{text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* The hub */}
      <Section id="hub" className="scroll-mt-20">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Included with every kit</Eyebrow>
            <Heading className="mt-2">{SITE.hubName}: where student work comes to life</Heading>
            <p className="mt-5 text-lg leading-relaxed text-cocoa-soft">
              The hub is a student-created school community website. Students research, write,
              draw, record and cook, then submit their work through the Student Studio. Teachers
              review it in the Command Center and publish it to the whole school.
            </p>
            <ul className="mt-6 space-y-3 text-cocoa">
              {[
                'Student Studio with projects, peer review and a portfolio for every student',
                'Teacher Command Center: rosters, review queues, events and analytics',
                'Private journaling with alerts to teachers for concerning entries',
                'Google sign-in with school accounts; nothing is public until approved',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={SITE.hubUrl} external variant="dark">Visit the live hub</ButtonLink>
              <ButtonLink href="/kits" variant="ghost">See what each kit includes</ButtonLink>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {HUB_CENTERS.map((c, i) => (
                <div
                  key={c.title}
                  className={[
                    'rounded-xl border border-cocoa/10 p-4',
                    ['bg-peach-soft', 'bg-mustard-soft', 'bg-sage-soft', 'bg-paper'][i % 4],
                  ].join(' ')}
                >
                  <h3 className="font-display text-[15px] font-semibold leading-tight text-cocoa">{c.title}</h3>
                  <p className="mt-1 text-xs text-cocoa-soft">{c.blurb}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-sm text-cocoa-soft">Twelve centers, all created by students and reviewed by teachers.</p>
          </div>
        </Container>
      </Section>

      {/* Outcomes */}
      <Section className="bg-paper/70">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Why schools choose Brightside</Eyebrow>
            <Heading className="mt-2">Wellness students practice, not just hear about</Heading>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Belonging', text: 'Every student gets a role: writer, researcher, artist, podcaster, designer or community reporter.' },
              { title: 'Self-awareness', text: 'Daily check-ins, gratitude pages and private journaling build a habit of noticing feelings.' },
              { title: 'Digital citizenship', text: 'Students learn to research, cite, give feedback and publish responsibly on a real website.' },
              { title: 'Creative communication', text: 'Stories, podcasts, videos, recipes and art give every student a way to be heard.' },
            ].map((o, i) => (
              <Card key={o.title} className="border-t-4 border-t-coral">
                <span className="sr-only">{i + 1}</span>
                <h3 className="font-display text-xl font-bold text-cocoa">{o.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cocoa-soft">{o.text}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Student testimonials */}
      <Section id="students" className="scroll-mt-20 bg-cocoa text-cream">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow tone="mustard">What students say</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">In their own words</h2>
            <p className="mt-4 text-lg text-cream/80">
              From 5th grade students who used the hub and the lessons this year.
            </p>
          </div>
          <ul className="mt-12 grid gap-6 md:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <li key={t.quote} className="flex flex-col rounded-2xl border border-cream/15 bg-cream/5 p-7">
                <span className="font-display text-5xl leading-none text-mustard" aria-hidden="true">&ldquo;</span>
                <blockquote className="mt-2 text-lg leading-relaxed text-cream">
                  <p>{t.quote}</p>
                </blockquote>
                <p className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-peach">{t.who}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Professional development */}
      <Section id="pd" className="scroll-mt-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>In person, in your district</Eyebrow>
            <Heading className="mt-2">Professional development that comes to you</Heading>
            <p className="mt-4 text-lg text-cocoa-soft">
              Add two or three days of on-site training to any kit, so every teacher starts
              lesson one ready and every leader has a plan.
            </p>
          </div>
          <div className="mt-12">
            <PdAddOn />
          </div>
        </Container>
      </Section>

      {/* Pricing */}
      <Section id="pricing" className="scroll-mt-20 pt-0">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Kits & pricing</Eyebrow>
            <Heading className="mt-2">Pick the kit that fits you</Heading>
            <p className="mt-4 text-lg text-cocoa-soft">
              A single teacher can buy the Classroom Kit by card in minutes. Schools and districts
              can order with a purchase order and add on-site professional development.{' '}
              <Link href="/kits" className="font-semibold text-coral underline-offset-4 hover:underline">See the full comparison.</Link>
            </p>
          </div>
          <div className="mt-14">
            <PricingGrid compact />
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section id="faq" className="scroll-mt-20 pt-0">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Questions</Eyebrow>
            <Heading className="mt-2">Frequently asked</Heading>
          </div>
          <div className="mt-10">
            <Faq />
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="pt-0">
        <Container>
          <div className="rounded-2xl bg-cocoa px-8 py-14 text-center text-cream shadow-soft sm:px-16">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Ready to bring Brightside to your classroom?</h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-cream/80">
              Order a kit today, or tell us about your district and we will put together a quote,
              with or without on-site professional development.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/order" size="lg">Order a kit</ButtonLink>
              <ButtonLink href={`mailto:${SITE.contactEmail}`} size="lg" variant="ghost" className="border-cream/40 text-cream hover:bg-cream/10 hover:text-cream">Email us</ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
