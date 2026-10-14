import { notFound } from "@tanstack/react-router"
import type {
  Book,
  Game,
  MediaType,
  Movie,
  Release,
  Season,
  Show,
} from "@workspace/schemas"
import { and, eq, sql } from "drizzle-orm"
import { cached } from "./cache.server"
import { getDb } from "./db/client.server"
import { books, games, movies, records, showLogs, shows } from "./db/schema"
import { fetchRelease } from "./discogs.server"
import { fetchGame } from "./igdb.server"
import { fetchBook } from "./openlibrary.server"
import { fetchMovie, fetchSeason, fetchShow } from "./tmdb.server"

/*
 * Provider details kept on each work row (`data` + columns copied out of
 * it). Detail pages ask the provider first (full data, recommendations
 * included) and fall back to the stored copy when it fails, so works in
 * your archive never lose their page. Visits refresh the copy daily.
 */

export type Detail = Movie | Show | Game | Book | Release
export type DetailOf<T extends MediaType> = Extract<Detail, { type: T }>

/** Shared by page loads and logging, so logging right after viewing doesn't refetch. */
const LIVE_TTL = 1000 * 60 * 10
/** Stored copies are rewritten at most this often when pages are visited. */
const REFRESH_AFTER = 1000 * 60 * 60 * 24

async function loadLive(type: MediaType, id: number): Promise<Detail> {
  switch (type) {
    case "movie":
      return fetchMovie(id)
    case "show":
      return fetchShow(id)
    case "book":
      return fetchBook(id)
    case "record":
      return fetchRelease(id)
    case "game": {
      const game = await fetchGame(id)
      if (!game) throw notFound()
      return game
    }
  }
}

export function fetchLive<T extends MediaType>(
  type: T,
  id: number
): Promise<DetailOf<T>> {
  return cached(`details:${type}:${id}`, LIVE_TTL, () =>
    loadLive(type, id)
  ) as Promise<DetailOf<T>>
}

const fetchLiveSeason = (showId: number, seasonNumber: number) =>
  cached(`season:${showId}:${seasonNumber}`, LIVE_TTL, () =>
    fetchSeason(showId, seasonNumber)
  )

// --- what gets stored: `data` minus the replaceable parts, plus columns -------

export function movieColumns(m: Movie) {
  return {
    title: m.title,
    year: m.year ?? null,
    genres: m.genres,
    poster: m.poster ?? null,
    originalTitle: m.originalTitle ?? null,
    releaseDate: m.releaseDate ?? null,
    runtime: m.runtime ?? null,
    directors: m.directors,
    imdbId: m.imdbId ?? null,
    data: { ...m, recommendations: [] },
  }
}

export function showColumns(s: Show) {
  return {
    title: s.title,
    year: s.year ?? null,
    genres: s.genres,
    poster: s.poster ?? null,
    originalTitle: s.originalTitle ?? null,
    firstAirDate: s.firstAirDate ?? null,
    lastAirDate: s.lastAirDate ?? null,
    status: s.status ?? null,
    creators: s.creators,
    networks: s.networks,
    imdbId: s.imdbId ?? null,
    data: { ...s, recommendations: [] },
  }
}

export function gameColumns(g: Game) {
  return {
    title: g.title,
    year: g.year ?? null,
    genres: g.genres,
    poster: g.cover ?? null,
    releaseDate: g.releaseDate ?? null,
    developers: g.developers,
    publishers: g.publishers,
    platforms: g.platforms,
    steamId: g.externalIds.steam ?? null,
    externalIds: g.externalIds,
    // The first screenshot is the page backdrop.
    data: {
      ...g,
      similar: [],
      videos: [],
      screenshots: g.screenshots.slice(0, 1),
    },
  }
}

export function bookColumns(b: Book) {
  return {
    title: b.title,
    year: b.year ?? null,
    genres: b.subjects.slice(0, 5),
    poster: b.cover ?? null,
    authors: b.authors.map((a) => a.name),
    pages: b.pages ?? null,
    subjects: b.subjects,
    isbns: [...new Set(b.editions.flatMap((e) => (e.isbn ? [e.isbn] : [])))],
    // Other editions stay on Open Library.
    data: { ...b, editions: [] },
  }
}

/** Release columns only: a copy's own fields (condition, price…) are untouched. */
export function recordColumns(r: Release) {
  const label = r.labels.at(0)
  return {
    title: r.title,
    artist: r.artists.join(", "),
    artists: r.artists,
    masterId: r.masterId ?? null,
    year: r.year ?? null,
    label: label?.name ?? null,
    catno: label?.catno ?? null,
    format: r.format ?? null,
    genres: r.genres,
    styles: r.styles,
    barcodes: r.identifiers
      .filter((i) => i.type === "Barcode")
      .map((i) => i.value),
    cover: r.cover ?? null,
    // Marketplace numbers go stale; keep the cover/backdrop image paths only.
    data: {
      ...r,
      videos: [],
      images: r.images.slice(0, 2),
      community: undefined,
      forSale: undefined,
      lowestPrice: undefined,
    },
  }
}

/** Writes fresh details onto the work's row (every copy, for records). */
async function writeDetails(detail: Detail) {
  const db = getDb()
  const fetchedAt = new Date()
  switch (detail.type) {
    case "movie":
      await db
        .update(movies)
        .set({ ...movieColumns(detail), fetchedAt })
        .where(eq(movies.id, detail.id))
      return
    case "show":
      await db
        .update(shows)
        .set({ ...showColumns(detail), fetchedAt })
        .where(eq(shows.id, detail.id))
      return
    case "game":
      await db
        .update(games)
        .set({ ...gameColumns(detail), fetchedAt })
        .where(eq(games.id, detail.id))
      return
    case "book":
      await db
        .update(books)
        .set({ ...bookColumns(detail), fetchedAt })
        .where(eq(books.id, detail.id))
      return
    case "record":
      await db
        .update(records)
        .set({ ...recordColumns(detail), fetchedAt })
        .where(eq(records.releaseId, detail.id))
  }
}

