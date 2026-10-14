# Data model

Source of truth: `packages/schemas/src/` (Zod). The Postgres tables
(`apps/admin/src/server/db/schema.ts`, see `docs/backend.md`) map to these shapes;
the export file format and `/api/v1` responses depend on them.

## Kinds and ids

| Kind   | `MediaType` | Provider id                                                             | Notes                                           |
| ------ | ----------- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| Movie  | `movie`     | TMDB movie id                                                           |                                                 |
| Show   | `show`      | TMDB tv id                                                              | seasons by `seasonNumber` (0 = specials)        |
| Game   | `game`      | IGDB game id                                                            |                                                 |
| Book   | `book`      | numeric part of the Open Library **work** id (`OL21464434W` → 21464434) | a book is the work; editions listed on its page |
| Record | `record`    | Discogs **release** id (a specific pressing)                            | master id used for "other versions"             |
| Flight | —           | uuid                                                                    | own records, no provider                        |

## Logs (`log.ts`)

A log = one experience of a work. Many logs per work. Common: `rating?` (1–10),
`notes?`, `id/createdAt/updatedAt` when stored. Dates are optional everywhere;
missing = "Date unknown" (sorted last, excluded from per-year stats).

| `kind`   | Extra fields                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------- |
| `movie`  | `watchedAt?`, `rewatch`                                                                         |
| `show`   | whole show: `startedAt?`, `finishedAt?`, `rewatch`                                              |
| `season` | `seasonNumber`, `startedAt?`, `finishedAt?`, `rewatch`                                          |
| `game`   | `status` (playing/finished/completed=100%/paused/abandoned), `platform?`, `hoursPlayed?`, dates |
| `book`   | `status` (reading/finished/abandoned), `format?` (physical/ebook/audiobook), `reread`, dates    |
| `record` | a listening session: `playedAt?`                                                                |

`mediaTypeOf(log)` maps `season`/`show` → `show`. `logDate()` = watched/played date,
else finished, else started, else undefined.

## Library items, backlog

- `LibraryItem`: denormalized snapshot (title, subtitle, year, poster, genres,
  addedAt) saved when a work is **first logged**, so library screens render without
  providers. Only logged works are library items.
- `BacklogItem`: same shape, any kind. Logging a work or owning a record removes it.

## Collection (`collection.ts`)

`CollectionItem` = one physical copy of a record (you can own several of a release):
`mediaCondition?`/`sleeveCondition?` (Goldmine: M, NM, VG+, VG, G+, G, F, P),
`variant?`, `acquiredAt?`, `price?` ({amount, currency}), `store?`, `notes?`,
`rating?`, `folder?`, `discogsInstanceId?` (makes Discogs re-imports idempotent),
plus a release snapshot (title, artist, label, catno, format, cover…).

## Flights (`flight.ts`)

`from`/`to` IATA, `departure`/`arrival?` as **local** `YYYY-MM-DDTHH:mm`,
`flightNumber?` (e.g. `G32054`), `airline?`, `aircraft?`, `registration?`, `seat?`,
`cabin?`, `reservation?`, `notes?`. Distance and duration are derived from
`public/data/airports.json` (coords + IANA tz) in `lib/flight-math.ts`; nothing
derived is stored.

## Images

`ImageRef = { provider: "tmdb" | "igdb" | "discogs" | "openlibrary", path }`.
URLs are built at render time with size presets (`lib/images.ts`). Discogs paths
are full signed URLs; Open Library uses cover ids (`author:<id>` for author photos).

## Export format

`ArchiveExport` v1: `{ version: 1, exportedAt, items, logs, backlog, collection, flights }`.
Newer arrays default to `[]`, so older exports still import. Settings → Import and
`db:seed` **replace** the archive (not accounts/API keys). The Obsidian importer
produces this same format.
