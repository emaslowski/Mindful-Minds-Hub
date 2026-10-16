import { useState } from "react";
import { WaveFooter } from "@/components/WaveFooter";
import { useSubmitReview, useGetReviews } from "@workspace/api-client-react";
import { Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function Review() {
  const { data: reviews, refetch } = useGetReviews();
  const { mutate: submitReview, isPending } = useSubmitReview();
  
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || helpful === null) return;

    submitReview(
      { data: { rating, helpful, comment: comment.trim() || undefined } },
      {
        onSuccess: () => {
          setSubmitted(true);
          refetch();
        }
      }
    );
  };

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative">
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 mb-24 z-10 flex flex-col items-center">
        
        <h1 className="text-5xl md:text-7xl font-display italic text-foreground mb-4 text-center">
          Was this site helpful?
        </h1>
        <p className="text-xl md:text-2xl text-sage font-sans text-center mb-12">
          We want to make The Brightside Project the best it can be. Let us know how we're doing!
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-card rounded-[3rem] p-8 md:p-12 shadow-sm border border-card-border/50 mb-16">
            
            {/* Rating Stars */}
            <div className="flex flex-col items-center mb-10">
              <label className="font-display font-bold text-2xl text-foreground mb-4">Rate your experience</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={48}
                      className={`${
                        (hoverRating || rating) >= star
                          ? "fill-amber text-amber"
                          : "fill-transparent text-amber/30"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Helpful Toggle */}
            <div className="flex flex-col items-center mb-10">
              <label className="font-display font-bold text-2xl text-foreground mb-4">Did you find what you were looking for?</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setHelpful(true)}
                  className={`px-8 py-3 rounded-full font-sans font-bold text-lg transition-all ${
                    helpful === true 
                      ? "bg-sage text-white shadow-md" 
                      : "bg-white/50 text-foreground/70 hover:bg-sage/20 border border-black/5"
                  }`}
                >
                  Yes, I did!
                </button>
                <button
                  type="button"
                  onClick={() => setHelpful(false)}
                  className={`px-8 py-3 rounded-full font-sans font-bold text-lg transition-all ${
                    helpful === false 
                      ? "bg-terracotta text-white shadow-md" 
                      : "bg-white/50 text-foreground/70 hover:bg-terracotta/20 border border-black/5"
                  }`}
                >
                  Not really
                </button>
              </div>
            </div>

            {/* Comment */}
            <div className="flex flex-col w-full mb-10">
              <label htmlFor="comment" className="font-display font-bold text-2xl text-foreground mb-4 flex items-center gap-2">
                <MessageSquare size={24} className="text-sage" /> Any other feedback? (Optional)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us what you liked or what we could improve..."
                className="w-full bg-white/60 border border-black/10 rounded-3xl p-6 font-sans text-lg focus:outline-none focus:ring-2 focus:ring-sage/50 resize-none min-h-[120px]"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || rating === 0 || helpful === null}
              className="w-full bg-terracotta hover:bg-terracotta/90 text-white font-sans font-bold text-xl py-4 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {isPending ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        ) : (
          <div className="w-full max-w-2xl bg-sage/10 rounded-[3rem] p-12 text-center border border-sage/20 mb-16 animate-in zoom-in-95">
            <div className="w-24 h-24 bg-sage text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Star fill="currentColor" size={48} />
            </div>
            <h2 className="text-4xl font-display italic text-foreground mb-4">Thank You!</h2>
            <p className="text-xl font-sans text-foreground/80">
              Your feedback is super important to us and helps make The Brightside Project better for everyone.
            </p>
            <button 
              onClick={() => { setSubmitted(false); setRating(0); setHelpful(null); setComment(""); }}
              className="mt-8 text-sage font-bold font-sans underline underline-offset-4"
            >
              Submit another review
            </button>
          </div>
        )}

        {/* Recent Reviews List */}
        {reviews && reviews.length > 0 && (
          <div className="w-full max-w-4xl mt-12">
            <h3 className="font-display italic text-3xl md:text-4xl text-foreground mb-8 text-center border-b border-border/50 pb-4">
              Recent Feedback
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white/40 backdrop-blur-sm p-6 rounded-3xl border border-white/50 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={16} className={s <= r.rating ? "fill-amber text-amber" : "fill-transparent text-black/10"} />
                      ))}
                    </div>
                    <span className="font-sans text-xs text-foreground/50">
                      {format(new Date(r.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="font-sans text-foreground/80 flex-1 italic">"{r.comment}"</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-black/5">
                     <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-sans ${r.helpful ? 'bg-sage/20 text-sage' : 'bg-terracotta/20 text-terracotta'}`}>
                       {r.helpful ? 'Found what they needed' : 'Still looking'}
                     </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      <WaveFooter quote="Your feedback helps us grow." />
    </div>
  );
}
