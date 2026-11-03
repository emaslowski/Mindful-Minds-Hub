import { useState } from "react";
import { WaveFooter } from "@/components/WaveFooter";
import { useGetCollabPosts, useSubmitCollabPost, useGetCollabComments, useAddCollabComment } from "@workspace/api-client-react";
import { Users, MessageCircle, Send } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

function BackButton() {
  return (
    <div className="mb-8">
      <Link href="/grow">
        <button className="px-6 py-2 rounded-full border border-terracotta text-terracotta font-sans text-sm tracking-wide transition-all hover:bg-terracotta hover:text-white">
          ← Back to Grow
        </button>
      </Link>
    </div>
  );
}

// Component for a single post with its comments section
function PostCard({ post, onCommentSubmitted }: { post: any; onCommentSubmitted: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { data: comments, refetch } = useGetCollabComments(post.id, {
    query: {
      enabled: expanded,
      refetchInterval: expanded ? 30_000 : false,
      refetchOnWindowFocus: true,
    },
  });
  const { mutate: addComment, isPending } = useAddCollabComment();
  
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentSubmitted, setCommentSubmitted] = useState(false);

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return;
    
    addComment(
      { id: post.id, data: { authorName: commentName, content: commentText } },
      {
        onSuccess: () => {
          setCommentName("");
          setCommentText("");
          setCommentSubmitted(true);
          refetch();
          onCommentSubmitted();
        }
      }
    );
  };

  return (
    <div className="bg-[#f4ebd8] p-6 md:p-8 rounded-sm shadow-md border-t-[12px] border-terracotta relative mb-8">
      {/* Thumbtack */}
      <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 w-6 h-6 bg-sage rounded-full shadow-md z-10 border border-black/10"></div>
      
      <div className="mb-4">
        <span className="font-sans text-sm font-bold text-terracotta uppercase tracking-widest">
          {post.authorName}
        </span>
        <span className="font-sans text-xs text-foreground/50 ml-4">
          {format(new Date(post.createdAt), "MMM d, yyyy")}
        </span>
      </div>
      
      <p className="font-sans text-lg text-foreground leading-relaxed mb-6">
        {post.content}
      </p>

      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 font-sans font-bold text-sm text-sage hover:text-sage/80 transition-colors"
      >
        <MessageCircle size={16} /> Comments ({post.commentCount})
      </button>

      {expanded && (
        <div className="mt-6 pt-6 border-t border-black/10">
          <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
            {comments && comments.length > 0 ? comments.map((c: any) => (
              <div key={c.id} className="bg-white/50 p-4 rounded-xl border border-black/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-sans font-bold text-sm text-foreground">{c.authorName}</span>
                  <span className="font-sans text-xs text-foreground/50">{format(new Date(c.createdAt), "MMM d")}</span>
                </div>
                <p className="font-sans text-sm text-foreground/80">{c.content}</p>
              </div>
            )) : (
                <div className="text-center font-sans text-sm text-foreground/50 italic py-2">
                  No approved comments yet. Comments appear here after a moderator authorizes them.
              </div>
            )}
          </div>
          
          <form onSubmit={handleComment} className="flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="Your first name" 
              value={commentName}
              onChange={(e) => setCommentName(e.target.value)}
              className="w-full bg-white/60 border border-black/10 rounded-lg p-2.5 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-sage"
            />
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Add a kind comment..." 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-white/60 border border-black/10 rounded-lg p-2.5 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-sage"
              />
              <button 
                type="submit"
                disabled={isPending || !commentName.trim() || !commentText.trim()}
                className="bg-sage text-white p-2.5 rounded-lg hover:bg-sage/90 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
            {commentSubmitted && (
              <p className="text-xs text-sage font-sans">
                Thanks! Your comment was sent to a moderator for approval.
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

export default function GrowCollab() {
  const { data: posts, refetch } = useGetCollabPosts({
    query: {
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
    },
  });
  const { mutate: submitPost, isPending } = useSubmitCollabPost();
  
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;
    
    submitPost(
      { data: { authorName, content } },
      {
        onSuccess: () => {
          setSubmitted(true);
          setAuthorName("");
          setContent("");
          // Note: posts require approval, so they won't show up immediately, but we can refetch anyway.
          refetch();
          setTimeout(() => setSubmitted(false), 5000);
        }
      }
    );
  };

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative bg-[#e8dcc4]/20">
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'20\\' height=\\'20\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Ccircle cx=\\'2\\' cy=\\'2\\' r=\\'2\\' fill=\\'%23688a52\\'/%3E%3C/svg%3E')"}}></div>

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 mb-24 z-10 flex flex-col lg:flex-row gap-12">
        
        {/* Left Column: Header & Form */}
        <div className="w-full lg:w-1/3 flex flex-col">
          <BackButton />
          <div className="mb-10">
            <h1 className="text-5xl font-display italic text-foreground mb-4 flex items-center gap-3">
              <Users className="text-terracotta" size={36} /> Brightside Advice Column
            </h1>
            <p className="text-lg font-sans text-foreground/80 leading-relaxed">
              Share kind thoughts, ask for advice, and encourage classmates. Posts and comments appear only after teacher approval, helping keep discussions safe and supportive.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white shadow-sm sticky top-8">
            <h2 className="font-display font-bold text-2xl mb-6 text-foreground">Post to the board</h2>
            
            {submitted ? (
              <div className="bg-sage/10 text-sage p-4 rounded-xl border border-sage/20 text-center font-sans">
                Thanks for sharing! Your post will appear on the board once approved by a moderator.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="font-sans font-bold text-xs uppercase tracking-widest text-foreground/60 mb-2 block">First Name</label>
                  <input 
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full bg-transparent border border-border rounded-xl p-3 font-sans focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                  />
                </div>
                <div>
                  <label className="font-sans font-bold text-xs uppercase tracking-widest text-foreground/60 mb-2 block">Your Message</label>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="I want to share that..."
                    className="w-full bg-transparent border border-border rounded-xl p-3 font-sans min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending || !authorName.trim() || !content.trim()}
                  className="w-full bg-terracotta hover:bg-terracotta/90 text-white font-sans font-bold py-3 rounded-full transition-colors disabled:opacity-50 mt-2"
                >
                  Share with the board
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Masonry/List of Posts */}
        <div className="w-full lg:w-2/3">
          <div className="columns-1 md:columns-2 gap-8">
            {posts && posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="break-inside-avoid">
                  <PostCard post={post} onCommentSubmitted={() => refetch()} />
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-20 bg-white/30 rounded-3xl border border-dashed border-black/10">
                <p className="font-handwritten text-3xl text-terracotta/70">
                  The board is empty. Be the first to pin a thought!
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
      <WaveFooter quote="Together we grow stronger." />
    </div>
  );
}
