# Vision, decisions and roadmap

## Why this exists

The owner wants their history of movies, shows, games, books, records and flights
**in their own hands** instead of Letterboxd/IMDb/Goodreads: full control, export and
import anytime, move to any platform. Their personal website (Next.js, on Vercel) will
later read _public_ parts of this data; an AI assistant may later answer questions
about it. Until now the data lived in an Obsidian vault (one note per item).

## Decisions (with reasons)

| Topic                | Decision                                                                                                                                        | Why                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Admin app            | Separate app at **archive.guilhermevictor.me**, not inside the Next.js site                                                                     | Needs auth, offline, forms; the site stays a read-only consumer                            |
| Stack                | TanStack Start + Router/Query/Form/Table, shadcn/ui on **Base UI**, Tailwind v4, Zod                                                            | Owner wanted to try TanStack; Base UI for native-feeling primitives (Drawer, Combobox)     |
| Repo                 | pnpm + Turborepo monorepo (`apps/admin`, `packages/schemas`, `packages/ui`)                                                                     | Schemas shared with the future API                                                         |
| Backend (next phase) | Postgres (Neon free tier) + Drizzle (standard `pg` driver), Better Auth (passkey/GitHub, single user, API-key plugin for the website)           | Budget **under $5/month**, managed now but **portable to a VPS** (no Vercel-only features) |
| Website access       | Private API key, called server-side only                                                                                                        | Data isn't public by default                                                               |
| Images               | Hotlink provider CDNs (TMDB/IGDB/Open Library/Discogs); store ids/paths only                                                                    | No R2 for now; can backfill later from stored ids                                          |
| Ratings              | 5 stars **with halves**, stored 1–10                                                                                                            | Avoids a migration if half stars change                                                    |
| Logs                 | Many logs per work, each with its own rating/date                                                                                               | Rewatches and changing opinions are part of the history                                    |
| Dates                | Optional on every log                                                                                                                           | Imported history has no dates ("Date unknown")                                             |
| Shows                | Log per season **or** the whole show (`show` log)                                                                                               | Vault rates whole shows                                                                    |
| Backlog              | One global backlog for all kinds (no separate wishlist); logging/owning removes the item                                                        | Owner's call                                                                               |
| Records              | Collection of owned copies (Goldmine grades, price, store…), imported from Discogs once (re-runnable), then the archive owns it; plays are logs | Discogs is just metadata, like TMDB                                                        |
| Games time           | `hoursPlayed` is what the owner types; IGDB "time to beat" is only an estimate shown next to it                                                 | Vault `playtime` was a HowLongToBeat estimate → ignored                                    |
| Flights              | Own records (no provider), local times + airport timezones                                                                                      | Correct durations across timezones/DST                                                     |
| AI                   | Not in v1 (later: MCP server over the API)                                                                                                      | Scope                                                                                      |
| Obsidian categories  | Import only Movies, Shows, Games, Books, Records, Flights. Videos, Websites, Places, Coding, Languages, People stay in Obsidian                 | Owner's call                                                                               |

## Status

Done (frontend phase, all persisted in `localStorage`):

- Movies, shows (+ seasons), games, books, records, flights — search, detail pages,
  logging, library (grid/table), backlog with "Surprise me", stats, JSON export/import
- Discogs collection import, Discogs-style release pages, Open Library books
- Flights with route map, boarding passes, timezone-aware durations
- PWA: manifest, icons, hand-written service worker, native-feel pass
- Obsidian import script → `References/.import/archive-import.json`

Next:

1. **API + DB + hosting plan** (Postgres/Neon, Drizzle, Better Auth, API key for the
   website, deploy, backups via `pg_dump` to e.g. a private repo/GitHub Action).
2. Replace `localRepository` with an API-backed `ArchiveRepository`.
3. Seed the DB from `archive-import.json` (after resolving the import review list).

Later ideas (agreed or discussed): Stremio addon (add/log from Stremio), MCP server
for AI questions, Steam import for real hours played, barcode scanning (ISBN,
vinyl), Discogs value per condition, AeroDataBox flight-number autofill, a
Google Books key for missing book descriptions, home/search/stats redesign (owner is
collecting reference designs).

## Open questions

- None right now. Decided 2026-10-14: subdomain `archive.guilhermevictor.me`;
  imported games without a status stay **Finished**.
