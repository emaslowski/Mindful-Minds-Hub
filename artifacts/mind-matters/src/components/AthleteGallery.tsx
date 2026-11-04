import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  getGetAthleteSessionQueryKey,
  getListAthleteQueryKey,
  getListMyAthleteQueryKey,
  useCompleteAthlete,
  useGetAthleteSession,
  useListAthlete,
  useRequestAthleteUpload,
  uploadVideoContentType,
} from "@workspace/api-client-react";
import type { AthleteEntry, AthleteUploadInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@workspace/mind-matters-ds/components/ui/alert";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/mind-matters-ds/components/ui/card";
import { Checkbox } from "@workspace/mind-matters-ds/components/ui/checkbox";
import { Input } from "@workspace/mind-matters-ds/components/ui/input";
import { Label } from "@workspace/mind-matters-ds/components/ui/label";
import { Progress } from "@workspace/mind-matters-ds/components/ui/progress";
import { Skeleton } from "@workspace/mind-matters-ds/components/ui/skeleton";
import { MyAthleteSubmissions } from "@/components/MyAthleteSubmissions";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/ogg"] as const;
const ACCEPTED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES] as const;

function AthleteMedia({ athlete, privateMedia = false }: { athlete: AthleteEntry; privateMedia?: boolean }) {
  const src = athlete.imageUrl || `/api/athlete/${athlete.id}/image`;
  if (athlete.mediaType === "video") {
    return (
      <video
        src={src}
        aria-label={`Active challenge video shared by ${athlete.athleteName}: ${athlete.title}`}
        className="aspect-square w-full rounded-lg bg-muted object-cover"
        controls
        preload="metadata"
        playsInline
        referrerPolicy={privateMedia ? "same-origin" : undefined}
        data-testid={`video-athlete-${athlete.id}`}
      />
    );
  }
  return (
    <img
      src={src}
      alt={`Active challenge photo shared by ${athlete.athleteName}: ${athlete.title}`}
      className="aspect-square w-full rounded-lg bg-muted object-cover"
      loading="lazy"
      referrerPolicy={privateMedia ? "same-origin" : undefined}
      data-testid={`img-athlete-${athlete.id}`}
    />
  );
}

function uploadFile(url: string, file: File, onProgress: (progress: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", uploadVideoContentType(file));
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error("The upload did not finish. Check your connection and try again."));
    };
    request.onerror = () => reject(new Error("The upload was interrupted. Check your connection and try again."));
    request.onabort = () => reject(new Error("The upload was cancelled. Please choose the file and try again."));
    request.send(file);
  });
}

export function AthleteGallery() {
  const session = useGetAthleteSession({
    query: { queryKey: getGetAthleteSessionQueryKey(), retry: 1 },
  });
  return <AthleteGalleryContent key={session.data?.id ?? "identity-loading"} />;
}

