import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { LogIn, LogOut, User, CheckCircle, Star } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated, login, logout } = useAuth();

  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/resources", label: "Resources" },
    { href: "/events", label: "Events" },
    { href: "/contact", label: "Contact Us" },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Top Right Botanical Branch SVG */}
      <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-30 z-0">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M180 10 C140 50 100 80 60 150" stroke="#C4622D" strokeWidth="2.5" strokeLinecap="round"/>
          <ellipse cx="155" cy="35" rx="18" ry="10" fill="#C4622D" opacity="0.6" transform="rotate(-30 155 35)"/>
          <ellipse cx="130" cy="65" rx="20" ry="11" fill="#688A52" opacity="0.7" transform="rotate(-20 130 65)"/>
          <ellipse cx="105" cy="95" rx="22" ry="12" fill="#D4A44C" opacity="0.5" transform="rotate(-10 105 95)"/>
          <ellipse cx="85" cy="125" rx="18" ry="10" fill="#C4622D" opacity="0.5" transform="rotate(5 85 125)"/>
          <ellipse cx="70" cy="150" rx="15" ry="8" fill="#688A52" opacity="0.6" transform="rotate(15 70 150)"/>
        </svg>
      </div>

      {/* Bottom Left Wildflower Bunch (Decorative only) */}
      <div className="fixed bottom-0 left-0 w-48 h-48 pointer-events-none opacity-10 z-0 transform -rotate-12 translate-y-8">
         <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 200 C60 140 80 100 100 50" stroke="#688A52" strokeWidth="3" strokeLinecap="round"/>
          <path d="M30 200 C40 150 70 110 80 60" stroke="#688A52" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="100" cy="50" r="10" fill="#D4A44C" opacity="0.6"/>
          <ellipse cx="100" cy="40" rx="6" ry="12" fill="#C4622D" opacity="0.6"/>
          <ellipse cx="110" cy="50" rx="12" ry="6" fill="#C4622D" opacity="0.6"/>
          <ellipse cx="100" cy="60" rx="6" ry="12" fill="#C4622D" opacity="0.6"/>
          <ellipse cx="90" cy="50" rx="12" ry="6" fill="#C4622D" opacity="0.6"/>
          <circle cx="80" cy="60" r="6" fill="#D4A44C" opacity="0.5"/>
        </svg>
      </div>

      {/* Top Navbar */}
      <header className="w-full max-w-6xl mx-auto px-6 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between z-10 gap-6">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 md:mb-0 hover:opacity-80 transition-opacity duration-300 group">
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* Inline SVG Crescent Moon + Star */}
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-terracotta">
              <path d="M50 15 A 35 35 0 1 0 85 50 A 25 25 0 1 1 50 15" fill="currentColor" opacity="0.8"/>
              <polygon points="80,10 82,18 90,20 82,22 80,30 78,22 70,20 78,18" fill="#D4A44C" opacity="0.8"/>
            </svg>
            <div className="absolute -bottom-2 -right-4 w-6 h-10 group-hover:-translate-y-1 transition-transform">
              <svg width="20" height="40" viewBox="0 0 20 40" fill="none" className="text-terracotta opacity-60">
                <path d="M10 38 C10 38 2 25 4 12 C6 0 10 2 10 2 C10 2 14 0 16 12 C18 25 10 38 10 38Z" fill="currentColor" opacity="0.4"/>
                <path d="M10 38 L10 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                <path d="M4 12 L10 16 M5 18 L10 22 M6 25 L10 28 M16 12 L10 16 M15 18 L10 22 M14 25 L10 28" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div className="flex items-center font-display font-semibold text-3xl md:text-4xl text-foreground tracking-wide italic mt-1">
            <span className="text-terracotta">M</span>ind <span className="text-terracotta ml-2">M</span>atters
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
                  className="group relative font-display italic text-xl md:text-2xl text-foreground hover:text-terracotta transition-colors duration-300"
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
            <Link href="/checkin" className="flex items-center gap-2 bg-amber/20 hover:bg-amber/30 text-amber-foreground px-4 py-1.5 rounded-full font-sans font-bold text-sm tracking-wide transition-colors">
              <CheckCircle size={16} /> Check In
            </Link>
            <Link href="/review" className="flex items-center gap-2 bg-sage/20 hover:bg-sage/30 text-sage-foreground px-4 py-1.5 rounded-full font-sans font-bold text-sm tracking-wide transition-colors">
              <Star size={16} /> Review
            </Link>
            
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
                <button onClick={login} className="text-sage hover:text-sage/80 font-sans text-sm font-bold flex items-center gap-1 transition-colors">
                  <LogIn size={14} /> Log in
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Decorative Wavy Divider below header */}
      <div className="w-full flex justify-center opacity-30 my-2">
        <svg width="200" height="10" viewBox="0 0 200 10" fill="none">
          <path d="M0 5 Q 50 10, 100 5 T 200 5" stroke="#C4622D" strokeWidth="1" fill="none"/>
        </svg>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 relative z-10 flex flex-col items-center pb-20">
        {children}
      </main>
    </div>
  );
}
