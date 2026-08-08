import { WaveFooter } from "@/components/WaveFooter";
import { Camera } from "lucide-react";

export default function AboutUs() {
  const roles = [
    { title: "Video Producers", color: "bg-amber/20", rotation: "-rotate-2", x: "translate-x-0" },
    { title: "Artists and Chefs", color: "bg-sage/20", rotation: "rotate-3", x: "md:translate-x-10" },
    { title: "Researchers & Writers", color: "bg-dusty-rose/20", rotation: "-rotate-1", x: "md:-translate-x-5" },
    { title: "Editors and Designers", color: "bg-terracotta/20", rotation: "rotate-2", x: "md:translate-x-5" },
    { title: "Podcasters", color: "bg-amber/20", rotation: "-rotate-3", x: "md:-translate-x-8" },
    { title: "Wellness Ambassadors", color: "bg-sage/20", rotation: "rotate-1", x: "md:translate-x-12" },
    { title: "Technology Team", color: "bg-dusty-rose/20", rotation: "-rotate-2", x: "md:translate-x-0" },
    { title: "Data Team", color: "bg-terracotta/20", rotation: "rotate-3", x: "md:-translate-x-6" },
  ];

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative bg-[url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20zM20 0h20v20H20V0z\' fill=\'%23c4622d\' fill-opacity=\'0.03\' fill-rule=\'evenodd\'/%3E%3C/svg%3E')]">
      
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 mb-24 relative z-10">
        
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-display italic text-foreground mb-6 drop-shadow-sm">
            About Us
          </h1>
          <p className="text-2xl md:text-3xl text-sage font-display font-medium max-w-3xl mx-auto leading-relaxed bg-white/60 p-6 rounded-3xl backdrop-blur-sm border border-white/50 shadow-sm">
            Mind Matters is a student-created website made to support and inspire our school community.
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
