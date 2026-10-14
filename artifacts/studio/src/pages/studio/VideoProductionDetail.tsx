import { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle, Download, Film, LockKeyhole, Upload } from 'lucide-react';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { useVideoProduction } from '@/hooks/useVideoProductions';
import { isVideoProducer, videoMimeForName, videoProductions } from '@/lib/videoApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MAX_VIDEO_BYTES = 262144000;
const ACCEPTED_VIDEO_MIME: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  ogv: 'video/ogg',
};

function getVideoType(file: File): string {
  const byName = videoMimeForName(file.name);
  if (!byName) throw new Error('Unsupported video format. Choose an MP4, WebM, MOV, or OGV file.');
  if (file.type && file.type !== byName) {
    throw new Error(`The selected file type (${file.type}) does not match its .${file.name.split('.').pop()?.toLowerCase()} extension.`);
  }
  if (file.type && !Object.values(ACCEPTED_VIDEO_MIME).includes(file.type)) {
    throw new Error('Unsupported video MIME type. Choose MP4, WebM, MOV, or OGV.');
  }
  return file.type || byName;
}

function validateVideo(file: File): string | null {
  if (file.size === 0) return 'This file is empty. Choose a video file with content.';
  if (file.size > MAX_VIDEO_BYTES) return 'Video must be 250 MiB or smaller.';
  try {
    getVideoType(file);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Unsupported video file.';
  }
}

