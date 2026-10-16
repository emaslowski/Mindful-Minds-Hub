import { WaveFooter } from "@/components/WaveFooter";
import { Camera } from "lucide-react";

export default function AboutUs() {
  const roles = [
    { title: "Video Producers",                       color: "bg-amber/20",      rotation: "-rotate-2", x: "translate-x-0" },
    { title: "Podcasters",                            color: "bg-sage/20",       rotation: "rotate-3",  x: "md:translate-x-10" },
    { title: "Editors and Designers",                 color: "bg-dusty-rose/20", rotation: "-rotate-1", x: "md:-translate-x-5" },
    { title: "Researchers and Content Writers",       color: "bg-terracotta/20", rotation: "rotate-2",  x: "md:translate-x-5" },
    { title: "Artists and Chefs",                     color: "bg-sage/20",       rotation: "-rotate-3", x: "md:-translate-x-8" },
    { title: "Wellness Ambassadors and Peer Mentors", color: "bg-amber/20",      rotation: "rotate-1",  x: "md:translate-x-12" },
    { title: "Technology Team",                       color: "bg-terracotta/20", rotation: "-rotate-2", x: "md:translate-x-0" },
    { title: "Community Connection Team",             color: "bg-dusty-rose/20", rotation: "rotate-3",  x: "md:-translate-x-6" },
    { title: "Data Team",                             color: "bg-amber/20",      rotation: "-rotate-1", x: "md:translate-x-8" },
    { title: "Music/Sound Keepers",                   color: "bg-sage/20",       rotation: "rotate-2",  x: "md:-translate-x-4" },
    { title: "Social Media and Advertising",          color: "bg-dusty-rose/20", rotation: "-rotate-3", x: "md:translate-x-6" },
    { title: "Sports Enthusiasts",                    color: "bg-terracotta/20", rotation: "rotate-1",  x: "translate-x-0" },
  ];

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative bg-[url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20zM20 0h20v20H20V0z\' fill=\'%23c4622d\' fill-opacity=\'0.03\' fill-rule=\'evenodd\'/%3E%3C/svg%3E')]">

      {/* Boho arch with flowers — top left */}
      <div className="absolute top-2 left-2 md:left-8 pointer-events-none opacity-25">
        <svg width="140" height="110" viewBox="0 0 140 110" fill="none">
          <path d="M10 108 Q10 40 70 15 Q130 40 130 108" stroke="#688A52" strokeWidth="2" fill="none" strokeLinecap="round"/>
          {/* Flowers along arch */}
          <circle cx="70" cy="15" r="9" fill="#C4829A" opacity="0.6"/>
          <circle cx="70" cy="15" r="5" fill="#D4A44C"/>
          <circle cx="30" cy="55" r="7" fill="#C4622D" opacity="0.5"/>
          <circle cx="30" cy="55" r="3.5" fill="#D4A44C"/>
          <circle cx="110" cy="55" r="7" fill="#C4622D" opacity="0.5"/>
          <circle cx="110" cy="55" r="3.5" fill="#D4A44C"/>
          {/* Leaves */}
          <ellipse cx="50" cy="28" rx="10" ry="5" fill="#688A52" opacity="0.5" transform="rotate(-55 50 28)"/>
          <ellipse cx="90" cy="28" rx="10" ry="5" fill="#688A52" opacity="0.5" transform="rotate(55 90 28)"/>
          <ellipse cx="17" cy="80" rx="9" ry="4.5" fill="#688A52" opacity="0.5" transform="rotate(-75 17 80)"/>
          <ellipse cx="123" cy="80" rx="9" ry="4.5" fill="#688A52" opacity="0.5" transform="rotate(75 123 80)"/>
        </svg>
      </div>

      {/* Moon + stars — top right */}
      <div className="absolute top-4 right-4 md:right-14 pointer-events-none opacity-25">
        <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
          <path d="M85 12 Q102 28 94 52 Q82 70 60 66 Q76 60 80 44 Q87 28 74 10 Q79 8 85 12Z" fill="#D4A44C"/>
          <path d="M28 18 L30 26 L38 28 L30 30 L28 38 L26 30 L18 28 L26 26Z" fill="#C4829A"/>
          <path d="M12 58 L13.5 63 L19 64.5 L13.5 66 L12 71 L10.5 66 L5 64.5 L10.5 63Z" fill="#D4A44C" opacity="0.7"/>
          <circle cx="48" cy="8" r="3" fill="#688A52" opacity="0.7"/>
          <circle cx="108" cy="78" r="2.5" fill="#C4622D" opacity="0.6"/>
        </svg>
      </div>

      {/* Botanical corner — bottom right */}
      <div className="absolute bottom-28 right-2 md:right-8 pointer-events-none opacity-20 rotate-6">
        <svg width="100" height="120" viewBox="0 0 100 120" fill="none">
          <path d="M50 120 Q50 70 50 10" stroke="#688A52" strokeWidth="2" strokeLinecap="round"/>
          <path d="M50 90 Q28 70 15 52" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M50 62 Q72 45 82 26" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M50 36 Q30 22 22 6" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <ellipse cx="15" cy="52" rx="11" ry="5" fill="#688A52" opacity="0.5" transform="rotate(-32 15 52)"/>
          <ellipse cx="81" cy="26" rx="11" ry="5" fill="#688A52" opacity="0.5" transform="rotate(30 81 26)"/>
          <ellipse cx="22" cy="6" rx="9" ry="4" fill="#688A52" opacity="0.5" transform="rotate(-38 22 6)"/>
          <circle cx="50" cy="10" r="8" fill="#C4829A" opacity="0.4"/>
          <circle cx="50" cy="10" r="4" fill="#D4A44C"/>
        </svg>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 mb-24 relative z-10">
        
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-display italic text-foreground mb-6 drop-shadow-sm">
            About Us
          </h1>
          <p className="text-2xl md:text-3xl text-sage font-display font-medium max-w-3xl mx-auto leading-relaxed bg-white/60 p-6 rounded-3xl backdrop-blur-sm border border-white/50 shadow-sm">
            The Brightside Project is a student-created website made to support and inspire our school community.
          </p>
        </div>

        {/* Corkboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 py-8">
          {roles.map((role, idx) => (
            <div 
              key={idx} 
              className={`
                ${role.color} p-6 rounded-sm shadow-md border border-black/5 flex flex-col items-center
                transform ${role.rotation} ${role.x} hover:rotate-0 hover:scale-105 hover:z-20 transition-all duration-300
                relative
              `}
              style={{ minHeight: "280px" }}
            >
              {/* Thumbtack */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-400 rounded-full shadow-md z-10 border border-red-500 after:content-[''] after:absolute after:top-1 after:left-1.5 after:w-2 after:h-2 after:bg-white/40 after:rounded-full"></div>
              
              <h3 className="font-display font-bold text-xl md:text-2xl text-foreground text-center mb-4 mt-2 leading-tight">
                {role.title}
              </h3>
              
              {/* Polaroid-style photo placeholder */}
              <div className="w-full aspect-[4/3] bg-white/60 rounded-lg flex items-center justify-center border border-white mb-4">
                <Camera size={32} className="text-foreground/20" />
              </div>
              
              <p className="font-handwritten text-2xl text-terracotta mt-auto">
                Students coming soon!
              </p>
            </div>
          ))}
        </div>

      </div>
      
      <WaveFooter />
    </div>
  );
}
