import type { QueryClient } from "@tanstack/react-query"
import type { ImageRef, MediaType } from "@workspace/schemas"

export type CachedItem = {
  type: MediaType
  id: string | number
  title: string
  year?: number
  subtitle?: string
  poster?: ImageRef
}

const isItem = (
  value: unknown,
  type: MediaType,
  id: string
): value is CachedItem =>
  typeof value === "object" &&
  value !== null &&
  (value as CachedItem).type === type &&
  String((value as CachedItem).id) === id &&
  typeof (value as CachedItem).title === "string"

/**
 * A work as some list already in the cache knows it (library, backlog,
 * recent, search, trending…): enough to draw a detail page's cover and
 * title while its details load. Looks a few levels deep, nothing more.
 */
export function findCachedItem(
  queryClient: QueryClient,
  type: MediaType,
  id: string
): CachedItem | undefined {
  const visit = (value: unknown, depth: number): CachedItem | undefined => {
    if (isItem(value, type, id)) return value
    if (depth === 0 || typeof value !== "object" || value === null) return
    for (const child of Array.isArray(value) ? value : Object.values(value)) {
      if (typeof child !== "object" || child === null) continue
      const found = visit(child, depth - 1)
      if (found) return found
    }
  }
  for (const query of queryClient.getQueryCache().getAll()) {
    const found = visit(query.state.data, 4)
    if (found) return found
  }
}

/** The kind and id a detail URL points at ("/shows/1399/seasons/2" → show 1399). */
export function detailTarget(pathname: string) {
  const match = /^\/(movies|shows|games|books|records)\/([^/]+)/.exec(pathname)
  if (!match) return undefined
  const type = (
    {
      movies: "movie",
      shows: "show",
      games: "game",
      books: "book",
      records: "record",
    } as const
  )[match[1] as "movies"]
  return { type, id: decodeURIComponent(match[2]!) }
}
