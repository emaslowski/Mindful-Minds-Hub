import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(resolve("artifacts/api-server/package.json"));
const { Storage } = require("@google-cloud/storage");
// Same credentials as the API server: GCS_SERVICE_ACCOUNT_KEY (JSON) or
// Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS).
const keyJson = process.env.GCS_SERVICE_ACCOUNT_KEY;
const credentials = keyJson ? JSON.parse(keyJson) : undefined;
const storage = new Storage(credentials ? { credentials, projectId: credentials.project_id } : {});
const publicPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(",")[0]?.trim();
if (!publicPath) throw new Error("Public object storage is not configured.");
const [bucket, ...prefix] = publicPath.replace(/^\/+/, "").split("/");
await storage.bucket(bucket).upload("generated-artifacts/homepage-image/homepage-student-art.webp", {
  destination: [...prefix, "homepage/student-art-2026-11-03.webp"].filter(Boolean).join("/"),
  metadata: { contentType: "image/webp" },
});
console.log("Homepage image saved to Cloud Storage.");
