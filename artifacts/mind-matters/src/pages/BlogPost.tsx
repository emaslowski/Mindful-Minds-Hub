import { Link, useParams } from "wouter";
import { WaveFooter } from "@/components/WaveFooter";
import { useGetBlogPost, getGetBlogPostQueryKey } from "@workspace/api-client-react";

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  
  // Try to load from API
  const { data: post, isLoading, isError } = useGetBlogPost(Number(id), { 
    query: { 
      enabled: !!id,
      retry: false,
      queryKey: getGetBlogPostQueryKey(Number(id))
    } 
  });

  // Fallback data if API fails or is not ready
  const fallbackPost = {
    title: "How I Deal with Test Anxiety",
    author: "Anna",
    content: "Math is definitely not my strongest subject. When I hear the teacher say, \"We have a test on Friday!\" I feel anxious the rest of the week!\n\nSome things that really helped me were studying a little bit every night instead of cramming, and taking deep breaths before the test starts. Remember, a test doesn't define who you are!\n\nI also found that talking to my teacher helped a lot. They actually gave me some extra practice problems to feel more confident. So don't be afraid to ask for help when you need it!",
    submittedAt: new Date().toISOString(),
  };

  const displayPost = isError || (!isLoading && !post) ? fallbackPost : post;

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative">
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 mb-24 relative z-10">
        
        <Link href="/connect" className="text-terracotta hover:text-terracotta/80 font-sans font-medium mb-12 inline-block transition-colors">
          ← Back to Blog
        </Link>

        {isLoading ? (
          <div className="bg-card rounded-[2rem] p-8 md:p-16 shadow-sm animate-pulse border border-card-border/50">
            <div className="h-12 bg-card-border/30 rounded-xl w-3/4 mb-6"></div>
            <div className="h-6 bg-card-border/30 rounded-md w-1/4 mb-16"></div>
            <div className="space-y-4">
              <div className="h-4 bg-card-border/30 rounded-md w-full"></div>
              <div className="h-4 bg-card-border/30 rounded-md w-full"></div>
              <div className="h-4 bg-card-border/30 rounded-md w-11/12"></div>
              <div className="h-4 bg-card-border/30 rounded-md w-full"></div>
              <div className="h-4 bg-card-border/30 rounded-md w-3/4"></div>
            </div>
          </div>
        ) : displayPost ? (
          <div className="bg-card rounded-[2rem] p-8 md:p-16 shadow-lg border border-card-border relative overflow-hidden">
            
            {/* Decorative Botanical Corner */}
            <div className="absolute -top-4 -right-4 text-sage opacity-20 pointer-events-none">
              <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
              </svg>
            </div>

            <h1 className="text-5xl md:text-7xl font-display italic font-bold text-foreground mb-8 leading-tight drop-shadow-sm">
              {displayPost.title}
            </h1>
            
            <div className="flex items-center gap-4 mb-14 border-b border-card-border pb-8">
              <div className="w-14 h-14 rounded-full bg-sage/20 flex items-center justify-center text-2xl text-sage border border-sage/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <p className="font-handwritten text-2xl text-terracotta mb-1">
                  By {displayPost.author}
                </p>
                <p className="text-sm text-foreground/50 font-sans tracking-wide">
                  {new Date(displayPost.submittedAt).toLocaleDateString(undefined, { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <div className="prose prose-lg md:prose-xl max-w-none text-foreground/80 font-sans leading-relaxed whitespace-pre-wrap selection:bg-terracotta/20">
              {displayPost.content}
            </div>

          </div>
        ) : null}
      </div>

      <WaveFooter quote="Thanks for reading!" />
    </div>
  );
}
