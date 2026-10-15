# Obsidian import

The owner's vault export lives in `References/` (**gitignored, private**). It's the
source for seeding the archive.

## Run

```bash
cd apps/admin
pnpm import-obsidian ../../References                     # writes References/.import/
pnpm db:seed ../../References/.import/archive-import.json  # empty archive (or --replace)
pnpm db:backfill-details                                  # provider details for every work
```

For production, prefix the last two with `DATABASE_URL='<Neon direct URL>'`, or
upload the JSON in Settings → Import and run the backfill afterwards.

Writes `References/.import/`:

| File                  | Purpose                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| `archive-import.json` | `ArchiveExport` v2, validated against `@workspace/schemas`                                        |
| `report.md`           | summary, "Needs review" list, all matches with confidence                                         |
| `overrides.json`      | owner's fixes: `"Note name.md": <id>`, `{ "id": <tmdb tv id>, "type": "show" }` or `null` to skip |
| `cache.json`          | match cache; delete entries to re-match them                                                      |

First run ~8 min (IGDB rate limit); cached re-runs ~2 min. The script loads
`apps/admin/.env` itself.

## Vault format

One note per item; all data in YAML frontmatter; `categories` (a wikilink like
`"[[Movies]]"`, as a list or scalar) gives the kind. Values are mostly wikilinks
(`"[[Gol]]"`). File names replace `:`, `'`, `?` with `_`. Notes also have Windows
`:Zone.Identifier` sidecar files (ignored).

| Category | Count | Useful fields                                                                                  |
| -------- | ----- | ---------------------------------------------------------------------------------------------- |
| Movies   | 348   | title (often only the file name), year, rating, score, genre, director, cast, tags             |
| Games    | 319   | title, year, rating, platforms, companies, playtime (HLTB estimate), tags                      |
| Records  | 47    | `source` = Discogs release URL, artists, label, price, store, body = purchase story            |
| Books    | 38    | title, author, isbn, pages, language, rating, tags; body = publisher blurb                     |
| Shows    | 22    | year, rating (whole show), start/end (rare), tags                                              |
| Flights  | 18    | `loc` [from, to] IATA, code, aircraft, companies, seat, reservation, departure/arrival (local) |

Also present but **not imported** (stay in Obsidian): Videos, Websites, Coding,
Places, Languages, People.

## Rules

- `rating` 0/empty = unrated; 0–5 with halves → stored ×2.
- No `start`/`end` → log with unknown date.
- `tags: backlog` or `wishlist` → Backlog (no separate wishlist).
- Movies: rated or untagged → one movie log. Shows: whole-show log.
- Games: untagged or rated → log with status **finished** (vault has no status;
  confirmed by the owner). `playtime` ignored.
- Books: Google Books volume by ISBN (exact), else free-text title + author (at
  best medium). Google Books is flaky (503s, empty results for the same query),
  so searches retry before giving up; `inauthor:"…"`-style filters find far
  less than free text. Book matches are cached under `googlebooks:<file>`.
- Records: release id from `source`; release details fetched from Discogs when a
  token is set; `price` assumed **BRL**; note body → copy notes.
- Flights: the direction comes from the note name ("GRU to LIS (ABC123).md"),
  because `loc` isn't in flight order (often alphabetical). Diverted flights are
  named "GRU to LIS -> OPO (…)": `to` is the last code, where it landed. `loc` is
  only a fallback (flagged in the report). Body kept as notes.
- A work row is written when it's logged or in the backlog (`backlogAddedAt`).
  Rows have no `data`; `db:backfill-details` fetches it.

## Matching

TMDB/IGDB search by cleaned title + year; confidence `high` (same title, same year),
`medium` (title match, year ±1, or partial title same year), `low`. Original titles
count (Brazilian films). Vault "movies" that are series switch to TV only when TV
clearly wins. Games prefer main games over DLC. File-name years like
`The Batman (2022).md` are used when the note has no year.

Provider data wins over the vault for titles and years (books included: a volume
is the edition, so its title is the one you own). Episodes/finales filed as movies
become whole-show logs via `type: "show"` overrides. Book overrides from the Open
Library days (numbers) are reported as "stale override" and re-matched.

Last run (2026-10-14): 336 movies, 32 shows, 319 games, 34 books, 47 records,
502 logs, 18 flights. Books are a small part of the library; wrong or missing
ones are fixed by hand in the app (two notes are skipped with `null` overrides).
