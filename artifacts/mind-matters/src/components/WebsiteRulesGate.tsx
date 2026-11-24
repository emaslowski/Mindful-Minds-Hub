import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/mind-matters-ds/components/ui/alert-dialog';
import { useSiteContent } from '@/lib/siteContent';

/**
 * First-visit agreement. The rules come from the editable site content
 * entry `site.rules`, which starts empty on a new hub: with no rules there
 * is no dialog. Once the teacher publishes the class's Community Promise
 * (Command Center → Settings → Website Rules, or through the Site
 * Assistant), every visitor reads and accepts it once per browser. The
 * acknowledgment is keyed by the rules' text, so a changed list asks again.
 */
const STORAGE_PREFIX = 'brightside-website-rules:';
const WebsiteRulesContext = createContext(true);
export const useWebsiteRulesAcknowledged = () => useContext(WebsiteRulesContext);

function rulesKey(rules: string[]) {
  // Small string hash; the key only has to change when the text changes.
  let h = 0;
  const text = rules.join('\n');
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return STORAGE_PREFIX + (h >>> 0).toString(36);
}

function alreadyAcknowledged(key: string) {
  try {
    return window.localStorage.getItem(key) === 'acknowledged';
  } catch {
    return false;
  }
}

export function WebsiteRulesGate({ children }: { children?: ReactNode }) {
  const raw = useSiteContent('site.rules');
  const rules = useMemo(
    () => (Array.isArray(raw) ? raw.filter((r): r is string => typeof r === 'string' && r.trim().length > 0) : []),
    [raw],
  );
  const key = rulesKey(rules);
  const [acknowledgedKey, setAcknowledgedKey] = useState<string | null>(null);

  useEffect(() => {
    setAcknowledgedKey(alreadyAcknowledged(key) ? key : null);
  }, [key]);

  const acknowledged = rules.length === 0 || acknowledgedKey === key;

  function acknowledge() {
    try {
      window.localStorage.setItem(key, 'acknowledged');
    } catch {
      // Storage may be disabled; the acknowledgment still lasts until reload.
    }
    setAcknowledgedKey(key);
  }

  return (
    <WebsiteRulesContext.Provider value={acknowledged}>
    {children}
    <AlertDialog open={!acknowledged}>
      <AlertDialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border-border bg-background p-6 sm:p-8"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            The Brightside Wellness Project Website Rules
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed text-foreground/80">
            Please read these rules before entering the website.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ol className="list-decimal space-y-3 pl-6 text-base leading-relaxed text-foreground marker:font-bold marker:text-primary">
          {rules.map((rule, i) => <li key={`${i}-${rule}`} className="pl-1">{rule}</li>)}
        </ol>
        <AlertDialogAction
          onClick={acknowledge}
          className="mt-2 w-full rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground hover:bg-primary/90"
        >
          I acknowledge
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
    </WebsiteRulesContext.Provider>
  );
}
