import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
} from "@workspace/mind-matters-ds/components/ui/alert-dialog";
import { useExploration } from "@/components/ExplorationProvider";
import { useWebsiteRulesAcknowledged } from "@/components/WebsiteRulesGate";
import { EXPLORATION_SECTIONS, REQUIRED_SECTIONS } from "@/lib/exploration";

export function GamesExplorationGate() {
  const { visited, hasSubmittedComment, storageUnavailable } = useExploration();
  const acknowledged = useWebsiteRulesAcknowledged();
  const [showPopup, setShowPopup] = useState(true);
  const remaining = Math.max(0, REQUIRED_SECTIONS - visited.length);
  const suggested = EXPLORATION_SECTIONS.filter((section) => !visited.includes(section.id)).slice(0, 3);

  const choices = (
    <div className="flex flex-col gap-3">
      {!hasSubmittedComment && (
        <Button asChild>
          <Link href="/connect" data-testid="games-leave-comment">Leave a kind comment</Link>
        </Button>
      )}
      {remaining > 0 && suggested.map((section) => (
        <Button key={section.id} asChild variant="outline">
          <Link href={section.href} data-testid={`explore-section-${section.id}`}>{section.label}</Link>
        </Button>
      ))}
      <Button asChild variant="secondary">
        <Link href="/#bright-spots" data-testid="explore-all-sections">Explore all sections</Link>
      </Button>
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 md:py-20">
      <h1 className="font-display text-4xl font-bold">Explore before you play</h1>
      <p className="mt-4 leading-relaxed text-foreground/85">
        The Brightside Project is about connection and a sense of belonging with peers.
        Visit three different sections and submit at least one kind, on-topic comment outside Games before playing.
      </p>
      <p className="mb-5 font-semibold" data-testid="games-comment-progress" role="status">
        {hasSubmittedComment ? "Comment requirement complete: sent for teacher approval." : "Comment requirement: submit one comment on another section."}
      </p>
      <p className="my-5 font-semibold" data-testid="games-exploration-progress" role="status">
        {Math.min(visited.length, REQUIRED_SECTIONS)} of {REQUIRED_SECTIONS} sections visited · {remaining} more to go
      </p>
      {visited.length > 0 && (
        <p className="mb-5 text-sm text-muted-foreground">
          Already explored: {EXPLORATION_SECTIONS.filter((section) => visited.includes(section.id)).map((section) => section.label).join(", ")}.
        </p>
      )}
      {choices}
      <Button variant="ghost" className="mt-4" onClick={() => setShowPopup(true)} data-testid="games-show-requirements">View game requirements</Button>
      <p className="mt-5 text-sm text-muted-foreground">
        Each section counts once per browsing session in this tab. Home and Games do not count.
        After visiting three sections and submitting a comment, return here to play.
        Comments count when successfully sent for teacher approval; you do not need to wait for approval.
        Look for “Join the conversation” below a section’s content. Do not share personal information.
      </p>
      {storageUnavailable && <p role="alert" className="mt-3 text-sm text-destructive">Your browser is blocking session storage. Your progress will last while you keep this site open without reloading.</p>}

      <AlertDialog open={acknowledged && showPopup}>
        <AlertDialogContent
          className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl"
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{remaining > 0 ? "Explore and comment to unlock games" : "Leave a comment to unlock games"}</AlertDialogTitle>
            <AlertDialogDescription>
              Our website is about connecting with peers and feeling a sense of belonging—not just games.
              You have visited {Math.min(visited.length, REQUIRED_SECTIONS)} of {REQUIRED_SECTIONS} so far.
              {remaining > 0 ? ` Explore ${remaining} more ${remaining === 1 ? "section" : "sections"}.` : " Your section visits are complete."}
              {hasSubmittedComment ? " Your comment requirement is complete." : " You also need to submit one kind, on-topic comment on another section. It counts when sent for teacher approval, even while approval is pending."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {choices}
          <Button variant="ghost" onClick={() => setShowPopup(false)} data-testid="games-dismiss-popup">Keep exploring</Button>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
