import { Link } from "wouter";
import { WaveFooter } from "@/components/WaveFooter";
import { useGetBlogPosts } from "@workspace/api-client-react";
import { FriendshipMatchmaker } from "@/components/FriendshipMatchmaker";
import { PublishedSection } from "@/components/PublishedSection";
import { DEFAULT_BLOG_COVER } from "@workspace/mind-matters-ds/components/PublishedArticle";

export default function Connect() {
  const { data: apiPosts, isLoading } = useGetBlogPosts();

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
            <span className="bg-terracotta hover:bg-terracotta/90 text-white px-8 py-3 rounded-full font-sans font-bold text-lg tracking-wide shadow-md transition-all hover:scale-105 flex items-center gap-3">
              Submit Post
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M12 20h9" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </Link>
        </div>

        <h1 className="text-6xl md:text-8xl font-display italic text-foreground mb-4 drop-shadow-sm mt-8">
          Blog
        </h1>
        <p className="text-2xl md:text-3xl text-sage font-display italic mb-16">
          Real Stories. Real Talk. Real Collaboration...
        </p>

        {isLoading ? (
          <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 text-left" aria-label="Loading blog posts">
            {[0, 1].map((i) => <div key={i} className="animate-pulse rounded-2xl border border-card-border/50 bg-card p-6">
              <div className="mb-6 h-56 w-full rounded-2xl bg-card-border/30" />
              <div className="mb-3 h-6 w-3/4 rounded-md bg-card-border/30" />
              <div className="h-4 w-full rounded-md bg-card-border/30" />
            </div>)}
          </div>
        ) : apiPosts?.length ? (
          <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 text-left">
            {apiPosts.map((post) => (
              <article key={post.id} className="rounded-2xl border border-card-border/50 bg-card p-6 shadow-sm">
                <img src={DEFAULT_BLOG_COVER} alt="A calm lake surrounded by a green landscape" className="mb-6 max-h-96 w-full rounded-2xl object-cover" />
                <h2 className="mb-2 font-display text-3xl italic leading-tight text-foreground">{post.title}</h2>
                <p className="mb-4 font-handwritten text-xl text-terracotta">By {post.author}</p>
                <p className="mb-6 font-sans leading-relaxed text-foreground/70">{post.excerpt}</p>
                <Link href={`/connect/blog/${post.id}`} className="inline-flex border-2 border-terracotta px-6 py-2.5 font-sans text-sm font-bold uppercase tracking-wide text-terracotta transition-colors hover:bg-terracotta hover:text-white">
                  Read More
                </Link>
              </article>
            ))}
          </div>
        ) : null}
      </div>

      <PublishedSection section="blog" heading="From Our Students" className="mb-12" />

      <FriendshipMatchmaker />
      <WaveFooter quote="Your voice matters." />
    </div>
  );
}
