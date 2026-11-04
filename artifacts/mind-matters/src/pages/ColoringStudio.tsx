import { useRef, useState } from "react";
import { getGetPublishedContentQueryKey, useGetPublishedContent } from "@workspace/api-client-react";
import { tokens } from "@workspace/mind-matters-ds/tokens";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/mind-matters-ds/components/ui/card";
import { Label } from "@workspace/mind-matters-ds/components/ui/label";
import { Input } from "@workspace/mind-matters-ds/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/mind-matters-ds/components/ui/select";
import { Slider } from "@workspace/mind-matters-ds/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/mind-matters-ds/components/ui/alert-dialog";
import { PublishedSection } from "@/components/PublishedSection";
import { ColoringCanvas, type ColoringCanvasHandle, type ColoringTool } from "@/components/coloring/ColoringCanvas";
import {
  BUILT_IN_COLORING_TEMPLATES,
  publishedColoringTemplateId,
  type ColoringTemplate,
} from "@/lib/coloring-templates";
import { Download, Eraser, PaintBucket, Paintbrush, Redo2, RotateCcw, Undo2 } from "lucide-react";

const swatches = [
  { name: "Terracotta", value: tokens.color.light.primary },
  { name: "Sage", value: tokens.color.light.secondary },
  { name: "Golden amber", value: tokens.color.light.accent },
  { name: "Rose", value: tokens.color.light.muted },
  { name: "Warm brown", value: tokens.color.light.chart5 },
  { name: "Warm paper", value: tokens.color.light.background },
  { name: "Soft canvas", value: tokens.color.light.card },
  { name: "Ink", value: tokens.color.light.foreground },
];

const tools: { id: ColoringTool; label: string; Icon: typeof Paintbrush }[] = [
  { id: "brush", label: "Brush", Icon: Paintbrush },
  { id: "eraser", label: "Eraser", Icon: Eraser },
  { id: "fill", label: "Fill", Icon: PaintBucket },
];

type PublishedArtwork = {
  id: number;
  projectId?: number;
  title: string;
  blocks?: { id: string; type: string; mediaId?: number; alt?: string }[];
};