export default function VideoProductionDetail() {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const projectId = Number(projectIdParam);
  const { user, isLoading: authLoading } = useRequireStudioRole('student');
  const queryClient = useQueryClient();
  const isProducer = !!user && isVideoProducer(user.jobTitle);
  const { data, isLoading, isError, error, refetch } = useVideoProduction(projectId, user?.id, user?.jobId, isProducer);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedObjectPath, setUploadedObjectPath] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isUploading && !isCompleting) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [isUploading, isCompleting]);

  if (authLoading || !user || isLoading) {
    return (
      <StudioLayout>
        <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6" aria-label="Loading production assignment">
          <div className="h-8 w-2/3 animate-pulse rounded-lg bg-[#eee6d8]" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-64 animate-pulse rounded-xl border border-[#d5cabe] bg-[#eee6d8] lg:col-span-2" />
            <div className="h-64 animate-pulse rounded-xl border border-[#d5cabe] bg-[#eee6d8]" />
          </div>
        </div>
      </StudioLayout>
    );
  }

  if (!isProducer) {
    return (
      <StudioLayout>
        <StudioPage title="Production assignment">
          <Card className="border-[#d5cabe] bg-[#eee6d8]"><CardContent className="p-5 text-sm text-[#453329]">This workspace is available to the Video Producers group.</CardContent></Card>
        </StudioPage>
      </StudioLayout>
    );
  }

  const production = data?.production;
  if (isError || !production) {
    return (
      <StudioLayout>
        <StudioPage title="Production assignment">
          <Card className="border-[#d5cabe] bg-[#eee6d8]">
            <CardContent className="space-y-3 p-6">
              <p className="flex items-start gap-2 text-sm text-[#453329]">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                {isError ? `Could not load this assignment${error instanceof Error ? `: ${error.message}` : '.'}` : 'This production assignment is not available to this account.'}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => refetch()}>Retry</Button>
                <Link href="/studio/video-productions" className="inline-flex items-center rounded-full px-3 py-2 text-sm font-medium text-[#688a52] hover:bg-[#eee6d8]">Back to queue</Link>
              </div>
            </CardContent>
          </Card>
        </StudioPage>
      </StudioLayout>
    );
  }

  const isAssigned = production.status === 'assigned' && production.projectStatus === 'Approved';
  const hasPreviousVersion = !!production.videoUrl && isAssigned;
  const fileProblem = selectedFile ? validateVideo(selectedFile) : null;
  const formatSize = (size: number) => `${(size / (1024 * 1024)).toFixed(1)} MiB`;

  const clearWorkflow = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['studio-video-productions'] }),
      queryClient.invalidateQueries({ queryKey: ['studio-video-production', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['teacher-review-queue'] }),
      queryClient.invalidateQueries({ queryKey: ['teacher-project', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['studio-project', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['studio-projects'] }),
    ]);
  };

  const submitVideo = async () => {
    if (!selectedFile || fileProblem || isUploading || isCompleting || !isAssigned) return;
    setUploadError('');
    setSuccessMessage('');
    try {
      let objectPath = uploadedObjectPath;
      if (!objectPath) {
        setIsUploading(true);
        const ticket = await videoProductions.requestUpload(projectId, selectedFile);
        const contentType = getVideoType(selectedFile);
        const uploadResponse = await fetch(ticket.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: selectedFile,
        });
        if (!uploadResponse.ok) {
          throw new Error(`Video upload failed (${uploadResponse.status}). Your selected file is still available to retry.`);
        }
        objectPath = ticket.objectPath;
        setUploadedObjectPath(objectPath);
      }
      setIsUploading(false);
      setIsCompleting(true);
      const result = await videoProductions.complete(projectId, objectPath);
      if (!result.success) throw new Error(result.message || 'The upload could not be sent for teacher review.');
      setSuccessMessage('Sent to teacher for review.');
      setSelectedFile(null);
      setUploadedObjectPath(null);
      const input = document.getElementById('production-video-file') as HTMLInputElement | null;
      if (input) input.value = '';
      await clearWorkflow();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'The video could not be uploaded. Try again.');
    } finally {
      setIsUploading(false);
      setIsCompleting(false);
    }
  };

  return (
    <StudioLayout>
      <StudioPage
        title={production.projectTitle}
        subtitle={`${production.contentType} · Video production`}
        action={<Link href="/studio/video-productions" className="inline-flex items-center gap-2 rounded-full border border-[#d5cabe] px-4 py-2 text-sm font-medium text-[#453329] hover:bg-[#eee6d8]"><ArrowLeft className="h-4 w-4" /> Queue</Link>}
      >
        {successMessage && (
          <div role="status" className="mb-5 flex items-start gap-2 rounded-lg border border-[#688a52] bg-[#eee6d8] p-4 text-sm text-[#453329]">
            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#688a52]" />
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-[#d5cabe] bg-[#eee6d8]">
              <CardHeader className="pb-3"><CardTitle className="font-serif text-base text-[#453329]">Approved project content</CardTitle></CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap rounded-lg border border-[#d5cabe] bg-white p-4 text-sm leading-relaxed text-[#453329]">
                  {production.content || 'No project content was provided.'}
                </div>
              </CardContent>
            </Card>

            {production.videoUrl && (
              <Card className="border-[#d5cabe] bg-[#eee6d8]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 font-serif text-base text-[#453329]">
                    <Film className="h-4 w-4 text-[#688a52]" /> {hasPreviousVersion ? 'Previous version' : 'Uploaded video'}
                  </CardTitle>
                  {hasPreviousVersion && <p className="text-sm text-[#688a52]">This version remains available while its replacement is in progress.</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <video className="max-h-96 w-full rounded-lg bg-black" controls playsInline src={production.videoUrl}>
                    Your browser does not support embedded video.
                  </video>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-[#453329]">{production.filename || 'Video file'}{production.uploadedAt ? ` · Uploaded ${new Date(production.uploadedAt).toLocaleString()}` : ''}</p>
                    <a href={production.videoUrl} download={production.filename || true} className="inline-flex items-center gap-2 text-sm font-medium text-[#c4622d] underline">
                      <Download className="h-4 w-4" /> Download video
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="border-[#d5cabe] bg-[#eee6d8]">
              <CardHeader className="pb-3"><CardTitle className="font-serif text-base text-[#453329]">Teacher directions</CardTitle></CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#453329]">{production.instructions || 'No additional directions were included.'}</p>
              </CardContent>
            </Card>

            <Card className="border-[#d5cabe] bg-[#eee6d8]">
              <CardHeader className="pb-3"><CardTitle className="font-serif text-base text-[#453329]">Video handoff</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2 rounded-lg border border-[#d5cabe] bg-white p-3 text-xs leading-relaxed text-[#453329]">
                  <LockKeyhole className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#688a52]" />
                  Keep the video private and follow school privacy and consent rules. Your video stays private until a teacher reviews it and makes a final decision. Uploading does not publish it.
                </div>

                {production.status === 'uploaded' ? (
                  <p className="text-sm font-medium text-[#688a52]">Video sent to the teacher. This assignment is read-only until the teacher requests a replacement.</p>
                ) : isAssigned ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="production-video-file" className="text-sm text-[#453329]">Select video file</Label>
                      <Input
                        id="production-video-file"
                        type="file"
                        accept=".mp4,.webm,.mov,.ogv,video/mp4,video/webm,video/quicktime,video/ogg"
                        disabled={isUploading || isCompleting}
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          setSelectedFile(file);
                          setUploadError('');
                          setUploadedObjectPath(null);
                        }}
                        className="block w-full rounded-md border border-[#d5cabe] bg-white p-2 text-sm text-[#453329] file:mr-3 file:rounded-md file:border-0 file:bg-[#eee6d8] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#453329]"
                      />
                      <p className="text-xs text-[#688a52]">MP4, WebM, MOV, or OGV. Maximum file size: 250 MiB.</p>
                    </div>
                    {selectedFile && (
                      <p className="break-all text-xs text-[#453329]">{selectedFile.name} · {formatSize(selectedFile.size)}</p>
                    )}
                    {fileProblem && <p role="alert" className="text-sm text-red-700">{fileProblem}</p>}
                    {uploadError && <p role="alert" className="rounded-md border border-red-300 bg-white p-3 text-sm text-red-700">{uploadError}</p>}
                    <Button className="w-full gap-2 rounded-full bg-[#c4622d] text-white hover:bg-[#a85226]" onClick={submitVideo} disabled={!selectedFile || !!fileProblem || isUploading || isCompleting}>
                      <Upload className="h-4 w-4" />
                      {isUploading ? 'Uploading video…' : isCompleting ? 'Sending to teacher…' : uploadedObjectPath ? 'Retry sending to teacher' : 'Upload for teacher review'}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-[#688a52]">This assignment is not currently available for upload.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </StudioPage>
    </StudioLayout>
  );
}
