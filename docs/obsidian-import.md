# Obsidian import

The owner's vault export lives in `References/` (**gitignored, private**). It's the
source for seeding the archive: today via Settings → Import, later to seed the DB.

## Run

```bash
pnpm --filter admin import-obsidian ../../References
```

Writes `References/.import/`:

| File                  | Purpose                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `archive-import.json` | `ArchiveExport`, validated against `@workspace/schemas`          |
| `report.md`           | summary, "Needs review" list, all matches with confidence        |
| `overrides.json`      | owner's fixes: `"Note name.md": <provider id>` or `null` to skip |
| `cache.json`          | match cache; delete entries to re-match them                     |

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
- Books: matched by ISBN via Open Library (exact), else title + author.
- Records: release id from `source`; release details fetched from Discogs when a
  token is set; `price` assumed **BRL**; note body → copy notes.
- Flights: imported as-is; diverted flights list `[from, landed, planned]` → `to`
  is where it landed, body kept as notes.
- Only logged works become library items; backlog-only works live in the backlog.

## Matching

TMDB/IGDB search by cleaned title + year; confidence `high` (same title, same year),
`medium` (title match, year ±1, or partial title same year), `low`. Original titles
count (Brazilian films). Vault "movies" that are series switch to TV only when TV
clearly wins. Games prefer main games over DLC. File-name years like
`The Batman (2022).md` are used when the note has no year.

Last run: 494 items, 497 logs, 220 backlog, 47 records, 18 flights; 43 notes to
review (mostly correct ±1-year matches; real misses are 8 Brazilian book editions,
2 Love Death & Robots episodes, a few games).