function AthleteGalleryContent() {
  const queryClient = useQueryClient();
  const session = useGetAthleteSession({
    query: { queryKey: getGetAthleteSessionQueryKey(), retry: 1 },
  });
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
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFormError("");
    setSuccess("");
    if (!selected) {
      setFile(null);
      return;
    }
    const contentType = uploadVideoContentType(selected);
    if (!ACCEPTED_TYPES.includes(contentType as (typeof ACCEPTED_TYPES)[number])) {
      setFile(null);
      event.target.value = "";
      setFormError("Choose a JPG, PNG, or WebP image, or an MP4, WebM, MOV, or OGV video.");
      return;
    }
    const isVideo = VIDEO_TYPES.includes(contentType as (typeof VIDEO_TYPES)[number]);
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (selected.size > maxBytes) {
      setFile(null);
      event.target.value = "";
      setFormError(isVideo ? "Your video must be 250 MB or smaller." : "Your image must be 10 MB or smaller.");
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
      setFormError("Your browser identity is still being prepared. Please try again in a moment.");
      return;
    }
    if (!athleteName.trim() || !title.trim() || !file || !consent) {
      setFormError("Enter a first name or nickname and title, choose a photo or video, and confirm permission.");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const requestData: AthleteUploadInput = {
        athleteName: athleteName.trim(),
        title: title.trim(),
        filename: file.name,
        contentType: uploadVideoContentType(file) as AthleteUploadInput["contentType"],
        size: file.size,
        consent,
      };
      const ticket = await requestUpload.mutateAsync({ data: requestData });
      await uploadFile(ticket.uploadUrl, file, setUploadProgress);
      await completeUpload.mutateAsync({ id: ticket.id });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...getListMyAthleteQueryKey(), session.data.id] }),
        queryClient.invalidateQueries({ queryKey: getListAthleteQueryKey() }),
      ]);
      setAthleteName("");
      setTitle("");
      setFile(null);
      setConsent(false);
      setUploadProgress(0);
      const fileInput = document.getElementById("athlete-media-file") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      setSuccess(`Your ${VIDEO_TYPES.includes(uploadVideoContentType(file) as (typeof VIDEO_TYPES)[number]) ? "video" : "photo"} is submitted for teacher approval. It will not appear publicly unless a teacher approves it.`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "We could not submit your media. Please try again.");
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
        <p className="text-lg text-foreground/75">Share a photo or video of your movement or challenge moment. Every submission is reviewed by a teacher before it can appear in this gallery.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>Photo and video sharing guidelines</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-foreground/75">
          <p>Choose a safe, comfortable activity. You can participate seated, use an adaptation, take a rest, or ask an adult for help. There is no single right way to move.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Use only your first name or a nickname. Do not include personal details, school names or logos, or location clues.</li>
            <li>Get permission from everyone pictured or heard. If you are under 18, make sure you have guardian and school permission before sharing.</li>
            <li>Before sharing a video, check the background and audio for names, addresses, school details, or other identifying information. Avoid recording other people without permission.</li>
            <li>Submissions are private while pending. A teacher must approve a photo or video before it becomes public; there is no voting or automatic winner.</li>
            <li>Your submission status is tied to this browser. Use the same browser and device to check it later; clearing browser site data may make it unavailable to you.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approved challenge moments</CardTitle>
          <p className="text-sm text-foreground/70">The public gallery includes teacher-approved photos and videos only.</p>
        </CardHeader>
        <CardContent>
          {gallery.isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="aspect-square w-full" />)}
            </div>
          ) : gallery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Challenge moments could not be loaded</AlertTitle>
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
                    <AthleteMedia athlete={athlete} />
                    <h3 className="break-words text-sm font-semibold text-foreground">{athlete.title}</h3>
                    <p className="text-xs text-foreground/70">Shared by {athlete.athleteName}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="p-6 text-sm text-foreground/75">No approved challenge moments yet. Share one for a teacher to review.</CardContent></Card>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Share a challenge moment</CardTitle>
            <p className="text-sm text-foreground/70">Upload one JPG, PNG, or WebP photo (10 MB maximum), or MP4, WebM, QuickTime, or Ogg video (250 MB maximum).</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {session.isLoading || session.isFetching ? (
              <Skeleton className="h-24 w-full" aria-label="Preparing browser identity" />
            ) : session.isError ? (
              <Alert variant="destructive">
                <AlertTitle>Browser identity could not be prepared</AlertTitle>
                <AlertDescription className="mt-2 flex items-center gap-3">
                  <span>Try again before submitting a photo or video.</span>
                  <Button variant="outline" size="sm" onClick={() => void session.refetch()} data-testid="button-retry-athlete-session">Retry</Button>
                </AlertDescription>
              </Alert>
            ) : (
              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="athlete-first-name">First name or nickname</Label>
                  <Input id="athlete-first-name" value={athleteName} maxLength={40} onChange={(event) => setAthleteName(event.target.value)} autoComplete="given-name" disabled={pending} data-testid="input-athlete-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="athlete-media-title">Photo or video title</Label>
                  <Input id="athlete-media-title" value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} disabled={pending} data-testid="input-athlete-title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="athlete-media-file">Challenge photo or video</Label>
                  <Input id="athlete-media-file" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,video/ogg,.jpg,.jpeg,.png,.webp,.mp4,.webm,.mov,.MOV,.ogv,.ogg" onChange={handleFile} disabled={pending} data-testid="input-athlete-file" />
                  <p className="text-xs text-foreground/70">Photos: JPG, PNG, WebP · 10 MB max. Videos: MP4, WebM, MOV, OGV · 250 MB max.</p>
                  {file && <p className="break-all text-xs text-foreground/70" data-testid="text-athlete-file-name">{file.name}</p>}
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="athlete-consent" checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} disabled={pending} data-testid="checkbox-athlete-consent" />
                  <Label htmlFor="athlete-consent" className="cursor-pointer text-sm leading-relaxed">
                    I have permission from everyone pictured or heard and, if needed, guardian and school permission. I agree that my photo or video and first name or nickname may be shared publicly if a teacher approves it.
                  </Label>
                </div>
                {formError && <Alert variant="destructive"><AlertDescription data-testid="status-athlete-upload-error">{formError}</AlertDescription></Alert>}
                {success && <Alert><AlertDescription data-testid="status-athlete-upload-success">{success}</AlertDescription></Alert>}
                {pending && (
                  <div className="space-y-2" role="status" aria-live="polite">
                    <p className="text-sm text-foreground/75">{uploadProgress === 100 ? "Finishing your submission…" : uploadProgress > 0 ? `Uploading ${uploadProgress}%` : "Preparing your upload…"}</p>
                    <Progress value={uploadProgress} aria-label="Upload progress" />
                  </div>
                )}
                <Button type="submit" disabled={pending || !session.data} className="w-full" data-testid="button-submit-athlete">
                  {pending ? uploadProgress > 0 && uploadProgress < 100 ? `Uploading ${uploadProgress}%…` : "Submitting…" : formError ? "Retry submission" : "Submit for teacher approval"}
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
