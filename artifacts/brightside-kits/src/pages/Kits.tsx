import { useEffect } from 'react';
import { Check as CheckIcon, Minus } from 'lucide-react';

import { ButtonLink, Container, Eyebrow, Heading, Section } from '@/components/ui';
import { KIT_ART } from '@/components/KitArt';
import { PricingGrid } from '@/components/Pricing';
import { KITS, KIT_PARTS, SITE } from '@/config';

type Cell = true | false | string;

const COMPARISON: { label: string; cells: Record<string, Cell> }[] = [
  { label: 'Teacher manual (print + PDF)', cells: { classroom: '1', school: '10', district: 'Per classroom' } },
  { label: 'Lesson slide decks (PowerPoint + Google Slides)', cells: { classroom: true, school: true, district: true } },
  { label: 'Student workbooks', cells: { classroom: '35', school: '350', district: 'Per student' } },
  { label: `Hub access (${SITE.accessMonths} months)`, cells: { classroom: '1 class', school: 'Whole school', district: 'District-wide' } },
  { label: 'Teacher accounts', cells: { classroom: '1', school: 'Up to 10', district: 'Unlimited' } },
  { label: 'Student Studio & portfolios', cells: { classroom: true, school: true, district: true } },
  { label: 'Teacher Command Center', cells: { classroom: true, school: true, district: true } },
  { label: 'School-branded hub (name, logo, colors)', cells: { classroom: false, school: true, district: 'Per school' } },
  { label: 'Live teacher onboarding', cells: { classroom: false, school: '1 session', district: 'Per school' } },
  { label: 'Support', cells: { classroom: 'Email', school: 'Priority email', district: 'Dedicated contact' } },
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
            One curriculum, three ways to buy it. Every kit ships with the same four parts; the
            difference is how many teachers and students it covers and how much support comes with it.
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
                className={['rounded-3xl p-4 shadow-card', ['bg-sage-soft', 'bg-mustard-soft', 'bg-peach-soft', 'bg-cream-deep'][i]].join(' ')}
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
        </Container>
      </Section>

      {/* Comparison table */}
      <Section className="bg-paper/70">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Side by side</Eyebrow>
            <Heading className="mt-2">What each kit includes</Heading>
          </div>
          <div className="mt-10 overflow-x-auto rounded-[2rem] border border-cocoa/10 bg-paper shadow-card">
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
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[2.5rem] bg-cocoa p-8 text-cream shadow-soft sm:p-10">
            <p className="font-script text-2xl text-mustard">Let's talk</p>
            <h3 className="mt-1 font-display text-3xl font-semibold">Need a quote for several schools?</h3>
            <p className="mt-3 text-cream/80">
              Tell us how many schools, teachers and students you would like to include and we will
              send a quote within two school days.
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
