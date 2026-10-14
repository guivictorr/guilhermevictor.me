/**
 * Obsidian → Archive import.
 *
 * Reads the vault notes (one note per item, data in YAML frontmatter),
 * matches them to TMDB / IGDB / Open Library / Discogs ids and writes an
 * JSON file in the legacy v1 export format. TODO: it must produce the v2
 * format (one array per table) before it can be imported again.
 *
 *   pnpm --filter admin import-obsidian ../../References
 *
 * Writes into <vault>/.import/ (inside the gitignored vault folder):
 *   archive-import.json  the export
 *   report.md            what matched, what's uncertain, what was skipped
 *   overrides.json       your fixes: { "Note name.md": providerId | null }
 * Re-run after editing overrides.json; matching results are cached in
 * cache.json so re-runs are fast and only new/changed notes hit the APIs.
 *
 * Import rules (agreed with the owner):
 * - rating 0/empty = unrated; ratings are 0–5 (halves) → stored ×2.
 * - no start/end → the log's date is unknown.
 * - games: `playtime` is a HowLongToBeat estimate → ignored.
 * - shows: rating is for the whole show → "show" log.
 * - tags backlog / wishlist → Backlog.
 * - only Movies, Shows, Games, Books, Records and Flights are imported.
 */
import { existsSync } from "node:fs"
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { LegacyArchiveExport } from "@workspace/schemas"
import type {
  BacklogItem,
  CollectionItem,
  Flight,
  ImageRef,
  LibraryItem,
  LogEntry,
  MediaType,
} from "@workspace/schemas"

// ---------------------------------------------------------------- setup

const vault = path.resolve(process.argv[2] ?? "../../References")
const outDir = path.join(vault, ".import")
const envFile = path.resolve(import.meta.dirname, "../.env")
if (existsSync(envFile)) process.loadEnvFile(envFile)

const env = (key: string) => process.env[key]?.trim() || undefined
const now = new Date().toISOString()
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------- frontmatter

type Frontmatter = Record<string, string | Array<string>>
type Note = { file: string; fm: Frontmatter; body: string }

/** Minimal YAML frontmatter reader for Obsidian properties (scalars + lists). */
function parseNote(file: string, text: string): Note | undefined {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return undefined
  const fm: Frontmatter = {}
  let key: string | undefined
  for (const line of match[1]!.split(/\r?\n/)) {
    const item = line.match(/^\s+-\s*(.*)$/)
    if (item && key) {
      const list = fm[key]
      fm[key] = [
        ...(Array.isArray(list) ? list : list ? [list] : []),
        unquote(item[1]!),
      ]
      continue
    }
    const pair = line.match(/^([^\s:][^:]*):\s*(.*)$/)
    if (pair) {
      key = pair[1]!.trim()
      fm[key] = pair[2] ? unquote(pair[2]) : []
    }
  }
  return { file, fm, body: match[2]!.trim() }
}

const unquote = (v: string) =>
  v
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .replace(/^'(.*)'$/, "$1")
/** "[[Gol]]" → "Gol"; "[[SQL|Label]]" → "Label". */
const unlink = (v: string) =>
  v.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b ?? a)
const list = (v: Frontmatter[string] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : [])
    .map(unlink)
    .map((s) => s.trim())
    .filter(Boolean)
const scalar = (v: Frontmatter[string] | undefined) => {
  const value = Array.isArray(v) ? v[0] : v
  return value ? unlink(value).trim() || undefined : undefined
}
const isoDate = (v?: string) =>
  v && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : undefined
const yearOf = (v?: string) => (v && /^\d{4}$/.test(v) ? Number(v) : undefined)
/** 0–5 with halves → 1–10; 0 or empty means unrated. */
const rating = (v?: string) => {
  const n = Number(v)
  return v && n > 0 && n <= 5 ? Math.round(n * 2) : undefined
}
/**
 * Obsidian replaces ":", "'" and "?" in file names with "_"; undo the
 * common cases and drop a trailing "(2022)" disambiguator.
 */
