import { Router, type IRouter } from "express";
import { ObjectStorageService } from "../lib/objectStorage";
import { streamProjectVideo } from "../lib/projectVideoStorage";

const router: IRouter = Router();
const storage = new ObjectStorageService();

router.get("/public/homepage-image", async (req, res) => {
  try {
    const file = await storage.searchPublicObject("homepage/student-art-2026-11-03.webp");
    if (!file) {
      res.status(404).json({ error: "The homepage image is not available." });
      return;
    }
    const [image] = await file.download();
    res.set("Content-Type", "image/webp");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(image);
  } catch (error) {
    req.log.error({ err: error }, "Failed to load homepage image");
    res.status(500).json({ error: "The homepage image could not be loaded." });
  }
});

// Only this explicitly selected public homepage asset is exposed. Never accept
// a client-supplied object path or open access to student uploads.
router.get("/public/homepage-video", async (req, res) => {
  try {
    const format = req.query.format ?? "mp4";
    if (format !== "mp4" && format !== "webm") {
      res.status(400).json({ error: "Unsupported video format." });
      return;
    }
    const file = await storage.searchPublicObject(`homepage/welcome-2026-10-27.${format}`);
    if (!file) {
      res.status(404).json({ error: "The homepage video is not available." });
      return;
    }
    await streamProjectVideo(file, req, res);
  } catch (error) {
    req.log.error({ err: error }, "Failed to stream homepage video");
    if (!res.headersSent) res.status(500).json({ error: "The homepage video could not be loaded." });
    else res.destroy();
  }
});

export default router;
