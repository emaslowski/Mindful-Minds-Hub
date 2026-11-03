import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(resolve("artifacts/api-server/package.json"));
const { Storage } = require("@google-cloud/storage");
const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: "http://127.0.0.1:1106/token",
    type: "external_account",
    credential_source: {
      url: "http://127.0.0.1:1106/credential",
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});
const publicPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(",")[0]?.trim();
if (!publicPath) throw new Error("Public object storage is not configured.");
const [bucket, ...prefix] = publicPath.replace(/^\/+/, "").split("/");
await storage.bucket(bucket).upload("generated-artifacts/homepage-image/homepage-student-art.webp", {
  destination: [...prefix, "homepage/student-art-2026-11-03.webp"].filter(Boolean).join("/"),
  metadata: { contentType: "image/webp" },
});
console.log("Homepage image saved to App Storage.");
