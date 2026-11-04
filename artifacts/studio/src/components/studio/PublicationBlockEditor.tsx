import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@workspace/mind-matters-ds/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/mind-matters-ds/components/ui/card';
import { Input } from '@workspace/mind-matters-ds/components/ui/input';
import { Label } from '@workspace/mind-matters-ds/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/mind-matters-ds/components/ui/select';
import { Textarea } from '@workspace/mind-matters-ds/components/ui/textarea';
import { uploadVideoContentType } from '@workspace/api-client-react';
import { publicationMediaApi, putPublicationFile, teacherPublicationMediaUrl } from '@/lib/publicationMediaApi';
import type { PublicationBlock, PublicationEdition, PublicationMedia, PublicationRecipe } from '@/lib/studioApi';
import { useToast } from '@workspace/mind-matters-ds/hooks/use-toast';
import { ArrowDown, ArrowUp, AudioLines, FileImage, FileText, Film, Plus, Trash2, Utensils } from 'lucide-react';

const EMPTY_RECIPE: PublicationRecipe = {
  name: '', description: '', servings: '', prepTime: '', cookTime: '', ingredients: '', steps: '',
};
const MEDIA_ACCEPT: Record<PublicationMedia['kind'], string> = {
  image: 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif',
  video: 'video/mp4,video/webm,video/quicktime,video/ogg,.mp4,.webm,.mov,.MOV,.ogv',
  audio: 'audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/ogg,audio/webm,audio/x-wav,audio/wave,.mp3,.m4a,.wav,.ogg,.webm',
};
const LIMITS: Record<PublicationMedia['kind'], number> = { image: 15, video: 250, audio: 100 };

