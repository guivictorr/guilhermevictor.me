# Architecture (admin app)

## Layers

```
routes/*  ──►  queries/*  ──►  lib/repo (ArchiveRepository)  ──►  localStorage  (today)
   │                                                         └──►  API client     (next phase)
   └──►  queries/media.ts  ──►  server/media.functions.ts (createServerFn)
                                   └──► server/*.server.ts (TMDB, IGDB, Discogs, Open Library)
```

- **Provider data** (catalog info) is fetched only on the server through
  `createServerFn` RPCs in `src/server/media.functions.ts`. API keys never reach the
  browser. `*.server.ts` files are import-protected server-only modules. Each client
  normalizes raw payloads into `@workspace/schemas` types.
- **Archive data** (logs, backlog, collection, flights) goes through the
  `ArchiveRepository` interface (`src/lib/repo/types.ts`). `localRepository` stores one
  JSON blob under `localStorage["archive:v1"]`, validated with Zod on read; unreadable
  data is copied to `archive:v1:corrupt:<ts>` instead of being wiped, and `migrate()`
  upgrades old shapes (e.g. game status `dropped` → `abandoned`).
- **Queries**: `queryOptions` factories. Provider data has a long `staleTime`;
  detail routes prefetch it in loaders (`ensureQueryData`) so pages SSR with data.
  Repo queries are client-only (never prefetched in loaders) and every mutation
  invalidates `["archive"]`. `indexQuery` gives Sets of `type:id` keys for ✓/backlog
  badges.
- **SSR + Query** via `@tanstack/react-router-ssr-query`. Trending lists are
  prefetched in the search loader (server-rendered first paint) and cached in memory
  on the server for 6h (`server/cache.server.ts`).
- **Env**: `vite.config.ts` copies non-`VITE_` vars from `.env` into `process.env`;
  `server/env.server.ts` validates per provider (a missing key only breaks that
  provider). `GOOGLE_BOOKS_KEY` is optional.

## Kind registry

`src/lib/media-kinds.ts` is the single source for per-kind UI facts: labels, icon,
library route, cover aspect (posters 2:3, records square), provider name.
`LIBRARY_SECTIONS` adds Flights (not a `MediaType`: no search/backlog/provider).
Navigation, library chips, home tiles and stats iterate these.

### Adding a kind

1. `packages/schemas`: add to `MediaType`, add the detail schema (media.ts), the log
   input/stored schemas + union members (log.ts), image provider if new.
2. `src/server/<provider>.server.ts` + server fns in `media.functions.ts`
   (search, details, trending); queries in `queries/media.ts`.
3. `src/lib/media-kinds.ts` entry; `src/lib/images.ts` URL builder if new provider.
4. Run `tsc` and fix every error it reports (library view, stats, repo counters,
   search tabs, `MediaLink` routes, log sheet target, log history badges…).
5. Routes: `routes/<kind>/index.tsx` (copy movies, uses `LibraryView`) and
   `routes/<kind>/$id.tsx` (use `DetailHero` + `DetailBody` + `LogSheet`), then
   `tsr generate`.
6. Log form in `components/log/log-forms.tsx` + case in `log-sheet.tsx`.
7. Service worker: add the image origin to `IMAGE_ORIGINS` and bump `VERSION`.
8. Importer: map the vault category in `scripts/import-obsidian.ts` if applicable.

## Routes

`/` home · `/search?type&q` · `/movies|shows|games|books|records|flights` (+ `/$id`)
· `/shows/$id/seasons/$season` · `/backlog` · `/stats` · `/settings`.
Library pages share `?view=grid|table` (defaults stripped from URLs).
Mobile tab bar: Home · Library · Backlog · Stats · Search; Library pages switch kinds
with chips (`LibraryNav`). Desktop: sidebar with a Library section.

## PWA

- `public/sw.js` is hand-written: `vite-plugin-pwa` 2.0 doesn't emit a worker for
  TanStack Start's multi-environment build. Strategy: network-first for pages and
  `/_serverFn/*`, cache-first for `/assets/*`, `/data/*` and provider images.
  **Bump `VERSION`** when changing it. It only registers in production builds.
- Icons generated from `public/icon.svg` (`pnpm --filter admin generate-pwa-assets`).
- "Add to Home Screen" needs HTTPS (Vercel preview or a tunnel) to test on a phone.

## Gotchas

- TanStack Table is **v9** (`useTable`, `tableFeatures`, `createSortedRowModel`) —
  v8 examples don't apply. The package ships skills under `node_modules/@tanstack/*/skills`.
- TanStack Start server functions use `.validator(zodSchema)`.
- shadcn here imports `cn` from the `cn` package inside `packages/ui`; app code uses
  `@workspace/ui/lib/utils`.
- `noUncheckedIndexedAccess` is on in `apps/admin`.
- Zod v4: don't `.extend()` a refined object — refine after extending
  (see `finishAfterStart` in log.ts).
