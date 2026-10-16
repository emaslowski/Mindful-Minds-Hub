import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/mind-matters-ds/components/ui/alert-dialog';

const ACKNOWLEDGMENT_KEY = 'middle-school-matters-website-rules-v1';

const rules = [
  "Please don't share personal information (no last names, phone numbers, or addresses).",
  'Use respectful language when posting.',
  'Everyone is welcomed and celebrated here.',
  'All information is researched before publishing.',
  'Mrs. Maslowski has to approve everything before it is posted.',
];

function alreadyAcknowledged() {
  try {
    return window.localStorage.getItem(ACKNOWLEDGMENT_KEY) === 'acknowledged';
  } catch {
    return false;
  }
}

export function WebsiteRulesGate() {
  const [acknowledged, setAcknowledged] = useState(alreadyAcknowledged);

  function acknowledge() {
    try {
      window.localStorage.setItem(ACKNOWLEDGMENT_KEY, 'acknowledged');
    } catch {
      // Storage may be disabled; the acknowledgment still lasts until reload.
    }
    setAcknowledged(true);
  }

  return (
    <AlertDialog open={!acknowledged}>
      <AlertDialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border-border bg-background p-6 sm:p-8"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            The Brightside Project Website Rules
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed text-foreground/80">
            Please read these rules before entering the website.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ol className="list-decimal space-y-3 pl-6 text-base leading-relaxed text-foreground marker:font-bold marker:text-primary">
          {rules.map((rule) => <li key={rule} className="pl-1">{rule}</li>)}
        </ol>
        <AlertDialogAction
          onClick={acknowledge}
          className="mt-2 w-full rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground hover:bg-primary/90"
        >
          I acknowledge
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}