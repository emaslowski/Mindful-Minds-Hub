import { useEffect } from 'react';
import { Check as CheckIcon, Minus } from 'lucide-react';

import { ButtonLink, Container, Eyebrow, Heading, Section } from '@/components/ui';
import { KIT_ART } from '@/components/KitArt';
import { FoundingOffer, PdAddOn, PricingGrid } from '@/components/Pricing';
import { EXTRAS, KITS, KIT_PARTS, PD, SITE, formatPrice } from '@/config';

const pdCell = `Add-on, from ${formatPrice(PD.options[0].price)}`;

type Cell = true | false | string;

const COMPARISON: { label: string; cells: Record<string, Cell> }[] = [
  { label: 'Teacher manual (print + PDF)', cells: { classroom: '1', school: '10', district: 'Per classroom' } },
  { label: 'Lesson slide decks (PowerPoint + Google Slides)', cells: { classroom: true, school: true, district: true } },
  { label: 'Student workbooks', cells: { classroom: '35', school: '350', district: 'Per student' } },
  { label: `Extra workbooks (${EXTRAS[0].unit}) / extra manual`, cells: { classroom: `${formatPrice(EXTRAS[0].price)} / ${formatPrice(EXTRAS[1].price)}`, school: `${formatPrice(EXTRAS[0].price)} / ${formatPrice(EXTRAS[1].price)}`, district: 'Included in quote' } },
  { label: `Hub access (${SITE.accessMonths} months)`, cells: { classroom: '1 class', school: 'Whole school', district: 'District-wide' } },
  { label: 'Teacher accounts', cells: { classroom: '1', school: 'Up to 10', district: 'Unlimited' } },
  { label: 'Student Studio & portfolios', cells: { classroom: true, school: true, district: true } },
  { label: 'Teacher Command Center', cells: { classroom: true, school: true, district: true } },
  { label: 'School-branded hub (name, logo, colors)', cells: { classroom: false, school: true, district: 'Per school' } },
  { label: 'Live teacher onboarding', cells: { classroom: false, school: '1 session', district: 'Per school' } },
  { label: 'Support', cells: { classroom: 'Email', school: 'Priority email', district: 'Dedicated contact' } },
  { label: 'On-site professional development (2 or 3 days)', cells: { classroom: pdCell, school: pdCell, district: 'Add-on or built into your quote' } },
  { label: 'Pay by card without a purchase order', cells: { classroom: true, school: true, district: false } },
  { label: 'Multi-year pricing', cells: { classroom: false, school: false, district: true } },
];

function CellValue({ value }: { value: Cell }) {
  if (value === true) return <CheckIcon className="mx-auto h-5 w-5 text-sage" aria-label="Included" />;
  if (value === false) return <Minus className="mx-auto h-5 w-5 text-cocoa/30" aria-label="Not included" />;
  return <span className="font-semibold text-cocoa">{value}</span>;
}

