import { useState } from "react";
import { WaveFooter } from "@/components/WaveFooter";
import { Send, CheckCircle, Mail, User, BookOpen } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Contact() {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch(`${BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, grade, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong.");
      }

      setStatus("sent");
      setName("");
      setGrade("");
      setMessage("");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message ?? "Could not send your message. Please try again.");
    }
  };

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative">
      {/* Soft background blobs */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-terracotta/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full bg-sage/8 blur-3xl pointer-events-none" />

      {/* Floral branch — top left */}
      <div className="absolute top-4 left-2 md:left-10 pointer-events-none opacity-25 rotate-6">
        <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
          <path d="M10 120 Q35 85 60 55 Q85 25 115 8" stroke="#688A52" strokeWidth="2" strokeLinecap="round"/>
          {/* Flowers along branch */}
          <circle cx="38" cy="88" r="10" fill="#C4829A" opacity="0.5"/>
          <circle cx="38" cy="88" r="5" fill="#D4A44C"/>
          <circle cx="38" cy="77" r="4" fill="#FAF3E3" opacity="0.8"/>
          <circle cx="38" cy="99" r="4" fill="#FAF3E3" opacity="0.8"/>
          <circle cx="27" cy="88" r="4" fill="#FAF3E3" opacity="0.8"/>
          <circle cx="49" cy="88" r="4" fill="#FAF3E3" opacity="0.8"/>

          <circle cx="72" cy="50" r="8" fill="#C4622D" opacity="0.4"/>
          <circle cx="72" cy="50" r="4" fill="#D4A44C"/>
          <circle cx="72" cy="41" r="3.5" fill="#FAF3E3" opacity="0.8"/>
          <circle cx="72" cy="59" r="3.5" fill="#FAF3E3" opacity="0.8"/>
          <circle cx="63" cy="50" r="3.5" fill="#FAF3E3" opacity="0.8"/>
          <circle cx="81" cy="50" r="3.5" fill="#FAF3E3" opacity="0.8"/>

          {/* Leaves */}
          <ellipse cx="22" cy="105" rx="12" ry="5" fill="#688A52" opacity="0.5" transform="rotate(-45 22 105)"/>
          <ellipse cx="55" cy="70" rx="11" ry="5" fill="#688A52" opacity="0.5" transform="rotate(-40 55 70)"/>
          <ellipse cx="95" cy="28" rx="10" ry="4.5" fill="#688A52" opacity="0.5" transform="rotate(-50 95 28)"/>
        </svg>
      </div>

      {/* Botanical stems — bottom right */}
      <div className="absolute bottom-32 right-2 md:right-8 pointer-events-none opacity-20 -rotate-6">
        <svg width="100" height="130" viewBox="0 0 100 130" fill="none">
          <path d="M50 130 Q50 80 50 10" stroke="#688A52" strokeWidth="2" strokeLinecap="round"/>
          <path d="M50 100 Q25 80 15 60" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M50 70 Q72 52 82 35" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M50 40 Q30 25 22 10" stroke="#688A52" strokeWidth="1.5" strokeLinecap="round"/>
          <ellipse cx="16" cy="60" rx="10" ry="5" fill="#688A52" opacity="0.5" transform="rotate(-30 16 60)"/>
          <ellipse cx="81" cy="35" rx="10" ry="5" fill="#688A52" opacity="0.5" transform="rotate(28 81 35)"/>
          <ellipse cx="23" cy="10" rx="9" ry="4.5" fill="#688A52" opacity="0.5" transform="rotate(-35 23 10)"/>
          {/* Small blooms */}
          <circle cx="50" cy="10" r="7" fill="#C4829A" opacity="0.4"/>
          <circle cx="50" cy="10" r="3.5" fill="#D4A44C"/>
        </svg>
      </div>

      {/* Sparkle dots — mid right */}
      <div className="absolute top-1/2 right-4 md:right-20 pointer-events-none opacity-20">
        <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
          <path d="M30 5 L32 14 L41 16 L32 18 L30 27 L28 18 L19 16 L28 14Z" fill="#D4A44C"/>
          <circle cx="10" cy="50" r="4" fill="#C4829A"/>
          <circle cx="50" cy="42" r="3" fill="#688A52"/>
          <circle cx="25" cy="68" r="3.5" fill="#C4622D" opacity="0.7"/>
        </svg>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto px-4 mb-24 z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-terracotta/10 border border-terracotta/20 mb-6">
            <Mail className="text-terracotta" size={36} />
          </div>
          <h1 className="text-5xl md:text-7xl font-display italic text-foreground mb-4">
            Contact Us
          </h1>
          <p className="text-xl md:text-2xl text-sage font-handwritten leading-relaxed">
            Got a question, idea, or just want to say hi?
          </p>
          <p className="text-base font-sans text-foreground/60 mt-3 max-w-md mx-auto leading-relaxed">
            Send us a message and we'll read every one. Your voice matters here.
          </p>
        </div>

        {/* Success State */}
        {status === "sent" ? (
          <div className="bg-sage/10 border border-sage/30 rounded-3xl p-10 text-center shadow-sm">
            <CheckCircle className="text-sage mx-auto mb-4" size={56} />
            <h2 className="font-display italic text-3xl text-foreground mb-3">
              Message sent successfully.
            </h2>
            <p className="font-sans text-foreground/70 text-lg mb-8 max-w-sm mx-auto leading-relaxed">
              Thanks for reaching out. We'll get back to you soon!
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="px-8 py-3 rounded-full border border-terracotta text-terracotta font-sans text-sm tracking-wide transition-all hover:bg-terracotta hover:text-white"
            >
              Send another message
            </button>
          </div>
        ) : (
          /* Form */
          <form
            onSubmit={handleSubmit}
            className="bg-card rounded-3xl p-8 md:p-10 border border-card-border shadow-sm flex flex-col gap-6"
          >
            {/* Name */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 font-sans font-bold text-sm text-foreground/60 uppercase tracking-widest">
                <User size={14} /> Your Name <span className="text-terracotta">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex or just Anonymous"
                required
                className="bg-white/70 border border-black/10 rounded-2xl px-5 py-3.5 font-sans text-base focus:outline-none focus:ring-2 focus:ring-terracotta/40 transition placeholder:text-foreground/30"
              />
            </div>

            {/* Grade (optional) */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 font-sans font-bold text-sm text-foreground/60 uppercase tracking-widest">
                <BookOpen size={14} /> Grade <span className="text-foreground/30 font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="bg-white/70 border border-black/10 rounded-2xl px-5 py-3.5 font-sans text-base focus:outline-none focus:ring-2 focus:ring-terracotta/40 transition text-foreground/80"
              >
                <option value="">Prefer not to say</option>
                <option value="5th">5th Grade</option>
                <option value="6th">6th Grade</option>
                <option value="7th">7th Grade</option>
                <option value="8th">8th Grade</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 font-sans font-bold text-sm text-foreground/60 uppercase tracking-widest">
                <Send size={14} /> Your Message <span className="text-terracotta">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask a question, share an idea, or tell us how we can make The Brightside Project better..."
                required
                rows={6}
                className="bg-white/70 border border-black/10 rounded-2xl px-5 py-3.5 font-sans text-base focus:outline-none focus:ring-2 focus:ring-terracotta/40 transition resize-none placeholder:text-foreground/30 placeholder:font-handwritten placeholder:text-xl leading-relaxed"
              />
            </div>

            {/* Error */}
            {status === "error" && (
              <p className="font-sans text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {errorMsg}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "sending" || !name.trim() || !message.trim()}
              className="bg-terracotta hover:bg-terracotta/90 disabled:opacity-50 text-white px-10 py-4 rounded-full font-sans font-bold text-lg tracking-wide transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-3 self-start"
            >
              {status === "sending" ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send size={20} />
                  Send Message
                </>
              )}
            </button>

            <p className="font-sans text-xs text-foreground/40 leading-relaxed">
              Messages go directly to our team. You don't need to include your last name or any personal info you're not comfortable sharing.
            </p>
          </form>
        )}
      </div>

      <WaveFooter quote="Every voice deserves to be heard." />
    </div>
  );
}
