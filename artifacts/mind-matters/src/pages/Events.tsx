import { WaveFooter } from "@/components/WaveFooter";
import { useGetEvents } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Clock } from "lucide-react";

export default function Events() {
  const { data: events, isLoading } = useGetEvents();
  const currentMonth = format(new Date(), "MMMM yyyy");

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative bg-[url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20zM20 0h20v20H20V0z\' fill=\'%23688a52\' fill-opacity=\'0.03\' fill-rule=\'evenodd\'/%3E%3C/svg%3E')]">

      {/* Sunflower — top left */}
      <div className="absolute top-4 left-2 md:left-10 pointer-events-none opacity-25">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          {/* Petals */}
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle, i) => (
            <ellipse key={i} cx="60" cy="60" rx="8" ry="22"
              fill={i % 2 === 0 ? "#D4A44C" : "#C4622D"}
              opacity="0.7"
              transform={`rotate(${angle} 60 60) translate(0 -18)`}/>
          ))}
          {/* Center */}
          <circle cx="60" cy="60" r="18" fill="#5A3A1A"/>
          <circle cx="60" cy="60" r="12" fill="#7A5A2A" opacity="0.7"/>
          {/* Seed dots */}
          <circle cx="56" cy="56" r="2" fill="#D4A44C" opacity="0.6"/>
          <circle cx="63" cy="55" r="2" fill="#D4A44C" opacity="0.6"/>
          <circle cx="58" cy="63" r="2" fill="#D4A44C" opacity="0.6"/>
          <circle cx="65" cy="62" r="2" fill="#D4A44C" opacity="0.6"/>
          {/* Stem */}
          <path d="M60 78 Q58 100 55 115" stroke="#688A52" strokeWidth="3" strokeLinecap="round"/>
          <ellipse cx="45" cy="100" rx="14" ry="7" fill="#688A52" opacity="0.5" transform="rotate(-30 45 100)"/>
        </svg>
      </div>

      {/* Stars + sparkles — top right */}
      <div className="absolute top-6 right-4 md:right-14 pointer-events-none opacity-25">
        <svg width="130" height="100" viewBox="0 0 130 100" fill="none">
          <path d="M30 15 L33 25 L43 28 L33 31 L30 41 L27 31 L17 28 L27 25Z" fill="#D4A44C"/>
          <path d="M90 8 L92 14 L98 16 L92 18 L90 24 L88 18 L82 16 L88 14Z" fill="#C4829A"/>
          <path d="M110 50 L111.5 55 L117 56.5 L111.5 58 L110 63 L108.5 58 L103 56.5 L108.5 55Z" fill="#C4622D" opacity="0.7"/>
          <circle cx="60" cy="20" r="4" fill="#688A52" opacity="0.6"/>
          <circle cx="15" cy="60" r="3" fill="#C4622D" opacity="0.5"/>
          <circle cx="75" cy="70" r="2.5" fill="#D4A44C"/>
          <circle cx="50" cy="80" r="2" fill="#C4829A"/>
        </svg>
      </div>

      {/* Botanical arch — bottom left */}
      <div className="absolute bottom-28 left-2 md:left-8 pointer-events-none opacity-20 rotate-3">
        <svg width="100" height="120" viewBox="0 0 100 120" fill="none">
          <path d="M50 120 Q50 70 50 10" stroke="#688A52" strokeWidth="2" strokeLinecap="round"/>
          <path d="M50 95 Q28 75 18 55" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M50 68 Q72 50 82 32" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M50 42 Q30 28 22 10" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <ellipse cx="19" cy="55" rx="11" ry="5" fill="#688A52" opacity="0.5" transform="rotate(-30 19 55)"/>
          <ellipse cx="81" cy="32" rx="11" ry="5" fill="#688A52" opacity="0.5" transform="rotate(28 81 32)"/>
          <ellipse cx="23" cy="10" rx="9" ry="4.5" fill="#688A52" opacity="0.5" transform="rotate(-35 23 10)"/>
          <circle cx="50" cy="10" r="7" fill="#C4622D" opacity="0.5"/>
          <circle cx="50" cy="10" r="3.5" fill="#D4A44C"/>
        </svg>
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 mb-24 z-10">
        
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-8xl font-display italic text-foreground mb-4 drop-shadow-sm">
            Events
          </h1>
          <div className="inline-block bg-white/80 px-8 py-3 rounded-full border border-sage/30 shadow-sm backdrop-blur-sm">
            <h2 className="text-2xl md:text-3xl text-sage font-display font-bold flex items-center gap-3">
              <CalendarIcon size={28} /> {currentMonth}
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-pulse flex gap-4">
              <div className="w-4 h-4 bg-sage rounded-full"></div>
              <div className="w-4 h-4 bg-sage rounded-full"></div>
              <div className="w-4 h-4 bg-sage rounded-full"></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 py-8">
            {events && events.length > 0 ? (
              events.map((event, idx) => (
                <div 
                  key={event.id}
                  className="bg-[#fcf8f2] p-8 rounded-sm shadow-md border-l-4 border-terracotta transform hover:-translate-y-1 hover:shadow-lg transition-all relative group"
                  style={{
                    boxShadow: "2px 4px 15px rgba(0,0,0,0.05)",
                    backgroundImage: "linear-gradient(#0000000a 1px, transparent 1px)",
                    backgroundSize: "100% 32px",
                    backgroundPosition: "0 40px",
                    lineHeight: "32px",
                    transform: `rotate(${idx % 2 === 0 ? '-1deg' : '1deg'})`
                  }}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 bg-[#e8e4db] shadow-sm transform -rotate-2"></div>
                  
                  <h3 className="font-display font-bold text-2xl text-foreground mb-4 pt-2">
                    {event.title}
                  </h3>
                  
                  {event.description && (
                    <p className="font-sans text-foreground/80 mb-6 leading-8">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="mt-auto space-y-2 font-handwritten text-2xl text-sage">
                    <div className="flex items-center gap-2">
                      <Clock size={20} className="text-terracotta" />
                      {format(new Date(event.eventDate), "MMM d, yyyy h:mm a")}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={20} className="text-terracotta" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-sage/50">
                <div className="w-64 h-64 bg-amber/10 rounded-sm shadow-sm border border-amber/20 transform rotate-3 flex flex-col items-center justify-center p-8 text-center relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-terracotta rounded-full shadow-sm"></div>
                  <CalendarIcon size={48} className="text-amber/40 mb-4" />
                  <p className="font-handwritten text-3xl text-terracotta">
                    Events coming soon! Check back each month.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
      <WaveFooter quote="Get involved and connect." />
    </div>
  );
}