const titleFromFile = (file: string) =>
  file
    .replace(/\.md$/, "")
    .replace(/\s*\(\d{4}\)$/, "")
    .replace(/_$/, "?")
    .replace(/_s\b/g, "'s")
    .replace(/_t\b/g, "'t")
    .replace(/_ /g, ": ")
    .replace(/_/g, "'")

/** Store-listing noise that breaks searches. */
const searchTitle = (title: string) =>
  title
    .replace(
      /\s*\((portuguese edition|em portugu[eê]s do brasil|\d{4})\)/gi,
      ""
    )
    .trim()

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

// ---------------------------------------------------------- matching

type Confidence = "exact" | "high" | "medium" | "low"
type Candidate = {
  id: number
  title: string
  /** Original-language title, so "Central do Brasil" matches "Central Station". */
  altTitles?: Array<string>
  year?: number
  poster?: ImageRef
  /** Tie-breaker among equally good matches (e.g. main game over DLC). */
  weight?: number
}
type Match = Omit<Candidate, "altTitles" | "weight"> & {
  confidence: Confidence
  /** A vault "movie" that TMDB knows as a TV show. */
  asShow?: boolean
}

/** Same title + same year = high; title or year ±1 = medium; else low. */
function pick(
  title: string,
  year: number | undefined,
  results: Array<Candidate>
): Match | undefined {
  const t = normalize(searchTitle(title))
  const scored = results.map((r) => {
    const titles = [r.title, ...(r.altTitles ?? [])].map(normalize)
    const sameTitle = titles.includes(t)
    const yearDiff = year && r.year ? Math.abs(year - r.year) : undefined
    const confidence: Confidence =
      sameTitle && yearDiff === 0
        ? "high"
        : (sameTitle && (yearDiff ?? 0) <= 1) ||
            (yearDiff === 0 &&
              titles.some((x) => x.includes(t) || t.includes(x)))
          ? "medium"
          : "low"
    const { altTitles: _alt, weight: _w, ...rest } = r
    return { ...rest, confidence, weight: r.weight ?? 0 }
  })
  const rank = { exact: 0, high: 1, medium: 2, low: 3 }
  const best = scored.sort(
    (a, b) => rank[a.confidence] - rank[b.confidence] || b.weight - a.weight
  )[0]
  if (!best) return undefined
  const { weight: _weight, ...match } = best
  return match
}

type Cache = Record<string, Match | null>
const cachePath = path.join(outDir, "cache.json")
const overridesPath = path.join(outDir, "overrides.json")

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T
  } catch {
    return fallback
  }
}

// TMDB --------------------------------------------------------------------
async function tmdb<T>(p: string, params: Record<string, string>) {
  const token = env("TMDB_READ_TOKEN")
  if (!token) throw new Error("TMDB_READ_TOKEN missing in apps/admin/.env")
  const url = new URL(`https://api.themoviedb.org/3${p}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`TMDB ${res.status} on ${p}`)
  return (await res.json()) as T
}

/**
 * `year` scores the candidates; it also narrows the search unless
 * `filterByYear` is off (a series' first year differs from a note about
 * one of its later seasons or episodes).
 */
async function matchTmdb(
  kind: "movie" | "show",
  title: string,
  year?: number,
  filterByYear = true
) {
  type R = {
    id: number
    title?: string
    name?: string
    original_title?: string
    original_name?: string
    release_date?: string
    first_air_date?: string
    poster_path?: string | null
  }
  const search = (withYear: boolean) =>
    tmdb<{ results: Array<R> }>(
      kind === "movie" ? "/search/movie" : "/search/tv",
      {
        query: searchTitle(title),
        include_adult: "false",
        ...(withYear && year
          ? {
              [kind === "movie" ? "year" : "first_air_date_year"]: String(year),
            }
          : {}),
      }
    )
  let { results } = await search(filterByYear)
  if (!results.length) ({ results } = await search(false))
  return pick(
    title,
    year,
    results.slice(0, 10).map((r) => ({
      id: r.id,
      title: r.title ?? r.name ?? "",
      altTitles: [r.original_title ?? r.original_name ?? ""],
      year:
        Number((r.release_date ?? r.first_air_date ?? "").slice(0, 4)) ||
        undefined,
      poster: r.poster_path
        ? { provider: "tmdb" as const, path: r.poster_path }
        : undefined,
    }))
  )
}

// IGDB --------------------------------------------------------------------
let igdbToken: string | undefined
async function igdb<T>(endpoint: string, body: string): Promise<T> {
  const clientId = env("IGDB_CLIENT_ID")
  const secret = env("IGDB_CLIENT_SECRET")
  if (!clientId || !secret)
    throw new Error("IGDB keys missing in apps/admin/.env")
  if (!igdbToken) {
    const res = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${secret}&grant_type=client_credentials`,
      { method: "POST" }
    )
    igdbToken = ((await res.json()) as { access_token: string }).access_token
  }
  await sleep(260) // IGDB allows 4 requests/second.
  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: { "Client-ID": clientId, Authorization: `Bearer ${igdbToken}` },
    body,
  })
  if (!res.ok) throw new Error(`IGDB ${res.status}`)
  return (await res.json()) as T
}

