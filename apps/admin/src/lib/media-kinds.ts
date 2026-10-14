import type { MediaType } from "@workspace/schemas"
import type { LucideIcon } from "lucide-react"
import {
  BookOpenIcon,
  ClapperboardIcon,
  Disc3Icon,
  Gamepad2Icon,
  TvIcon,
} from "lucide-react"

/**
 * Everything the UI needs to know about each archive kind, in one place.
 * Adding a kind (books, flights…) starts here; TypeScript then points at
 * every screen that still needs to handle it.
 */
export type KindConfig = {
  label: string
  plural: string
  icon: LucideIcon
  /** Library route. */
  to: "/movies" | "/shows" | "/games" | "/books" | "/records"
  /** Cover shape: posters are 2:3, album art is square. */
  aspect: "poster" | "square"
  provider: string
}

export const KINDS: Record<MediaType, KindConfig> = {
  movie: {
    label: "Movie",
    plural: "Movies",
    icon: ClapperboardIcon,
    to: "/movies",
    aspect: "poster",
    provider: "TMDB",
  },
  show: {
    label: "Show",
    plural: "Shows",
    icon: TvIcon,
    to: "/shows",
    aspect: "poster",
    provider: "TMDB",
  },
  game: {
    label: "Game",
    plural: "Games",
    icon: Gamepad2Icon,
    to: "/games",
    aspect: "poster",
    provider: "IGDB",
  },
  book: {
    label: "Book",
    plural: "Books",
    icon: BookOpenIcon,
    to: "/books",
    aspect: "poster",
    provider: "Open Library",
  },
  record: {
    label: "Record",
    plural: "Records",
    icon: Disc3Icon,
    to: "/records",
    aspect: "square",
    provider: "Discogs",
  },
}

export const KIND_ORDER: Array<MediaType> = [
  "movie",
  "show",
  "game",
  "book",
  "record",
]
