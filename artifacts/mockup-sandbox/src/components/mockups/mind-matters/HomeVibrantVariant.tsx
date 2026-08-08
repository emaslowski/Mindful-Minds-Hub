import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { 
  BookOpen, 
  Palette, 
  HeartHandshake, 
  Wind, 
  Headphones, 
  Sprout,
  ArrowRight,
  Menu,
  Heart,
  Star
} from "lucide-react";
import "./HomeVibrantVariant.css";

export default function HomeVibrantVariant() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const categories = [
    {
      name: "Learn",
      icon: <BookOpen strokeWidth={2.5} className="w-8 h-8 text-[#FF3366]" />,
      color: "#FF3366",
      bg: "#FFE5EC",
      path: "/learn",
      desc: "Strategies & tips"
    },
    {
      name: "Create",
      icon: <Palette strokeWidth={2.5} className="w-8 h-8 text-[#7000FF]" />,
      color: "#7000FF",
      bg: "#F0E5FF",
      path: "/create",
      desc: "Art & expression"
    },
    {
      name: "Connect",
      icon: <HeartHandshake strokeWidth={2.5} className="w-8 h-8 text-[#00D084]" />,
      color: "#00D084",
      bg: "#E5FBF2",
      path: "/connect",
      desc: "Community posts"
    },
    {
      name: "Move",
      icon: <Wind strokeWidth={2.5} className="w-8 h-8 text-[#FF9900]" />,
      color: "#FF9900",
      bg: "#FFF5E5",
      path: "/move",
      desc: "Mindful activity"
    },
    {
      name: "Listen",
      icon: <Headphones strokeWidth={2.5} className="w-8 h-8 text-[#00E5FF]" />,
      color: "#00B8CC",
      bg: "#E5FCFF",
      path: "/listen",
      desc: "Music & podcasts"
    },
    {
      name: "Grow",
      icon: <Sprout strokeWidth={2.5} className="w-8 h-8 text-[#FF3366]" />,
      color: "#FF3366",
      bg: "#FFE5EC",
      path: "/grow",
      desc: "Personal journey"
    },
  ];

  return (
    <div className="vibrant-container">
      {/* Dynamic Background */}
      <div className="vibrant-bg-pattern"></div>
      
      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 border-b-4 border-black bg-white">
        <div className="flex items-center gap-3">
          <div className="bg-[#FF3366] p-2 rounded-full border-2 border-black rotate-[-10deg] hover:rotate-[10deg] transition-transform">
            <Heart className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-black text-2xl tracking-tighter text-black uppercase">
            Mind Matters
          </span>
        </div>
        <button className="bg-[#00E5FF] p-3 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-y-2">
          <Menu className="w-6 h-6 text-black" strokeWidth={2.5} />
        </button>
      </nav>

      <main className="relative z-10 flex flex-col items-center justify-center pt-12 md:pt-20 pb-24 px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
          <div 
            className={`flex flex-col items-start text-left transition-all duration-1000 ease-out transform ${
              mounted ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black bg-[#FFEB3B] font-bold text-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform cursor-default">
              <Star className="w-5 h-5 text-[#FF3366] fill-current animate-spin-slow" />
              <span>Student-run wellness!</span>
            </div>

            <h1 className="font-display font-black text-6xl md:text-7xl lg:text-8xl leading-[0.9] text-black mb-6 uppercase tracking-tighter mix-blend-darken">
              <span className="block mb-2">You <span className="text-[#FF3366] inline-block hover:-rotate-3 transition-transform">Matter.</span></span>
              <span className="block mb-2">We <span className="text-[#7000FF] inline-block hover:rotate-3 transition-transform">Matter.</span></span>
              <span className="block">Mind <span className="text-[#00D084] inline-block hover:-rotate-3 transition-transform">Matters.</span></span>
            </h1>

            <p className="text-xl md:text-2xl text-black font-medium leading-snug mb-8 bg-white/90 p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl max-w-lg">
              A safe, colorful space to learn, create, connect, and grow. Because no matter what you're facing, you are not alone!
            </p>

            <button className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#7000FF] text-white rounded-xl font-bold text-xl uppercase tracking-wider border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-2 active:translate-x-2 active:shadow-none transition-all">
              <span>Begin Check-in</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" strokeWidth={3} />
            </button>
          </div>

          <div 
            className={`relative flex justify-center items-center transition-all duration-1000 delay-300 ease-out transform ${
              mounted ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-90"
            }`}
          >
            {/* Abstract colorful blobs behind image */}
            <div className="absolute inset-0 z-0 flex items-center justify-center">
              <div className="absolute w-[280px] h-[280px] md:w-[400px] md:h-[400px] bg-[#FF3366] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] animate-blob mix-blend-multiply opacity-80 filter blur-xl"></div>
              <div className="absolute w-[250px] h-[250px] md:w-[350px] md:h-[350px] bg-[#00E5FF] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] animate-blob animation-delay-2000 mix-blend-multiply opacity-80 filter blur-xl -translate-x-10 translate-y-10"></div>
              <div className="absolute w-[200px] h-[200px] md:w-[300px] md:h-[300px] bg-[#FFEB3B] rounded-[30%_60%_70%_40%/50%_60%_30%_60%] animate-blob animation-delay-4000 mix-blend-multiply opacity-80 filter blur-xl translate-x-10 -translate-y-10"></div>
            </div>
            
            <img 
              src="/__mockup/images/homevibrant-hero.png" 
              alt="Students hanging out" 
              className="relative z-10 w-full max-w-md md:max-w-lg object-contain drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:scale-[1.02] transition-transform duration-500 rounded-3xl border-4 border-black bg-white"
            />
          </div>
        </div>

        {/* Categories Section */}
        <div className="w-full mt-24 md:mt-32">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 border-b-4 border-black pb-6">
            <h2 className="font-display font-black text-4xl md:text-5xl text-black uppercase tracking-tight">
              Explore <span className="text-[#FF3366]">your journey</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {categories.map((cat, idx) => (
              <div 
                key={idx}
                className="relative group bg-white border-4 border-black p-6 md:p-8 rounded-2xl flex items-center gap-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:-translate-x-2"
                style={{
                  boxShadow: mounted ? `8px 8px 0px 0px ${cat.color}` : 'none',
                  transitionDelay: mounted ? `${idx * 100}ms` : '0ms',
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(20px)'
                }}
              >
                <div 
                  className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 border-black flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  style={{ backgroundColor: cat.bg }}
                >
                  {cat.icon}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-1" style={{ color: cat.color }}>
                    {cat.name}
                  </h3>
                  <p className="text-black font-bold">
                    {cat.desc}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center bg-[#FFEB3B] group-hover:bg-[#00E5FF] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                  <ArrowRight className="w-5 h-5 text-black" strokeWidth={3} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
