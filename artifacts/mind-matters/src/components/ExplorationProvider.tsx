import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { COMMENT_STORAGE_KEY, EXPLORATION_STORAGE_KEY, isQualifyingGameComment, recordSection, validVisitedSections } from "@/lib/exploration";
import { useWebsiteRulesAcknowledged } from "@/components/WebsiteRulesGate";

const ExplorationContext = createContext<{
  visited: string[];
  hasSubmittedComment: boolean;
  storageUnavailable: boolean;
  recordCommentSubmission: (section: string) => void;
}>({
  visited: [], hasSubmittedComment: false, storageUnavailable: false, recordCommentSubmission: () => {},
});

function restoreVisits() {
  try {
    return {
      visited: validVisitedSections(JSON.parse(sessionStorage.getItem(EXPLORATION_STORAGE_KEY) ?? "[]")),
      hasSubmittedComment: sessionStorage.getItem(COMMENT_STORAGE_KEY) === "submitted",
      storageUnavailable: false,
    };
  } catch {
    return { visited: [], hasSubmittedComment: false, storageUnavailable: true };
  }
}

export function ExplorationProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const acknowledged = useWebsiteRulesAcknowledged();
  const [progress, setProgress] = useState(restoreVisits);
  const recordCommentSubmission = useCallback((section: string) => {
    if (!isQualifyingGameComment(section)) return;
    let storageUnavailable = false;
    try {
      // Store only completion, never the comment text or visitor identity.
      sessionStorage.setItem(COMMENT_STORAGE_KEY, "submitted");
    } catch {
      storageUnavailable = true;
    }
    setProgress((current) => ({ ...current, hasSubmittedComment: true, storageUnavailable: current.storageUnavailable || storageUnavailable }));
  }, []);

  useEffect(() => {
    if (!acknowledged) return;
    setProgress((current) => {
      const visited = recordSection(current.visited, location);
      if (visited === current.visited) return current;
      try {
        sessionStorage.setItem(EXPLORATION_STORAGE_KEY, JSON.stringify(visited));
        return { ...current, visited };
      } catch {
        // Browsing remains usable when school privacy settings disable storage.
        return { ...current, visited, storageUnavailable: true };
      }
    });
  }, [location, acknowledged]);

  return <ExplorationContext.Provider value={{ ...progress, recordCommentSubmission }}>{children}</ExplorationContext.Provider>;
}

export const useExploration = () => useContext(ExplorationContext);
