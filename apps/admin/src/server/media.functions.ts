import { notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { MediaType } from "@workspace/schemas"
import { z } from "zod"
import { cached } from "./cache.server"
import {
  fetchCollectionValue,
  fetchDiscogsCollection,
  fetchMaster,
  fetchRelease,
  searchDiscogs,
} from "./discogs.server"
import { fetchGame, fetchPopularGames, searchIgdb } from "./igdb.server"
import {
  fetchAuthor,
  fetchAuthorWorks,
  fetchBook,
  fetchTrendingBooks,
  searchOpenLibrary,
} from "./openlibrary.server"
import {
  fetchCollection,
  fetchMovie,
  fetchSeason,
  fetchShow,
  fetchTrendingTmdb,
  searchTmdb,
} from "./tmdb.server"

/*
 * Provider API keys never leave the server: every provider call goes
 * through these RPCs, which return our normalized schemas.
 */

const Id = z.object({ id: z.number().int().positive() })

export const searchMedia = createServerFn({ method: "GET" })
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
  .validator(Id)
  .handler(({ data }) => fetchMovie(data.id))

export const getShow = createServerFn({ method: "GET" })
  .validator(Id)
  .handler(({ data }) => fetchShow(data.id))

export const getSeason = createServerFn({ method: "GET" })
  .validator(Id.extend({ season: z.number().int().min(0) }))
  .handler(({ data }) => fetchSeason(data.id, data.season))

export const getGame = createServerFn({ method: "GET" })
  .validator(Id)
  .handler(async ({ data }) => {
    const game = await fetchGame(data.id)
    if (!game) throw notFound()
    return game
  })

export const getCollection = createServerFn({ method: "GET" })
  .validator(Id)
  .handler(({ data }) => fetchCollection(data.id))

const TRENDING_TTL = 1000 * 60 * 60 * 6

/** Popular right now, per media type. Cached on the server for 6 hours. */
export const getTrending = createServerFn({ method: "GET" })
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
  .validator(Id)
  .handler(({ data }) => fetchRelease(data.id))

/** Reads your whole Discogs collection; the client merges it locally. */
export const importDiscogsCollection = createServerFn({
  method: "POST",
}).handler(() => fetchDiscogsCollection())

export const getCollectionValue = createServerFn({ method: "GET" }).handler(
  () => cached("discogs:value", 1000 * 60 * 60, fetchCollectionValue)
)

export const getMaster = createServerFn({ method: "GET" })
  .validator(Id)
  .handler(({ data }) => fetchMaster(data.id))

export const getBook = createServerFn({ method: "GET" })
  .validator(Id)
  .handler(({ data }) => fetchBook(data.id))

const AuthorKey = z.object({ key: z.string().regex(/^OL\d+A$/) })

export const getAuthor = createServerFn({ method: "GET" })
  .validator(AuthorKey)
  .handler(({ data }) => fetchAuthor(data.key))

export const getAuthorWorks = createServerFn({ method: "GET" })
  .validator(AuthorKey)
  .handler(({ data }) => fetchAuthorWorks(data.key))
