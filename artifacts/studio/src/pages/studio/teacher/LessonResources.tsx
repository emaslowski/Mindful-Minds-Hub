import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@workspace/mind-matters-ds/components/ui/alert-dialog';
import { lessonResourcesApi, putLessonResource, formatBytes, type LessonResourceFile, type LessonResourceSection } from '@/lib/lessonResourcesApi';
import { BookOpen, Download, ExternalLink, FileText, Image as ImageIcon, Loader2, Package, Presentation, Printer, Trash2, Upload } from 'lucide-react';

const ACCEPT = '.pdf,.pptx,.docx,.xlsx,.png,.jpg,.jpeg,.zip';

function fileIcon(file: LessonResourceFile) {
  const ext = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase();
  if (ext === 'pdf') return <FileText className="h-5 w-5 text-[#c4622d]" />;
  if (ext === 'pptx') return <Presentation className="h-5 w-5 text-[#d4a44c]" />;
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return <ImageIcon className="h-5 w-5 text-[#688a52]" />;
  return <Package className="h-5 w-5 text-[#688a52]" />;
}

function fileKind(file: LessonResourceFile) {
  const ext = file.name.slice(file.name.lastIndexOf('.') + 1).toUpperCase();
  return ext === 'PPTX' ? 'PowerPoint' : ext;
}

export default function LessonResources() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const qc = useQueryClient();
  const { toast } = useToast();
  const library = useQuery({ queryKey: ['teacher-lesson-resources'], queryFn: lessonResourcesApi.list, enabled: !!user });
  const [pendingDelete, setPendingDelete] = useState<LessonResourceFile | null>(null);
  const [uploading, setUploading] = useState<{ folder: string; name: string; pct: number } | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const refresh = () => qc.invalidateQueries({ queryKey: ['teacher-lesson-resources'] });

  const remove = useMutation({
    mutationFn: lessonResourcesApi.remove,
    onSuccess: (_r, file) => { toast({ title: 'File removed', description: file.name }); setPendingDelete(null); refresh(); },
    onError: (e: Error) => { toast({ title: 'Could not remove the file', description: e.message, variant: 'destructive' }); setPendingDelete(null); },
  });

  async function upload(folder: string, file: File) {
    setUploading({ folder, name: file.name, pct: 0 });
    try {
      const ticket = await lessonResourcesApi.requestUpload(folder, file);
      await putLessonResource(ticket.uploadUrl, ticket.contentType, file, (pct) => setUploading({ folder, name: file.name, pct }));
      toast({ title: 'File added', description: `${file.name} is now in the library.` });
      refresh();
    } catch (e) {
      toast({ title: 'Could not add the file', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  }

  if (isLoading || !user) return null;

  const sections = library.data?.sections ?? [];
  const total = sections.reduce((n, s) => n + s.files.length, 0);

  return (
    <StudioLayout>
      <StudioPage
        title="Lesson Printables"
        subtitle="Student workbook pages, teacher printables and lesson slides for all 12 lessons. Open a file to print it, or download it to keep."
      >
        <div className="space-y-6 max-w-5xl">
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Printer className="h-5 w-5 text-[#c4622d] mt-0.5" />
                <div className="text-sm text-[#453329]">
                  <p className="font-medium">How to use this library</p>
                  <p className="text-[#688a52]">
                    <strong>Open</strong> shows the PDF in a new tab so you can print it. <strong>Download</strong> saves a copy.
                    The editable PowerPoint versions are under Whole unit. Use <strong>Add a file</strong> on any lesson to add your own
                    handouts; uploading a file with the same name replaces it.
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#688a52] whitespace-nowrap">{library.isLoading ? 'Loading…' : `${total} file${total === 1 ? '' : 's'}`}</p>
            </CardContent>
          </Card>

          {library.isError && (
            <Card className="bg-[#eee6d8] border-[#d5cabe]">
              <CardContent className="p-4 text-sm text-red-700">
                The library could not be loaded.{' '}
                <button type="button" className="underline font-semibold" onClick={() => library.refetch()}>Try again</button>
              </CardContent>
            </Card>
          )}

          {sections.map((section) => (
            <SectionCard
              key={section.folder}
              section={section}
              uploading={uploading?.folder === section.folder ? uploading : null}
              onPick={() => inputs.current[section.folder]?.click()}
              onDelete={setPendingDelete}
              inputRef={(el) => { inputs.current[section.folder] = el; }}
              onFile={(file) => upload(section.folder, file)}
              busy={!!uploading}
            />
          ))}
        </div>

        <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
          <AlertDialogContent className="bg-[#eee6d8] border-[#d5cabe]">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-[#453329]">Remove this file?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDelete?.name} will be removed from the library for every teacher. You can add it again later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-700 hover:bg-red-800 text-white"
                disabled={remove.isPending}
                onClick={() => pendingDelete && remove.mutate(pendingDelete)}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </StudioPage>
    </StudioLayout>
  );
}

function SectionCard({ section, uploading, onPick, onDelete, inputRef, onFile, busy }: {
  section: LessonResourceSection;
  uploading: { name: string; pct: number } | null;
  onPick: () => void;
  onDelete: (file: LessonResourceFile) => void;
  inputRef: (el: HTMLInputElement | null) => void;
  onFile: (file: File) => void;
  busy: boolean;
}) {
  const isUnit = section.folder === 'unit';
  return (
    <Card className="bg-[#eee6d8] border-[#d5cabe]" id={section.folder}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base font-serif text-[#453329] flex items-center gap-2">
          {isUnit ? <Package className="h-4 w-4 text-[#c4622d]" /> : <BookOpen className="h-4 w-4 text-[#c4622d]" />}
          {section.title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) onFile(file);
            }}
          />
          <Button variant="outline" size="sm" className="rounded-full gap-1.5 border-[#c4622d] text-[#c4622d] hover:bg-[#c4622d] hover:text-white" onClick={onPick} disabled={busy}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? `Uploading ${uploading.pct}%` : 'Add a file'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {section.files.length === 0 ? (
          <p className="text-sm text-[#688a52] italic py-2">No files yet. Add a PDF or PowerPoint for this lesson.</p>
        ) : (
          <ul className="divide-y divide-[#d5cabe]">
            {section.files.map((file) => (
              <li key={file.name} className="py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {fileIcon(file)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#453329] truncate">{file.name}</p>
                    <p className="text-xs text-[#688a52]">
                      {fileKind(file)} · {formatBytes(file.size)}
                      {file.updatedAt && ` · updated ${new Date(file.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium bg-[#c4622d] text-white hover:bg-[#a85226]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open
                  </a>
                  <a
                    href={`${file.url}?download=1`}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium border border-[#453329] text-[#453329] hover:bg-[#453329] hover:text-white"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-full text-[#688a52] hover:bg-red-100 hover:text-red-700"
                    onClick={() => onDelete(file)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
