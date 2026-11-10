import { ButtonLink, Container, Eyebrow, Heading, Section } from '@/components/ui';

export default function NotFound() {
  return (
    <Section>
      <Container className="max-w-xl text-center">
        <Eyebrow>Oops</Eyebrow>
        <Heading as="h1" className="mt-2">We couldn't find that page.</Heading>
        <p className="mt-4 text-lg text-cocoa-soft">The link may be old, or the page may have moved.</p>
        <div className="mt-8">
          <ButtonLink href="/" variant="dark">Back to home</ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
