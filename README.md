# The Brightside Project

A student-created school community to learn, create, connect, and belong, with a connected Student Studio and teacher-reviewed publishing.

The app is one Node.js server that serves:

| Path       | What                                           | Source                      |
|------------|------------------------------------------------|-----------------------------|
| `/`        | Main site                                      | `artifacts/mind-matters`    |
| `/studio/` | Student Studio and Teacher Command Center      | `artifacts/studio`          |
| `/api/`    | API (Express 5)                                | `artifacts/api-server`      |

A separate static site for selling the learning kits lives in [artifacts/brightside-kits](artifacts/brightside-kits/README.md) (`pnpm run dev:kits`, `pnpm run build:kits`). Its order form posts to this server's `POST /api/kits/orders`.

It needs three outside services: **PostgreSQL**, **Google Cloud** (sign-in, file storage, and Gmail for credential emails), and an **SMTP** mailbox for notifications. All settings are in [.env.example](.env.example).

## Run it locally

Requirements: Node.js 24, pnpm 10 (`npm install -g pnpm@10`), and PostgreSQL 16.

```bash
cp .env.example .env        # then fill in the values
pnpm install
pnpm run db:push            # create/update tables from the Drizzle schema
pnpm run db:migrate         # apply the repeatable SQL in lib/db/post-merge/
pnpm run dev                # API :8080, main site :5173, Studio :5174
```

Open http://localhost:5173. The main site's dev server forwards `/api` to the API server and `/studio` to the Studio dev server, so everything works from that one address.

## Production

```bash
pnpm install
pnpm run build:app          # builds the API server, main site and Studio
pnpm run db:push && pnpm run db:migrate
NODE_ENV=production pnpm start
```

Or use Docker on any container host (Render, Railway, Fly.io, Google Cloud Run, a VPS, …):

```bash
docker build -t brightside .
docker run --env-file .env -p 8080:8080 brightside
```

Health check: `GET /api/healthz`.

## One-time Google Cloud setup

1. **Sign-in**: in Google Cloud Console → APIs & Services → Credentials, create an OAuth client (type: Web application). Add the redirect URI `<APP_URL>/api/auth/google/callback`, then put the ID and secret in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
2. **File storage**: create a Cloud Storage bucket and a service account with the *Storage Object Admin* role on it. Create a JSON key and paste it into `GCS_SERVICE_ACCOUNT_KEY`. Uploads go straight from the browser to the bucket, so give the bucket a CORS rule:
   ```json
   [{"origin": ["https://your-domain"], "method": ["PUT", "GET", "HEAD"], "responseHeader": ["Content-Type"], "maxAgeSeconds": 3600}]
   ```
   Apply it with `gcloud storage buckets update gs://YOUR_BUCKET --cors-file=cors.json`.
3. **Credential emails**: enable the Gmail API. Using the OAuth client above, get a refresh token for the school sender mailbox with the `gmail.send` and `gmail.readonly` scopes (the [OAuth Playground](https://developers.google.com/oauthplayground) works; tick "Use your own OAuth credentials"). Put it in `GMAIL_REFRESH_TOKEN`.

## Moving data off Replit

Do this **before** shutting down the Replit project:

- **Database**: in the Replit shell, run `pg_dump "$DATABASE_URL" --no-owner --no-acl > brightside.sql`, download the file, then load it into the new database with `psql "$NEW_DATABASE_URL" < brightside.sql`.
- **Uploaded files** (artwork, videos, coloring pages, homepage images): the Replit App Storage bucket can only be read from inside Replit, so the copy has to run there. Create the new bucket and service-account key first (step 2 of the Google Cloud setup above), then:
  1. Upload [scripts/migrate-replit-storage.mjs](scripts/migrate-replit-storage.mjs) to the root folder of the Replit project.
  2. In Replit, add two Secrets: `NEW_BUCKET` (the new bucket's name) and `NEW_GCS_KEY` (the whole service-account JSON key).
  3. In the Replit shell, run `node migrate-replit-storage.mjs --dry-run` to see what will be copied, then `node migrate-replit-storage.mjs` to copy it.

  The script keeps the folder layout and each file's access-control metadata (`custom:aclPolicy`), so the database needs no changes. It ends by printing the `PUBLIC_OBJECT_SEARCH_PATHS` and `PRIVATE_OBJECT_DIR` values to use on the new host. It is safe to run more than once.

People who used to sign in with a Replit account must now sign in with Google.

## Useful commands

- `pnpm run typecheck`: full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen`: regenerate API hooks and Zod schemas from `lib/api-spec/openapi.yaml`
- `pnpm --filter @workspace/mind-matters-ds run dev`: design-system preview at http://localhost:5175/design-system/
