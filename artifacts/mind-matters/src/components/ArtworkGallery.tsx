import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "wouter";
import {
  getListArtworkQueryKey,
  getListMyArtworkQueryKey,
  useCompleteArtwork,
  useDeleteArtwork,
  useListArtwork,
  useListMyArtwork,
  useRequestArtworkUpload,
} from "@workspace/api-client-react";
import type { ArtworkEntry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@workspace/mind-matters-ds/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@workspace/mind-matters-ds/components/ui/alert-dialog";
import { Badge } from "@workspace/mind-matters-ds/components/ui/badge";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/mind-matters-ds/components/ui/card";
import { Checkbox } from "@workspace/mind-matters-ds/components/ui/checkbox";
import { Input } from "@workspace/mind-matters-ds/components/ui/input";
import { Label } from "@workspace/mind-matters-ds/components/ui/label";
import { Skeleton } from "@workspace/mind-matters-ds/components/ui/skeleton";
import { useArtworkStudioSession } from "@/hooks/useArtworkStudioSession";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function statusVariant(status: ArtworkEntry["status"]) {
  if (status === "approved") return "secondary" as const;
  if (status === "rejected") return "destructive" as const;
  return "outline" as const;
}

function ArtworkImage({ artwork, privateImage = false }: { artwork: ArtworkEntry; privateImage?: boolean }) {
  return (
    <img
      src={artwork.imageUrl || `/api/artwork/${artwork.id}/image`}
      alt={`Artwork titled ${artwork.title} by ${artwork.artistName}`}
      className="aspect-square w-full rounded-lg bg-muted object-cover"
      loading="lazy"
      data-testid={`img-artwork-${artwork.id}`}
      referrerPolicy={privateImage ? "same-origin" : undefined}
    />
  );
}

function OwnArtworkList() {
  const queryClient = useQueryClient();
  const session = useArtworkStudioSession();
  const { data: ownArtworks, isLoading, isError, refetch } = useListMyArtwork({
    query: {
      enabled: Boolean(session.data),
      queryKey: [...getListMyArtworkQueryKey(), session.data?.id],
      staleTime: 30_000,
      refetchInterval: 60_000,
      retry: 1,
    },
  });
  const deleteArtwork = useDeleteArtwork();
  const [feedback, setFeedback] = useState("");

  if (session.isLoading || session.isFetching) return <Skeleton className="h-20 w-full" aria-label="Checking Studio session" />;
  if (!session.data) return null;
  if (isLoading) return <Skeleton className="h-40 w-full" aria-label="Loading your artwork submissions" />;
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Your submissions could not be loaded</AlertTitle>
        <AlertDescription className="mt-2 flex items-center gap-3">
          <span>Please try again.</span>
          <Button variant="outline" size="sm" onClick={() => void refetch()} data-testid="button-retry-my-artwork">Retry</Button>
        </AlertDescription>
      </Alert>
    );
  }

  const withdraw = async (artwork: ArtworkEntry) => {
    try {
      await deleteArtwork.mutateAsync({ id: artwork.id });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListMyArtworkQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListArtworkQueryKey() }),
      ]);
      setFeedback(`“${artwork.title}” was withdrawn.`);
    } catch {
      setFeedback("We could not withdraw this artwork. Please try again.");
    }
  };

  return (
    <section className="space-y-4" aria-labelledby="my-artwork-title">
      <div>
        <h3 id="my-artwork-title" className="font-display text-2xl italic text-foreground">Your submissions</h3>
        <p className="text-sm text-foreground/70">Only you and your teachers can see work that has not been approved.</p>
      </div>
      {feedback && <p role="status" className="text-sm text-foreground" data-testid="status-artwork-withdrawal">{feedback}</p>}
      {!ownArtworks?.length ? (
        <Card>
          <CardContent className="p-6 text-sm text-foreground/75">Your submitted artwork will appear here with its review status.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ownArtworks.map((artwork) => (
            <Card key={artwork.id} data-testid={`card-my-artwork-${artwork.id}`}>
              <CardContent className="space-y-3 p-4">
                <ArtworkImage artwork={artwork} privateImage />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="break-words font-semibold text-foreground">{artwork.title}</h4>
                    <p className="text-sm text-foreground/70">{artwork.artistName}</p>
                  </div>
                  <Badge variant={statusVariant(artwork.status)} data-testid={`status-artwork-${artwork.id}`}>
                    {artwork.status}
                  </Badge>
                </div>
                {artwork.status === "pending" && <p className="text-sm text-foreground/70">Waiting for teacher approval.</p>}
                {artwork.status === "approved" && <p className="text-sm text-foreground/70">Approved for public sharing.</p>}
                {artwork.status === "rejected" && <p className="text-sm text-foreground/70">Not approved for public sharing.</p>}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={deleteArtwork.isPending} data-testid={`button-withdraw-artwork-${artwork.id}`}>
                      Withdraw submission
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Withdraw this artwork?</AlertDialogTitle>
                      <AlertDialogDescription>This removes “{artwork.title}” from review and from the public gallery.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep submission</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void withdraw(artwork)} data-testid={`button-confirm-withdraw-${artwork.id}`}>
                        Withdraw artwork
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

export function ArtworkGallery() {
  const queryClient = useQueryClient();
  const session = useArtworkStudioSession();
  const gallery = useListArtwork({
    query: {
      queryKey: getListArtworkQueryKey(),
      staleTime: 30_000,
      refetchInterval: 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  });
  const requestUpload = useRequestArtworkUpload();
  const completeUpload = useCompleteArtwork();
  const [artistName, setArtistName] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFormError("");
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ALLOWED_CONTENT_TYPES.includes(selected.type as (typeof ALLOWED_CONTENT_TYPES)[number])) {
      setFile(null);
      event.target.value = "";
      setFormError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setFile(null);
      event.target.value = "";
      setFormError("Your image must be 10 MB or smaller.");
      return;
    }
    setFile(selected);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (uploading) return;
    setFormError("");
    setSuccess("");
    if (!session.data) {
      setFormError("Sign in to Studio before submitting your artwork.");
      return;
    }
    if (!artistName.trim() || !title.trim() || !file || !consent) {
      setFormError("Enter an artist name and title, choose an image, and agree to public sharing after approval.");
      return;
    }
    setUploading(true);
    try {
      const ticket = await requestUpload.mutateAsync({
        data: {
          artistName: artistName.trim(),
          title: title.trim(),
          filename: file.name,
          contentType: file.type as (typeof ALLOWED_CONTENT_TYPES)[number],
          size: file.size,
          consent,
        },
      });
      const uploaded = await fetch(ticket.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploaded.ok) throw new Error("The image upload did not finish. Please try again.");
      await completeUpload.mutateAsync({ id: ticket.id });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListMyArtworkQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListArtworkQueryKey() }),
      ]);
      setArtistName("");
      setTitle("");
      setFile(null);
      setConsent(false);
      const fileInput = document.getElementById("artwork-file") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      setSuccess("Your artwork is submitted for teacher approval. Thank you for sharing your creativity.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "We could not submit your artwork. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const pending = uploading || requestUpload.isPending || completeUpload.isPending;
  const featured = gallery.data?.featured?.status === "approved" ? gallery.data.featured : null;
  const artworks = (gallery.data?.artworks ?? []).filter((artwork) => artwork.status === "approved");

  return (
    <section className="mx-auto w-full max-w-6xl space-y-12 px-4 py-12" aria-labelledby="artwork-gallery-heading">
      <header className="mx-auto max-w-3xl space-y-3 text-center">
        <p className="font-sans text-sm font-bold uppercase tracking-widest text-primary">Student artwork</p>
        <h2 id="artwork-gallery-heading" className="font-display text-4xl italic text-foreground md:text-5xl">Make something, share it with us</h2>
        <p className="text-lg text-foreground/75">Follow a Directed Draw video, then add your own creative details. Teachers review every submission before it appears here.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Featured Artist of the Month</CardTitle>
        </CardHeader>
        <CardContent>
          {gallery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : gallery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Featured artwork could not be loaded</AlertTitle>
              <AlertDescription className="mt-2 flex items-center gap-3">
                <span>Please try again.</span>
                <Button variant="outline" size="sm" onClick={() => void gallery.refetch()} data-testid="button-retry-featured-artwork">Retry</Button>
              </AlertDescription>
            </Alert>
          ) : featured ? (
            <div className="grid items-center gap-6 sm:grid-cols-2">
              <ArtworkImage artwork={featured} />
              <div className="space-y-3">
                <Badge variant="secondary">Featured artist · {gallery.data?.month}</Badge>
                <h3 className="font-display text-3xl italic text-foreground">{featured.title}</h3>
                <p className="text-lg text-foreground/75">By {featured.artistName}</p>
                <p className="text-sm text-foreground/70">Selected by a teacher. Each month’s featured artwork is chosen by our teachers.</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground/70">This month’s featured artist will be shared here after a teacher makes a selection.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-2xl italic text-foreground">Approved student artwork</h3>
            <p className="text-sm text-foreground/70">Only teacher-approved artwork is shown publicly.</p>
          </div>
          {gallery.isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="aspect-square w-full" />)}
            </div>
          ) : gallery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Artwork could not be loaded</AlertTitle>
              <AlertDescription className="mt-2 flex items-center gap-3">
                <span>Please try again.</span>
                <Button variant="outline" size="sm" onClick={() => void gallery.refetch()} data-testid="button-retry-artwork-gallery">Retry</Button>
              </AlertDescription>
            </Alert>
          ) : artworks.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {artworks.map((artwork) => (
                <Card key={artwork.id} data-testid={`card-public-artwork-${artwork.id}`}>
                  <CardContent className="space-y-2 p-3">
                    <ArtworkImage artwork={artwork} />
                    <h4 className="break-words text-sm font-semibold text-foreground">{artwork.title}</h4>
                    <p className="text-xs text-foreground/70">By {artwork.artistName}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-sm text-foreground/75">There are no approved artworks in the gallery yet. Be the first to share your work.</CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Submit your artwork</CardTitle>
            <p className="text-sm text-foreground/70">Upload a photo of your finished Directed Draw or original artwork.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {session.isLoading ? (
              <Skeleton className="h-24 w-full" aria-label="Checking Studio sign-in" />
            ) : session.isError ? (
              <Alert variant="destructive">
                <AlertTitle>Studio sign-in could not be checked</AlertTitle>
                <AlertDescription className="mt-2 flex items-center gap-3">
                  <span>Try again before submitting artwork.</span>
                  <Button variant="outline" size="sm" onClick={() => void session.refetch()} data-testid="button-retry-studio-session">Retry</Button>
                </AlertDescription>
              </Alert>
            ) : !session.data ? (
              <div className="space-y-3">
                <p className="text-sm text-foreground/75">Sign in with your existing Studio account to submit artwork and see your review status.</p>
                <Button asChild data-testid="link-studio-sign-in">
                  <Link href="/studio/login">Sign in to Studio</Link>
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="artwork-artist-name">First name or nickname</Label>
                  <Input id="artwork-artist-name" value={artistName} maxLength={40} onChange={(event) => setArtistName(event.target.value)} autoComplete="given-name" data-testid="input-artwork-artist-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artwork-title">Artwork title</Label>
                  <Input id="artwork-title" value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} data-testid="input-artwork-title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artwork-file">Artwork photo</Label>
                  <Input id="artwork-file" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={handleFile} data-testid="input-artwork-file" />
                  <p className="text-xs text-foreground/70">JPG, PNG, or WebP · 10 MB maximum</p>
                  {file && <p className="break-all text-xs text-foreground/70" data-testid="text-artwork-file-name">{file.name}</p>}
                </div>
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <p className="text-sm font-semibold text-foreground">Before you upload</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/75">
                    <li>Photograph your artwork in good light.</li>
                    <li>Include artwork only: no faces or identifying information.</li>
                  </ul>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="artwork-consent" checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} data-testid="checkbox-artwork-consent" />
                  <Label htmlFor="artwork-consent" className="cursor-pointer text-sm leading-relaxed">
                    I agree that this artwork and the first name or nickname I provided may be shared publicly if a teacher approves it.
                  </Label>
                </div>
                {formError && <Alert variant="destructive"><AlertDescription data-testid="status-artwork-error">{formError}</AlertDescription></Alert>}
                {success && <Alert><AlertDescription data-testid="status-artwork-success">{success}</AlertDescription></Alert>}
                <Button type="submit" disabled={pending} className="w-full" data-testid="button-submit-artwork">
                  {pending ? "Uploading artwork…" : "Submit for teacher approval"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <OwnArtworkList />
    </section>
  );
}
