# Providers

All calls happen server-side (`apps/admin/src/server/*.server.ts`). Env vars in
`apps/admin/.env` (see `.env.example`).

## TMDB — movies & shows (`TMDB_READ_TOKEN`, optional `TMDB_LANGUAGE`)

- Bearer token. Details use `append_to_response`: movies
  `credits,videos,recommendations`; shows `external_ids,aggregate_credits,videos,recommendations`.
- Videos are filtered by `language`; pass `include_video_language=<lang>,en,null`.
- Collections: `/collection/{id}`. Trending: `/trending/{movie|tv}/week`.
- Ratings are 0–10 → shown as 0–5.

## IGDB — games (`IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET`)

- Twitch client-credentials token (~60 days), cached in memory; retried on 401.
- Apicalypse POST bodies; escape quotes in user input. ~4 requests/second.
- `game_time_to_beats` (hastily/normally/completely, seconds) for time-to-beat.
- Popular: `popularity_primitives` (popularity_type 1 = visits) → noisy list
  (Roblox etc.); fallback = most-rated releases of the last year. Owner was asked
  whether to switch to "want to play" or "best recent" — undecided.
- Search returns DLCs/seasons with the same name; prefer `game_type = 0`.

## Discogs — records (`DISCOGS_TOKEN`)

- Personal token header `Discogs token=…` plus a User-Agent; **60 requests/minute**.
- Username comes from `/oauth/identity`. Collection: `/users/{u}/collection/folders/0/releases`
  (+ `/fields` for custom fields like Media/Sleeve Condition, `/folders`, `/value`).
- Release: credits (`extraartists`), companies, identifiers (barcode, matrix/runout),
  notes, videos, community have/want/rating, lowest price. Master + `/versions` for
  original year and other pressings.
- No trending endpoint; public "last sold/median/high" prices aren't in the API.
- Artist/label names may end in ` (2)` (disambiguation) — strip it.

## Open Library — books (no key)

- `search.json` (title/author or `isbn=`), `/works/{id}.json`, `/works/{id}/editions.json`,
  `/ratings.json`, `/bookshelves.json`, `/authors/{id}.json`, `/isbn/{isbn}.json`,
  `/trending/weekly.json`. Covers: `covers.openlibrary.org/b/id/{id}-{S|M|L}.jpg`.
- Data is sparse for many books (no description); Brazilian editions are often
  missing. Language codes are MARC; mapped with `Intl.DisplayNames`.
- Google Books fills missing descriptions only when `GOOGLE_BOOKS_KEY` is set —
  keyless requests get HTTP 429.

## Airports & airlines (flights)

- `public/data/airports.json`: ~7.9k airports with IATA, city, country, lat/lon,
  IANA timezone, built from mwgg/Airports (MIT) by `scripts/build-airports.mjs`.
  Its "city" is the municipality (NAT → "Sao Goncalo Do Amarante").
- Airline logos: `https://pics.avs.io/120/40/{IATA}.png` by flight-number prefix,
  falling back to the airline name.
- Flight-number autofill (AeroDataBox etc.) is not implemented (paid tier).
