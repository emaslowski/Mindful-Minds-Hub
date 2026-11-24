import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { craftsApi, type Craft, type CraftInput } from '@/lib/craftsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Scissors, ImagePlus, Trash2, Pencil, Eye, EyeOff, ExternalLink, X } from 'lucide-react';

interface FormState {
  title: string;
  description: string;
  materials: string;
  steps: string;
  link: string;
  published: boolean;
}

const EMPTY: FormState = { title: '', description: '', materials: '', steps: '', link: '', published: true };

function toForm(craft: Craft): FormState {
  return {
    title: craft.title,
    description: craft.description,
    materials: craft.materials.join('\n'),
    steps: craft.steps.join('\n'),
    link: craft.link ?? '',
    published: craft.published,
  };
}

const field = 'bg-white border-[#d5cabe] text-sm';
const labelClass = 'block text-sm font-medium text-[#453329] mb-1';

export default function TeacherCrafts() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editing, setEditing] = useState<Craft | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Craft | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const formTop = useRef<HTMLDivElement>(null);

  const { data, isLoading: craftsLoading, isError } = useQuery({
    queryKey: ['teacher-crafts'],
    queryFn: () => craftsApi.list(),
    enabled: !!user,
  });
  const crafts = data?.crafts ?? [];

  useEffect(() => {
    if (!photo) { setPhotoPreview(null); return; }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: ['teacher-crafts'] }),
    qc.invalidateQueries({ queryKey: ['crafts'] }),
  ]);

  function reset() {
    setForm(EMPTY);
    setEditing(null);
    setPhoto(null);
    if (fileInput.current) fileInput.current.value = '';
  }

  function startEdit(craft: Craft) {
    setEditing(craft);
    setForm(toForm(craft));
    setPhoto(null);
    if (fileInput.current) fileInput.current.value = '';
    formTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast({ title: 'Give the craft a title', variant: 'destructive' }); return; }
    setSaving(true);
    const body: CraftInput = {
      title: form.title,
      description: form.description,
      materials: form.materials,
      steps: form.steps,
      link: form.link.trim() || null,
      published: form.published,
    };
    try {
      const saved = editing ? (await craftsApi.update(editing.id, body)).craft : (await craftsApi.create(body)).craft;
      let photoError: string | null = null;
      if (photo) {
        try { await craftsApi.uploadImage(saved.id, photo); }
        catch (err) { photoError = err instanceof Error ? err.message : 'The photo could not be uploaded.'; }
      }
      await refresh();
      reset();
      if (photoError) {
        toast({ title: editing ? 'Craft saved, photo not uploaded' : 'Craft posted, photo not uploaded', description: `${photoError} Use Edit to try the photo again.`, variant: 'destructive' });
      } else {
        toast({
          title: editing ? 'Craft saved' : saved.published ? 'Craft posted' : 'Draft saved',
          description: saved.published ? 'Students can see it in the Craft Corner on the homepage.' : 'Only teachers can see it until you publish it.',
        });
      }
    } catch (err) {
      toast({ title: 'Could not save the craft', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  const { mutate: togglePublished, isPending: toggling } = useMutation({
    mutationFn: (craft: Craft) => craftsApi.update(craft.id, { published: !craft.published }),
    onSuccess: async (res) => {
      await refresh();
      toast({ title: res.craft.published ? 'Craft published' : 'Craft hidden', description: res.craft.published ? 'Students can see it now.' : 'Only teachers can see it.' });
    },
    onError: (err: Error) => toast({ title: 'Could not update the craft', description: err.message, variant: 'destructive' }),
  });

  const { mutate: removeCraft, isPending: removing } = useMutation({
    mutationFn: (id: number) => craftsApi.remove(id),
    onSuccess: async () => {
      await refresh();
      setConfirmDelete(null);
      if (editing && confirmDelete && editing.id === confirmDelete.id) reset();
      toast({ title: 'Craft deleted' });
    },
    onError: (err: Error) => { setConfirmDelete(null); toast({ title: 'Could not delete the craft', description: err.message, variant: 'destructive' }); },
  });

  const { mutate: removePhoto, isPending: removingPhoto } = useMutation({
    mutationFn: (id: number) => craftsApi.removeImage(id),
    onSuccess: async (res) => {
      await refresh();
      if (editing?.id === res.craft.id) setEditing(res.craft);
      toast({ title: 'Photo removed' });
    },
    onError: (err: Error) => toast({ title: 'Could not remove the photo', description: err.message, variant: 'destructive' }),
  });

  if (isLoading || !user) return null;

  const currentPhoto = photoPreview ?? (editing?.imageUrl ?? null);

  return (
    <StudioLayout>
      <StudioPage
        title="Craft Corner"
        subtitle="Post craft ideas for students. Published crafts appear in the Craft Corner on the hub homepage and at /crafts."
      >
        <div ref={formTop} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Post / edit form */}
          <Card className="bg-[#eee6d8] border-[#d5cabe] self-start">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-serif text-[#453329] flex items-center gap-2">
                <Scissors className="h-4 w-4 text-[#c4622d]" />
                {editing ? `Editing: ${editing.title}` : 'Post a craft'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="craft-title" className={labelClass}>Title</label>
                  <Input id="craft-title" value={form.title} maxLength={120} required className={field}
                    placeholder="e.g. Paper plate sunflower"
                    onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="craft-description" className={labelClass}>What is it?</label>
                  <Textarea id="craft-description" value={form.description} rows={3} maxLength={2000} className={field}
                    placeholder="A sentence or two about the craft and why students might like it."
                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="craft-materials" className={labelClass}>Materials <span className="font-normal text-[#688a52]">(one per line)</span></label>
                    <Textarea id="craft-materials" value={form.materials} rows={6} maxLength={2000} className={field}
                      placeholder={'Paper plate\nYellow paint\nGlue\nSunflower seeds'}
                      onChange={(e) => setForm({ ...form, materials: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="craft-steps" className={labelClass}>Steps <span className="font-normal text-[#688a52]">(one per line)</span></label>
                    <Textarea id="craft-steps" value={form.steps} rows={6} maxLength={6000} className={field}
                      placeholder={'Paint the plate yellow and let it dry.\nCut petals around the edge.\nGlue seeds in the middle.'}
                      onChange={(e) => setForm({ ...form, steps: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label htmlFor="craft-link" className={labelClass}>Video or tutorial link <span className="font-normal text-[#688a52]">(optional)</span></label>
                  <Input id="craft-link" type="url" value={form.link} maxLength={500} className={field} placeholder="https://"
                    onChange={(e) => setForm({ ...form, link: e.target.value })} />
                </div>

                <div>
                  <span className={labelClass}>Photo <span className="font-normal text-[#688a52]">(optional, JPG/PNG/WebP/GIF up to 10 MB)</span></span>
                  <div className="flex flex-wrap items-center gap-3">
                    {currentPhoto && (
                      <img src={currentPhoto} alt="" className="h-20 w-28 rounded-md object-cover border border-[#d5cabe] bg-white" />
                    )}
                    <input ref={fileInput} id="craft-photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only"
                      onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                    <Button type="button" variant="outline" size="sm" className="border-[#d5cabe] bg-white" onClick={() => fileInput.current?.click()}>
                      <ImagePlus className="h-4 w-4" /> {currentPhoto ? 'Change photo' : 'Add a photo'}
                    </Button>
                    {photo && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setPhoto(null); if (fileInput.current) fileInput.current.value = ''; }}>
                        <X className="h-4 w-4" /> Undo
                      </Button>
                    )}
                    {!photo && editing?.imageUrl && (
                      <Button type="button" variant="ghost" size="sm" disabled={removingPhoto} onClick={() => removePhoto(editing.id)}>
                        <Trash2 className="h-4 w-4" /> Remove photo
                      </Button>
                    )}
                  </div>
                  {photo && <p className="mt-1 text-xs text-[#688a52]">{photo.name} will be uploaded when you save.</p>}
                </div>

                <div className="flex items-center justify-between gap-3 rounded-md border border-[#d5cabe] bg-white px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-[#453329]">Show to students</p>
                    <p className="text-xs text-[#688a52]">Off saves a draft only teachers can see.</p>
                  </div>
                  <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} aria-label="Show to students" />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={saving} className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full">
                    {saving ? 'Saving…' : editing ? 'Save changes' : form.published ? 'Post craft' : 'Save draft'}
                  </Button>
                  {editing && (
                    <Button type="button" variant="outline" className="rounded-full border-[#d5cabe] bg-white" onClick={reset} disabled={saving}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Existing crafts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-[#453329]">Posted crafts</h2>
              <span className="text-xs text-[#688a52]">{crafts.filter((c) => c.published).length} visible to students</span>
            </div>
            {craftsLoading ? (
              <Card className="bg-[#eee6d8] border-[#d5cabe]"><CardContent className="p-6 text-sm text-[#688a52]">Loading crafts…</CardContent></Card>
            ) : isError ? (
              <Card className="bg-[#eee6d8] border-[#d5cabe]"><CardContent className="p-6 text-sm text-red-700">Crafts could not be loaded. Refresh the page to try again.</CardContent></Card>
            ) : crafts.length === 0 ? (
              <Card className="bg-[#eee6d8] border-[#d5cabe]">
                <CardContent className="p-6 text-sm text-[#688a52]">
                  No crafts yet. Post the first one with the form, and it appears in the Craft Corner on the hub homepage.
                </CardContent>
              </Card>
            ) : (
              crafts.map((craft) => (
                <Card key={craft.id} className={`bg-[#eee6d8] border-[#d5cabe] ${editing?.id === craft.id ? 'ring-2 ring-[#c4622d]' : ''}`} data-testid={`card-teacher-craft-${craft.id}`}>
                  <CardContent className="p-4 flex gap-4">
                    {craft.imageUrl ? (
                      <img src={craft.imageUrl} alt="" className="h-20 w-28 shrink-0 rounded-md object-cover border border-[#d5cabe] bg-white" loading="lazy" />
                    ) : (
                      <div className="h-20 w-28 shrink-0 rounded-md border border-dashed border-[#d5cabe] bg-white grid place-items-center text-[#d5cabe]" aria-hidden="true">
                        <Scissors className="h-6 w-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-[#453329] truncate">{craft.title}</h3>
                        <Badge variant={craft.published ? 'secondary' : 'outline'}>{craft.published ? 'Published' : 'Draft'}</Badge>
                      </div>
                      {craft.description && <p className="mt-1 text-sm text-[#453329]/80 line-clamp-2">{craft.description}</p>}
                      <p className="mt-1 text-xs text-[#688a52]">
                        {craft.materials.length} material{craft.materials.length === 1 ? '' : 's'} · {craft.steps.length} step{craft.steps.length === 1 ? '' : 's'}
                        {craft.link && <> · <a href={craft.link} target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">link <ExternalLink className="h-3 w-3" /></a></>}
                        {' · '}posted {new Date(craft.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" className="border-[#d5cabe] bg-white" onClick={() => startEdit(craft)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="border-[#d5cabe] bg-white" disabled={toggling} onClick={() => togglePublished(craft)}>
                          {craft.published ? <><EyeOff className="h-3.5 w-3.5" /> Hide</> : <><Eye className="h-3.5 w-3.5" /> Publish</>}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="text-red-700" onClick={() => setConfirmDelete(craft)}>
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <AlertDialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete “{confirmDelete?.title}”?</AlertDialogTitle>
              <AlertDialogDescription>The craft and its photo are removed from the hub for good.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={removing}>Keep it</AlertDialogCancel>
              <AlertDialogAction disabled={removing} className="bg-red-700 hover:bg-red-800" onClick={() => confirmDelete && removeCraft(confirmDelete.id)}>
                {removing ? 'Deleting…' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </StudioPage>
    </StudioLayout>
  );
}
