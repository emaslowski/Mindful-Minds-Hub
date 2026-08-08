import { Link } from "wouter";
import { WaveFooter } from "@/components/WaveFooter";
import { useGetBlogPosts } from "@workspace/api-client-react";

const SAMPLE_POSTS = [
  {
    id: 1,
    title: "How I Deal with Test Anxiety",
    author: "Anna",
    excerpt: "Math is definitely not my strongest subject. When I hear the teacher say, \"We have a test on Friday!\" I feel anxious the rest of the week! Some things that really helped...",
    gradient: "from-amber/30 to-terracotta/20",
  },
  {
    id: 2,
    title: "Breathing Ideas that WORK!",
    author: "Anonymous",
    excerpt: "I had never found any breathing exercises that worked...until now! I was talking with a friend and they told me about this cool new way to ground myself when I am overwhelmed...",
    gradient: "from-sage/30 to-dusty-rose/20",
  },
  {
    id: 3,
    title: "Moving Feels GOOD",
    author: "Mya",
    excerpt: "Believe me, I would much rather come home after a long day at school and slump down on the couch. The other day, I decided to go on a walk when I got home. I looked around and listened to the sounds...",
    gradient: "from-dusty-rose/30 to-amber/20",
  }
];

export default function Connect() {
  const { data: apiPosts, isLoading } = useGetBlogPosts();
  
  const gradients = [
    "from-amber/30 to-terracotta/20",
    "from-sage/30 to-dusty-rose/20",
    "from-dusty-rose/30 to-amber/20",
    "from-terracotta/30 to-sage/20"
  ];

  const posts = apiPosts && apiPosts.length > 0 
    ? apiPosts.map((p, i) => ({
        ...p, 
        gradient: gradients[i % gradients.length]
      }))
    : SAMPLE_POSTS;

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative overflow-hidden">
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 mb-24 text-center relative z-10">
        
        {/* Wildflower bunch SVG decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none -z-10">
          <svg width="300" height="200" viewBox="0 0 300 200" fill="none">
             <path d="M150 200 Q150 100 100 50" stroke="#688A52" strokeWidth="2" strokeLinecap="round"/>
             <path d="M150 200 Q150 120 200 80" stroke="#688A52" strokeWidth="2" strokeLinecap="round"/>
             <path d="M150 200 Q150 50 150 20" stroke="#688A52" strokeWidth="3" strokeLinecap="round"/>
             
             {/* Flowers */}
             <circle cx="100" cy="50" r="15" fill="#D4A44C" opacity="0.8"/>
             <circle cx="200" cy="80" r="12" fill="#C4622D" opacity="0.8"/>
             <circle cx="150" cy="20" r="18" fill="#C9A0A8" opacity="0.8"/>
          </svg>
        </div>

        {/* Submit Post Button Top Right */}
        <div className="absolute top-4 right-4 md:right-12 z-20">
          <Link href="/connect/submit">
            <button className="bg-terracotta hover:bg-terracotta/90 text-white px-8 py-3 rounded-full font-sans font-bold text-lg tracking-wide shadow-md transition-all hover:scale-105 flex items-center gap-3">
              Submit Post
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M12 20h9" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </Link>
        </div>

        <h1 className="text-6xl md:text-8xl font-display italic text-foreground mb-4 drop-shadow-sm mt-8">
          Blog
        </h1>
        <p className="text-2xl md:text-3xl text-sage font-display italic mb-16">
          Real Stories. Real Talk. Real Collaboration...
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-[2rem] p-6 h-[400px] animate-pulse border border-card-border/50">
                <div className="w-full h-40 bg-card-border/30 rounded-2xl mb-6"></div>
                <div className="h-6 bg-card-border/30 rounded-md w-3/4 mb-3"></div>
                <div className="h-4 bg-card-border/30 rounded-md w-1/4 mb-6"></div>
                <div className="h-4 bg-card-border/30 rounded-md w-full mb-2"></div>
                <div className="h-4 bg-card-border/30 rounded-md w-full mb-2"></div>
                <div className="h-4 bg-card-border/30 rounded-md w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {posts.map((post) => (
              <div key={post.id} className="bg-card rounded-[2rem] p-6 flex flex-col items-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-card-border/50">
                
                {/* Gradient Image Area */}
                <div className={`w-full aspect-[4/3] rounded-2xl bg-gradient-to-br ${post.gradient} mb-6 relative overflow-hidden flex items-center justify-center`}>
                  <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-16 h-16 text-foreground/20">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>

                <div className="w-full flex flex-col flex-1">
                  <h3 className="font-display italic font-semibold text-2xl text-foreground mb-1 leading-tight">
                    {post.title}
                  </h3>
                  <p className="font-handwritten text-xl text-terracotta mb-4">
                    By {post.author}
                  </p>
                  <p className="text-sm text-foreground/70 font-sans leading-relaxed mb-8 flex-1">
                    {post.excerpt}
                  </p>
                  
                  <Link href={`/connect/post/${post.id}`}>
                    <button className="w-full border-2 border-terracotta text-terracotta hover:bg-terracotta hover:text-white font-sans font-bold px-6 py-2.5 rounded-full transition-colors text-sm uppercase tracking-wide">
                      Read More
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <WaveFooter quote="Your voice matters." />
    </div>
  );
}
