import { Link } from "wouter";
import { WaveFooter } from "@/components/WaveFooter";
import { useGetBlogPosts, useGetPublishedContent } from "@workspace/api-client-react";
import { Star } from "lucide-react";
import { FriendshipMatchmaker } from "@/components/FriendshipMatchmaker";

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
  const { data: publishedData } = useGetPublishedContent({ section: "blog" });
  const publishedPosts = publishedData?.publications ?? [];
  
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
    <div className="w-full flex flex-col flex-1 pt-12 relative">

      {/* Butterfly — top left */}
      <div className="absolute top-6 left-4 md:left-14 pointer-events-none opacity-25">
        <svg width="100" height="90" viewBox="0 0 100 90" fill="none">
          {/* Left wings */}
          <path d="M50 45 Q20 15 5 25 Q0 45 25 55 Q40 60 50 45Z" fill="#C4829A" opacity="0.7"/>
          <path d="M50 45 Q18 55 10 70 Q20 85 40 75 Q52 65 50 45Z" fill="#C4829A" opacity="0.5"/>
          {/* Right wings */}
          <path d="M50 45 Q80 15 95 25 Q100 45 75 55 Q60 60 50 45Z" fill="#D4A44C" opacity="0.7"/>
          <path d="M50 45 Q82 55 90 70 Q80 85 60 75 Q48 65 50 45Z" fill="#D4A44C" opacity="0.5"/>
          {/* Body */}
          <ellipse cx="50" cy="48" rx="3" ry="18" fill="#5A3A1A" opacity="0.6"/>
          {/* Antennae */}
          <path d="M50 30 Q42 18 38 12" stroke="#5A3A1A" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
          <circle cx="38" cy="12" r="2.5" fill="#C4622D" opacity="0.5"/>
          <path d="M50 30 Q58 18 62 12" stroke="#5A3A1A" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
          <circle cx="62" cy="12" r="2.5" fill="#C4622D" opacity="0.5"/>
          {/* Wing spots */}
          <circle cx="28" cy="38" r="5" fill="#FAF3E3" opacity="0.5"/>
          <circle cx="72" cy="38" r="5" fill="#FAF3E3" opacity="0.5"/>
        </svg>
      </div>

      {/* Floral spray — top right */}
      <div className="absolute top-4 right-4 md:right-14 pointer-events-none opacity-22 -rotate-6">
        <svg width="110" height="120" viewBox="0 0 110 120" fill="none">
          <path d="M55 120 Q55 70 55 15" stroke="#688A52" strokeWidth="2" strokeLinecap="round"/>
          <path d="M55 90 Q32 72 18 54" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M55 65 Q78 48 90 30" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M55 42 Q34 27 26 10" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <ellipse cx="18" cy="54" rx="11" ry="5" fill="#688A52" opacity="0.5" transform="rotate(-32 18 54)"/>
          <ellipse cx="89" cy="30" rx="11" ry="5" fill="#688A52" opacity="0.5" transform="rotate(28 89 30)"/>
          <ellipse cx="27" cy="10" rx="9" ry="4" fill="#688A52" opacity="0.5" transform="rotate(-38 27 10)"/>
          {/* Blooms */}
          <circle cx="55" cy="15" r="9" fill="#C4829A" opacity="0.5"/>
          <circle cx="55" cy="15" r="4.5" fill="#D4A44C"/>
        </svg>
      </div>

      {/* Stars + dots — bottom left */}
      <div className="absolute bottom-32 left-4 md:left-12 pointer-events-none opacity-20">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <path d="M20 12 L22 20 L30 22 L22 24 L20 32 L18 24 L10 22 L18 20Z" fill="#D4A44C"/>
          <path d="M60 50 L61.5 55.5 L67 57 L61.5 58.5 L60 64 L58.5 58.5 L53 57 L58.5 55.5Z" fill="#C4622D" opacity="0.7"/>
          <circle cx="50" cy="15" r="4" fill="#688A52" opacity="0.6"/>
          <circle cx="12" cy="55" r="3" fill="#C4829A"/>
          <circle cx="70" cy="25" r="2.5" fill="#D4A44C"/>
        </svg>
      </div>

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

      {/* Published student blog articles from Studio */}
      {publishedPosts.length > 0 && (
        <div className="w-full max-w-6xl mx-auto px-4 mb-12">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px flex-1 bg-sage/20 max-w-[120px]"></div>
            <h2 className="font-display italic text-2xl text-foreground">From Our Students</h2>
            <div className="h-px flex-1 bg-sage/20 max-w-[120px]"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {publishedPosts.map((item, i) => (
              <div
                key={item.id}
                className={`bg-gradient-to-br ${gradients[i % gradients.length]} rounded-[2rem] p-6 flex flex-col border border-white/40 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <Star size={12} className="text-amber fill-amber" />
                  <span className="font-sans text-xs font-bold text-amber uppercase tracking-widest">
                    Middle School Matters Student Team
                  </span>
                </div>
                <h3 className="font-display italic font-semibold text-2xl text-foreground mb-3 leading-tight">
                  {item.title}
                </h3>
                {item.content && (
                  <p className="font-sans text-sm text-foreground/70 leading-relaxed line-clamp-4 flex-1">
                    {item.content.slice(0, 200)}{item.content.length > 200 ? "…" : ""}
                  </p>
                )}
                <span className="mt-4 font-sans text-xs text-foreground/50">{item.authorDisplay}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <FriendshipMatchmaker />
      <WaveFooter quote="Your voice matters." />
    </div>
  );
}
