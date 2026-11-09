import type { MediaType } from "@workspace/schemas"

/** Each kind's detail page (typed for `Link`/`navigate`). */
export const DETAIL_ROUTE = {
  movie: "/movies/$id",
  show: "/shows/$id",
  game: "/games/$id",
  book: "/books/$id",
  record: "/records/$id",
} as const satisfies Record<MediaType, string>
