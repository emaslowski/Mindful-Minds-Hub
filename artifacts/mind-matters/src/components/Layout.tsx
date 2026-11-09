import { useLayoutEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/auth-web";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { CheckCircle, Home, LogIn, LogOut, PenLine, Star, Sun, User } from "lucide-react";
import { ContentComments, normalizePublicCommentSection } from "@/components/ContentComments";

const mainLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact Us" },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previousRestoration; };
  }, []);

  useLayoutEffect(() => {
    // Section navigation must not keep the previous page's position near its
    // comments. Leave explicit anchor links to the browser.
    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [location]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-background">
      <header className="relative z-20 mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 pb-3 pt-3 md:flex-row md:items-center md:justify-between md:px-6">
        <Link
          data-testid="link-home-logo"
          href="/"
          aria-label="The Brightside Project home"
          className="flex items-center gap-2 self-center rounded-md text-foreground transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring md:self-auto"
        >
          <Sun aria-hidden="true" className="h-9 w-9 fill-accent/50 text-accent" />
          <span className="font-serif text-xl font-bold leading-tight sm:text-2xl">
            The Brightside Project
          </span>
        </Link>

        <div className="flex flex-col items-center gap-2 md:items-end">
          <nav aria-label="Main navigation" className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 md:justify-end">
            {mainLinks.map((item) => {
              const active = location === item.href || (item.href !== "/" && location.startsWith(`${item.href}/`));
              return (
                <Button
                  key={item.href}
                  asChild
                  variant="link"
                  size="sm"
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                  className={active ? "font-bold text-primary" : "text-foreground"}
                >
                  <Link href={item.href} aria-current={active ? "page" : undefined}>{item.label}</Link>
                </Button>
              );
            })}
          </nav>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild size="sm" variant="amber" data-testid="link-check-in">
              <Link href="/checkin"><CheckCircle aria-hidden="true" />Check In</Link>
            </Button>
            <Button asChild size="sm" variant="secondary" data-testid="link-review">
              <Link href="/review"><Star aria-hidden="true" />Review</Link>
            </Button>
            <Button asChild size="sm" variant="default" data-testid="link-student-studio">
              <a href="/studio/"><PenLine aria-hidden="true" />Student Studio</a>
            </Button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 border-l border-border pl-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground/80 sm:text-sm">
                  <User aria-hidden="true" className="h-4 w-4" />
                  Hi, {user?.firstName || "Student"}!
                </span>
                <Button type="button" size="sm" variant="ghost" onClick={logout} data-testid="button-log-out">
                  <LogOut aria-hidden="true" />Log out
                </Button>
              </div>
            ) : (
              <Button asChild size="sm" variant="ghost" data-testid="link-log-in">
                <Link href="/anonymous-access"><LogIn aria-hidden="true" />Log in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4" aria-hidden="true">
        <svg viewBox="0 0 200 10" className="h-2 w-full text-primary/45">
          <path d="M0 5 Q50 10 100 5 T200 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 pb-10 md:px-6">
        {location !== "/" && (
          <div className="mt-4 mb-2 flex w-full justify-start">
            <Button asChild size="sm" variant="outline">
              <Link href="/" data-testid="link-return-home" onClick={() => window.scrollTo(0, 0)}>
                <Home aria-hidden="true" />
                Return to Home
              </Link>
            </Button>
          </div>
        )}
        {children}
        {normalizePublicCommentSection(location) && (
          <ContentComments
            key={normalizePublicCommentSection(location) ?? location}
            section={normalizePublicCommentSection(location)!}
          />
        )}
      </main>
    </div>
  );
}
