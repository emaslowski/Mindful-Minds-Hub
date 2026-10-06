import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, Download, Gamepad2, Lightbulb, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCRATCH_STARTERS, starterHref } from "@/components/games/scratchStarters";

const EDITOR_URL = `${import.meta.env.BASE_URL}coding-editor/index.html`;
const LEAVE_WARNING =
  "Your project may have unsaved changes. In the editor, use File > Save to your computer before leaving this page. Leave anyway?";

export function ScratchPlayground({ isActive }: { isActive: boolean }) {
  const [editorOpened, setEditorOpened] = useState(false);
  const [selectedStarter, setSelectedStarter] = useState<string | null>(null);

  useEffect(() => {
    if (!editorOpened) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const confirmInternalNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute("download") || anchor.target === "_blank") return;

      let destination: URL;
      try {
        destination = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
      if (!window.confirm(LEAVE_WARNING)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    document.addEventListener("click", confirmInternalNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      document.removeEventListener("click", confirmInternalNavigation, true);
    };
  }, [editorOpened]);

  return (
    <section
      aria-labelledby="coding-playground-title"
      data-active={isActive}
      className="min-w-0 space-y-6"
    >
      <header className="rounded-3xl border border-card-border bg-card p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Gamepad2 aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-secondary">Make something that moves</p>
            <h2 id="coding-playground-title" className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">
              Your first game, one block at a time
            </h2>
            <p className="mt-2 max-w-3xl text-foreground/80">
              Choose a starter, open the Scratch-compatible editor, and change the blocks to make the game your own.
              No account is needed.
            </p>
          </div>
        </div>
      </header>

      <section aria-labelledby="starter-games-title" className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">Start with a small win</p>
          <h3 id="starter-games-title" className="mt-1 text-2xl font-bold">Pick a starter game</h3>
          <p className="mt-1 max-w-3xl text-foreground/80">
            Download a starter file first. In the editor, choose <strong>File &gt; Load from your computer</strong> and
            select the <code className="rounded bg-muted px-1.5 py-0.5 text-sm">.sb3</code> file you downloaded.
          </p>
        </div>
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          {SCRATCH_STARTERS.map((starter) => (
            <article key={starter.id} className="flex min-w-0 flex-col rounded-2xl border border-card-border bg-card p-5 shadow-sm transition-transform hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xl font-bold">{starter.title}</h4>
                  <p className="mt-1 text-sm text-foreground/80">{starter.description}</p>
                </div>
                <span aria-hidden="true" className="rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary">
                  Starter
                </span>
              </div>
              <ol className="mt-4 space-y-2 border-l-2 border-secondary/30 pl-4 text-sm text-foreground/85">
                {starter.steps.map((step, index) => (
                  <li key={`${starter.id}-step-${index}`} data-testid={`starter-step-${starter.id}-${index + 1}`}>
                    <span className="font-semibold text-secondary">{index + 1}.</span> {step}
                  </li>
                ))}
              </ol>
              <p className="mt-4 flex gap-2 rounded-xl bg-accent/25 p-3 text-sm">
                <Lightbulb aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><strong>Try this next:</strong> {starter.challenge}</span>
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button asChild variant="outline" data-testid={`download-starter-${starter.id}`}>
                  <a
                    href={starterHref(starter.filename)}
                    download={starter.filename}
                    onClick={() => setSelectedStarter(starter.id)}
                  >
                    <Download aria-hidden="true" />
                    Download {starter.title}
                  </a>
                </Button>
                {selectedStarter === starter.id && (
                  <span role="status" className="text-sm font-semibold text-secondary" data-testid={`status-downloaded-${starter.id}`}>
                    Next: load this file in the editor.
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="editor-title" className="space-y-4 rounded-3xl border border-card-border bg-card p-5 shadow-sm sm:p-7">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">Save a copy as you go</p>
          <h3 id="editor-title" className="mt-1 text-2xl font-bold">Open the game editor when you’re ready</h3>
        </div>

        <div className="rounded-2xl border border-amber/60 bg-accent/25 p-4 sm:p-5" aria-label="Privacy and saving information">
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
            <div className="space-y-2 text-sm">
              <p className="font-bold">A quick privacy and saving check before you start</p>
              <p>
                This site does not publish your projects, and your work is not saved on this website. Save a copy to
                your computer often. Do not enter your name or other personal information, or turn on cloud features
                or custom extensions unless your teacher says it is okay.
              </p>
              <p>
                The open-source Scratch editor runs on this site. Built-in sprite and sound libraries may load public assets
                from Scratch. Accounts, cloud saving, public sharing, and network/hardware extensions are not provided.
                {" "}<a className="font-semibold text-primary underline underline-offset-2" href={`${import.meta.env.BASE_URL}coding-editor/sources.html`} target="_blank" rel="noreferrer" data-testid="link-scratch-source">Editor licenses and source</a>.
              </p>
            </div>
          </div>
        </div>

        {!editorOpened ? (
          <div className="rounded-2xl border border-dashed border-secondary/50 bg-background/70 p-5 sm:p-6">
            <p className="text-sm text-foreground/80">
              The editor opens only after you choose below. Its own file menu handles loading and saving; this site does
              not upload or store your game.
            </p>
            <Button
              type="button"
              className="mt-4"
              onClick={() => {
                if (isActive) setEditorOpened(true);
              }}
              data-testid="button-open-editor"
            >
              Open the editor
              <ArrowUpRight aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 rounded-2xl bg-secondary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p><strong>Keep a copy:</strong> in the editor choose <strong>File &gt; Save to your computer</strong> to download your project as a <code className="rounded bg-background px-1 py-0.5">.sb3</code> file.</p>
              </div>
              <Button asChild variant="outline" className="shrink-0" data-testid="link-editor-new-tab">
                <a href={EDITOR_URL} target="_blank" rel="noreferrer">
                  Open in a new tab
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
            </div>
            <div className="w-full max-w-full overflow-auto rounded-2xl border border-card-border bg-background p-1">
              <iframe
                title="Scratch block-coding game editor"
                src={EDITOR_URL}
                className="block w-full rounded-xl"
                style={{ minWidth: "60rem", height: "min(78vh, 52rem)", minHeight: "32rem" }}
                sandbox="allow-scripts allow-downloads allow-modals"
                allow="fullscreen; camera 'none'; microphone 'none'; geolocation 'none'"
                allowFullScreen
                referrerPolicy="no-referrer"
                data-testid="iframe-scratch-editor"
              />
            </div>
            <p className="text-sm text-foreground/75">
              On a phone, scroll inside the editor frame to reach the full workspace. A laptop or tablet gives the blocks more room.
              Save before leaving; browser Back cannot always show a warning, and this page does not save your work.
              {" "}A new tab starts a separate workspace; save and reload your <code>.sb3</code> file to move your project there.
            </p>
          </div>
        )}
      </section>

      <section aria-label="Build and save steps" className="rounded-2xl border border-secondary/25 bg-secondary/10 p-5">
        <h3 className="text-xl font-bold">The quick path</h3>
        <ol className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <li className="rounded-xl bg-background/75 p-3"><strong>1. Load</strong><br />Download a starter, then use File &gt; Load from your computer.</li>
          <li className="rounded-xl bg-background/75 p-3"><strong>2. Experiment</strong><br />Press the green flag, then change a block and see what happens.</li>
          <li className="rounded-xl bg-background/75 p-3"><strong>3. Keep it</strong><br />Use File &gt; Save to your computer to get your own .sb3 copy.</li>
        </ol>
      </section>
    </section>
  );
}
