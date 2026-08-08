import { useState } from "react";
import { Link } from "wouter";
import { WaveFooter } from "@/components/WaveFooter";
import { useGetPublishedContent } from "@workspace/api-client-react";
import { Star } from "lucide-react";

function PublishedRecipesSection() {
  const { data, isLoading } = useGetPublishedContent({ section: "cooking" });
  const items = data?.publications ?? [];
  if (isLoading || items.length === 0) return null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mb-12">
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="h-px flex-1 bg-sage/20 max-w-[100px]"></div>
        <h2 className="font-display italic text-2xl text-foreground">Student Recipes</h2>
        <div className="h-px flex-1 bg-sage/20 max-w-[100px]"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, i) => {
          const colors = ["from-sage/20 to-amber/20", "from-terracotta/20 to-sage/20", "from-amber/20 to-dusty-rose/20"];
          return (
            <div
              key={item.id}
              className={`bg-gradient-to-br ${colors[i % colors.length]} rounded-[2rem] p-6 flex flex-col border border-white/40 shadow-sm`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Star size={12} className="text-amber fill-amber" />
                <span className="font-sans text-xs font-bold text-amber uppercase tracking-widest">Student Recipe</span>
              </div>
              <h3 className="font-display italic text-2xl text-foreground mb-2 leading-tight">{item.title}</h3>
              {item.content && (
                <p className="font-sans text-sm text-foreground/70 leading-relaxed line-clamp-4 flex-1">{item.content}</p>
              )}
              <span className="mt-3 font-sans text-xs text-foreground/50">{item.authorDisplay}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Cooking() {
  const [activeTab, setActiveTab] = useState<"videos" | "recipes">("recipes");

  const recipes = [
    {
      id: 1,
      title: "Yogurt Pops",
      category: "Snack",
      desc: "A cool and fruity treat for any day!",
      time: "10 min",
      colors: "from-dusty-rose/30 to-amber/20"
    },
    {
      id: 2,
      title: "Apples & Peanut Butter",
      category: "Snack",
      desc: "Sweet, crunch, and full of energy!",
      time: "5 min",
      colors: "from-amber/30 to-terracotta/20"
    },
    {
      id: 3,
      title: "Berry Blast Smoothie",
      category: "Snack",
      desc: "Packed with fruit and vitamins!",
      time: "10 min",
      colors: "from-sage/30 to-dusty-rose/20"
    }
  ];

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative">
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 mb-24 text-center relative z-10">
        
        {/* Top left decorative utensils (Boho outlines) */}
        <div className="absolute top-0 left-0 md:left-8 opacity-40 flex gap-4 rotate-[-10deg] pointer-events-none">
          <svg width="60" height="120" viewBox="0 0 60 120" fill="none" stroke="#C4622D" strokeWidth="2" strokeLinecap="round">
            <path d="M30 50 L30 110" />
            <path d="M10 20 C 10 50 50 50 50 20 C 50 10 10 10 10 20 Z" fill="#C4622D" fillOpacity="0.1"/>
            <path d="M20 20 L20 40 M30 20 L30 45 M40 20 L40 40" strokeWidth="1"/>
          </svg>
          <svg width="40" height="110" viewBox="0 0 40 110" fill="none" stroke="#688A52" strokeWidth="2" strokeLinecap="round" className="mt-4 -rotate-12">
            <path d="M20 40 L20 100" />
            <ellipse cx="20" cy="25" rx="15" ry="20" fill="#688A52" fillOpacity="0.1"/>
          </svg>
        </div>

        <h1 className="text-5xl md:text-7xl font-display italic text-foreground mb-4 drop-shadow-sm px-12">
          Healthy Cooking Corner
        </h1>
        <p className="text-2xl md:text-3xl text-sage font-handwritten mb-12 max-w-xl mx-auto">
          Good food fuels your body and your mind!
        </p>

        {/* Pill Tabs */}
        <div className="flex justify-center gap-6 mb-16">
          <button 
            onClick={() => setActiveTab("videos")}
            className={`px-8 py-3 rounded-full font-sans font-semibold text-lg transition-all duration-300 shadow-sm outline-none ${
              activeTab === "videos" 
                ? "bg-terracotta text-white shadow-md scale-105" 
                : "bg-card text-foreground border border-card-border hover:bg-card/80"
            }`}
          >
            Cooking Videos
          </button>
          <button 
            onClick={() => setActiveTab("recipes")}
            className={`px-8 py-3 rounded-full font-sans font-semibold text-lg transition-all duration-300 shadow-sm outline-none ${
              activeTab === "recipes" 
                ? "bg-terracotta text-white shadow-md scale-105" 
                : "bg-card text-foreground border border-card-border hover:bg-card/80"
            }`}
          >
            Recipes
          </button>
        </div>

        {activeTab === "recipes" ? (
          <div className="flex flex-col md:flex-row gap-12 text-left">
            {/* Left side: Featured Chef Placeholder */}
            <div className="w-full md:w-1/3 flex flex-col relative">
              <h2 className="font-handwritten text-3xl text-terracotta mb-4 px-2">Featured Chef:</h2>
              
              <div className="w-full aspect-[4/5] bg-deep-brown/90 rounded-[2rem] shadow-lg flex items-center justify-center group cursor-pointer relative overflow-hidden border-4 border-card">
                {/* Decorative background circle */}
                <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-amber/20 rounded-full blur-2xl"></div>
                
                {/* Play Button */}
                <div className="w-20 h-20 rounded-full border border-white/40 bg-white/10 backdrop-blur-sm flex items-center justify-center pl-2 transition-transform duration-500 group-hover:scale-110 group-hover:bg-white/20 z-10">
                  <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8 opacity-90">
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Right side: Recipes Grid */}
            <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-8">
              {recipes.map(recipe => (
                <Link key={recipe.id} href={`/create/cooking/recipes/${recipe.id}`}>
                  <div className="flex flex-col bg-card rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full cursor-pointer group border border-card-border/50 relative">
                    
                    {/* Herb Corner Decoration */}
                    <div className="absolute top-2 right-2 opacity-30 w-8 h-8 text-sage">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                      </svg>
                    </div>

                    <div className="px-5 py-3 text-center text-sm font-handwritten text-terracotta border-b border-card-border/40 bg-white/40 text-xl">
                      Recipe of the Month
                    </div>
                    
                    {/* Earthy Image Gradient Area */}
                    <div className={`w-full h-40 bg-gradient-to-br ${recipe.colors} opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
                      <span className="text-4xl opacity-50 font-display italic mix-blend-overlay">Fresh</span>
                    </div>
                    
                    <div className="p-6 flex flex-col flex-1 bg-card">
                      <h3 className="font-display italic text-2xl mb-2 text-foreground font-semibold">{recipe.title}</h3>
                      <span className="inline-block bg-amber/20 text-amber-foreground font-sans text-xs font-bold px-3 py-1 rounded-full w-fit mb-3 uppercase tracking-wider">{recipe.category}</span>
                      <p className="text-sm text-foreground/70 font-sans flex-1 leading-relaxed mb-4">{recipe.desc}</p>
                      
                      <div className="flex items-center text-sm font-sans font-medium text-sage mt-auto">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 mr-2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 6v6l4 2"/>
                        </svg>
                        {recipe.time}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(id => (
              <Link key={id} href={`/create/cooking/videos`}>
                <div className="w-full aspect-video bg-card rounded-[2rem] shadow-sm flex items-center justify-center group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border border-card-border relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br from-sage/10 to-amber/10 opacity-50`}></div>
                  <div className="w-16 h-16 rounded-full bg-terracotta/90 backdrop-blur-sm flex items-center justify-center pl-1 transition-transform duration-500 group-hover:scale-110 shadow-md z-10">
                    <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <PublishedRecipesSection />
      <WaveFooter quote="Nourish to flourish." />
    </div>
  );
}
