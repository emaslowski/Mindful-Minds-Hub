import fs from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";
import { studioAuthMiddleware } from "./middlewares/studioAuthMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
// Files upload directly to App Storage; this limit covers text/recipe layouts,
// never file bytes or base64 media.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);
app.use(studioAuthMiddleware);

app.use("/api", router);

// ─── Static front-ends ────────────────────────────────────────────────────────
// After `pnpm run build`, the API server also serves the main site at / and
// the Student Studio at /studio/, so the whole app runs as a single process.
// In development the Vite dev servers serve these instead.
function serveSpa(mountPath: string, distDir: string) {
  const indexFile = path.join(distDir, "index.html");
  if (!fs.existsSync(indexFile)) return false;
  app.use(
    mountPath,
    express.static(distDir, {
      index: false,
      setHeaders(res, filePath) {
        // Vite emits content-hashed assets, which are safe to cache forever.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );
  return indexFile;
}

const studioIndex = serveSpa(
  "/studio",
  process.env.STUDIO_DIST_DIR ?? path.resolve(import.meta.dirname, "../../studio/dist/public"),
);
const webIndex = serveSpa(
  "/",
  process.env.WEB_DIST_DIR ?? path.resolve(import.meta.dirname, "../../mind-matters/dist/public"),
);

app.get(/^\/studio$/, (_req, res) => res.redirect(301, "/studio/"));
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (req.path.startsWith("/api/")) return next();
  const index = req.path.startsWith("/studio/") ? studioIndex : webIndex;
  if (!index) return next();
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(index);
});

export default app;