type Stored = { data?: Detail; fetchedAt?: Date }

function stored(
  row: { data: Detail | null; fetchedAt: Date | null } | undefined
): Stored | undefined {
  if (!row) return undefined
  return { data: row.data ?? undefined, fetchedAt: row.fetchedAt ?? undefined }
}

/** The work's stored details, or undefined when it isn't in the archive. */
async function readStored(
  type: MediaType,
  id: number
): Promise<Stored | undefined> {
  const db = getDb()
  switch (type) {
    case "movie": {
      const [row] = await db
        .select({ data: movies.data, fetchedAt: movies.fetchedAt })
        .from(movies)
        .where(eq(movies.id, id))
      return stored(row)
    }
    case "show": {
      const [row] = await db
        .select({ data: shows.data, fetchedAt: shows.fetchedAt })
        .from(shows)
        .where(eq(shows.id, id))
      return stored(row)
    }
    case "game": {
      const [row] = await db
        .select({ data: games.data, fetchedAt: games.fetchedAt })
        .from(games)
        .where(eq(games.id, id))
      return stored(row)
    }
    case "book": {
      const [row] = await db
        .select({ data: books.data, fetchedAt: books.fetchedAt })
        .from(books)
        .where(eq(books.id, id))
      return stored(row)
    }
    case "record": {
      // Any copy of the release will do; prefer one that has details.
      const [row] = await db
        .select({ data: records.data, fetchedAt: records.fetchedAt })
        .from(records)
        .where(eq(records.releaseId, id))
        .orderBy(sql`${records.data} is null`)
        .limit(1)
      return stored(row)
    }
  }
}

const isStale = (fetchedAt?: Date) =>
  !fetchedAt || Date.now() - fetchedAt.getTime() > REFRESH_AFTER

// --- page-facing --------------------------------------------------------------

/** Live details, falling back to the stored copy when the provider fails. */
export async function liveOrStored<T extends MediaType>(
  type: T,
  id: number
): Promise<DetailOf<T>> {
  let live: DetailOf<T>
  try {
    live = await fetchLive(type, id)
  } catch (error) {
    const copy = await readStored(type, id).catch(() => undefined)
    if (copy?.data) return copy.data as DetailOf<T>
    throw error
  }
  // Works in the archive keep a copy: fill it in if missing, refresh if old.
  try {
    const copy = await readStored(type, id)
    if (copy && (!copy.data || isStale(copy.fetchedAt)))
      await writeDetails(live)
  } catch (error) {
    console.warn(`Couldn't store details ${type}:${id}`, error)
  }
  return live
}

export async function seasonLiveOrStored(
  showId: number,
  seasonNumber: number
): Promise<Season> {
  let live: Season
  try {
    live = await fetchLiveSeason(showId, seasonNumber)
  } catch (error) {
    const copy = await readSeason(showId, seasonNumber).catch(() => undefined)
    if (copy) return copy
    throw error
  }
  try {
    if (
      !(await readSeason(showId, seasonNumber)) &&
      (await seasonLogged(showId, seasonNumber))
    )
      await writeSeason(live)
  } catch (error) {
    console.warn(`Couldn't store season ${showId}/${seasonNumber}`, error)
  }
  return live
}

async function readSeason(
  showId: number,
  seasonNumber: number
): Promise<Season | undefined> {
  const [row] = await getDb()
    .select({ seasons: shows.seasons })
    .from(shows)
    .where(eq(shows.id, showId))
  return row?.seasons[String(seasonNumber)]
}

async function seasonLogged(showId: number, seasonNumber: number) {
  const [row] = await getDb()
    .select({ id: showLogs.id })
    .from(showLogs)
    .where(
      and(eq(showLogs.showId, showId), eq(showLogs.seasonNumber, seasonNumber))
    )
    .limit(1)
  return row !== undefined
}

async function writeSeason(season: Season) {
  await getDb()
    .update(shows)
    .set({
      seasons: sql`${shows.seasons} || jsonb_build_object(${String(season.seasonNumber)}::text, ${JSON.stringify(season)}::jsonb)`,
    })
    .where(eq(shows.id, season.showId))
}

/**
 * Fills in `data` for a work already in the archive (no-op otherwise);
 * `refresh` re-fetches even when present. Never throws: if the provider is
 * down, the next page visit or the backfill script fills it in.
 */
export async function ensureDetails(
  type: MediaType,
  id: number,
  { refresh = false } = {}
): Promise<boolean> {
  try {
    const copy = await readStored(type, id)
    if (!copy || (copy.data && !refresh)) return true
    await writeDetails(await fetchLive(type, id))
    return true
  } catch (error) {
    console.warn(`Couldn't store details ${type}:${id}`, error)
    return false
  }
}

export async function ensureSeasonDetails(
  showId: number,
  seasonNumber: number,
  { refresh = false } = {}
): Promise<boolean> {
  try {
    if (!refresh && (await readSeason(showId, seasonNumber))) return true
    await writeSeason(await fetchLiveSeason(showId, seasonNumber))
    return true
  } catch (error) {
    console.warn(`Couldn't store season ${showId}/${seasonNumber}`, error)
    return false
  }
}
