import { queryOptions } from "@tanstack/react-query"
import type { MediaType } from "@workspace/schemas"
import { activeFilters } from "@/lib/search-filters"
import type { SearchFilters } from "@/lib/search-filters"
import {
  getCollection,
  getBook,
  getCollectionValue,
  getGame,
  getMaster,
  getRelease,
  getMovie,
  getSeason,
  getShow,
  getTrending,
  getWatchProviders,
  searchMedia,
} from "@/server/media.functions"

// Provider metadata barely changes; avoid refetching it during a session.
const PROVIDER_STALE_TIME = 1000 * 60 * 60

export const mediaKeys = {
  all: ["media"] as const,
  search: (type: MediaType, query: string, filters: SearchFilters) =>
    [...mediaKeys.all, "search", type, query, filters] as const,
  providers: (type: "movie" | "show") =>
    [...mediaKeys.all, "providers", type] as const,
  movie: (id: number) => [...mediaKeys.all, "movie", id] as const,
  show: (id: number) => [...mediaKeys.all, "show", id] as const,
  season: (id: number, season: number) =>
    [...mediaKeys.all, "show", id, "season", season] as const,
  game: (id: number) => [...mediaKeys.all, "game", id] as const,
  book: (id: string) => [...mediaKeys.all, "book", id] as const,
  master: (id: number) => [...mediaKeys.all, "master", id] as const,
  release: (id: number) => [...mediaKeys.all, "release", id] as const,
  collectionValue: () => [...mediaKeys.all, "collection-value"] as const,
  trending: (type: MediaType) => [...mediaKeys.all, "trending", type] as const,
  collection: (id: number) => [...mediaKeys.all, "collection", id] as const,
}

/** Runs with search text, filters, or both. */
export const searchQuery = (
  type: MediaType,
  query: string,
  filters: SearchFilters = {}
) =>
  queryOptions({
    queryKey: mediaKeys.search(type, query, filters),
    queryFn: () => searchMedia({ data: { type, query, filters } }),
    enabled: query.trim().length > 0 || activeFilters(type, filters).length > 0,
    staleTime: PROVIDER_STALE_TIME,
  })

export const watchProvidersQuery = (type: "movie" | "show") =>
  queryOptions({
    queryKey: mediaKeys.providers(type),
    queryFn: () => getWatchProviders({ data: { type } }),
    staleTime: 1000 * 60 * 60 * 24,
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

export const bookQuery = (id: string) =>
  queryOptions({
    queryKey: mediaKeys.book(id),
    queryFn: () => getBook({ data: { id } }),
    staleTime: PROVIDER_STALE_TIME,
  })
