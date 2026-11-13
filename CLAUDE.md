# guilhermevictor.me

Monorepo for the owner's personal apps; `packages/ui` is the design system they are
meant to share (the site does not use it yet):

- `apps/archive`: the archive PWA (below). Most of this file is about it.
- `apps/site`: the public personal website at guilhermevictor.me (Next.js, next-intl,
  MDX writing, Last.fm + Discogs). Merged in with its full git history; keeps its own
  Prettier style (semicolons, single quotes) and env vars (`apps/site/.env.example`).

## Archive

Personal archive: one place to own and log everything the owner watches, plays,
reads, collects and flies — movies, shows (per season; a show's rating is its seasons' average), games,
books, vinyl records and flights. Replaces Letterboxd/IMDb-style services: the
data must stay fully owned and portable (export/import as JSON at any time).

Current phase: **deployed**. The archive PWA stores everything in Postgres
(Drizzle) through server functions, with Better Auth (GitHub + passkeys, single
user). One table per kind (movies, shows, games, books, records = one row per copy)
with the provider details in a `data` column, one log table per kind, flights.
Deployed at archive.guilhermevictor.me (Vercel + Neon, see `docs/backend.md`);
the Obsidian vault is imported with `import-obsidian` → `db:seed`. Details in `docs/`.

## Commands

```bash
pnpm install
docker compose up -d                       # local Postgres on :5433
pnpm --filter archive db:migrate           # apply migrations (db:generate after schema edits)
pnpm --filter archive db:seed <export.json>  # load a v2 export (--replace to overwrite)
pnpm --filter archive db:studio            # browse the tables in the browser
pnpm --filter archive db:backfill-details  # store provider details for works missing them
pnpm --filter archive import-obsidian ../../References  # vault → References/.import/
pnpm dev                                   # archive app on http://localhost:3000 (LAN too)
pnpm dev:site                              # website on http://localhost:3001
pnpm typecheck                             # all packages (turbo)
pnpm lint
pnpm --filter archive build
pnpm --filter archive exec tsr generate    # regenerate routeTree.gen.ts after adding routes
pnpm --filter archive build-airports       # rebuild public/data/airports.json
pnpm --filter archive build-aircraft       # rebuild public/data/aircraft.json (ICAO types)
pnpm dlx shadcn@latest add <name> -c apps/archive        # UI components → packages/ui
```

Run `prettier --write`, `tsc --noEmit` and `pnpm lint` before calling work done
(lint uses `@tanstack/eslint-config`, which flags unnecessary assertions/conditions).

## Repo map

```
apps/archive/        TanStack Start PWA
  src/routes/        file-based routes (movies, shows/$id/seasons/$season, games, books,
                     records, flights, search, backlog, settings)
  src/server/        *.server.ts provider clients + media.functions.ts (createServerFn RPCs)
                     archive.server.ts (Postgres repo), archive.functions.ts, auth.server.ts,
                     auth.functions.ts (requireOwner), db/ (Drizzle schema + client)
  src/routes/api/    auth/$ (Better Auth handler)
  src/lib/repo/      ArchiveRepository interface, remoteRepository, derive.ts (stats/library)
  drizzle/           SQL migrations (generated)
  src/lib/           media-kinds.ts (kind registry), images, flight-math, airports, format…
  src/queries/       TanStack Query options/mutations (media.ts = providers, archive.ts = repo)
  src/components/    app components (detail-layout, log/, media/, records/, flights/, form/)
  scripts/           seed.ts, backfill-details.ts, build-airports.mjs, build-aircraft.mjs,
                     import-obsidian.ts (vault → export v2)
  public/            sw.js (hand-written), manifest, icons, data/airports.json
apps/site/           Next.js personal website (guilhermevictor.me)
packages/schemas/    Zod schemas = the data contract (shared with the future API)
packages/ui/         shadcn/ui on Base UI (import as @workspace/ui/components/*)
References/          owner's Obsidian vault export — GITIGNORED, private (see rules)
.claude/skills/      Emil Kowalski design skills (mobile-native, emil-design-eng, animate…)
docs/                project documentation (start at docs/README.md)
```

