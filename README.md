# CTERA AI Hub (Customer Hub)

Next.js app with hub content loaded from **`GET /api/hub-data`**. The default dataset lives in [`lib/seed-hub`](lib/seed-hub); validated uploads are stored in **`data/hub.json`** (gitignored).

## Quick start

From the repo root:

```powershell
# Windows (installs deps, creates .env.local if missing, starts dev server)
pnpm start:hub
```

Or manually:

```bash
pnpm install
pnpm dev
```

Open **http://localhost:3000**. Verify the API: **http://localhost:3000/api/hub-data**

Production build:

```bash
pnpm build
pnpm start
```

## Environment

Copy [`.env.example`](.env.example) to `.env.local`.

- **`OPENAI_API_KEY`**: Required for the ARIA chat widget (`/api/chat`).
- **`HUB_ADMIN_TOKEN`**: Optional. When set, `POST /api/hub-data` and `POST /api/hub-data/upload` must send `Authorization: Bearer <token>`.

## Ingesting hub JSON

1. **`POST /api/hub-data`** with a JSON body. Only `version` (must be `1`), `tenants`, and `currentUser` are strictly validated; other sections are merged with defaults from the built-in seed so you can omit unchanged blocks.
2. **`POST /api/hub-data/upload`** with `multipart/form-data` and a field **`file`** (`.json`).

Without `HUB_ADMIN_TOKEN`, writes are open (suitable for local dev only).

## Optional `public/seed.hub.json`

If this file exists and parses correctly, it is used **before** falling back to the TypeScript seed (and after `data/hub.json`). To snapshot the live API shape after `pnpm dev`:

```bash
curl -s http://localhost:3000/api/hub-data -o public/seed.hub.json
```

On Vercel, **`data/hub.json` is not durable** (serverless filesystem). Use external storage or redeploy with data in `public/seed.hub.json` / your own backend when moving to production.

## Scripts

- `pnpm dev` / `pnpm build` — standard Next.js
