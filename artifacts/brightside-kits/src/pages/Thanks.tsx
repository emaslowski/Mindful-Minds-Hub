import { useSearch } from 'wouter';

import { ButtonLink, Container, Eyebrow, Heading, Section } from '@/components/ui';
import { BrainMark } from '@/components/KitArt';
import { SITE, kitById } from '@/config';

export default function Thanks() {
  const params = new URLSearchParams(useSearch());
  const reference = params.get('ref');
  const kit = kitById(params.get('kit'));
  const payment = params.get('payment');
  const fromStripe = params.has('session_id');

  const headline = fromStripe
    ? 'Payment received. Thank you!'
    : payment === 'quote'
      ? 'Your quote request is in.'
      : 'Your order is in.';

  const next = fromStripe
    ? 'We will email your receipt and reach out within two school days to arrange shipping and set up your hub accounts.'
    : payment === 'card'
      ? 'We will email a secure checkout link within two school days. Your kit ships as soon as payment clears.'
      : payment === 'purchase_order'
        ? 'We will email a formal quote and invoice within two school days, along with a W-9 for your business office.'
        : 'We will email a quote within two school days. Reply to that email with any questions.';

  return (
    <Section>
      <Container className="max-w-2xl text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-peach-soft">
          <BrainMark size={72} />
        </div>
        <Eyebrow className="mt-6">Thank you</Eyebrow>
        <Heading as="h1" className="mt-2">{headline}</Heading>
        <p className="mt-5 text-lg text-cocoa-soft">{next}</p>
        {(kit || reference) && (
          <dl className="mx-auto mt-8 grid max-w-md gap-3 rounded-[2rem] border border-cocoa/10 bg-paper p-6 text-left shadow-card">
            {kit && (
              <div className="flex justify-between gap-4">
                <dt className="text-cocoa-soft">Kit</dt>
                <dd className="font-semibold text-cocoa">{kit.name}</dd>
              </div>
            )}
            {reference && (
              <div className="flex justify-between gap-4">
                <dt className="text-cocoa-soft">Reference</dt>
                <dd className="font-mono font-semibold text-cocoa">{reference}</dd>
              </div>
            )}
          </dl>
        )}
        <p className="mt-8 text-cocoa-soft">
          Questions in the meantime? Email <a href={`mailto:${SITE.contactEmail}`} className="font-semibold text-coral underline-offset-4 hover:underline">{SITE.contactEmail}</a>.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" variant="dark">Back to home</ButtonLink>
          <ButtonLink href={SITE.hubUrl} external variant="ghost">Visit the hub</ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
