# Vision, decisions and roadmap

## Why this exists

The owner wants their history of movies, shows, games, books, records and flights
**in their own hands** instead of Letterboxd/IMDb/Goodreads: full control, export and
import anytime, move to any platform. Their personal website (Next.js, on Vercel) will
later read _public_ parts of this data; an AI assistant may later answer questions
about it. Until now the data lived in an Obsidian vault (one note per item).

## Decisions (with reasons)

| Topic               | Decision                                                                                                                                        | Why                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Admin app           | Separate app at **archive.guilhermevictor.me**, not inside the Next.js site                                                                     | Needs auth, offline, forms; the site stays a read-only consumer                            |
| Stack               | TanStack Start + Router/Query/Form/Table, shadcn/ui on **Base UI**, Tailwind v4, Zod                                                            | Owner wanted to try TanStack; Base UI for native-feeling primitives (Drawer, Combobox)     |
| Repo                | pnpm + Turborepo monorepo (`apps/admin`, `packages/schemas`, `packages/ui`)                                                                     | Schemas shared with the future API                                                         |
| Backend             | Postgres (Neon free tier) + Drizzle (standard `pg` driver), Better Auth (passkey/GitHub, single user, API-key plugin for the website)           | Budget **under $5/month**, managed now but **portable to a VPS** (no Vercel-only features) |
| API shape           | Server functions for the app; read-only `/api/v1/*` (API key) for the website, both inside the admin app                                        | One deployable; no separate API service                                                    |
| Hosting             | Vercel Hobby + Neon free (São Paulo), Nitro build that also runs as a plain Node server                                                         | $0/month; a VPS later is `pnpm start` behind a proxy                                       |
| Website access      | Private API key, called server-side only                                                                                                        | Data isn't public by default                                                               |
| Images              | Hotlink provider CDNs (TMDB/IGDB/Open Library/Discogs); store ids/paths only                                                                    | No R2 for now; can backfill later from stored ids                                          |
| Ratings             | 5 stars **with halves**, stored 1–10                                                                                                            | Avoids a migration if half stars change                                                    |
| Logs                | Many logs per work, each with its own rating/date                                                                                               | Rewatches and changing opinions are part of the history                                    |
| Dates               | Optional on every log                                                                                                                           | Imported history has no dates ("Date unknown")                                             |
| Shows               | Log per season **or** the whole show (`show` log)                                                                                               | Vault rates whole shows                                                                    |
| Backlog             | One global backlog for all kinds (no separate wishlist); logging/owning removes the item                                                        | Owner's call                                                                               |
| Records             | Collection of owned copies (Goldmine grades, price, store…), imported from Discogs once (re-runnable), then the archive owns it; plays are logs | Discogs is just metadata, like TMDB                                                        |
| Games time          | `hoursPlayed` is what the owner types; IGDB "time to beat" is only an estimate shown next to it                                                 | Vault `playtime` was a HowLongToBeat estimate → ignored                                    |
| Flights             | Own records (no provider), local times + airport timezones                                                                                      | Correct durations across timezones/DST                                                     |
| AI                  | Not in v1 (later: MCP server over the API)                                                                                                      | Scope                                                                                      |
| Obsidian categories | Import only Movies, Shows, Games, Books, Records, Flights. Videos, Websites, Places, Coding, Languages, People stay in Obsidian                 | Owner's call                                                                               |

## Status

Done (frontend phase):

- Movies, shows (+ seasons), games, books, records, flights — search, detail pages,
  logging, library (grid/table), backlog with "Surprise me", stats, JSON export/import
- Discogs collection import, Discogs-style release pages, Open Library books
- Flights with route map, boarding passes, timezone-aware durations
- PWA: manifest, icons, hand-written service worker, native-feel pass
- Obsidian import script → `References/.import/archive-import.json`

Done (backend phase, 2026-10-14; runs locally, see `docs/backend.md`):

- Postgres + Drizzle schema and migrations; server-function repository replacing
  localStorage; lossless round trip of the Obsidian import (`db:seed`)
- Better Auth: GitHub + passkeys, single owner (`OWNER_EMAIL`), sessions, CSRF check
- Read-only `/api/v1` for the website with API keys managed in Settings
- Nitro build (Vercel or plain Node), daily `pg_dump` GitHub Action

Next:

1. **Deploy**: Neon + Vercel + GitHub OAuth app + domain (checklist in
   `docs/backend.md`), then seed production and create the website's API key.
2. Website: read `/api/v1` from the Next.js site.

Later ideas (agreed or discussed): Stremio addon (add/log from Stremio), MCP server
for AI questions, Steam import for real hours played, barcode scanning (ISBN,
vinyl), Discogs value per condition, AeroDataBox flight-number autofill, a
Google Books key for missing book descriptions, home/search/stats redesign (owner is
collecting reference designs).

## Open questions

- None right now. Decided 2026-10-14: subdomain `archive.guilhermevictor.me`;
  imported games without a status stay **Finished**.