## Rules that matter

- **Never commit anything from or derived from `References/`** (notes, import output,
  screenshots of imported data). Before every commit, review `git status` untracked
  files — don't blindly `git add -A`. Keep test artifacts in the session scratchpad
  with absolute paths.
- **New env vars go in `turbo.json` (`tasks.build.env`)**. Turbo runs in strict env
  mode: undeclared vars never reach `turbo build`, so they are missing on Vercel.
- **Never read `.env` or `.env.local` in any app** (`vercel env pull` writes
  `.env.local`). API keys live there and are only used inside
  `*.server.ts` / `createServerFn`. `.env.example` lists the variables.
- The owner may be running `pnpm dev` on port 3000 with real keys. Don't kill it;
  run your own server on another port (`pnpm exec vite dev --port 3005 --strictPort`).
- Commit/push only when asked. Commit messages end with the Co-Authored-By line.
- Repo: `github.com/guivictorr/guilhermevictor.me` (public), branch `main`.

## Conventions

- **Kinds are centralized** in `src/lib/media-kinds.ts` (`KINDS`, `KIND_ORDER`,
  `LIBRARY_SECTIONS`). Adding a `MediaType` makes TypeScript flag every place that
  needs handling — follow the errors. See `docs/architecture.md#adding-a-kind`.
- UI talks to data only through `src/queries/*` → `repo` → server functions. Every
  server function must use the `requireOwner` middleware (route guards are only UX).
- Loading and writes follow `docs/data-fetching.md`: loaders prefetch, sections use
  `useSuspenseQuery` in `<SuspenseSection>` with real-size skeletons, mutations are
  optimistic (fire `mutate` and move on, no success toast; failures roll back and
  toast with Retry) and invalidate only the keys they touch.
- Logging from outside a detail page goes through `openLog(item)` / `useOpenLog()`
  (new log) or `openLogs(item)` (your logs, tap to edit) in
  `components/log/log-host.tsx`: one sheet mounted in the root, no navigation.
- Detail RPCs go through `liveOrStored()` (details.server.ts): provider first, stored
  copy as fallback. Works entering the archive get `ensureDetails()`.
- Provider responses are normalized at the edge into `@workspace/schemas` types;
  images are stored as `{ provider, path }`, never full URLs (except Discogs, whose
  URLs are signed).
- Ratings are integers 1–10 (shown as 0.5–5 stars). Log dates are optional
  ("Date unknown"). Flight times are local to each airport (`YYYY-MM-DDTHH:mm`).
- Search params: the router parses numeric-looking values as numbers — use
  `z.coerce.string()` for free text (ISBNs, "1984").
- **Before any front-end work, read `docs/design.md`** (brand, color, type, motion,
  component rules) and the skills and articles it lists. Every app follows
  `docs/web-interface-guidelines.md`; shared components are planned in
  `docs/design-system.md` (Base UI is the only primitive layer).
- Native feel: bottom sheets via `ResponsiveSheet`, press feedback `pressable`,
  safe-area utilities (`pt-safe`, `px-safe`, `pb-tab-bar`), hover only under
  `(hover: hover)`, inputs ≥16px. See `docs/ui.md`.
- Match surrounding code style: Prettier defaults (no semicolons, double quotes),
  `Array<T>` generics, small comments explaining _why_.

## Testing

No test suite yet. Verify with typecheck + lint + build, then drive the real UI with
headless Chromium (Playwright browsers are installed under
`~/.cache/ms-playwright/chromium-*/`; use `playwright-core` from the scratchpad).
For provider-dependent screens without keys, point a temporary env override at a
local mock server — and **revert the override before finishing**.

Signed-in testing without GitHub: run your server with env overrides
(`DATABASE_URL`, `BETTER_AUTH_*`, `OWNER_EMAIL`), create a user + session with
`auth.$context` → `internalAdapter.createSession()`, and send the cookie
`better-auth.session_token=<token>.<base64 HMAC-SHA256(secret, token)>`.
Afterwards delete only the test user (`where email = '<test email>'`) and the
archive rows the test created; the owner's real account lives in the same DB.
