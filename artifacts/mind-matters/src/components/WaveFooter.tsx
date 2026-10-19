import { Link } from "wouter";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Heart, Sun } from "lucide-react";

interface WaveFooterProps {
  quote?: string;
}

export function WaveFooter({ quote = "Learn. Create. Connect. Belong." }: WaveFooterProps) {
  return (
    <footer className="relative z-10 mt-10 w-full border-t border-border bg-background pt-6">
      <div className="relative flex flex-col items-center gap-4 px-2 pb-4 text-center text-foreground md:flex-row md:justify-between md:gap-6 md:text-left">
        <div className="flex max-w-sm flex-col items-center gap-1 md:items-start">
          <p className="flex items-center gap-2 font-serif text-2xl font-bold leading-tight">
            <Sun aria-hidden="true" className="h-8 w-8 shrink-0 fill-accent/30 text-accent" />
            The Brightside Project
          </p>
          <p className="text-sm text-foreground/80">{quote}</p>
        </div>
        <img
          src="/assets/bright/footer-landscape.jpg"
          alt="Illustrated green hills and a winding path beneath a warm sky"
          className="h-24 w-full max-w-md object-contain md:w-2/5"
          loading="lazy"
        />
        <div className="flex flex-col items-center gap-2">
          <Heart aria-hidden="true" className="h-7 w-7 text-secondary" />
          <p className="font-handwritten text-xl text-foreground/80">Same students. Brighter days.</p>
        </div>
      </div>
      <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-1 pb-3">
          {[
            { href: "/", label: "Home" },
            { href: "/events", label: "Events" },
            { href: "/resources", label: "Resources" },
            { href: "/contact", label: "Contact" },
          ].map((item) => (
            <Button key={item.href} asChild size="sm" variant="ghost" className="text-foreground hover:bg-secondary/10">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
      </nav>
    </footer>
  );
}
