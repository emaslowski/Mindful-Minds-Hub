import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { LogIn, LogOut, User, CheckCircle, Star, PenLine } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/events", label: "Events" },
    { href: "/contact", label: "Contact Us" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden bg-background">
      {/* Top Right Botanical Branch SVG */}
      <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-55 z-0">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
           <path d="M180 10 C140 50 100 80 60 150" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"/>
           <ellipse cx="155" cy="35" rx="18" ry="10" fill="hsl(var(--primary))" opacity="0.75" transform="rotate(-30 155 35)"/>
           <ellipse cx="130" cy="65" rx="20" ry="11" fill="hsl(var(--secondary))" opacity="0.85" transform="rotate(-20 130 65)"/>
           <ellipse cx="105" cy="95" rx="22" ry="12" fill="hsl(var(--accent))" opacity="0.8" transform="rotate(-10 105 95)"/>
           <ellipse cx="85" cy="125" rx="18" ry="10" fill="hsl(var(--primary))" opacity="0.7" transform="rotate(5 85 125)"/>
           <ellipse cx="70" cy="150" rx="15" ry="8" fill="hsl(var(--secondary))" opacity="0.8" transform="rotate(15 70 150)"/>
        </svg>
      </div>

      {/* Bottom Left Wildflower Bunch (Decorative only) */}
      <div className="fixed bottom-0 left-0 w-48 h-48 pointer-events-none opacity-25 z-0 transform -rotate-12 translate-y-8">
         <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
           <path d="M50 200 C60 140 80 100 100 50" stroke="hsl(var(--secondary))" strokeWidth="3" strokeLinecap="round"/>
           <path d="M30 200 C40 150 70 110 80 60" stroke="hsl(var(--secondary))" strokeWidth="2" strokeLinecap="round"/>
           <circle cx="100" cy="50" r="10" fill="hsl(var(--accent))" opacity="0.85"/>
           <ellipse cx="100" cy="40" rx="6" ry="12" fill="hsl(var(--primary))" opacity="0.8"/>
           <ellipse cx="110" cy="50" rx="12" ry="6" fill="hsl(var(--primary))" opacity="0.8"/>
           <ellipse cx="100" cy="60" rx="6" ry="12" fill="hsl(var(--primary))" opacity="0.8"/>
           <ellipse cx="90" cy="50" rx="12" ry="6" fill="hsl(var(--primary))" opacity="0.8"/>
           <circle cx="80" cy="60" r="6" fill="hsl(var(--accent))" opacity="0.75"/>
        </svg>
      </div>

      {/* Top Navbar */}
      <header className="w-full max-w-6xl mx-auto px-6 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between z-10 gap-6">
        
        {/* Logo */}
          <Link data-testid="link-home-logo" href="/" className="flex items-center gap-3 md:mb-0 hover:opacity-90 transition-opacity duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full">
          <div className="relative w-12 h-12 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
            {/* Cartoon smiling brain */}
            <svg viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Left hemisphere */}
              <path d="M50 20 C50 20 38 14 28 18 C18 22 12 32 14 42 C16 52 22 58 28 62 C34 66 44 68 50 68 Z" fill="#C4622D"/>
              {/* Right hemisphere */}
              <path d="M50 20 C50 20 62 14 72 18 C82 22 88 32 86 42 C84 52 78 58 72 62 C66 66 56 68 50 68 Z" fill="#D4734A"/>
              {/* Center divider */}
              <path d="M50 18 C50 18 48 30 49 45 C49.5 55 50 68 50 68" stroke="#A8522A" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6"/>
              {/* Brain folds — left */}
              <path d="M30 28 C26 33 25 40 27 46" stroke="#A8522A" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5"/>
              <path d="M36 22 C32 28 30 36 32 43" stroke="#A8522A" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4"/>
              <path d="M42 20 C39 26 38 34 40 41" stroke="#A8522A" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35"/>
              {/* Brain folds — right */}
              <path d="M70 28 C74 33 75 40 73 46" stroke="#A8522A" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5"/>
              <path d="M64 22 C68 28 70 36 68 43" stroke="#A8522A" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4"/>
              <path d="M58 20 C61 26 62 34 60 41" stroke="#A8522A" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35"/>
              {/* Bottom bumps */}
              <path d="M32 66 C36 72 44 74 50 74 C56 74 64 72 68 66" stroke="#C4622D" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              {/* Eyes */}
              <circle cx="38" cy="46" r="4.5" fill="#FAF3E3"/>
              <circle cx="62" cy="46" r="4.5" fill="#FAF3E3"/>
              <circle cx="39" cy="46" r="2.5" fill="#3D2314"/>
              <circle cx="63" cy="46" r="2.5" fill="#3D2314"/>
              {/* Eye shine */}
              <circle cx="40" cy="44.5" r="1" fill="white"/>
              <circle cx="64" cy="44.5" r="1" fill="white"/>
              {/* Smile */}
              <path d="M38 56 Q50 65 62 56" stroke="#3D2314" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              {/* Rosy cheeks */}
              <circle cx="32" cy="54" r="5" fill="#E8A090" opacity="0.35"/>
              <circle cx="68" cy="54" r="5" fill="#E8A090" opacity="0.35"/>
            </svg>
          </div>
          <div className="flex items-center font-display font-semibold text-2xl md:text-3xl text-foreground tracking-wide italic mt-1">
             <span className="text-terracotta">M</span>iddle&nbsp;
            <span className="text-terracotta">S</span>chool&nbsp;
            <span className="text-terracotta">M</span>atters
          </div>
        </Link>

        {/* Nav Links and Secondary Actions */}
        <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
          <nav className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-4">
            {links.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                   data-testid={`link-nav-${link.label.toLowerCase().replaceAll(" ", "-")}`}
                   className="group relative font-display italic text-xl md:text-2xl text-foreground hover:text-primary transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  <span>{link.label}</span>
                  {/* Botanical wavy underline on hover or active */}
                  <div className={`absolute -bottom-1 left-0 w-full overflow-hidden transition-all duration-300 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="w-full h-2 text-terracotta">
                      <path d="M0 5 Q 25 10, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                </Link>
              )
            })}
          </nav>
          
          <div className="flex flex-wrap justify-center items-center gap-3">
              <Link data-testid="link-check-in" href="/checkin" className="flex items-center gap-2 bg-accent/40 hover:bg-accent/70 text-accent-foreground px-4 py-1.5 rounded-full font-sans font-bold text-sm tracking-wide transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <CheckCircle size={16} /> Check In
            </Link>
              <Link data-testid="link-review" href="/review" className="flex items-center gap-2 bg-secondary/35 hover:bg-secondary/60 text-secondary-foreground px-4 py-1.5 rounded-full font-sans font-bold text-sm tracking-wide transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Star size={16} /> Review
            </Link>
            {/* Full-page nav to the separate Studio artifact */}
              <a data-testid="link-student-studio" href="/studio/" className="flex items-center gap-2 bg-primary/30 hover:bg-primary/55 text-primary px-4 py-1.5 rounded-full font-sans font-bold text-sm tracking-wide transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <PenLine size={16} aria-hidden="true" /> Student Studio
            </a>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-3 ml-2 border-l-2 border-border/50 pl-4">
                <span className="font-sans text-sm font-medium text-foreground/70 flex items-center gap-2">
                  <User size={16} /> Hi, {user?.firstName || 'Student'}!
                </span>
                <button onClick={logout} className="text-terracotta hover:text-terracotta/80 font-sans text-sm font-bold flex items-center gap-1 transition-colors">
                  <LogOut size={14} /> Log out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-2 border-l-2 border-border/50 pl-4">
                <Link href="/anonymous-access" className="text-sage hover:text-sage/80 font-sans text-sm font-bold flex items-center gap-1 transition-colors">
                  <LogIn size={14} /> Log in
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Decorative Wavy Divider below header */}
      <div className="w-full flex justify-center opacity-65 my-2">
        <svg width="200" height="10" viewBox="0 0 200 10" fill="none">
          <path d="M0 5 Q 50 10, 100 5 T 200 5" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none"/>
        </svg>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 relative z-10 flex flex-col items-center pb-20">
        {children}
      </main>
    </div>
  );
}
