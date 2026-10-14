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

## Google Books — books (`GOOGLE_BOOKS_KEY`, required)

- Google Cloud project → enable **Books API** → API key. Keyless requests get
  HTTP 429. ~1,000 requests/day on the free quota.
- `GET /volumes?q=…` (search; `inauthor:`, `subject:`, `inpublisher:`, `isbn:`
  operators, `langRestrict`, `orderBy=newest`, `printType=books`, up to 40 results)
  and `GET /volumes/{id}`. A volume is an **edition** (translations are separate
  volumes); ids are strings (`zyTCAlFPjgYC`), so book ids are strings everywhere.
- Descriptions come as light HTML → `plainText()`. Categories like
  "Fiction / Science Fiction / General" are split into parts.
- Covers: `books.google.com/books/content?id={id}&printsec=frontcover&img=1&zoom=1&fife=w{width}`
  returns any width up to ~800px without a key. Only volumes with `imageLinks`
  get a cover (otherwise Google serves an "image not available" placeholder).
- No trending endpoint: the search page shows newest fiction instead.

## Search filters (`src/lib/search-filters.ts`)

- TMDB: text search only supports a year, so other filters narrow the first 3
  result pages (genre ids, original language, vote average). Without text,
  `/discover/{movie|tv}` takes everything: genres, release date range,
  `vote_average.gte` (+ `vote_count.gte=200`), runtime, original language,
  `with_watch_providers` + `watch_region` (`TMDB_WATCH_REGION`, default `BR`),
  show status, sort. Watch providers: `/watch/providers/{movie|tv}?watch_region=…`.
- IGDB: `search` and `where` combine (platforms, genres, themes, game_modes,
  first_release_date range, total_rating, `game_type` = main/remake/remaster/
  expanded/port unless "include DLC"). `sort` only works without `search`.
- Discogs `/database/search`: q, artist, label, genre, style, country, year,
  format (Vinyl by default).
- Genre/theme/mode/platform ids are stable and listed as constants.

## Airports & airlines (flights)

- `public/data/airports.json`: ~7.9k airports with IATA, city, country, lat/lon,
  IANA timezone, built from mwgg/Airports (MIT) by `scripts/build-airports.mjs`.
  Its "city" is the municipality (NAT → "Sao Goncalo Do Amarante").
- Airline logos: `https://pics.avs.io/120/40/{IATA}.png` by flight-number prefix,
  falling back to the airline name.
- Flight-number autofill (AeroDataBox etc.) is not implemented (paid tier).
