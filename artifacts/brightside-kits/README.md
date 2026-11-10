# The Brightside Wellness Project — kits site

A standalone marketing and ordering website for the Brightside learning kits
(teacher manual, slide decks, student workbooks, and access to The Brightside
Project hub). It is a static site (Vite + React + Tailwind) with one backend
dependency: the order form posts to `POST /api/kits/orders` on the main hub's
API server, which emails the order to you and a confirmation to the buyer.

Pages:

| Path      | What                                                            |
|-----------|-----------------------------------------------------------------|
| `/`       | Home: what's in the kit, how it works, the hub, pricing, FAQ     |
| `/kits`   | Product page: gallery, the three kits, comparison table, district buying |
| `/order`  | Order / quote form (`?kit=classroom`, `school` or `district`)    |
| `/thanks` | Confirmation (also the return page for Stripe checkout)          |
| `/school-login` | School login: a school enters its access code and gets its hub links |

## School login (access codes)

Each school that buys a kit gets an access code and a hub address. The list
lives in the hub's editable site content under the key `kits.schools`, so you
add a school without a deploy: open the Teacher Command Center → Site
Assistant and say, for example, "Add Lincoln Middle School to the kit schools
with code LINCOLN-2026 and hub URL https://…". Each entry has `name`, `code`,
`hubUrl` and an optional `note`. The kits site looks codes up through
`GET /api/kits/schools/:code` and only ever returns the one matching school.
A demo entry (`BRIGHT-DEMO`) points at the main hub; remove it when you no
longer want it.

## Edit the content

Everything you are likely to change is in [src/config.ts](src/config.ts):
prices, what each kit includes, the contact email, the hub URL, the FAQ and
the list of hub centers. Page copy lives in `src/pages/`.

The logo is `public/logo.png` (1000px, transparent background). Full-resolution
copies: `public/logo-transparent-print.png` (transparent) and
`public/logo-print.png` (the original with its cream background). The four product illustrations are SVG
components in `src/components/KitArt.tsx`; replace any of them with a real
photo by swapping the component for an `<img>`.

## Take payments

The "Buy" buttons send buyers to the order form, which emails you the order so
you can invoice the district or accept a purchase order. To take card or ACH
payments directly:

1. In Stripe, create a **Payment Link** for each kit
   (Dashboard → Payment Links → New). Set the confirmation page to
   `https://thebrightsidewellnessproject.com/thanks?session_id={CHECKOUT_SESSION_ID}`.
2. Paste each link into `checkoutUrl` for that kit in `src/config.ts`.
3. Rebuild and deploy. The "Buy now" button now goes straight to Stripe, and
   the order form keeps working for purchase orders and quotes.

## Order emails

The API server emails orders using the same SMTP settings as the rest of the
app (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`). Recipients are, in order of
preference, `KIT_ORDER_EMAILS`, then `SITE_OWNER_EMAILS`, then the first
`ADMIN_EMAILS` entry. Without SMTP configured, orders are written to the server
log and the buyer still sees the confirmation page.

## Run it locally

From the repository root:

```bash
pnpm install
pnpm run dev:kits          # http://localhost:5176 (forwards /api to :8080)
pnpm run dev               # in another terminal, if you want the order form to work
```

## Deploy

The site is static, so any static host works (Cloud Run, Netlify, Vercel,
Cloudflare Pages, GitHub Pages). Build with the API's public URL so the order
form knows where to post:

```bash
VITE_API_BASE_URL=https://thebrightsidehub-480156548115.us-east1.run.app pnpm run build:kits
# output: artifacts/brightside-kits/dist/public
```

### Google Cloud Run (same project as the hub)

Cloud Build builds the image (no local Docker needed) and Cloud Run serves it
as the service `brightside-kits`. From the repository root:

```bash
gcloud builds submit --config artifacts/brightside-kits/cloudbuild.yaml .
gcloud run deploy brightside-kits \
  --image us-east1-docker.pkg.dev/the-brightside-project-llc/cloud-run-source-deploy/brightside-kits:latest \
  --region us-east1 --port 8080 --allow-unauthenticated
```

Repeat both commands whenever the site changes.

### Connect thebrightsidewellnessproject.com

1. Verify the domain once in [Google Search Console](https://search.google.com/search-console)
   with the Google account that owns the Cloud project (add a TXT record at
   your registrar when asked).
2. Map it to the service:
   ```bash
   gcloud beta run domain-mappings create --service brightside-kits \
     --domain thebrightsidewellnessproject.com --region us-east1
   gcloud beta run domain-mappings create --service brightside-kits \
     --domain www.thebrightsidewellnessproject.com --region us-east1
   ```
   Each command prints the DNS records to add (A/AAAA records for the root
   domain, a CNAME to `ghs.googlehosted.com` for `www`).
3. Add those records at your registrar. The certificate is issued
   automatically once DNS propagates, usually within an hour.

Alternatively, Cloud Run → the service → **Manage custom domains** does the
same thing in the console.
