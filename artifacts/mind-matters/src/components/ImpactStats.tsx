import { useGetImpactStats } from "@workspace/api-client-react";

const STAT_LABELS: Record<string, { label: string; emoji: string }> = {
  resources_published: { label: "Resources Published", emoji: "📚" },
  student_creators: { label: "Student Creators", emoji: "✨" },
  projects_continued: { label: "Projects Continued", emoji: "🔄" },
  class_cycles: { label: "Class Cycles", emoji: "🌱" },
};

export function ImpactStats() {
  const { data, isLoading } = useGetImpactStats();

  if (isLoading) return null;

  const stats = data?.stats ?? {};
  const entries = Object.entries(stats).filter(([, v]) => typeof v === "number");

  if (entries.length === 0) return null;

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h2 className="font-display italic text-3xl md:text-4xl text-foreground mb-2">
          Our Impact
        </h2>
        <p className="font-handwritten text-xl text-sage">
          Created by students, for students.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        {entries.map(([key, value]) => {
          const meta = STAT_LABELS[key] ?? { label: key.replace(/_/g, " "), emoji: "⭐" };
          return (
            <div
              key={key}
              className="bg-card border border-card-border rounded-[2rem] px-8 py-6 flex flex-col items-center min-w-[150px] shadow-sm"
            >
              <span className="text-4xl mb-2">{meta.emoji}</span>
              <span className="font-display font-bold text-4xl text-terracotta">
                {value.toLocaleString()}
              </span>
              <span className="font-sans text-sm text-foreground/70 text-center mt-1 capitalize">
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