function makeBlock(type: PublicationBlock['type']): PublicationBlock {
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `block-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    width: 'full',
    ...(type === 'recipe' ? { recipe: { ...EMPTY_RECIPE } } : {}),
    ...(type === 'image' ? { fit: 'contain' as const } : {}),
  };
}

function inferredKind(file: File): PublicationMedia['kind'] | null {
  if (['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'].includes(uploadVideoContentType(file))) return 'video';
  if (file.type.startsWith('image/')) return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) ? 'image' : null;
  if (file.type.startsWith('audio/')) return ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-wav', 'audio/wave'].includes(file.type) ? 'audio' : null;
  return null;
}

type Props = {
  projectId: number;
  draft: PublicationEdition;
  onChange: (draft: PublicationEdition) => void;
  canImportVideo: boolean;
};

export function PublicationBlockEditor({ projectId, draft, onChange, canImportVideo }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedKind, setSelectedKind] = useState<PublicationMedia['kind']>('image');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'verifying' | 'ready'>('idle');
  const [importError, setImportError] = useState('');
  const blocks = draft.blocks ?? [];
  const latestDraft = useRef(draft);
  latestDraft.current = draft;
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['teacher-publication-media', projectId],
    queryFn: () => publicationMediaApi.list(projectId),
  });
  const library = data?.media ?? [];
  const readyMedia = useMemo(() => library.filter((item) => item.status === 'ready'), [library]);
  const refreshLibrary = () => queryClient.invalidateQueries({ queryKey: ['teacher-publication-media', projectId] });

  const updateBlocks = (next: PublicationBlock[]) => onChange({ ...draft, blocks: next });
  const updateBlock = (index: number, update: Partial<PublicationBlock>) =>
    updateBlocks(blocks.map((block, blockIndex) => blockIndex === index ? { ...block, ...update } : block));
  const moveBlock = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    updateBlocks(next);
  };
  const addBlock = (type: PublicationBlock['type']) => {
    if (blocks.length >= 40) return;
    updateBlocks([...blocks, makeBlock(type)]);
  };

  const importMutation = useMutation({
    mutationFn: () => publicationMediaApi.importVideo(projectId),
    onSuccess: (result) => {
      setImportError('');
      refreshLibrary();
      const block = makeBlock('video');
      const current = latestDraft.current;
      if ((current.blocks ?? []).length < 40) {
        onChange({ ...current, blocks: [...(current.blocks ?? []), { ...block, mediaId: result.media.id }] });
        toast({ title: 'Production video added', description: 'The uploaded video is ready to place in this edition.' });
      } else {
        toast({ title: 'Production video imported', description: 'Remove a block to make room, then add this video from the media library.' });
      }
    },
    onError: (error: Error) => setImportError(error.message || 'Could not import the production video.'),
  });

  const upload = async (file: File) => {
    if (uploadPhase === 'uploading' || uploadPhase === 'verifying') return;
    setUploadFile(file);
    setUploadError('');
    setUploadProgress(0);
    const kind = inferredKind(file);
    if (!kind || kind !== selectedKind) {
      setUploadError('Choose a supported JPEG, PNG, WebP, GIF, MP4, WebM, MOV, OGV, MP3, M4A, WAV, or OGG file.');
      return;
    }
    if (file.size > LIMITS[kind] * 1024 * 1024) {
      setUploadError(`${kind[0].toUpperCase()}${kind.slice(1)} files must be ${LIMITS[kind]} MB or smaller.`);
      return;
    }
    try {
      setUploadPhase('uploading');
      const ticket = await publicationMediaApi.requestUpload(projectId, file);
      await putPublicationFile(ticket.uploadUrl, file, setUploadProgress);
      setUploadPhase('verifying');
      await publicationMediaApi.completeUpload(projectId, ticket.mediaId);
      await refreshLibrary();
      setUploadProgress(100);
      setUploadPhase('ready');
      toast({ title: 'Media uploaded', description: `${file.name} is ready to add to a block.` });
    } catch (error) {
      setUploadPhase('idle');
      setUploadError(error instanceof Error ? error.message : 'Upload failed. Please retry.');
    }
  };

  const mediaById = (id?: number) => readyMedia.find((item) => item.id === id);
  const bodyCanConvert = Boolean(draft.content.trim());

  return (
    <Card className="bg-[#eee6d8] border-[#d5cabe]">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-base text-[#453329]">Multimedia blocks</CardTitle>
        <p className="text-sm text-[#688a52]">Arrange text, media, and recipes in the exact order you want. Changes stay in this draft until you save.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {bodyCanConvert && (
          <div className="rounded-lg border border-[#d5cabe] bg-white p-3">
            <p className="text-sm font-medium text-[#453329]">Legacy article body is shown before your blocks.</p>
            <p className="mt-1 text-xs text-[#688a52]">Move it into the first text block to reorder it with the rest of your content.</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" disabled={blocks.length >= 40} onClick={() => {
              if (blocks.length >= 40) return;
              const legacy = { ...makeBlock('text'), text: draft.content };
              onChange({ ...draft, content: '', blocks: [legacy, ...blocks] });
            }}>
              <FileText className="mr-2 h-4 w-4" /> Move body to first text block
            </Button>
          </div>
        )}

        {blocks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#d5cabe] bg-white p-5 text-center">
            <p className="text-sm font-medium text-[#453329]">Start building the website edition</p>
            <p className="mt-1 text-xs text-[#688a52]">Add one or more arranged content blocks below.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block, index) => {
              const selected = mediaById(block.mediaId);
              const typeName = { text: 'Text', image: 'Image', video: 'Video', audio: 'Audio', recipe: 'Recipe' }[block.type];
              return (
                <section key={block.id} className="rounded-lg border border-[#d5cabe] bg-white p-3" data-testid={`publication-block-${block.id}`}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-sm text-[#453329]">Block {index + 1}: {typeName}</p>
                    <div className="flex flex-wrap items-center gap-1">
                      <Button type="button" size="icon" variant="outline" aria-label={`Move ${typeName} block up`} disabled={index === 0} onClick={() => moveBlock(index, -1)}><ArrowUp className="h-4 w-4" /></Button>
                      <Button type="button" size="icon" variant="outline" aria-label={`Move ${typeName} block down`} disabled={index === blocks.length - 1} onClick={() => moveBlock(index, 1)}><ArrowDown className="h-4 w-4" /></Button>
                      <Button type="button" size="icon" variant="ghost" aria-label={`Remove ${typeName} block`} onClick={() => updateBlocks(blocks.filter((_, blockIndex) => blockIndex !== index))}><Trash2 className="h-4 w-4 text-[#c4622d]" /></Button>
                    </div>
                  </div>
                  <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Block width</Label>
                      <Select value={block.width} onValueChange={(width: 'full' | 'half') => updateBlock(index, { width })}>
                        <SelectTrigger data-testid={`select-block-width-${block.id}`}><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="full">Full width</SelectItem><SelectItem value="half">Half width</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  {block.type === 'text' && (
                    <Textarea value={block.text ?? ''} onChange={(event) => updateBlock(index, { text: event.target.value })} rows={6} className="bg-white" placeholder="Write text for this block. Markdown headings, lists, bold, italic, quotes and links are supported." data-testid={`textarea-block-text-${block.id}`} />
                  )}
                  {block.type === 'recipe' && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {([
                        ['name', 'Recipe name'], ['description', 'Description'], ['servings', 'Servings'], ['prepTime', 'Prep time'], ['cookTime', 'Cook time'],
                      ] as const).map(([field, label]) => (
                        <div key={field} className="space-y-1">
                          <Label>{label}</Label>
                          <Input value={block.recipe?.[field] ?? ''} onChange={(event) => updateBlock(index, { recipe: { ...EMPTY_RECIPE, ...block.recipe, [field]: event.target.value } })} placeholder={label} />
                        </div>
                      ))}
                      <div className="space-y-1">
                        <Label>Ingredients (one per line)</Label>
                        <Textarea rows={5} value={block.recipe?.ingredients ?? ''} onChange={(event) => updateBlock(index, { recipe: { ...EMPTY_RECIPE, ...block.recipe, ingredients: event.target.value } })} placeholder={'1 cup oats\n1 banana'} />
                      </div>
                      <div className="space-y-1">
                        <Label>Steps (one per line)</Label>
                        <Textarea rows={5} value={block.recipe?.steps ?? ''} onChange={(event) => updateBlock(index, { recipe: { ...EMPTY_RECIPE, ...block.recipe, steps: event.target.value } })} placeholder={'Mash the banana.\nMix with the oats.'} />
                      </div>
                    </div>
                  )}
                  {block.type !== 'text' && block.type !== 'recipe' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label>Choose an uploaded {block.type}</Label>
                        {isLoading ? <div className="h-10 animate-pulse rounded-md bg-[#eee6d8]" aria-label="Loading media library" /> : isError ? (
                          <div className="flex items-center gap-2 text-sm text-[#453329]"><span>Media library could not be loaded.</span><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
                        ) : (
                          <Select value={block.mediaId ? String(block.mediaId) : ''} onValueChange={(value) => updateBlock(index, { mediaId: Number(value) })}>
                            <SelectTrigger data-testid={`select-block-media-${block.id}`}><SelectValue placeholder={`Select ready ${block.type}`} /></SelectTrigger>
                            <SelectContent>
                              {readyMedia.filter((item) => item.kind === block.type).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.filename}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      {selected && <p className="text-xs text-[#688a52]">Selected: {selected.filename}</p>}
                      {block.type === 'image' && (
                        <>
                          <div className="space-y-1"><Label>Alternative text</Label><Input value={block.alt ?? ''} onChange={(event) => updateBlock(index, { alt: event.target.value })} placeholder="Describe the image for readers using assistive technology" /></div>
                          <div className="space-y-1"><Label>Image fit</Label><Select value={block.fit ?? 'contain'} onValueChange={(fit: 'contain' | 'cover') => updateBlock(index, { fit })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="contain">Contain (show whole image)</SelectItem><SelectItem value="cover">Cover (fill the block)</SelectItem></SelectContent></Select></div>
                        </>
                      )}
                      <div className="space-y-1"><Label>Caption</Label><Input value={block.caption ?? ''} onChange={(event) => updateBlock(index, { caption: event.target.value })} placeholder="Optional caption" /></div>
                      {!block.mediaId && <p className="text-xs font-medium text-[#c4622d]">Choose ready media before publishing this block.</p>}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        <div className="space-y-3 rounded-lg border border-[#d5cabe] bg-white p-3">
          <div>
            <p className="text-sm font-medium text-[#453329]">Add a block</p>
            <p className="text-xs text-[#688a52]">Up to 40 blocks per website edition.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              ['text', 'Text', <FileText className="mr-1.5 h-4 w-4" />],
              ['image', 'Image', <FileImage className="mr-1.5 h-4 w-4" />],
              ['video', 'Video', <Film className="mr-1.5 h-4 w-4" />],
              ['audio', 'Audio', <AudioLines className="mr-1.5 h-4 w-4" />],
              ['recipe', 'Recipe', <Utensils className="mr-1.5 h-4 w-4" />],
            ] as const).map(([type, label, icon]) => (
              <Button key={type} type="button" variant="outline" size="sm" onClick={() => addBlock(type)} disabled={blocks.length >= 40} data-testid={`button-add-block-${type}`}>
                <Plus className="mr-1 h-3.5 w-3.5" />{icon}{label}
              </Button>
            ))}
          </div>
          {blocks.length >= 40 && <p className="text-xs text-[#c4622d]">The 40-block limit has been reached.</p>}
        </div>

        <div className="space-y-3 rounded-lg border border-[#d5cabe] bg-white p-3">
          <div>
            <p className="text-sm font-medium text-[#453329]">Project media library</p>
            <p className="text-xs text-muted-foreground">Images: JPEG, PNG, WebP or GIF up to 15 MB. Video: MP4, WebM, MOV or OGV up to 250 MB. Audio: MP3, M4A, WAV, OGG or WebM up to 100 MB.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select disabled={uploadPhase === 'uploading' || uploadPhase === 'verifying'} value={selectedKind} onValueChange={(value: PublicationMedia['kind']) => setSelectedKind(value)}>
              <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="image">Image</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="audio">Audio</SelectItem></SelectContent>
            </Select>
            <Input type="file" disabled={uploadPhase === 'uploading' || uploadPhase === 'verifying'} accept={MEDIA_ACCEPT[selectedKind]} className="bg-white" data-testid="input-publication-media-upload" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.currentTarget.value = '';
            }} />
          </div>
          {uploadFile && <div role="status" className="text-sm text-[#453329]">{uploadError ? `Upload not completed: ${uploadError}` : uploadPhase === 'verifying' ? `Verifying ${uploadFile.name}…` : uploadPhase === 'ready' ? `${uploadFile.name} uploaded and ready.` : `Uploading ${uploadFile.name}: ${uploadProgress}%`}</div>}
          {uploadError && uploadFile && <Button type="button" size="sm" variant="outline" onClick={() => void upload(uploadFile)}>Retry upload</Button>}
          {canImportVideo && (
            <div className="border-t border-[#d5cabe] pt-3">
              <Button type="button" size="sm" variant="outline" disabled={importMutation.isPending || blocks.length >= 40} onClick={() => { setImportError(''); importMutation.mutate(); }}>
                {importMutation.isPending ? 'Importing production video…' : 'Import uploaded production video'}
              </Button>
              {blocks.length >= 40 && <p className="mt-1 text-xs text-[#c4622d]">Remove a block before adding the production video; editions are limited to 40 blocks.</p>}
              <p className="mt-1 text-xs text-[#688a52]">Adds the ready producer video to the library; it does not publish or alter the student original.</p>
              {importError && <p role="alert" className="mt-2 text-sm text-[#c4622d]">{importError}</p>}
            </div>
          )}
          <div className="space-y-1">
            {isLoading ? <div className="h-12 animate-pulse rounded-md bg-[#eee6d8]" aria-label="Loading media list" /> : isError ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#453329]">
                <span>Media library could not be loaded.</span>
                <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : readyMedia.length === 0 ? <p className="text-xs text-[#688a52]">No ready media yet. Upload a file to use it in an edition.</p> : readyMedia.map((media) => (
              <p key={media.id} className="text-xs text-[#453329]">{media.kind} · {media.filename}</p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { teacherPublicationMediaUrl };
