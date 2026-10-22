import { useQuery } from "@tanstack/react-query";

export type ArtworkStudioUser = {
  id: string;
  role: "student" | "teacher";
  displayName: string;
};

export function useArtworkStudioSession() {
  return useQuery({
    queryKey: ["artwork-studio-session"],
    queryFn: async (): Promise<ArtworkStudioUser | null> => {
      const response = await fetch("/api/studio/auth/me", { credentials: "include" });
      if (response.status === 401 || response.status === 403) return null;
      if (!response.ok) throw new Error("Your Studio session could not be checked.");
      const result = (await response.json()) as { user?: ArtworkStudioUser | null };
      return result.user ?? null;
    },
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
    retry: false,
  });
}
