import { defineConfig } from "drizzle-kit";
import path from "path";

try {
  process.loadEnvFile(path.resolve(__dirname, "../../.env"));
} catch {
  // No .env file; rely on the real environment.
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  // drizzle-kit globs this path, and globs need forward slashes on Windows.
  schema: path.join(__dirname, "./src/schema/index.ts").replace(/\\/g, "/"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