async function matchIgdb(title: string, year?: number) {
  type R = {
    id: number
    name: string
    first_release_date?: number
    cover?: { image_id: string }
    game_type?: number
    total_rating_count?: number
  }
  const q = searchTitle(title).replace(/\\/g, "\\\\").replace(/"/g, '\\"')
  const fields = "name,first_release_date,cover.image_id,total_rating_count"
  // game_type 0 = main game; DLCs, seasons and skins share names with it.
  const results = await igdb<Array<R>>(
    "games",
    `search "${q}"; fields ${fields},game_type; where version_parent = null; limit 20;`
  ).catch(() =>
    igdb<Array<R>>(
      "games",
      `search "${q}"; fields ${fields}; where version_parent = null; limit 20;`
    )
  )
  return pick(
    title,
    year,
    results.map((r) => ({
      id: r.id,
      title: r.name,
      year: r.first_release_date
        ? new Date(r.first_release_date * 1000).getUTCFullYear()
        : undefined,
      poster: r.cover
        ? { provider: "igdb" as const, path: r.cover.image_id }
        : undefined,
      weight:
        (r.game_type === undefined || r.game_type === 0 ? 1_000_000 : 0) +
        (r.total_rating_count ?? 0),
    }))
  )
}

// Open Library --------------------------------------------------------------
async function matchBook(
  isbn: string | undefined,
  title: string,
  author?: string
): Promise<Match | undefined> {
  const ua = {
    "User-Agent": "ArchivePersonalApp/0.1 (personal archive import)",
  }
  if (isbn) {
    const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, {
      headers: ua,
    })
    if (res.ok) {
      const edition = (await res.json()) as {
        works?: Array<{ key: string }>
        covers?: Array<number>
        title: string
      }
      const work = edition.works?.[0]?.key.match(/OL(\d+)W/)?.[1]
      if (work)
        return {
          id: Number(work),
          title: edition.title,
          poster: edition.covers?.[0]
            ? { provider: "openlibrary", path: String(edition.covers[0]) }
            : undefined,
          confidence: "exact",
        }
    }
  }
  // Brazilian editions are often missing from /isbn; the search index
  // sometimes still knows the ISBN, else fall back to title + author.
  const clean = searchTitle(title)
  const url = new URL("https://openlibrary.org/search.json")
  if (isbn) url.searchParams.set("isbn", isbn)
  else {
    url.searchParams.set("title", clean)
    if (author) url.searchParams.set("author", author)
  }
  url.searchParams.set("fields", "key,title,first_publish_year,cover_i")
  url.searchParams.set("limit", "5")
  const res = await fetch(url, { headers: ua })
  if (!res.ok) return undefined
  const { docs } = (await res.json()) as {
    docs: Array<{
      key: string
      title: string
      first_publish_year?: number
      cover_i?: number
    }>
  }
  if (!docs.length && isbn) return matchBook(undefined, title, author)
  if (!docs.length && clean.includes(":"))
    return matchBook(undefined, clean.split(":")[0]!, author)
  const best = pick(
    clean,
    undefined,
    docs.map((d) => ({
      id: Number(d.key.match(/OL(\d+)W/)?.[1]),
      title: d.title,
      year: d.first_publish_year,
      poster: d.cover_i
        ? { provider: "openlibrary" as const, path: String(d.cover_i) }
        : undefined,
    }))
  )
  // Without an ISBN hit, a title match is at best "medium".
  return (
    best && {
      ...best,
      confidence: best.confidence === "high" ? "medium" : best.confidence,
    }
  )
}

