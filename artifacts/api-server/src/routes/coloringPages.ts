import { Router, type IRouter } from "express";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const storage = new ObjectStorageService();

// Only the six explicitly approved PDF pages are public, never arbitrary uploads.
router.get("/public/coloring-pages/2026-11-04/:page", async (req, res) => {
  const page = req.params.page;
  if (!/^[1-6]$/.test(page)) {
    res.status(404).json({ error: "This coloring page does not exist." });
    return;
  }
  try {
    const file = await storage.searchPublicObject(`coloring/2026-11-04/painting-${page}.webp`);
    if (!file) {
      res.status(404).json({ error: "This coloring page is not available." });
      return;
    }
    const [image] = await file.download();
    res.set("Content-Type", "image/webp");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(image);
  } catch (error) {
    req.log.error({ err: error }, "Failed to load coloring page");
    res.status(500).json({ error: "This coloring page could not be loaded." });
  }
});

export default router;
