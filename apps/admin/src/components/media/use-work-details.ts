import { useQuery } from "@tanstack/react-query"
import type {
  ImageRef,
  ProviderRating,
  Release,
  SeasonSummary,
} from "@workspace/schemas"
import { formatRuntime, joinDefined } from "@/lib/format"
import type { LibraryItemInput } from "@/lib/repo"
import {
  bookQuery,
  gameQuery,
  movieQuery,
  releaseQuery,
  showQuery,
} from "@/queries/media"

/*
 * The provider facts worth a glance for any work, from its kind's detail
 * query (cached for an hour). Used by the swipe view and Home's cards.
 */

export type WorkDetails = {
  /** One short line: runtime · director, platforms, author · pages… */
  facts?: string
  provider?: ProviderRating
  /** For the game log form. */
  platforms: Array<string>
  /** Platforms (icons later) or a record's format, as tags: never truncated. */
  tags: Array<string>
  seasons: Array<SeasonSummary>
  release?: Release
  /** A wide image for blurred backgrounds: backdrop, screenshot, photo. */
  backdrop?: ImageRef
}

/** The provider facts worth a glance, from the kind's detail query. */
export function useWorkDetails(item: LibraryItemInput): WorkDetails {
  const id = Number(item.id)
  const movie = useQuery({ ...movieQuery(id), enabled: item.type === "movie" })
  const show = useQuery({ ...showQuery(id), enabled: item.type === "show" })
  const game = useQuery({ ...gameQuery(id), enabled: item.type === "game" })
  const book = useQuery({
    ...bookQuery(String(item.id)),
    enabled: item.type === "book",
  })
  const release = useQuery({
    ...releaseQuery(id),
    enabled: item.type === "record",
  })
  const none = { platforms: [], tags: [], seasons: [] }
  switch (item.type) {
    case "movie": {
      const m = movie.data
      return {
        ...none,
        facts: joinDefined([formatRuntime(m?.runtime), m?.directors.at(0)]),
        provider: m?.providerRating,
        backdrop: m?.backdrop,
      }
    }
    case "show": {
      const s = show.data
      const count = s?.seasons.filter((x) => x.seasonNumber > 0).length
      return {
        ...none,
        facts: joinDefined([
          count === undefined
            ? undefined
            : `${count} season${count === 1 ? "" : "s"}`,
          s?.networks.at(0),
        ]),
        provider: s?.providerRating,
        seasons: s?.seasons ?? [],
        backdrop: s?.backdrop,
      }
    }
    case "game": {
      const g = game.data
      return {
        ...none,
        facts: g?.developers.at(0),
        provider: g?.providerRating,
        platforms: g?.platforms ?? [],
        tags: g?.platforms ?? [],
        backdrop: g?.screenshots.at(0),
      }
    }
    case "book": {
      const b = book.data
      return {
        ...none,
        facts: joinDefined([
          b?.authors.slice(0, 2).join(", "),
          b?.pages ? `${b.pages} pages` : undefined,
        ]),
        provider: b?.providerRating,
      }
    }
    case "record": {
      const r = release.data
      return {
        ...none,
        facts: r?.labels[0]?.name,
        tags: r?.format?.split(/,\s*/) ?? [],
        provider: r?.providerRating,
        release: r,
        backdrop: r?.images.at(1),
      }
    }
  }
}