// Discogs -------------------------------------------------------------------
type DiscogsRelease = {
  title: string
  year?: number
  artists?: Array<{ name: string; anv?: string }>
  labels?: Array<{ name: string; catno?: string }>
  formats?: Array<{
    name: string
    qty?: string
    descriptions?: Array<string>
    text?: string
  }>
  genres?: Array<string>
  styles?: Array<string>
  images?: Array<{ type: string; uri: string }>
}
async function fetchDiscogs(id: number): Promise<DiscogsRelease | undefined> {
  const token = env("DISCOGS_TOKEN")
  if (!token) return undefined
  await sleep(1100) // 60 requests/minute.
  const res = await fetch(`https://api.discogs.com/releases/${id}`, {
    headers: {
      Authorization: `Discogs token=${token}`,
      "User-Agent": "ArchivePersonalApp/0.1",
    },
  })
  return res.ok ? ((await res.json()) as DiscogsRelease) : undefined
}
const cleanName = (n: string) => n.replace(/\s\(\d+\)$/, "")

/** Fetch an item by id, for overrides.json entries. */
async function lookup(kind: string, id: number): Promise<Match | undefined> {
  if (kind === "Movies" || kind === "Shows") {
    const r = await tmdb<{
      title?: string
      name?: string
      release_date?: string
      first_air_date?: string
      poster_path?: string | null
    }>(kind === "Movies" ? `/movie/${id}` : `/tv/${id}`, {})
    return {
      id,
      title: r.title ?? r.name ?? "",
      year:
        Number((r.release_date ?? r.first_air_date ?? "").slice(0, 4)) ||
        undefined,
      poster: r.poster_path
        ? { provider: "tmdb", path: r.poster_path }
        : undefined,
      confidence: "exact",
    }
  }
  if (kind === "Games") {
    const [g] = await igdb<
      Array<{
        name: string
        first_release_date?: number
        cover?: { image_id: string }
      }>
    >(
      "games",
      `fields name,first_release_date,cover.image_id; where id = ${id};`
    )
    if (!g) return undefined
    return {
      id,
      title: g.name,
      year: g.first_release_date
        ? new Date(g.first_release_date * 1000).getUTCFullYear()
        : undefined,
      poster: g.cover
        ? { provider: "igdb", path: g.cover.image_id }
        : undefined,
      confidence: "exact",
    }
  }
  if (kind === "Books") {
    const res = await fetch(`https://openlibrary.org/works/OL${id}W.json`)
    if (!res.ok) return undefined
    const w = (await res.json()) as { title: string; covers?: Array<number> }
    return {
      id,
      title: w.title,
      poster: w.covers?.[0]
        ? { provider: "openlibrary", path: String(w.covers[0]) }
        : undefined,
      confidence: "exact",
    }
  }
  return undefined
}

// ---------------------------------------------------------------- run

type ReportRow = { file: string; kind: string; result: string; detail?: string }

