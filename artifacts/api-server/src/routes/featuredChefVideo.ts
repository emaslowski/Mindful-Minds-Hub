import { Router, type IRouter } from "express";
import { ObjectStorageService } from "../lib/objectStorage";
import { streamProjectVideo } from "../lib/projectVideoStorage";

const router: IRouter = Router();
const storage = new ObjectStorageService();

// Expose only the teacher-selected Featured Chef recording, never arbitrary uploads.
router.get("/public/featured-chef-video", async (req, res) => {
  try {
    const format = req.query.format ?? "mp4";
    if (format !== "mp4" && format !== "webm") {
      res.status(400).json({ error: "Unsupported video format." });
      return;
    }
    const file = await storage.searchPublicObject(`cooking/featured-chef-2026-10-27.${format}`);
    if (!file) {
      res.status(404).json({ error: "The Featured Chef video is not available." });
      return;
    }
    await streamProjectVideo(file, req, res);
  } catch (error) {
    req.log.error({ err: error }, "Failed to stream Featured Chef video");
    if (!res.headersSent) res.status(500).json({ error: "The Featured Chef video could not be loaded." });
    else res.destroy();
  }
});

export default router;
