import { WaveFooter } from "@/components/WaveFooter";
import { useParams, Link, useLocation } from "wouter";
import { Sparkles } from "lucide-react";

interface BlankTemplateProps {
  title?: string;
  subtitle?: string;
}

export default function BlankTemplate({ title, subtitle }: BlankTemplateProps) {
  const params = useParams();
  const [location] = useLocation();

  // Derive parent section path by stripping the last segment (e.g. /move/strength → /move)
  const parentPath = location.includes('/') ? location.substring(0, location.lastIndexOf('/')) || '/' : '/';
  
  // Try to derive title from URL params if not provided
  let displayTitle = title || "Coming Soon";
  if (!title) {
    const slug = params.strategy || params.section || params.category;
    if (slug) {
      displayTitle = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  }

  const displaySubtitle = subtitle || "This page is being lovingly crafted. Check back soon!";

  return (
    <div className="w-full flex flex-col flex-1 mt-8">
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 mb-20 text-center relative pt-12">
        
        {/* Back Button */}
        <div className="absolute top-0 left-0 md:-left-8 z-20">
          <Link href={parentPath}>
            <button className="px-6 py-2 rounded-full border border-terracotta text-terracotta font-sans text-sm tracking-wide transition-all hover:bg-terracotta hover:text-white">
              ← Back
            </button>
          </Link>
        </div>

        {/* Decorative SVG Wreath above title */}
        <div className="flex justify-center mb-6 opacity-80">
          <svg width="120" height="40" viewBox="0 0 120 40" fill="none">
            <path d="M 10,20 Q 60,-10 110,20" stroke="#688A52" strokeWidth="1.5" fill="none" strokeDasharray="4 4"/>
            <ellipse cx="30" cy="12" rx="6" ry="3" fill="#688A52" transform="rotate(-20 30 12)"/>
            <ellipse cx="90" cy="12" rx="6" ry="3" fill="#688A52" transform="rotate(20 90 12)"/>
            <ellipse cx="60" cy="8" rx="8" ry="4" fill="#D4A44C"/>
          </svg>
        </div>

        <h1 className="text-5xl md:text-7xl font-display italic text-foreground mb-4">
          {displayTitle}
        </h1>
        <p className="text-xl md:text-2xl text-terracotta/90 font-handwritten mb-16">
          {displaySubtitle}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="relative rounded-3xl p-8 min-h-[300px] flex flex-col items-center justify-center bg-card shadow-sm border border-card-border/50"
              style={{ borderStyle: 'dashed', borderWidth: '2px', borderColor: 'rgba(200, 150, 120, 0.4)' }}
            >
              {/* Corner pressed leaf */}
              <div className="absolute top-4 right-4 opacity-30">
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                   <path d="M15 30 L15 15 M15 15 C 5 15 5 5 15 0 C 25 5 25 15 15 15 Z" fill="#C4622D" stroke="#C4622D"/>
                </svg>
              </div>

              <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center mb-6 text-3xl text-sage">
                <Sparkles aria-hidden="true" className="h-8 w-8" />
              </div>
              <h3 className="font-display italic text-2xl text-foreground mb-3">Quiet Space</h3>
              <p className="text-foreground/70 font-sans text-sm max-w-[200px] text-center leading-relaxed">
                We're dreaming up something beautiful for this spot.
              </p>
            </div>
          ))}
        </div>
      </div>
      <WaveFooter quote="Take your time. We are." />
    </div>
  );
}
