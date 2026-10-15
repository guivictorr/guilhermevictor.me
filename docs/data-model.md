# Data model

Source of truth: `packages/schemas/src/` (Zod). The Postgres tables
(`apps/admin/src/server/db/schema.ts`, see `docs/backend.md`) map to these shapes;
the export file format depends on them.

## Kinds and ids

| Kind   | `MediaType` | Provider id                                           | Notes                                       |
| ------ | ----------- | ----------------------------------------------------- | ------------------------------------------- |
| Movie  | `movie`     | TMDB movie id                                         |                                             |
| Show   | `show`      | TMDB tv id                                            | seasons by `seasonNumber` (0 = specials)    |
| Game   | `game`      | IGDB game id                                          |                                             |
| Book   | `book`      | Google Books **volume** id, a string (`zyTCAlFPjgYC`) | an edition; translations are separate books |
| Record | `record`    | Discogs **release** id (a specific pressing)          | master id used for "other versions"         |
| Flight | —           | uuid                                                  | own records, no provider                    |

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

- `LibraryItem`: what library screens show (title, subtitle, year, poster, genres),
  built from the work's row. Only works with logs appear in the library.
- `BacklogItem`: same shape, any kind; a work row with `backlog_added_at` set.
  Logging a work or owning a record removes it from the backlog.
- Record plays (`kind: "record"`) carry `copyId`, the owned copy that was played.

## Collection (`collection.ts`)

`CollectionItem` = one physical copy of a record, i.e. a row in `records` (you can
own several of a release, each its own row):
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

`ImageRef = { provider: "tmdb" | "igdb" | "discogs" | "googlebooks", path }`.
URLs are built at render time with size presets (`lib/images.ts`). Discogs paths
are full signed URLs; Google Books paths are volume ids. Work ids are `WorkId`
(number, or string for books).

## Export format

`ArchiveExport` v2 (`archive.ts`): `{ version: 2, exportedAt, movies, shows, games,
books, records, logs, flights }`. Each work row carries its provider `data`, so an
export is self-contained. Settings → Import and `db:seed` **replace** the archive
(never your account). `LegacyArchiveExport` (v1, pre-database) is only read for
data left in the browser. The Obsidian importer writes v2 (without `data`; run
`db:backfill-details` after seeding).