export default function Kits() {
  useEffect(() => {
    document.title = `Kits & pricing — ${SITE.name}`;
    return () => {
      document.title = `${SITE.name} — Learning Kits for Schools`;
    };
  }, []);

  return (
    <>
      <Section className="pb-8">
        <Container className="text-center">
          <Eyebrow>Kits & pricing</Eyebrow>
          <Heading as="h1" className="mt-2">The Brightside Wellness Learning Kit</Heading>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-cocoa-soft">
            One curriculum, three ways to buy it: as a teacher, as a school, or as a district.
            Every kit ships with the same four parts; the difference is how many teachers and
            students it covers and how much support comes with it. On-site professional
            development can be added to any of them.
          </p>
        </Container>
      </Section>

      {/* Product gallery */}
      <Container>
        <div className="grid gap-4 sm:grid-cols-4">
          {KIT_PARTS.map((part, i) => {
            const Art = KIT_ART[part.key];
            return (
              <figure
                key={part.key}
                className={['rounded-xl border border-cocoa/10 p-4', ['bg-sage-soft', 'bg-mustard-soft', 'bg-peach-soft', 'bg-cream-deep'][i]].join(' ')}
              >
                <div className="aspect-square">
                  <Art />
                </div>
                <figcaption className="mt-2 text-center font-display font-semibold text-cocoa">{part.title}</figcaption>
              </figure>
            );
          })}
        </div>
      </Container>

      <Section id="pricing" className="scroll-mt-20">
        <Container>
          <PricingGrid />
          <div className="mt-10">
            <FoundingOffer />
          </div>
        </Container>
      </Section>

      {/* Professional development add-on */}
      <Section id="pd" className="scroll-mt-20 pt-0">
        <Container>
          <PdAddOn />
        </Container>
      </Section>

      {/* Comparison table */}
      <Section className="bg-paper/70">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Side by side</Eyebrow>
            <Heading className="mt-2">What each kit includes</Heading>
          </div>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-cocoa/10 bg-paper shadow-card">
            <table className="w-full min-w-[640px] text-left text-[15px]">
              <thead>
                <tr className="border-b border-cocoa/10">
                  <th scope="col" className="px-6 py-4 font-display text-base font-semibold text-cocoa-soft">Feature</th>
                  {KITS.map((k) => (
                    <th key={k.id} scope="col" className="px-4 py-4 text-center font-display text-lg font-semibold text-cocoa">
                      {k.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.label} className={i % 2 ? 'bg-cream/60' : undefined}>
                    <th scope="row" className="px-6 py-3.5 font-medium text-cocoa">{row.label}</th>
                    {KITS.map((k) => (
                      <td key={k.id} className="px-4 py-3.5 text-center">
                        <CellValue value={row.cells[k.id]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>

      {/* Materials sold separately */}
      <Section id="materials" className="scroll-mt-20 pt-0">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Materials sold separately</Eyebrow>
            <Heading className="mt-3">Need extra workbooks or another manual?</Heading>
            <p className="mt-4 text-lg text-cocoa-soft">
              Add these to any kit order, or order them on their own for a new class, a new teacher
              or next year's students.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            {EXTRAS.map((x) => {
              const Art = KIT_ART[x.id === 'manual' ? 'manual' : 'workbooks'];
              return (
                <article key={x.id} className="flex gap-5 rounded-2xl border border-cocoa/10 bg-paper p-6 shadow-card">
                  <div className={`${x.id === 'manual' ? 'bg-sage-soft' : 'bg-peach-soft'} h-28 w-28 shrink-0 rounded-xl p-2`}>
                    <Art />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <h3 className="font-display text-xl font-bold text-cocoa">{x.name}</h3>
                    <p className="mt-1 flex items-baseline gap-2">
                      <span className="font-display text-3xl font-bold text-cocoa">{formatPrice(x.price)}</span>
                      <span className="text-sm text-cocoa-soft">per {x.unit}</span>
                    </p>
                    <p className="mt-2 text-sm text-cocoa-soft">{x.blurb}</p>
                    <div className="mt-4">
                      <ButtonLink href={`/order?kit=classroom&${x.id}=1`} variant="dark">Add to an order</ButtonLink>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mt-6 text-center text-sm text-cocoa-soft">
            Prices are per unit before shipping. Slide decks and hub access are included with every kit and are not sold separately.
          </p>
        </Container>
      </Section>

      {/* Buying as a teacher */}
      <Section className="pb-0">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="rounded-2xl border border-cocoa/10 bg-paper p-8 shadow-card sm:p-10 lg:order-2">
            <Eyebrow>For teachers</Eyebrow>
            <h3 className="mt-3 font-display text-3xl font-bold text-cocoa">Buying for your own classroom?</h3>
            <p className="mt-3 text-cocoa/80">
              The Classroom Kit is {formatPrice(KITS[0].price)} and you can pay by card today. It ships
              to your school, and your class gets its own hub access the same week.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/order?kit=classroom" variant="dark" size="lg">Order a Classroom Kit</ButtonLink>
            </div>
          </div>
          <div className="lg:order-1">
            <Eyebrow>No purchasing office needed</Eyebrow>
            <Heading className="mt-2">Buying as a teacher</Heading>
            <p className="mt-5 text-lg leading-relaxed text-cocoa-soft">
              Many Brightside classrooms start with one teacher. You do not need a district contract
              or an IT project to get going.
            </p>
            <ul className="mt-6 space-y-3 text-cocoa">
              {[
                'Pay by card, or request a quote your principal can approve',
                'Everything arrives at your school within 5 business days',
                'Hub accounts for you and your students, with Google sign-in',
                'Scripted lessons and slides, so your first lesson can be next week',
                'Ask about PD: a 2-day institute can train your whole building',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Buying for a district */}
      <Section>
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>For purchasing offices</Eyebrow>
            <Heading className="mt-2">Buying as a school district</Heading>
            <p className="mt-5 text-lg leading-relaxed text-cocoa-soft">
              We work the way districts buy. Choose "Purchase order" on the order form and we will
              send a formal quote and vendor paperwork for your business office.
            </p>
            <ul className="mt-6 space-y-3 text-cocoa">
              {[
                'Formal quotes valid for 90 days',
                'Purchase orders accepted; net-30 invoicing',
                'W-9 and vendor registration forms on request',
                'Card and ACH payments through a secure checkout',
                'Ships to one address per school, or one central warehouse',
                'Hub accounts created from a roster spreadsheet you send us',
                `On-site professional development (${PD.options[0].days} or ${PD.options[1].days} days) on the same quote`,
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-cocoa p-8 text-cream shadow-soft sm:p-10">
            <Eyebrow tone="mustard">Let's talk</Eyebrow>
            <h3 className="mt-3 font-display text-3xl font-bold">Need a quote for several schools?</h3>
            <p className="mt-3 text-cream/80">
              Tell us how many schools, teachers and students you would like to include, and whether
              you want professional development on site, and we will send a quote within two school days.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/order?kit=district" variant="secondary" size="lg">Request a district quote</ButtonLink>
              <ButtonLink href={`mailto:${SITE.contactEmail}`} variant="ghost" size="lg" className="border-cream/30 text-cream hover:bg-cream/10 hover:text-cream">
                Email {SITE.contactEmail}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
