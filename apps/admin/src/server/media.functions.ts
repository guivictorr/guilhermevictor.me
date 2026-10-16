import { createServerFn } from "@tanstack/react-start"
import { MediaType } from "@workspace/schemas"
import { z } from "zod"
import { SearchFilters, filtersFor } from "@/lib/search-filters"
import { requireOwner } from "./auth.functions"
import { cached } from "./cache.server"
import { liveOrStored, seasonLiveOrStored } from "./details.server"
import {
  fetchCollectionValue,
  fetchDiscogsCollection,
  fetchMaster,
  searchDiscogs,
} from "./discogs.server"
import {
  fetchPopularGames,
  igdbIdsForSteamApps,
  searchIgdb,
} from "./igdb.server"
import { fetchSteamPlaytime } from "./steam.server"
import { fetchTrendingBooks, searchGoogleBooks } from "./googlebooks.server"
import {
  discoverTmdb,
  fetchCollection,
  fetchTrendingTmdb,
  fetchWatchProviders,
  searchTmdb,
} from "./tmdb.server"

/*
 * Provider API keys never leave the server: every provider call goes
 * through these RPCs, which return our normalized schemas. They require the
 * owner's session so nobody else can spend the provider quotas. Detail RPCs
 * fall back to the copy stored in the archive when a provider fails.
 */

const Id = z.object({ id: z.number().int().positive() })

/** Text search, browse by filters, or both (see lib/search-filters.ts). */
export const searchMedia = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(
    z.object({
      type: MediaType,
      query: z.string().trim().max(200),
      filters: SearchFilters.default({}),
      /** 1-based; about 20–40 results per page depending on the provider. */
      page: z.number().int().min(1).max(25).default(1),
    })
  )
  .handler(({ data }) => {
    const { page } = data
    const query = data.query || undefined
    const filters = filtersFor(data.type, data.filters)
    switch (data.type) {
      case "game":
        return searchIgdb(query, filters, page)
      case "record":
        return searchDiscogs(query, filters, page)
      case "book":
        return searchGoogleBooks({
          query,
          author: filters.author,
          subject: filters.genre,
          publisher: filters.publisher,
          language: filters.lang,
          orderBy: filters.sort === "newest" ? "newest" : undefined,
          page,
        })
      default:
        return query
          ? searchTmdb(data.type, query, filters, page)
          : discoverTmdb(data.type, filters, page)
    }
  })

/** Streaming services for the "Streaming on" filter (TMDB, your region). */
export const getWatchProviders = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(z.object({ type: z.enum(["movie", "show"]) }))
  .handler(({ data }) =>
    cached(`providers:${data.type}`, 1000 * 60 * 60 * 24, () =>
      fetchWatchProviders(data.type)
    )
  )

export const getMovie = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(Id)
  .handler(({ data }) => liveOrStored("movie", data.id))

export const getShow = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(Id)
  .handler(({ data }) => liveOrStored("show", data.id))

export const getSeason = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(Id.extend({ season: z.number().int().min(0) }))
  .handler(({ data }) => seasonLiveOrStored(data.id, data.season))

export const getGame = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(Id)
  .handler(({ data }) => liveOrStored("game", data.id))

export const getCollection = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(Id)
  .handler(({ data }) => fetchCollection(data.id))

const TRENDING_TTL = 1000 * 60 * 60 * 6

/** Popular right now, per media type. Cached on the server for 6 hours. */
export const getTrending = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(z.object({ type: MediaType }))
  .handler(({ data }) => {
    // Discogs has no trending endpoint; the UI shows your collection instead.
    if (data.type === "record") return Promise.resolve([])
    const type = data.type
    return cached(`trending:${type}`, TRENDING_TTL, () => {
      switch (type) {
        case "game":
          return fetchPopularGames()
        case "book":
          return fetchTrendingBooks()
        default:
          return fetchTrendingTmdb(type)
      }
    })
  })

export const getRelease = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(Id)
  .handler(({ data }) => liveOrStored("record", data.id))

/** Reads your whole Discogs collection; the client merges it locally. */
export const importDiscogsCollection = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .handler(() => fetchDiscogsCollection())

export const getCollectionValue = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .handler(() => cached("discogs:value", 1000 * 60 * 60, fetchCollectionValue))

export const getMaster = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(Id)
  .handler(({ data }) => fetchMaster(data.id))

/** Google Books volume ids are strings, e.g. "zyTCAlFPjgYC". */
export const getBook = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(z.object({ id: z.string().regex(/^[\w-]{1,64}$/) }))
  .handler(({ data }) => liveOrStored("book", data.id))

/**
 * Your played Steam games matched to IGDB ids (through IGDB's Steam links);
 * the client hands the matches to `fillFromSteam`.
 */
export const fetchSteamLibrary = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .handler(async () => {
    const played = await fetchSteamPlaytime()
    const igdbIds = await igdbIdsForSteamApps(played.map((g) => g.appId))
    const matched = played.flatMap((g) => {
      const gameId = igdbIds.get(g.appId)
      return gameId ? [{ gameId, minutes: g.minutes }] : []
    })
    return { played: played.length, matched }
  })
