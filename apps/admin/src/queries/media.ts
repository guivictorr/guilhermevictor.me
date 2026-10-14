import { queryOptions } from "@tanstack/react-query"
import type { MediaType } from "@workspace/schemas"
import {
  getCollection,
  getAuthor,
  getAuthorWorks,
  getBook,
  getCollectionValue,
  getGame,
  getMaster,
  getRelease,
  getMovie,
  getSeason,
  getShow,
  getTrending,
  searchMedia,
} from "@/server/media.functions"

// Provider metadata barely changes; avoid refetching it during a session.
const PROVIDER_STALE_TIME = 1000 * 60 * 60

export const mediaKeys = {
  all: ["media"] as const,
  search: (type: MediaType, query: string) =>
    [...mediaKeys.all, "search", type, query] as const,
  movie: (id: number) => [...mediaKeys.all, "movie", id] as const,
  show: (id: number) => [...mediaKeys.all, "show", id] as const,
  season: (id: number, season: number) =>
    [...mediaKeys.all, "show", id, "season", season] as const,
  game: (id: number) => [...mediaKeys.all, "game", id] as const,
  book: (id: number) => [...mediaKeys.all, "book", id] as const,
  author: (key: string) => [...mediaKeys.all, "author", key] as const,
  authorWorks: (key: string) =>
    [...mediaKeys.all, "author", key, "works"] as const,
  master: (id: number) => [...mediaKeys.all, "master", id] as const,
  release: (id: number) => [...mediaKeys.all, "release", id] as const,
  collectionValue: () => [...mediaKeys.all, "collection-value"] as const,
  trending: (type: MediaType) => [...mediaKeys.all, "trending", type] as const,
  collection: (id: number) => [...mediaKeys.all, "collection", id] as const,
}

export const searchQuery = (type: MediaType, query: string) =>
  queryOptions({
    queryKey: mediaKeys.search(type, query),
    queryFn: () => searchMedia({ data: { type, query } }),
    enabled: query.trim().length > 0,
    staleTime: PROVIDER_STALE_TIME,
  })

export const movieQuery = (id: number) =>
  queryOptions({
    queryKey: mediaKeys.movie(id),
    queryFn: () => getMovie({ data: { id } }),
    staleTime: PROVIDER_STALE_TIME,
  })

export const showQuery = (id: number) =>
  queryOptions({
    queryKey: mediaKeys.show(id),
    queryFn: () => getShow({ data: { id } }),
    staleTime: PROVIDER_STALE_TIME,
  })

export const seasonQuery = (id: number, season: number) =>
  queryOptions({
    queryKey: mediaKeys.season(id, season),
    queryFn: () => getSeason({ data: { id, season } }),
    staleTime: PROVIDER_STALE_TIME,
  })

export const gameQuery = (id: number) =>
  queryOptions({
    queryKey: mediaKeys.game(id),
    queryFn: () => getGame({ data: { id } }),
    staleTime: PROVIDER_STALE_TIME,
  })

export const collectionQuery = (id: number) =>
  queryOptions({
    queryKey: mediaKeys.collection(id),
    queryFn: () => getCollection({ data: { id } }),
    staleTime: PROVIDER_STALE_TIME,
  })

export const trendingQuery = (type: MediaType) =>
  queryOptions({
    queryKey: mediaKeys.trending(type),
    queryFn: () => getTrending({ data: { type } }),
    staleTime: 1000 * 60 * 60 * 6,
  })

export const releaseQuery = (id: number) =>
  queryOptions({
    queryKey: mediaKeys.release(id),
    queryFn: () => getRelease({ data: { id } }),
    staleTime: PROVIDER_STALE_TIME,
  })

export const collectionValueQuery = () =>
  queryOptions({
    queryKey: mediaKeys.collectionValue(),
    queryFn: () => getCollectionValue(),
    staleTime: PROVIDER_STALE_TIME,
    retry: false,
  })

export const masterQuery = (id: number) =>
  queryOptions({
    queryKey: mediaKeys.master(id),
    queryFn: () => getMaster({ data: { id } }),
    staleTime: PROVIDER_STALE_TIME,
  })

export const bookQuery = (id: number) =>
  queryOptions({
    queryKey: mediaKeys.book(id),
    queryFn: () => getBook({ data: { id } }),
    staleTime: PROVIDER_STALE_TIME,
  })

export const authorQuery = (key: string) =>
  queryOptions({
    queryKey: mediaKeys.author(key),
    queryFn: () => getAuthor({ data: { key } }),
    staleTime: PROVIDER_STALE_TIME,
  })

export const authorWorksQuery = (key: string) =>
  queryOptions({
    queryKey: mediaKeys.authorWorks(key),
    queryFn: () => getAuthorWorks({ data: { key } }),
    staleTime: PROVIDER_STALE_TIME,
  })
