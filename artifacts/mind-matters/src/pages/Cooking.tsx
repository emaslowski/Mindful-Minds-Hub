import { useState } from "react";
import { Link } from "wouter";
import { WaveFooter } from "@/components/WaveFooter";
import { PublishedSection } from "@/components/PublishedSection";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { CookingRecipes } from "@/components/CookingRecipes";

export default function Cooking() {
  const [activeTab, setActiveTab] = useState<"food-reviews" | "videos" | "recipes">("food-reviews");

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
        <div className="flex flex-wrap justify-center gap-4 mb-12" role="group" aria-label="Cooking Corner sections">
          {([
            ["food-reviews", "Food Reviews"],
            ["videos", "Cooking Videos"],
            ["recipes", "Recipes"],
          ] as const).map(([tab, label]) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              aria-controls="cooking-section"
              variant={activeTab === tab ? "default" : "outline"}
              className={`h-auto rounded-full px-8 py-3 font-sans text-lg font-semibold shadow-sm ${
                activeTab === tab ? "bg-terracotta text-primary-foreground" : "bg-card text-foreground border-card-border"
              }`}
            >
              {label}
            </Button>
          ))}
        </div>

        <div id="cooking-section">
        {activeTab === "food-reviews" ? (
          <PublishedSection
            section="cooking-food-reviews"
            heading="Food Reviews"
            featureVideos
            emptyMessage="Student food review videos will appear here once a teacher publishes them."
            className="mb-12 text-left"
          />
        ) : activeTab === "recipes" ? (
          <CookingRecipes />
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
      </div>

      <WaveFooter quote="Nourish to flourish." />
    </div>
  );
}
