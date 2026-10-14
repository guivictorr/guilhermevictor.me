import { createServerFn } from "@tanstack/react-start"
import { MediaType } from "@workspace/schemas"
import { z } from "zod"
import { requireOwner } from "./auth.functions"
import { cached } from "./cache.server"
import { liveOrStored, seasonLiveOrStored } from "./details.server"
import {
  fetchCollectionValue,
  fetchDiscogsCollection,
  fetchMaster,
  searchDiscogs,
} from "./discogs.server"
import { fetchPopularGames, searchIgdb } from "./igdb.server"
import {
  fetchAuthor,
  fetchAuthorWorks,
  fetchTrendingBooks,
  searchOpenLibrary,
} from "./openlibrary.server"
import { fetchCollection, fetchTrendingTmdb, searchTmdb } from "./tmdb.server"

/*
 * Provider API keys never leave the server: every provider call goes
 * through these RPCs, which return our normalized schemas. They require the
 * owner's session so nobody else can spend the provider quotas. Detail RPCs
 * fall back to the copy stored in the archive when a provider fails.
 */

const Id = z.object({ id: z.number().int().positive() })

export const searchMedia = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(
    z.object({ type: MediaType, query: z.string().trim().min(1).max(200) })
  )
  .handler(({ data }) => {
    switch (data.type) {
      case "game":
        return searchIgdb(data.query)
      case "record":
        return searchDiscogs(data.query)
      case "book":
        return searchOpenLibrary(data.query)
      default:
        return searchTmdb(data.type, data.query)
    }
  })

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

export const getBook = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(Id)
  .handler(({ data }) => liveOrStored("book", data.id))

const AuthorKey = z.object({ key: z.string().regex(/^OL\d+A$/) })

export const getAuthor = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(AuthorKey)
  .handler(({ data }) => fetchAuthor(data.key))

export const getAuthorWorks = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(AuthorKey)
  .handler(({ data }) => fetchAuthorWorks(data.key))