async function main() {
  await mkdir(outDir, { recursive: true })
  const cache = await readJson<Cache>(cachePath, {})
  // A provider id, `{ id, type: "show" }` for vault "movies" that are TV
  // (episodes, series), or null to skip the note.
  type Override = number | { id: number; type: "show" } | null
  const overrides = await readJson<Record<string, Override>>(overridesPath, {})
  if (!existsSync(overridesPath))
    await writeFile(
      overridesPath,
      JSON.stringify(
        {
          "_example Note name.md":
            'provider id, { "id": 123, "type": "show" }, or null to skip',
        },
        null,
        2
      )
    )

  const files = (await readdir(vault)).filter((f) => f.endsWith(".md"))
  const notes: Array<Note> = []
  for (const file of files) {
    const note = parseNote(file, await readFile(path.join(vault, file), "utf8"))
    if (note) notes.push(note)
  }

  const items = new Map<string, LibraryItem>()
  const logs: Array<LogEntry> = []
  const backlog: Array<BacklogItem> = []
  const collection: Array<CollectionItem> = []
  const flights: Array<Flight> = []
  const report: Array<ReportRow> = []

  const resolve = async (
    note: Note,
    kind: string,
    find: () => Promise<Match | undefined>
  ): Promise<Match | undefined> => {
    if (note.file in overrides) {
      const override = overrides[note.file]
      if (override === null || override === undefined) return undefined
      const { id, asShow } =
        typeof override === "number"
          ? { id: override, asShow: false }
          : { id: override.id, asShow: true }
      const key = `override:${note.file}:${asShow ? "tv" : ""}${id}`
      if (!(key in cache)) {
        const found = await lookup(asShow ? "Shows" : kind, id)
        cache[key] = found ? { ...found, asShow: asShow || undefined } : null
      }
      return cache[key] ?? undefined
    }
    if (!(note.file in cache)) {
      try {
        cache[note.file] = (await find()) ?? null
      } catch (error) {
        report.push({
          file: note.file,
          kind,
          result: "error",
          detail: String(error),
        })
        return undefined
      }
    }
    return cache[note.file] ?? undefined
  }

  const addItem = (
    type: MediaType,
    m: Match,
    note: Note,
    title: string,
    subtitle?: string
  ) => {
    const key = `${type}:${m.id}`
    if (!items.has(key))
      items.set(key, {
        type,
        id: m.id,
        title,
        subtitle,
        year: m.year ?? yearOf(scalar(note.fm.year)),
        poster: m.poster,
        genres: list(note.fm.genre),
        addedAt: toIso(scalar(note.fm.created)),
      })
    return items.get(key)!
  }
  const stored = (created?: string) => ({
    id: crypto.randomUUID(),
    createdAt: toIso(created),
    updatedAt: now,
  })
  const toBacklog = (item: Omit<LibraryItem, "addedAt">, note: Note) => {
    if (!backlog.some((b) => b.type === item.type && b.id === item.id))
      backlog.push({ ...item, addedAt: toIso(scalar(note.fm.created)) })
  }

  let done = 0
  for (const note of notes) {
    const category = list(note.fm.categories)[0]
    const tags = list(note.fm.tags)
    const wantsLater = tags.includes("backlog") || tags.includes("wishlist")
    const title = scalar(note.fm.title) ?? titleFromFile(note.file)
    // Files like "The Batman (2022).md" carry the year in the name.
    const year =
      yearOf(scalar(note.fm.year)) ??
      yearOf(note.file.match(/\((\d{4})\)\.md$/)?.[1])
    const rated = rating(scalar(note.fm.rating))
    const start = isoDate(scalar(note.fm.start))
    const end = isoDate(scalar(note.fm.end))
    if (++done % 25 === 0) console.log(`… ${done}/${notes.length}`)

    if (category === "Movies" || category === "Shows") {
      let type: "movie" | "show" = category === "Movies" ? "movie" : "show"
      // Some vault "movies" are series or episodes; try TV when the movie
      // search has no confident answer.
      const m = await resolve(note, category, async () => {
        const movie = await matchTmdb(type, title, year)
        if (type === "show" || movie?.confidence === "high") return movie
        const series = title.replace(/\s+(Season \d+|\d+\s.*Finale.*)$/i, "")
        const show = await matchTmdb("show", series, year, false)
        // TV wins only when it's clearly better: a high match, or a medium
        // one against a weak movie match, or anything when no movie matched.
        const tvWins =
          show &&
          (!movie ||
            show.confidence === "high" ||
            (show.confidence === "medium" && movie.confidence === "low"))
        return tvWins ? { ...show, asShow: true } : movie
      })
      if (m?.asShow) type = "show"
      if (!m) {
        report.push({
          file: note.file,
          kind: category,
          result: "unmatched",
          detail: title,
        })
        continue
      }
      const item = addItem(type, m, note, m.title)
      const watched = rated !== undefined || (!wantsLater && type === "movie")
      if (watched)
        logs.push(
          type === "movie"
            ? {
                kind: "movie",
                mediaId: m.id,
                watchedAt: end ?? start,
                rating: rated,
                rewatch: false,
                ...stored(scalar(note.fm.created)),
              }
            : {
                kind: "show",
                mediaId: m.id,
                startedAt: start,
                finishedAt: end,
                rating: rated,
                rewatch: false,
                ...stored(scalar(note.fm.created)),
              }
        )
      if (wantsLater) toBacklog(item, note)
      report.push({
        file: note.file,
        kind: category,
        result: m.confidence,
        detail: `${title} (${year ?? "?"}) → ${m.asShow ? "[TV] " : ""}${m.title} (${m.year ?? "?"}) #${m.id}`,
      })
    } else if (category === "Games") {
      const m = await resolve(note, category, () => matchIgdb(title, year))
      if (!m) {
        report.push({
          file: note.file,
          kind: category,
          result: "unmatched",
          detail: title,
        })
        continue
      }
      const item = addItem("game", m, note, m.title)
      // In the vault, a game note without backlog/wishlist means you played it.
      if (!wantsLater || rated !== undefined)
        logs.push({
          kind: "game",
          mediaId: m.id,
          status: "finished",
          startedAt: start,
          finishedAt: end,
          rating: rated,
          ...stored(scalar(note.fm.created)),
        })
      if (wantsLater) toBacklog(item, note)
      report.push({
        file: note.file,
        kind: category,
        result: m.confidence,
        detail: `${title} (${year ?? "?"}) → ${m.title} (${m.year ?? "?"}) #${m.id}`,
      })
    } else if (category === "Books") {
      const isbn = scalar(note.fm.isbn)?.replace(/\D/g, "")
      const author = list(note.fm.author)[0]
      const m = await resolve(note, category, () =>
        matchBook(isbn, title, author)
      )
      if (!m) {
        report.push({
          file: note.file,
          kind: category,
          result: "unmatched",
          detail: title,
        })
        continue
      }
      const item = addItem(
        "book",
        m,
        note,
        title,
        list(note.fm.author).join(", ")
      )
      if (!wantsLater || rated !== undefined)
        logs.push({
          kind: "book",
          mediaId: m.id,
          status: "finished",
          startedAt: start,
          finishedAt: end,
          rating: rated,
          reread: false,
          ...stored(scalar(note.fm.created)),
        })
      if (wantsLater) toBacklog(item, note)
      report.push({
        file: note.file,
        kind: category,
        result: m.confidence,
        detail: `${title}${isbn ? ` [ISBN ${isbn}]` : ""} → OL${m.id}W`,
      })
    } else if (category === "Records") {
      const id = Number(scalar(note.fm.source)?.match(/release\/(\d+)/)?.[1])
      if (!id) {
        report.push({
          file: note.file,
          kind: category,
          result: "unmatched",
          detail: "no Discogs release URL in source",
        })
        continue
      }
      const release = await fetchDiscogs(id)
      const format = release?.formats
        ?.map((f) =>
          [
            f.qty && f.qty !== "1" ? `${f.qty}× ${f.name}` : f.name,
            ...(f.descriptions ?? []),
            f.text,
          ]
            .filter(Boolean)
            .join(", ")
        )
        .join(" + ")
      const primary =
        release?.images?.find((i) => i.type === "primary") ??
        release?.images?.[0]
      const cover = primary?.uri ?? scalar(note.fm.cover)
      const price = Number(scalar(note.fm.price))
      collection.push({
        id: crypto.randomUUID(),
        type: "record",
        releaseId: id,
        title: release?.title ?? titleFromFile(note.file),
        artist:
          release?.artists?.map((a) => cleanName(a.anv || a.name)).join(", ") ??
          list(note.fm.artists).join(", "),
        year: release?.year || yearOf(scalar(note.fm.year)),
        format: format || undefined,
        label: release?.labels?.[0]
          ? cleanName(release.labels[0].name)
          : list(note.fm.label)[0],
        catno: release?.labels?.[0]?.catno,
        genres: release?.genres ?? list(note.fm.genre),
        styles: release?.styles ?? [],
        cover: cover ? { provider: "discogs", path: cover } : undefined,
        price: price > 0 ? { amount: price, currency: "BRL" } : undefined,
        store: scalar(note.fm.store),
        notes: unlink(note.body) || undefined,
        addedAt: toIso(scalar(note.fm.created)),
        updatedAt: now,
      })
      report.push({
        file: note.file,
        kind: category,
        result: release ? "exact" : "exact (no Discogs token: note data only)",
        detail: `release ${id}`,
      })
    } else if (category === "Flights") {
      const loc = list(note.fm.loc)
      const departure = scalar(note.fm.departure)?.slice(0, 16)
      if (loc.length < 2 || !departure) {
        report.push({
          file: note.file,
          kind: category,
          result: "skipped",
          detail: "missing airports or departure",
        })
        continue
      }
      flights.push({
        from: loc[0]!.toUpperCase(),
        // Diverted flights list [from, landed at, planned]; keep where it landed.
        to: loc[1]!.toUpperCase(),
        departure,
        arrival: scalar(note.fm.arrival)?.slice(0, 16),
        flightNumber: scalar(note.fm.code)?.replace(/\s+/g, "").toUpperCase(),
        airline: list(note.fm.companies)[0],
        aircraft: scalar(note.fm.aircraft),
        seat: scalar(note.fm.seat)?.toUpperCase(),
        reservation: scalar(note.fm.reservation)?.toUpperCase(),
        notes:
          unlink(note.body.split(/^## Connections/m)[0] ?? "").trim() ||
          undefined,
        ...stored(scalar(note.fm.created)),
      })
      report.push({
        file: note.file,
        kind: category,
        result: loc.length > 2 ? "exact (diverted)" : "exact",
        detail: loc.join(" → "),
      })
    }
  }

  await writeFile(cachePath, JSON.stringify(cache, null, 2))

  // The library only holds works you've logged; backlog-only items live
  // in the backlog with their own snapshot.
  const logged = new Set(
    logs.map((l) => `${l.kind === "season" ? "show" : l.kind}:${l.mediaId}`)
  )

  // Validate against the app's schema so the file is guaranteed to import.
  const data = LegacyArchiveExport.parse({
    version: 1,
    exportedAt: now,
    items: [...items.entries()]
      .filter(([key]) => logged.has(key))
      .map(([, item]) => item),
    logs,
    backlog,
    collection,
    flights,
  })
  await writeFile(
    path.join(outDir, "archive-import.json"),
    JSON.stringify(data, null, 2)
  )
  await writeFile(path.join(outDir, "report.md"), renderReport(report, data))
  console.log(
    `Done: ${data.items.length} items, ${data.logs.length} logs, ${data.backlog.length} backlog, ` +
      `${data.collection.length} records, ${data.flights.length} flights → ${path.relative(process.cwd(), outDir)}`
  )
}

function toIso(date?: string) {
  const d = isoDate(date)
  return d ? `${d}T12:00:00.000Z` : now
}

function renderReport(rows: Array<ReportRow>, data: LegacyArchiveExport) {
  const order = ["error", "unmatched", "low", "medium", "skipped"]
  const needsReview = rows.filter((r) => order.includes(r.result))
  const counts = new Map<string, number>()
  for (const r of rows)
    counts.set(
      `${r.kind} · ${r.result}`,
      (counts.get(`${r.kind} · ${r.result}`) ?? 0) + 1
    )
  return [
    `# Obsidian import report`,
    ``,
    `Generated ${now}. Items ${data.items.length} · logs ${data.logs.length} · backlog ${data.backlog.length} · records ${data.collection.length} · flights ${data.flights.length}.`,
    ``,
    `## Summary`,
    ...[...counts.entries()].sort().map(([k, v]) => `- ${k}: ${v}`),
    ``,
    `## Needs review (${needsReview.length})`,
    `Fix a match by adding \`"Note name.md": <TMDB/IGDB/Open Library work id>\` to overrides.json (or \`null\` to skip), then re-run.`,
    ``,
    ...needsReview
      .sort((a, b) => order.indexOf(a.result) - order.indexOf(b.result))
      .map(
        (r) =>
          `- **${r.result}** · ${r.kind} · \`${r.file}\` — ${r.detail ?? ""}`
      ),
    ``,
    `## All matches`,
    ...rows.map(
      (r) => `- ${r.result} · ${r.kind} · \`${r.file}\` — ${r.detail ?? ""}`
    ),
    ``,
  ].join("\n")
}

await main()
