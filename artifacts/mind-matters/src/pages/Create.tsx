import { Link } from "wouter";
import { WaveFooter } from "@/components/WaveFooter";
import { DirectedDrawsEasel, TeacherDrawingPostLink } from "@/components/DirectedDrawsEasel";
import { PublishedSection } from "@/components/PublishedSection";
import { ArtworkGallery } from "@/components/ArtworkGallery";

export default function Create() {
  const sections = [
    { title: "Directed Draws", path: "/create/directed-draws", rotation: "-2deg" },
    { title: "Coloring Pages", path: "/create/coloring-pages", rotation: "1deg" },
    { title: "Gallery and Art Club", path: "/create/art-club", rotation: "-1deg" },
  ];

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative">
      {/* Top right Cooking Link — Chalkboard Style */}
      <div className="absolute top-4 right-4 md:right-12 z-20">
        <Link href="/create/cooking" className="group">
          <div className="w-28 h-28 md:w-32 md:h-32 bg-[#2D3A34] rounded-full border-4 border-[#C4622D] shadow-lg flex flex-col items-center justify-center p-3 text-center transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105"
               style={{ boxShadow: '4px 6px 15px rgba(45,58,52,0.3)' }}>
            <svg viewBox="0 0 26 24" fill="none" className="w-9 h-9 mb-1 opacity-90">
              {/* Pan */}
              <ellipse cx="10" cy="14" rx="7.5" ry="5.5" fill="#FAF3E3" fillOpacity="0.15" stroke="#FAF3E3" strokeWidth="1.5"/>
              {/* Long handle */}
              <path d="M17.5 14 L25 11" stroke="#FAF3E3" strokeWidth="2.2" strokeLinecap="round"/>
              {/* Helper handle */}
              <path d="M4.5 11 L2.5 9" stroke="#FAF3E3" strokeWidth="1.5" strokeLinecap="round"/>
              {/* Steam */}
              <path d="M7 8 Q7.5 6.2 7 4.5" stroke="#FAF3E3" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
              <path d="M10 7.5 Q10.5 5.5 10 4" stroke="#FAF3E3" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
              <path d="M13 8 Q13.5 6.2 13 4.5" stroke="#FAF3E3" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
            </svg>
            <span className="text-[#FAF3E3] font-handwritten text-lg md:text-xl leading-tight">
              Cooking<br/>Corner!
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 mb-24 text-center relative z-10">
        
        {/* Decorative elements top left - Paint splatters & brushes as SVG */}
        <div className="absolute top-12 left-8 md:left-20 opacity-40 -rotate-12 pointer-events-none">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
             <path d="M30 80 L70 20 L80 30 L40 90 Z" fill="#D4A44C" opacity="0.6"/>
             <path d="M70 20 Q85 5 95 15 Q80 30 80 30 Z" fill="#203520"/>
             <circle cx="20" cy="20" r="5" fill="#C4622D" opacity="0.7"/>
             <circle cx="35" cy="15" r="3" fill="#C4622D" opacity="0.5"/>
             <circle cx="15" cy="40" r="4" fill="#688A52" opacity="0.6"/>
          </svg>
        </div>

        <h1 className="text-6xl md:text-8xl font-display italic text-foreground mb-4 drop-shadow-sm">
          Art Studio
        </h1>
        <p className="text-2xl md:text-3xl text-terracotta/90 font-handwritten mb-20 max-w-xl mx-auto leading-relaxed">
          Express yourself and relax...
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 px-4 mt-8">
          {sections.map((section) => (
            <div key={section.path} className="flex flex-col items-center">
              
              {/* Handwritten Tag Label */}
              <Link href={section.path} className="z-30 outline-none">
                <div 
                  className="bg-terracotta px-6 py-2 rounded-sm shadow-md transition-transform duration-300 hover:scale-105 mb-6"
                  style={{ 
                    transform: `rotate(${section.rotation})`,
                    boxShadow: '3px 4px 10px rgba(196,98,45,0.2)' 
                  }}
                >
                  <span className="font-handwritten text-2xl text-[#FAF3E3]">
                    {section.title}
                  </span>
                </div>
              </Link>
              
              {/* Easel Structure */}
              <div className="relative w-full max-w-[320px] aspect-[4/3] mt-2 group">
                
                {/* Easel Top Peg */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-8 bg-[#8B5A2B] rounded-t-sm z-0 opacity-90 shadow-inner"></div>
                
                {/* The Canvas */}
                <div className="w-full h-full">
                  <div className="w-full h-full bg-[#FAF3E3] shadow-lg relative z-20 transition-transform duration-500 group-hover:-translate-y-2 flex items-center justify-center"
                       style={{
                         border: '1px solid rgba(200, 150, 120, 0.3)',
                         backgroundImage: 'repeating-linear-gradient(45deg, rgba(200,150,120,0.05) 0px, rgba(200,150,120,0.05) 2px, transparent 2px, transparent 10px)'
                       }}>
                    {/* Dashed organic border inside canvas */}
                    <div className="absolute inset-3 border-2 border-dashed border-terracotta/20 rounded-sm"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-terracotta"></div>
                    {section.title === "Directed Draws" ? (
                      <div className="absolute inset-5 z-20 flex min-h-0 items-center justify-center">
                        <DirectedDrawsEasel />
                      </div>
                    ) : (
                      <Link href={section.path} aria-label={`Open ${section.title}`} className="absolute inset-0 z-20" />
                    )}
                  </div>
                </div>

                {/* Easel Bottom Shelf */}
                <div className="absolute -bottom-4 left-[-10%] w-[120%] h-4 bg-[#8B5A2B] shadow-md z-30 rounded-sm opacity-90 border-t border-white/20"></div>
                
                {/* Easel Legs (Wooden Tripod) */}
                <div className="absolute -bottom-24 left-[15%] w-4 h-24 bg-[#8B5A2B] rotate-[18deg] z-10 origin-top opacity-90 rounded-b-sm shadow-md"></div>
                <div className="absolute -bottom-24 right-[15%] w-4 h-24 bg-[#8B5A2B] -rotate-[18deg] z-10 origin-top opacity-90 rounded-b-sm shadow-md"></div>
                <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-4 h-20 bg-[#6A4420] z-0 origin-top opacity-80 rounded-b-sm"></div>
              </div>
              {section.title === "Directed Draws" && (
                <div className="mt-28 flex w-full justify-center">
                  <TeacherDrawingPostLink />
                </div>
              )}
            </div>
          ))}
        </div>
        <ArtworkGallery />
      </div>
      
      <PublishedSection section="create" heading="Creative work from our students" className="mb-12" />
      <WaveFooter quote="There is no wrong way to create." />
    </div>
  );
}
