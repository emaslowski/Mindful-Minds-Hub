import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  getListAthleteQueryKey,
  getListMyAthleteQueryKey,
  useCompleteAthlete,
  useListAthlete,
  useRequestAthleteUpload,
} from "@workspace/api-client-react";
import type { AthleteEntry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@workspace/mind-matters-ds/components/ui/alert";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/mind-matters-ds/components/ui/card";
import { Checkbox } from "@workspace/mind-matters-ds/components/ui/checkbox";
import { Input } from "@workspace/mind-matters-ds/components/ui/input";
import { Label } from "@workspace/mind-matters-ds/components/ui/label";
import { Skeleton } from "@workspace/mind-matters-ds/components/ui/skeleton";
import { useArtworkStudioSession } from "@/hooks/useArtworkStudioSession";
import { MyAthleteSubmissions } from "@/components/MyAthleteSubmissions";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function AthleteImage({ athlete, privateImage = false }: { athlete: AthleteEntry; privateImage?: boolean }) {
  return (
    <img
      src={athlete.imageUrl || `/api/athlete/${athlete.id}/image`}
      alt={`Active challenge photo shared by ${athlete.athleteName}: ${athlete.title}`}
      className="aspect-square w-full rounded-lg bg-muted object-cover"
      loading="lazy"
      referrerPolicy={privateImage ? "same-origin" : undefined}
      data-testid={`img-athlete-${athlete.id}`}
    />
  );
}

export function AthleteGallery() {
  const session = useArtworkStudioSession();
  // Reset unsent names, files, consent, and feedback when Studio accounts change.
  return <AthleteGalleryContent key={session.data?.id ?? "signed-out"} />;
}

function AthleteGalleryContent() {
  const queryClient = useQueryClient();
  const session = useArtworkStudioSession();
  const gallery = useListAthlete({
    query: {
      queryKey: getListAthleteQueryKey(),
      staleTime: 30_000,
      refetchInterval: 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  });
  const requestUpload = useRequestAthleteUpload();
  const completeUpload = useCompleteAthlete();
  const [athleteName, setAthleteName] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFormError("");
    setSuccess("");
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
      setFormError("Sign in to Studio before submitting a photo.");
      return;
    }
    if (!athleteName.trim() || !title.trim() || !file || !consent) {
      setFormError("Enter a first name or nickname and photo title, choose an image, and confirm permission.");
      return;
    }
    setUploading(true);
    try {
      const ticket = await requestUpload.mutateAsync({
        data: {
          athleteName: athleteName.trim(),
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
      if (!uploaded.ok) throw new Error("The photo upload did not finish. Check your connection and submit again.");
      await completeUpload.mutateAsync({ id: ticket.id });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...getListMyAthleteQueryKey(), session.data.id] }),
        queryClient.invalidateQueries({ queryKey: getListAthleteQueryKey() }),
      ]);
      setAthleteName("");
      setTitle("");
      setFile(null);
      setConsent(false);
      const fileInput = document.getElementById("athlete-photo-file") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      setSuccess("Your photo is submitted for teacher approval. It will not appear publicly unless a teacher approves it.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "We could not submit your photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const pending = uploading || requestUpload.isPending || completeUpload.isPending;
  const athletes = (gallery.data?.athletes ?? []).filter((athlete) => athlete.status === "approved");

  return (
    <section className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8" aria-labelledby="active-challenge-gallery-heading">
      <header className="mx-auto max-w-3xl space-y-3 text-center">
        <p className="font-sans text-sm font-bold uppercase tracking-widest text-primary">Active Challenge</p>
        <h2 id="active-challenge-gallery-heading" className="font-display text-4xl italic text-foreground md:text-5xl">Move in your own way</h2>
        <p className="text-lg text-foreground/75">Share a photo of your movement or challenge moment. Every photo is reviewed by a teacher before it can appear in this gallery.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Photo sharing guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-foreground/75">
          <p>Choose a safe, comfortable activity. You can participate seated, use an adaptation, take a rest, or ask an adult for help. There is no single right way to move.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Use only your first name or a nickname. Do not include personal details, school names or logos, or location clues.</li>
            <li>Get permission from everyone pictured. If you are under 18, make sure you have guardian and school permission before sharing a photo.</li>
            <li>Photos are private while pending. A teacher must approve a photo before it becomes public; there is no voting or automatic winner.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approved challenge photos</CardTitle>
          <p className="text-sm text-foreground/70">The public gallery includes teacher-approved photos only.</p>
        </CardHeader>
        <CardContent>
          {gallery.isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="aspect-square w-full" />)}
            </div>
          ) : gallery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Challenge photos could not be loaded</AlertTitle>
              <AlertDescription className="mt-2 flex items-center gap-3">
                <span>Please try again in a moment.</span>
                <Button variant="outline" size="sm" onClick={() => void gallery.refetch()} data-testid="button-retry-athlete-gallery">Retry</Button>
              </AlertDescription>
            </Alert>
          ) : athletes.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {athletes.map((athlete) => (
                <Card key={athlete.id} data-testid={`card-public-athlete-${athlete.id}`}>
                  <CardContent className="space-y-2 p-3">
                    <AthleteImage athlete={athlete} />
                    <h3 className="break-words text-sm font-semibold text-foreground">{athlete.title}</h3>
                    <p className="text-xs text-foreground/70">Shared by {athlete.athleteName}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-sm text-foreground/75">No approved challenge photos yet. Share a moment for a teacher to review.</CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Share a challenge photo</CardTitle>
            <p className="text-sm text-foreground/70">Upload one JPG, PNG, or WebP photo (10 MB maximum).</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {session.isLoading ? (
              <Skeleton className="h-24 w-full" aria-label="Checking Studio sign-in" />
            ) : session.isError ? (
              <Alert variant="destructive">
                <AlertTitle>Studio sign-in could not be checked</AlertTitle>
                <AlertDescription className="mt-2 flex items-center gap-3">
                  <span>Try again before submitting a photo.</span>
                  <Button variant="outline" size="sm" onClick={() => void session.refetch()} data-testid="button-retry-athlete-session">Retry</Button>
                </AlertDescription>
              </Alert>
            ) : !session.data ? (
              <div className="space-y-3">
                <p className="text-sm text-foreground/75">Sign in with your existing Studio account to upload and follow your submission status.</p>
                <Button asChild data-testid="link-athlete-studio-sign-in"><a href="/studio/login">Sign in to Studio</a></Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="athlete-first-name">First name or nickname</Label>
                  <Input id="athlete-first-name" value={athleteName} maxLength={40} onChange={(event) => setAthleteName(event.target.value)} autoComplete="given-name" data-testid="input-athlete-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="athlete-photo-title">Photo title</Label>
                  <Input id="athlete-photo-title" value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} data-testid="input-athlete-title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="athlete-photo-file">Challenge photo</Label>
                  <Input id="athlete-photo-file" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={handleFile} data-testid="input-athlete-file" />
                  <p className="text-xs text-foreground/70">JPG, PNG, or WebP · 10 MB maximum</p>
                  {file && <p className="break-all text-xs text-foreground/70" data-testid="text-athlete-file-name">{file.name}</p>}
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="athlete-consent" checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} data-testid="checkbox-athlete-consent" />
                  <Label htmlFor="athlete-consent" className="cursor-pointer text-sm leading-relaxed">
                    I have permission from everyone pictured and, if needed, guardian and school permission. I agree that my photo and first name or nickname may be shared publicly if a teacher approves it.
                  </Label>
                </div>
                {formError && <Alert variant="destructive"><AlertDescription data-testid="status-athlete-upload-error">{formError}</AlertDescription></Alert>}
                {success && <Alert><AlertDescription data-testid="status-athlete-upload-success">{success}</AlertDescription></Alert>}
                <Button type="submit" disabled={pending} className="w-full" data-testid="button-submit-athlete">
                  {pending ? "Uploading photo…" : formError ? "Retry photo submission" : "Submit for teacher approval"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <MyAthleteSubmissions />
      </div>
    </section>
  );
}