export default function ColoringStudio() {
  const canvasRef = useRef<ColoringCanvasHandle>(null);
  const [templateId, setTemplateId] = useState("flower-garden");
  const [tool, setTool] = useState<ColoringTool>("brush");
  const [color, setColor] = useState(swatches[0].value);
  const [brushSize, setBrushSize] = useState([12]);
  const [canvasReady, setCanvasReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [status, setStatus] = useState("Loading your local painting draft…");
  const [statusError, setStatusError] = useState(false);
  const { data, isLoading: publishedLoading, isError: publishedError, refetch } = useGetPublishedContent(
    { section: "coloring-pages" },
    { query: { queryKey: getGetPublishedContentQueryKey({ section: "coloring-pages" }), staleTime: 45_000, refetchOnWindowFocus: true } },
  );

  const publishedTemplates: ColoringTemplate[] = ((data?.publications ?? []) as PublishedArtwork[]).flatMap((publication) => {
    const projectId = publication.projectId ?? publication.id;
    return (publication.blocks ?? [])
      .filter((block) => block.type === "image" && typeof block.mediaId === "number")
      .map((block) => ({
        id: publishedColoringTemplateId(projectId, block.id),
        title: block.alt || publication.title,
        description: `Published student coloring page from ${publication.title}.`,
        imageUrl: `/api/public/publications/${projectId}/media/${block.mediaId}`,
      }));
  });
  const templates = [...BUILT_IN_COLORING_TEMPLATES, ...publishedTemplates];
  const selectedTemplate = templates.find((item) => item.id === templateId) ?? BUILT_IN_COLORING_TEMPLATES[0];

  const updateStatus = (message: string, isError = false) => {
    setStatus(message);
    setStatusError(isError);
  };

  const switchTemplate = async (nextTemplateId: string) => {
    if (nextTemplateId === templateId) return;
    try {
      await canvasRef.current?.flush();
    } catch {
      updateStatus("The current painting could not be saved. Stay on this page and try again before switching.", true);
      return;
    }
    setTemplateId(nextTemplateId);
    setCanvasReady(false);
    setCanUndo(false);
    setCanRedo(false);
    updateStatus("Opening this page's local draft…");
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12">
      <header className="mx-auto mb-8 max-w-3xl text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-secondary">Art Studio</p>
        <h1 className="mb-3 font-display text-4xl italic text-foreground sm:text-5xl">Coloring & Painting Studio</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Choose a page, find your colors, and make it your own. No printer needed.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="min-w-0">
          <CardHeader className="gap-4 border-b border-border/60 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 flex-1">
                <Label htmlFor="coloring-template" className="mb-2 block">Coloring page</Label>
                <Select value={templateId} onValueChange={(value) => void switchTemplate(value)}>
                  <SelectTrigger id="coloring-template" data-testid="select-coloring-template">
                    <SelectValue placeholder="Choose a page" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILT_IN_COLORING_TEMPLATES.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
                    ))}
                    {publishedTemplates.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Student pages</div>
                        {publishedTemplates.map((item) => (
                          <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-sm text-muted-foreground">{selectedTemplate.description}</p>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Painting history and download">
                <Button type="button" variant="outline" size="icon" aria-label="Undo" data-testid="button-undo" disabled={!canvasReady || !canUndo} onClick={() => canvasRef.current?.undo()}>
                  <Undo2 />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label="Redo" data-testid="button-redo" disabled={!canvasReady || !canRedo} onClick={() => canvasRef.current?.redo()}>
                  <Redo2 />
                </Button>
                <Button type="button" variant="secondary" size="sm" data-testid="button-download-painting" disabled={!canvasReady} onClick={() => canvasRef.current?.download()}>
                  <Download /> Download PNG
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-5">
            <p id="coloring-canvas-help" className="sr-only">Use your mouse, touch, or stylus to paint. Select a tool and color first.</p>
            <ColoringCanvas
              key={selectedTemplate.id}
              ref={canvasRef}
              template={selectedTemplate}
              tool={tool}
              color={color}
              brushSize={brushSize[0]}
              onHistoryChange={(undo, redo) => {
                setCanUndo(undo);
                setCanRedo(redo);
              }}
              onReadyChange={setCanvasReady}
              onStatus={updateStatus}
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p role={statusError ? "alert" : "status"} aria-live="polite" data-testid="status-coloring-draft" className={statusError ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
                {status}
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm" data-testid="button-reset-painting" disabled={!canvasReady}>
                    <RotateCcw /> Reset page
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset this painting?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This clears the colors on this page. You can undo the reset while you stay here; after the blank draft is saved, it replaces this page's local draft on this device.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-reset-cancel">Keep painting</AlertDialogCancel>
                    <AlertDialogAction data-testid="button-reset-confirm" onClick={() => canvasRef.current?.reset()}>Reset painting</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader className="p-5">
            <CardTitle>Painting tools</CardTitle>
            <CardDescription>Make a mark, soften it, or fill a space.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-5 pt-0">
            <section aria-labelledby="painting-tool-label">
              <Label id="painting-tool-label" className="mb-2 block">Tool</Label>
              <div className="grid grid-cols-3 gap-2">
                {tools.map(({ id, label, Icon }) => (
                  <Button
                    key={id}
                    type="button"
                    variant={tool === id ? "secondary" : "outline"}
                    size="sm"
                    aria-pressed={tool === id}
                    data-testid={`button-tool-${id}`}
                    onClick={() => setTool(id)}
                    className="flex-col gap-1 px-2 py-2"
                  >
                    <Icon />{label}
                  </Button>
                ))}
              </div>
            </section>

            <section aria-labelledby="palette-label">
              <Label id="palette-label" className="mb-3 block">Color palette</Label>
              <div className="mb-4 flex items-center justify-between gap-3">
                <Label htmlFor="custom-paint-color">Choose any color</Label>
                <Input
                  id="custom-paint-color"
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="h-10 w-16 cursor-pointer p-1"
                  data-testid="input-custom-paint-color"
                />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {swatches.map((swatch) => (
                  <Button
                    key={swatch.name}
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Select ${swatch.name}`}
                    aria-pressed={color === swatch.value}
                    data-testid={`button-color-${swatch.name.toLowerCase().replace(/\s+/g, "-")}`}
                    title={swatch.name}
                    onClick={() => setColor(swatch.value)}
                    className={color === swatch.value ? "ring-2 ring-ring ring-offset-2" : ""}
                    style={{ backgroundColor: swatch.value, borderColor: swatch.value }}
                  >
                    <span className="sr-only">{swatch.name}</span>
                  </Button>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Selected: {swatches.find((swatch) => swatch.value === color)?.name ?? "custom color"}</p>
            </section>

            <section aria-labelledby="brush-size-label" className="space-y-3">
              <div className="flex items-center justify-between">
                <Label id="brush-size-label">Brush size</Label>
                <span className="text-sm text-muted-foreground">{brushSize[0]} px</span>
              </div>
              <Slider
                aria-label="Brush size"
                data-testid="slider-brush-size"
                min={4}
                max={36}
                step={2}
                value={brushSize}
                onValueChange={setBrushSize}
              />
              <p className="text-xs text-muted-foreground">For the brush and eraser.</p>
            </section>
          </CardContent>
        </Card>
      </div>

      <Card className="mx-auto mt-6 max-w-5xl">
        <CardContent className="p-5 sm:p-6">
          <h2 className="mb-2 font-serif text-lg font-semibold italic">Your work stays with you</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Paintings are saved locally in this browser on this device, separately for each page. Anyone using this shared device and browser may be able to see them. They are not public, stored in the cloud, or attached to a student account. Clearing browser data or switching devices can remove or leave behind a draft.
          </p>
        </CardContent>
      </Card>

      {publishedLoading && (
        <div className="mx-auto mt-10 max-w-6xl space-y-3" aria-label="Loading published coloring pages">
          <div className="h-8 w-1/2 animate-pulse rounded-md bg-muted" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      )}
      {publishedError && (
        <Card role="alert" className="mx-auto mt-10 max-w-4xl">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">Published student pages could not be loaded. Your built-in pages still work.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>Retry</Button>
          </CardContent>
        </Card>
      )}
      <PublishedSection section="coloring-pages" heading="Student coloring pages" className="mt-12" />
    </main>
  );
}
