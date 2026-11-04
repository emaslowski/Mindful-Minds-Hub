import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { ColoringTemplate } from "@/lib/coloring-templates";
import { loadColoringDraft, saveColoringDraft } from "@/lib/coloring-storage";

export type ColoringTool = "brush" | "eraser" | "fill";

export type ColoringCanvasHandle = {
  undo: () => void;
  redo: () => void;
  reset: () => void;
  flush: () => Promise<void>;
  download: () => void;
};

type ColoringCanvasProps = {
  template: ColoringTemplate;
  tool: ColoringTool;
  color: string;
  brushSize: number;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
  onStatus: (message: string, isError?: boolean) => void;
  onReadyChange: (ready: boolean) => void;
};

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 650;
const MAX_HISTORY = 8;

async function imageFromTemplate(template: ColoringTemplate): Promise<HTMLImageElement | null> {
  if (!template.svg && !template.imageUrl) return null;
  let source: string;
  let revokeSource = false;
  if (template.svg) {
    source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(template.svg)}`;
  } else {
    const sourceUrl = new URL(template.imageUrl!, window.location.href);
    if (sourceUrl.origin !== window.location.origin || !/^\/api\/public\/publications\/\d+\/media\/\d+$/.test(sourceUrl.pathname)) {
      throw new Error("This published coloring page does not use an approved same-site image.");
    }
    const response = await fetch(sourceUrl.href, { credentials: "same-origin" });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
      throw new Error("This published coloring page image could not be loaded.");
    }
    if (new URL(response.url).origin !== window.location.origin) {
      throw new Error("This published coloring page image did not come from this site.");
    }
    source = URL.createObjectURL(await response.blob());
    revokeSource = true;
  }
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("This coloring page could not be loaded."));
      image.src = source;
    });
  } finally {
    if (revokeSource) URL.revokeObjectURL(source);
  }
}

function paintTemplate(ctx: CanvasRenderingContext2D, image: HTMLImageElement | null, paper: boolean, extractInk: boolean) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (paper) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  if (!image) return;
  const scale = Math.min(CANVAS_WIDTH / image.width, CANVAS_HEIGHT / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  ctx.drawImage(image, (CANVAS_WIDTH - width) / 2, (CANVAS_HEIGHT - height) / 2, width, height);
  if (extractInk) {
    const pixels = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    for (let offset = 0; offset < pixels.data.length; offset += 4) {
      const sourceAlpha = pixels.data[offset + 3];
      const luminance = pixels.data[offset] * 0.299 + pixels.data[offset + 1] * 0.587 + pixels.data[offset + 2] * 0.114;
      if (!paper) {
        pixels.data[offset] = 0;
        pixels.data[offset + 1] = 0;
        pixels.data[offset + 2] = 0;
        pixels.data[offset + 3] = Math.round((255 - luminance) * sourceAlpha / 255);
      } else {
        const isInk = sourceAlpha > 0 && luminance < 220;
        pixels.data[offset] = isInk ? 0 : 255;
        pixels.data[offset + 1] = isInk ? 0 : 255;
        pixels.data[offset + 2] = isInk ? 0 : 255;
        pixels.data[offset + 3] = 255;
      }
    }
    ctx.putImageData(pixels, 0, 0);
  }
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Your painting could not be prepared for local saving."));
    }, "image/png");
  });
}

function snapshot(ctx: CanvasRenderingContext2D): ImageData {
  return ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function floodFill(
  paintContext: CanvasRenderingContext2D,
  outlineContext: CanvasRenderingContext2D,
  x: number,
  y: number,
  fillColor: string,
) {
  const outline = outlineContext.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data;
  const paint = paintContext.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const width = CANVAS_WIDTH;
  const height = CANVAS_HEIGHT;
  const start = y * width + x;
  const isOpen = (pixel: number) => {
    const offset = pixel * 4;
    return (outline[offset] + outline[offset + 1] + outline[offset + 2]) / 3 >= 210;
  };
  if (!isOpen(start)) return false;
  const seen = new Uint8Array(width * height);
  const stack = new Int32Array(width * height);
  let stackLength = 0;
  seen[start] = 1;
  stack[stackLength++] = start;
  const normalized = fillColor.match(/^#([0-9a-f]{6})$/i);
  if (!normalized) return false;
  const hex = normalized[1];
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  let changed = false;
  while (stackLength) {
    const pixel = stack[--stackLength];
    if (!isOpen(pixel)) continue;
    const offset = pixel * 4;
    if (paint.data[offset] !== red || paint.data[offset + 1] !== green || paint.data[offset + 2] !== blue || paint.data[offset + 3] !== 255) {
      paint.data[offset] = red;
      paint.data[offset + 1] = green;
      paint.data[offset + 2] = blue;
      paint.data[offset + 3] = 255;
      changed = true;
    }
    const px = pixel % width;
    const py = Math.floor(pixel / width);
    if (px > 0 && !seen[pixel - 1]) { seen[pixel - 1] = 1; stack[stackLength++] = pixel - 1; }
    if (px + 1 < width && !seen[pixel + 1]) { seen[pixel + 1] = 1; stack[stackLength++] = pixel + 1; }
    if (py > 0 && !seen[pixel - width]) { seen[pixel - width] = 1; stack[stackLength++] = pixel - width; }
    if (py + 1 < height && !seen[pixel + width]) { seen[pixel + width] = 1; stack[stackLength++] = pixel + width; }
  }
  if (changed) paintContext.putImageData(paint, 0, 0);
  return changed;
}

export const ColoringCanvas = forwardRef<ColoringCanvasHandle, ColoringCanvasProps>(
  function ColoringCanvas({ template, tool, color, brushSize, onHistoryChange, onStatus, onReadyChange }, ref) {
    const paintCanvasRef = useRef<HTMLCanvasElement>(null);
    const outlineCanvasRef = useRef<HTMLCanvasElement>(null);
    const paintContextRef = useRef<CanvasRenderingContext2D | null>(null);
    const outlineContextRef = useRef<CanvasRenderingContext2D | null>(null);
    const fillContextRef = useRef<CanvasRenderingContext2D | null>(null);
    const undoStackRef = useRef<ImageData[]>([]);
    const redoStackRef = useRef<ImageData[]>([]);
    const drawingRef = useRef(false);
    const pointerIdRef = useRef<number | null>(null);
    const saveRevisionRef = useRef(0);
    const savePromiseRef = useRef<Promise<void>>(Promise.resolve());
    const currentBlobSaveRef = useRef<Promise<void>>(Promise.resolve());
    const [loadState, setLoadState] = useState<"loading" | "ready" | "image-error" | "storage-error">("loading");
    const [loadAttempt, setLoadAttempt] = useState(0);
    const ready = loadState === "ready";

    const reportHistory = () => onHistoryChange(undoStackRef.current.length > 0, redoStackRef.current.length > 0);

    const persist = () => {
      const canvas = paintCanvasRef.current;
      if (!canvas) return Promise.resolve();
      const revision = ++saveRevisionRef.current;
      onStatus("Saving your painting on this device…");
      const save = canvasBlob(canvas)
        .then(async (blob) => {
          if (revision !== saveRevisionRef.current) return;
          const write = saveColoringDraft(template.id, blob);
          savePromiseRef.current = write;
          await write;
          if (revision === saveRevisionRef.current) {
            onStatus("Draft saved on this browser and device.");
          }
        })
        .catch((error: unknown) => {
          if (revision === saveRevisionRef.current) {
            onStatus(error instanceof Error ? error.message : "Your local draft could not be saved.", true);
          }
          throw error;
        });
      currentBlobSaveRef.current = save;
      return save;
    };

    const pushUndo = (ctx: CanvasRenderingContext2D) => {
      undoStackRef.current.push(snapshot(ctx));
      if (undoStackRef.current.length > MAX_HISTORY) undoStackRef.current.shift();
      redoStackRef.current = [];
      reportHistory();
    };

    useEffect(() => {
      let active = true;
      setLoadState("loading");
      onReadyChange(false);
      const paintCanvas = paintCanvasRef.current;
      const outlineCanvas = outlineCanvasRef.current;
      if (!paintCanvas || !outlineCanvas) return;
      paintCanvas.width = CANVAS_WIDTH;
      paintCanvas.height = CANVAS_HEIGHT;
      outlineCanvas.width = CANVAS_WIDTH;
      outlineCanvas.height = CANVAS_HEIGHT;
      const paintContext = paintCanvas.getContext("2d", { willReadFrequently: true });
      const outlineContext = outlineCanvas.getContext("2d", { willReadFrequently: true });
      const fillCanvas = document.createElement("canvas");
      fillCanvas.width = CANVAS_WIDTH;
      fillCanvas.height = CANVAS_HEIGHT;
      const fillContext = fillCanvas.getContext("2d", { willReadFrequently: true });
      if (!paintContext || !outlineContext || !fillContext) {
        onStatus("This browser could not start the painting canvas.", true);
        setLoadState("image-error");
        return;
      }
      paintContextRef.current = paintContext;
      outlineContextRef.current = outlineContext;
      fillContextRef.current = fillContext;
      paintContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      undoStackRef.current = [];
      redoStackRef.current = [];
      reportHistory();

      const initialize = async () => {
        let image: HTMLImageElement | null;
        try {
          image = await imageFromTemplate(template);
        } catch (error) {
          if (active) {
            onStatus(error instanceof Error ? error.message : "The coloring page image could not be loaded.", true);
            setLoadState("image-error");
          }
          return;
        }
        if (!active) return;
        paintTemplate(outlineContext, image, false, true);
        paintTemplate(fillContext, image, true, true);
        let draft: Blob | null;
        try {
          draft = await loadColoringDraft(template.id);
        } catch (error) {
          if (active) {
            const detail = error instanceof Error ? ` ${error.message}` : "";
            onStatus(`Saved painting could not be read.${detail} Retry loading before painting so an existing draft is not replaced.`, true);
            setLoadState("storage-error");
          }
          return;
        }
        if (!active) return;
        if (draft) {
          const draftImage = new Image();
          const url = URL.createObjectURL(draft);
          try {
            await new Promise<void>((resolve, reject) => {
              draftImage.onload = () => resolve();
              draftImage.onerror = () => reject(new Error("Your saved local painting could not be opened."));
              draftImage.src = url;
            });
          } catch (error) {
            if (active) {
              const detail = error instanceof Error ? ` ${error.message}` : "";
              onStatus(`Saved painting could not be restored.${detail} Retry loading before painting so the local draft is not replaced.`, true);
              setLoadState("storage-error");
            }
            URL.revokeObjectURL(url);
            return;
          }
          URL.revokeObjectURL(url);
          if (!active) return;
          paintContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          paintContext.drawImage(draftImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          onStatus("Your local painting has been restored.");
        } else {
          onStatus("A fresh page is ready. Your first strokes will be saved locally.");
        }
        if (active) {
          setLoadState("ready");
          onReadyChange(true);
        }
      };
      initialize().catch((error: unknown) => {
        if (active) {
          onStatus(error instanceof Error ? error.message : "The coloring page could not be loaded.", true);
          setLoadState("image-error");
        }
      });
      return () => {
        active = false;
      };
    }, [template.id, loadAttempt]);

    const pointFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(CANVAS_WIDTH - 1, Math.floor(((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH))),
        y: Math.max(0, Math.min(CANVAS_HEIGHT - 1, Math.floor(((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT))),
      };
    };

    const drawDot = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      ctx.save();
      ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!ready || tool === "fill") {
        if (ready && tool === "fill") {
          const ctx = paintContextRef.current;
          const outline = fillContextRef.current;
          if (!ctx || !outline) return;
          const point = pointFromEvent(event);
          pushUndo(ctx);
          if (floodFill(ctx, outline, point.x, point.y, color)) void persist().catch(() => undefined);
          else {
            undoStackRef.current.pop();
            reportHistory();
          }
        }
        return;
      }
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      pointerIdRef.current = event.pointerId;
      drawingRef.current = true;
      const ctx = paintContextRef.current;
      if (!ctx) return;
      pushUndo(ctx);
      const point = pointFromEvent(event);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = color;
      ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      drawDot(ctx, point.x, point.y);
    };

    const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current || pointerIdRef.current !== event.pointerId) return;
      event.preventDefault();
      const ctx = paintContextRef.current;
      if (!ctx) return;
      const point = pointFromEvent(event);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    };

    const finishStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current || pointerIdRef.current !== event.pointerId) return;
      drawingRef.current = false;
      pointerIdRef.current = null;
      const ctx = paintContextRef.current;
      if (ctx) ctx.closePath();
      void persist().catch(() => undefined);
    };

    const undo = () => {
      const ctx = paintContextRef.current;
      if (!ready || !ctx || !undoStackRef.current.length) return;
      redoStackRef.current.push(snapshot(ctx));
      ctx.putImageData(undoStackRef.current.pop()!, 0, 0);
      reportHistory();
      void persist().catch(() => undefined);
    };

    const redo = () => {
      const ctx = paintContextRef.current;
      if (!ready || !ctx || !redoStackRef.current.length) return;
      undoStackRef.current.push(snapshot(ctx));
      if (undoStackRef.current.length > MAX_HISTORY) undoStackRef.current.shift();
      ctx.putImageData(redoStackRef.current.pop()!, 0, 0);
      reportHistory();
      void persist().catch(() => undefined);
    };

    const reset = () => {
      const ctx = paintContextRef.current;
      if (!ready || !ctx) return;
      pushUndo(ctx);
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      void persist().catch(() => undefined);
    };

    const download = () => {
      const paintCanvas = paintCanvasRef.current;
      const outlineCanvas = outlineCanvasRef.current;
      if (!ready || !paintCanvas || !outlineCanvas) return;
      const flattened = document.createElement("canvas");
      flattened.width = CANVAS_WIDTH;
      flattened.height = CANVAS_HEIGHT;
      const context = flattened.getContext("2d");
      if (!context) {
        onStatus("The finished painting could not be prepared for download.", true);
        return;
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      context.drawImage(paintCanvas, 0, 0);
      context.drawImage(outlineCanvas, 0, 0);
      flattened.toBlob((blob) => {
        if (!blob) {
          onStatus("The finished painting could not be downloaded.", true);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${template.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
        link.click();
        URL.revokeObjectURL(url);
        onStatus("Your flattened PNG is ready to download.");
      }, "image/png");
    };

    useImperativeHandle(ref, () => ({
      undo,
      redo,
      reset,
      flush: async () => {
        while (true) {
          const revision = saveRevisionRef.current;
          await currentBlobSaveRef.current;
          await savePromiseRef.current;
          if (revision === saveRevisionRef.current) return;
        }
      },
      download,
    }));

    return (
      <div className="relative overflow-hidden rounded-xl border border-border shadow-sm" data-testid="coloring-canvas-frame" style={{ backgroundColor: "#ffffff" }}>
          <div className="relative w-full" style={{ aspectRatio: "18 / 13" }}>
          <canvas
            ref={paintCanvasRef}
            aria-label={`Paint on ${template.title}`}
            aria-describedby="coloring-canvas-help"
            className="absolute inset-0 h-full w-full touch-none"
            data-testid="coloring-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishStroke}
            onPointerCancel={finishStroke}
            style={{ cursor: tool === "fill" ? "cell" : tool === "eraser" ? "cell" : "crosshair" }}
          />
          <canvas ref={outlineCanvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 p-4" aria-label={loadState === "loading" ? "Loading coloring page" : "Coloring page needs attention"}>
              {loadState === "loading" ? (
                <div className="w-2/3 space-y-3">
                  <div className="h-4 animate-pulse rounded-md bg-muted" />
                  <div className="h-40 animate-pulse rounded-md bg-muted" />
                </div>
              ) : (
                <div className="max-w-sm space-y-3 text-center">
                  <p className="text-sm text-foreground">
                    {loadState === "image-error"
                      ? "The page image could not be loaded, so painting is paused."
                      : "The local draft could not be read. Painting is paused so an existing draft is not replaced."}
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
                    <RefreshCw /> Retry loading
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);
