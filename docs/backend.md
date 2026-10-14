# Backend: database, auth, API, hosting

The admin app is also the backend: TanStack Start server functions and server
routes talk to Postgres through Drizzle. No separate API service to run.

```
browser ── server fns (session cookie) ──► archive.functions.ts ──► archive.server.ts (pgRepository) ──► Postgres
website ── GET /api/v1/* (API key) ─────► routes/api/v1/$.ts ──────┘
           /api/auth/*  ────────────────► Better Auth (GitHub, passkeys, API keys, sessions)
```

## Local development

```bash
docker compose up -d                       # Postgres 17 on localhost:5433
cp apps/admin/.env.example apps/admin/.env # then fill the auth values
pnpm --filter admin db:migrate             # apply drizzle/ migrations
pnpm --filter admin db:seed ../../References/.import/archive-import.json
pnpm dev
```

`db:seed` refuses to overwrite a non-empty archive unless you pass `--replace`.
Sign-in locally needs a GitHub OAuth app whose callback is
`http://localhost:3000/api/auth/callback/github` (separate from production's).

Other scripts: `db:generate` (new migration after editing `src/server/db/schema.ts`),
`db:studio` (Drizzle Studio), `build` + `start` (production server on Node).

## Database (`src/server/db/`)

| Table              | Holds                                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| `library_items`    | Logged works (PK `type, id`); snapshot of title/poster/genres                 |
| `logs`             | One row per log; kind-specific fields are nullable columns; FK → library item |
| `backlog_items`    | Same snapshot shape as library items                                          |
| `collection_items` | Record copies; `discogs_instance_id` unique (idempotent Discogs import)       |
| `flights`          | Local times as `timestamp` without time zone                                  |
| auth tables        | `user`, `session`, `account`, `verification`, `passkey`, `apikey`             |

- `logs.log_date` is a generated column (`coalesce(watched, played, finished,
started)`), so "newest first, undated last" is plain SQL ordering.
- Check constraints: ratings 1–10, `season_number` only on season logs, log
  kind ↔ media type, price amount and currency together.
- Deleting the last log of a work deletes its library item; deleting a library
  item cascades to its logs.
- Auth tables are generated: `pnpm dlx auth@1.7.7 generate --config <file
exporting auth> --output src/server/db/auth-schema.ts`, then `db:generate`.
- Rows are mapped back to `@workspace/schemas` types and validated on the way
  out (`archive.server.ts`), so the export format is unchanged. A DB export
  round-trips the Obsidian import with zero differences.

## Auth (`src/server/auth.server.ts`)

- Better Auth with **GitHub** (first sign-in) and **passkeys** (add in Settings).
- **Single user:** a database hook refuses to create any account whose email
  isn't in `OWNER_EMAIL`.
- Every server function (archive and provider RPCs) uses the `requireOwner`
  middleware. The root route's `beforeLoad` redirects to `/login`, but that's
  only UX. When offline it lets the cached shell render.
- CSRF: `src/start.ts` rejects non-GET server-function calls that aren't
  same-origin (`createCsrfMiddleware`). Better Auth checks origins itself.
- Sessions last 90 days and refresh daily while used. Signing out clears the
  service worker's page/data caches.

## Website API (`src/routes/api/v1/$.ts`)

Read-only. Create a key in Settings → API keys (shown once, stored hashed), then
call it **server-side** from the website:

```ts
const res = await fetch(
  "https://archive.guilhermevictor.me/api/v1/recent?limit=10",
  {
    headers: { Authorization: `Bearer ${process.env.ARCHIVE_API_KEY}` },
    next: { revalidate: 3600 },
  }
)
```

| Endpoint                     | Returns                                               |
| ---------------------------- | ----------------------------------------------------- |
| `GET /api/v1/library?type=…` | `LibraryEntry[]` for movie/show/game/book/record      |
| `GET /api/v1/recent?limit=N` | `{ log, item }[]`, newest first (default 20, max 100) |
| `GET /api/v1/backlog`        | `BacklogItem[]`                                       |
| `GET /api/v1/stats`          | `ArchiveStats`                                        |
| `GET /api/v1/collection`     | `CollectionItem[]`                                    |
| `GET /api/v1/flights`        | `Flight[]`                                            |
| `GET /api/v1/export`         | The full `ArchiveExport`                              |

Errors: 401 (missing/invalid key), 400 (bad query), 404 (unknown endpoint).
Key rate limiting is off (the plugin's default of 10 requests a day would break
the site); cache on the website side instead.

## Hosting (plan: $0/month)

- **Vercel Hobby** runs the app. Nitro detects Vercel at build time; anywhere
  else the same build is a plain Node server (`pnpm --filter admin start`), so
  moving to a VPS is just running that behind a reverse proxy.
- **Neon free tier** for Postgres. Pick São Paulo (`aws-sa-east-1`) and set the
  Vercel function region to `gru1` so they sit together.

Deploy checklist (owner's accounts):

1. Neon: create the project (Postgres 17+). Run `DATABASE_URL=<neon url>
pnpm --filter admin db:migrate`, then `db:seed`.
2. GitHub OAuth app for production with callback
   `https://archive.guilhermevictor.me/api/auth/callback/github`.
3. Vercel: import the repo with root directory `apps/admin` and the env vars
   from `.env.example` (`BETTER_AUTH_URL=https://archive.guilhermevictor.me`,
   a fresh `BETTER_AUTH_SECRET`). Set the function region to `gru1`.
4. Add the domain `archive.guilhermevictor.me` in Vercel (CNAME at the DNS host).
5. Sign in with GitHub, add a passkey, create the website's API key.
6. Backups: add `DATABASE_URL` as a GitHub Actions secret.

## Backups

`.github/workflows/backup.yml` runs `pg_dump` daily and keeps each dump as a
workflow artifact for 90 days. It skips itself until the `DATABASE_URL` secret
exists. To restore:
`pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" archive.dump`.
The JSON export (Settings → Export or `/api/v1/export`) is the portable copy.
