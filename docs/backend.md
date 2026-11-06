# Backend: database, auth, hosting

The admin app is also the backend: TanStack Start server functions talk to
Postgres through Drizzle. No separate API service to run, and no public API
(API keys were removed until a client needs one).

```
browser ── server fns (session cookie) ──► archive.functions.ts ──► archive.server.ts (pgRepository) ──► Postgres
           /api/auth/*  ────────────────► Better Auth (GitHub, passkeys, sessions)
```

## Local development

```bash
docker compose up -d                       # Postgres 17 on localhost:5433
cp apps/admin/.env.example apps/admin/.env # then fill the auth values
pnpm --filter admin db:migrate             # apply drizzle/ migrations
pnpm dev
pnpm --filter admin db:studio              # browse the tables (local.drizzle.studio)
```

Sign-in locally needs a GitHub OAuth app whose callback is
`http://localhost:3000/api/auth/callback/github` (separate from production's).

Other scripts: `db:generate` (new migration after editing `src/server/db/schema.ts`),
`db:seed <export.json>` (load a v2 export; `--replace` to overwrite),
`db:backfill-details` (fill in provider details; `--refresh`, `--type=movie,show`),
`build` + `start` (production server on Node).

## Database (`src/server/db/schema.ts`)

One table per kind of work, one log table per kind, and flights:

| Table                                                   | Holds                                                                                                                                                                                     |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `movies`, `shows`, `games`, `books`                     | One row per work in the archive, PK = provider id. `data` (jsonb) = provider details; columns copied from it for SQL (runtime, directors, imdb_id, developers, steam_id, authors, isbns…) |
| `records`                                               | One row **per physical copy** (uuid), or per wanted release (backlog, no copy fields). `release_id` = Discogs release; copy fields (conditions, price, store…); release columns + `data`  |
| `movie_logs`, `show_logs`, `game_logs`, `book_logs`     | One row per log, FK to its work (cascade). `show_logs.season_number` null = whole show. Records have no logs (`record_logs` was dropped in migration 0007)                                |
| `flights`                                               | Local times as `timestamp` without time zone                                                                                                                                              |
| views `all_logs`, `all_backlog`                         | Every log / every backlog entry across kinds, for SQL                                                                                                                                     |
| `user`, `session`, `account`, `verification`, `passkey` | Better Auth (generated: `pnpm dlx auth@1.7.7 generate`)                                                                                                                                   |

Rules:

- **A work row exists while it's in the archive**: it has logs, it's in the
  backlog (`backlog_added_at` set), or (records) it's a copy you own. Logging
  clears the backlog flag; deleting the last log of a non-backlogged work, or
  removing a never-logged work from the backlog, deletes the row.
- **Records**: wanting a release adds a row with `backlog_added_at`; buying it
  turns that row into the copy. A second copy is a second row. Records have no
  logs: copies are all there is.
- Columns like `title`, `year`, `poster`, `genres` come from the snapshot the UI
  sends when you log/backlog, and are overwritten from `data` once fetched.
- Check constraints: ratings 1–10, game/book statuses, price amount and currency
  together.
- Rows are mapped back to `@workspace/schemas` types (`archive.ts`, `log.ts`) and
  validated on the way out (`archive.server.ts`).

## Stored provider details (`src/server/details.server.ts`)

Goal: a work in the archive keeps a working page even if TMDB, IGDB, Discogs or
Google Books is down or gone. Search and discovery still need the providers.

- **When:** after logging, backlogging or adding a copy, the work's row gets
  `data` (and logged seasons get their episodes in `shows.seasons`). A provider
  failure never fails the write; the next page visit or the backfill fills it in.
- **What:** the provider type (`Movie`, `Show`, `Game`, `Book`, `Release`) with the
  replaceable parts removed: recommendations, similar, videos, screenshots
  (except the backdrop), other book editions, Discogs marketplace numbers. Full
  cast and crew are kept (the page shows 24 with "Show all"). Image paths are
  kept; the images stay on the provider CDNs. English (`TMDB_LANGUAGE`) only.
- **Reads:** detail RPCs try the provider first (full live data), refresh the
  stored copy if it's missing or older than a day, and fall back to it on any
  provider error.
- **Export:** `data` is part of each exported row, so an export is self-contained.

## Export format (v2)

`ArchiveExport` = `{ version: 2, exportedAt, movies, shows, games, books, records,
logs, flights }`: one array per work table (with `data`), all logs as one array
(`LogEntry` union), flights. Settings → Import and `db:seed` **replace** the
archive (never your account). v1 files (pre-database) are rejected.

## Auth (`src/server/auth.server.ts`)

- Better Auth with **GitHub** (first sign-in) and **passkeys** (add in Settings).
- **Single user:** database hooks refuse any user whose email isn't in
  `OWNER_EMAIL`, any user at all once one exists, and any GitHub account other
  than `OWNER_GITHUB_ID` (so an email match alone never links a stranger).
- Every server function (archive and provider RPCs) uses the `requireOwner`
  middleware. The root route's `beforeLoad` redirects to `/login`, but that's
  only UX. When offline it lets the cached shell render.
- CSRF: `src/start.ts` rejects non-GET server-function calls that aren't
  same-origin (`createCsrfMiddleware`). Better Auth checks origins itself.
- Sessions last 90 days and refresh daily while used. Settings → Devices lists
  them and signs other devices out. Signing out clears the service worker's
  page/data caches.

## Privacy

- Nothing is indexed: `public/robots.txt` disallows everything (AI crawlers
  named too), every response carries `X-Robots-Tag: noindex…` and the page a
  `robots` meta. robots/noindex are requests; the login is the real wall.
- Security headers (CSP, HSTS, `frame-ancestors 'none'`, `Referrer-Policy:
same-origin`…) are Nitro route rules in `vite.config.ts`, so Vercel applies
  them to static files too. The CSP is production-only (Vite's dev client
  breaks it). Add new image/embed origins there.
- On Vercel: Deployment Protection "Standard" (only the custom domain is
  public) and the Firewall's AI-bots rule block what ignores robots.txt.

## Hosting (plan: $0/month)

- **Vercel Hobby** runs the app. Nitro detects Vercel at build time; anywhere
  else the same build is a plain Node server (`pnpm --filter admin start`), so
  moving to a VPS is just running that behind a reverse proxy.
- **Neon free tier** for Postgres. Pick São Paulo (`aws-sa-east-1`) and set the
  Vercel function region to `gru1` so they sit together.

Deploy checklist (owner's accounts):

1. Neon: create the project (Postgres 17+). Run `DATABASE_URL=<neon url>
pnpm --filter admin db:migrate`.
2. GitHub OAuth app for production with callback
   `https://archive.guilhermevictor.me/api/auth/callback/github`.
3. Vercel: import the repo with root directory `apps/admin` and the env vars
   from `.env.example` (`BETTER_AUTH_URL=https://archive.guilhermevictor.me`,
   a fresh `BETTER_AUTH_SECRET`). Set the function region to `gru1`.
4. Add the domain `archive.guilhermevictor.me` in Vercel (CNAME at the DNS host).
5. Sign in with GitHub, then add a passkey in Settings.
6. Backups: add `DATABASE_URL` as a GitHub Actions secret.

## Backups

`.github/workflows/backup.yml` runs `pg_dump` daily and keeps each dump as a
workflow artifact for 90 days. It skips itself until the `DATABASE_URL` secret
exists. To restore:
`pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" archive.dump`.
The JSON export (Settings → Export) is the portable copy.
