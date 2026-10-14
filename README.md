# Archive

Personal archive of movies, shows (per season) and games — my data, fully portable.

**Phase 1 (current):** Admin PWA frontend. Searches and reads TMDB + IGDB; logs are stored in the
browser (`localStorage`) behind a repository interface until the API + DB exist.

## Structure

```
apps/admin          TanStack Start PWA (Router, Query, Form, Table) + shadcn/ui (Base UI) + Tailwind v4
packages/schemas    Zod domain schemas (media, logs, export format) — shared with the future API
packages/ui         shadcn/ui components (Base UI primitives)
```

Key seams in `apps/admin/src`:

- `server/*.server.ts` — TMDB/IGDB clients + normalizers (API keys never reach the browser)
- `server/media.functions.ts` — `createServerFn` RPCs used by the UI
- `lib/repo/` — `ArchiveRepository` interface; `localRepository` today, API client next
- `queries/` — TanStack Query options and mutations
- `public/sw.js` — hand-written service worker (online-first, caches pages and poster images)

## Setup

```bash
pnpm install
cp apps/admin/.env.example apps/admin/.env   # fill in TMDB + IGDB (Twitch) credentials
pnpm dev                                     # http://localhost:3000 (also on your LAN IP)
```

| Variable             | Where to get it                                                     |
| -------------------- | ------------------------------------------------------------------- |
| `TMDB_READ_TOKEN`    | TMDB → Settings → API → "API Read Access Token"                     |
| `TMDB_LANGUAGE`      | Optional, defaults to `en-US` (e.g. `pt-BR`)                        |
| `IGDB_CLIENT_ID`     | dev.twitch.tv → Console → Applications                              |
| `IGDB_CLIENT_SECRET` | Same Twitch application                                             |

## Scripts

```bash
pnpm dev          # admin dev server
pnpm build        # production build
pnpm typecheck    # all packages
pnpm lint
pnpm --filter admin generate-pwa-assets   # regenerate icons from public/icon.svg
```

## Adding UI components

```bash
pnpm dlx shadcn@latest add <component> -c apps/admin
```

Components land in `packages/ui/src/components` and are imported from `@workspace/ui/components/*`.

## Design notes

Project-level design skills from Emil Kowalski live in `.claude/skills` (`mobile-native`,
`emil-design-eng`, `animate`, `break-ui`, …). Test native feel on a real phone: the service
worker only registers in production builds, and "Add to Home Screen" needs HTTPS.
