import type { MediaType } from "@workspace/schemas"
import { z } from "zod"

/*
 * Search filters for every kind, as URL search params. With a query they
 * narrow the provider's search; without one they browse (TMDB discover,
 * IGDB/Discogs/Google Books queries built from the filters alone).
 *
 * The router parses number-like params as numbers, so text fields coerce.
 */

const text = z.coerce
  .string()
  .trim()
  .min(1)
  .max(100)
  .optional()
  .catch(undefined)
const year = z.coerce
  .number()
  .int()
  .min(1800)
  .max(2100)
  .optional()
  .catch(undefined)

export const SearchFilters = z.object({
  /** Provider genre id (TMDB/IGDB), Discogs genre or Google Books subject. */
  genre: text,
  /** Release year range. */
  from: year,
  to: year,
  /** Minimum community rating, 0–5 stars. */
  rating: z.coerce.number().min(0).max(5).optional().catch(undefined),
  /** ISO 639-1: original language (movies/shows), edition language (books). */
  lang: text,
  sort: text,
  /** TMDB watch provider id (streaming service). */
  provider: text,
  /** Shows: TMDB status id. */
  status: text,
  /** Movies: runtime bucket. */
  runtime: text,
  // Games (IGDB ids)
  platform: text,
  theme: text,
  mode: text,
  /** "1" includes DLC, expansions, bundles… (main games only by default). */
  extras: text,
  // Records (Discogs)
  artist: text,
  label: text,
  style: text,
  country: text,
  format: text,
  // Books (Google Books)
  author: text,
  publisher: text,
})
export type SearchFilters = z.infer<typeof SearchFilters>
export type FilterKey = keyof SearchFilters

type Option = { value: string; label: string }

const options = (list: Array<[number | string, string]>): Array<Option> =>
  list.map(([value, label]) => ({ value: String(value), label }))

export const MOVIE_GENRES = options([
  [28, "Action"],
  [12, "Adventure"],
  [16, "Animation"],
  [35, "Comedy"],
  [80, "Crime"],
  [99, "Documentary"],
  [18, "Drama"],
  [10751, "Family"],
  [14, "Fantasy"],
  [36, "History"],
  [27, "Horror"],
  [10402, "Music"],
  [9648, "Mystery"],
  [10749, "Romance"],
  [878, "Science Fiction"],
  [10770, "TV Movie"],
  [53, "Thriller"],
  [10752, "War"],
  [37, "Western"],
])

export const SHOW_GENRES = options([
  [10759, "Action & Adventure"],
  [16, "Animation"],
  [35, "Comedy"],
  [80, "Crime"],
  [99, "Documentary"],
  [18, "Drama"],
  [10751, "Family"],
  [10762, "Kids"],
  [9648, "Mystery"],
  [10763, "News"],
  [10764, "Reality"],
  [10765, "Sci-Fi & Fantasy"],
  [10766, "Soap"],
  [10767, "Talk"],
  [10768, "War & Politics"],
  [37, "Western"],
])

export const SHOW_STATUS = options([
  [0, "Returning"],
  [3, "Ended"],
  [4, "Canceled"],
  [2, "In production"],
])

export const RUNTIMES = options([
  ["short", "Under 90 min"],
  ["standard", "90–150 min"],
  ["long", "Over 150 min"],
])

export const TMDB_SORTS = options([
  ["popular", "Most popular"],
  ["rating", "Highest rated"],
  ["newest", "Newest"],
  ["oldest", "Oldest"],
])

export const LANGUAGES = options([
  ["en", "English"],
  ["pt", "Portuguese"],
  ["es", "Spanish"],
  ["fr", "French"],
  ["de", "German"],
  ["it", "Italian"],
  ["ja", "Japanese"],
  ["ko", "Korean"],
  ["zh", "Chinese"],
  ["hi", "Hindi"],
  ["ru", "Russian"],
  ["sv", "Swedish"],
  ["da", "Danish"],
  ["no", "Norwegian"],
  ["nl", "Dutch"],
  ["pl", "Polish"],
  ["tr", "Turkish"],
])

export const GAME_GENRES = options([
  [31, "Adventure"],
  [33, "Arcade"],
  [35, "Card & Board Game"],
  [4, "Fighting"],
  [25, "Hack and slash"],
  [32, "Indie"],
  [36, "MOBA"],
  [7, "Music"],
  [30, "Pinball"],
  [8, "Platform"],
  [2, "Point-and-click"],
  [9, "Puzzle"],
  [26, "Quiz/Trivia"],
  [10, "Racing"],
  [11, "Real-time strategy"],
  [12, "Role-playing (RPG)"],
  [5, "Shooter"],
  [13, "Simulator"],
  [14, "Sport"],
  [15, "Strategy"],
  [24, "Tactical"],
  [16, "Turn-based strategy"],
  [34, "Visual Novel"],
])

export const GAME_THEMES = options([
  [1, "Action"],
  [28, "Business"],
  [27, "Comedy"],
  [31, "Drama"],
  [34, "Educational"],
  [17, "Fantasy"],
  [22, "Historical"],
  [19, "Horror"],
  [35, "Kids"],
  [43, "Mystery"],
  [38, "Open world"],
  [40, "Party"],
  [44, "Romance"],
  [33, "Sandbox"],
  [18, "Science fiction"],
  [23, "Stealth"],
  [21, "Survival"],
  [20, "Thriller"],
  [39, "Warfare"],
  [41, "4X"],
])

export const GAME_MODES = options([
  [1, "Single player"],
  [2, "Multiplayer"],
  [3, "Co-operative"],
  [4, "Split screen"],
  [5, "MMO"],
  [6, "Battle Royale"],
])

/** Common platforms (IGDB ids), current generation first. */
export const PLATFORMS = options([
  [6, "PC (Windows)"],
  [167, "PlayStation 5"],
  [169, "Xbox Series X|S"],
  [130, "Nintendo Switch"],
  [508, "Nintendo Switch 2"],
  [48, "PlayStation 4"],
  [49, "Xbox One"],
  [14, "Mac"],
  [3, "Linux"],
  [39, "iOS"],
  [34, "Android"],
  [9, "PlayStation 3"],
  [12, "Xbox 360"],
  [41, "Wii U"],
  [5, "Wii"],
  [37, "Nintendo 3DS"],
  [20, "Nintendo DS"],
  [8, "PlayStation 2"],
  [7, "PlayStation"],
  [11, "Xbox"],
  [21, "GameCube"],
  [4, "Nintendo 64"],
  [19, "SNES"],
  [18, "NES"],
  [24, "Game Boy Advance"],
  [33, "Game Boy"],
  [29, "Sega Mega Drive"],
])

export const GAME_SORTS = options([
  ["popular", "Most popular"],
  ["rating", "Highest rated"],
  ["newest", "Newest"],
])

export const RECORD_GENRES = options(
  [
    "Rock",
    "Electronic",
    "Pop",
    "Jazz",
    "Funk / Soul",
    "Hip Hop",
    "Latin",
    "Folk, World, & Country",
    "Classical",
    "Reggae",
    "Blues",
    "Stage & Screen",
    "Non-Music",
    "Children's",
  ].map((g) => [g, g])
)

export const RECORD_FORMATS = options([
  ["Vinyl", "Vinyl"],
  ["CD", "CD"],
  ["Cassette", "Cassette"],
  ["Box Set", "Box set"],
  ["all", "Any format"],
])

export const BOOK_SUBJECTS = options(
  [
    "Fiction",
    "Science Fiction",
    "Fantasy",
    "Mystery",
    "Romance",
    "Biography & Autobiography",
    "History",
    "Philosophy",
    "Psychology",
    "Science",
    "Business & Economics",
    "Self-Help",
    "Comics & Graphic Novels",
    "Poetry",
    "Travel",
    "Cooking",
    "Art",
    "Juvenile Fiction",
  ].map((s) => [s, s])
)

export const BOOK_SORTS = options([
  ["relevance", "Most relevant"],
  ["newest", "Newest"],
])

export type FilterField =
  | {
      key: FilterKey
      label: string
      control: "select"
      options: Array<Option>
      /** Only applies when browsing (no search text). */
      browseOnly?: boolean
    }
  | {
      key: FilterKey
      label: string
      control: "text"
      placeholder?: string
    }
  | { key: "from"; label: string; control: "years" }
  | { key: "rating"; label: string; control: "rating" }
  | { key: "extras"; label: string; control: "toggle"; description: string }
  | {
      key: "provider"
      label: string
      control: "providers"
      browseOnly: true
    }

const tmdbFields = (genres: Array<Option>): Array<FilterField> => [
  { key: "genre", label: "Genre", control: "select", options: genres },
  { key: "from", label: "Released", control: "years" },
  { key: "rating", label: "Rating", control: "rating" },
  {
    key: "lang",
    label: "Original language",
    control: "select",
    options: LANGUAGES,
  },
  {
    key: "provider",
    label: "Streaming on",
    control: "providers",
    browseOnly: true,
  },
]

export const FILTER_FIELDS: Record<MediaType, Array<FilterField>> = {
  movie: [
    ...tmdbFields(MOVIE_GENRES),
    {
      key: "runtime",
      label: "Runtime",
      control: "select",
      options: RUNTIMES,
      browseOnly: true,
    },
    {
      key: "sort",
      label: "Sort by",
      control: "select",
      options: TMDB_SORTS,
    },
  ],
  show: [
    ...tmdbFields(SHOW_GENRES),
    {
      key: "status",
      label: "Status",
      control: "select",
      options: SHOW_STATUS,
      browseOnly: true,
    },
    {
      key: "sort",
      label: "Sort by",
      control: "select",
      options: TMDB_SORTS,
    },
  ],
  game: [
    {
      key: "platform",
      label: "Platform",
      control: "select",
      options: PLATFORMS,
    },
    { key: "genre", label: "Genre", control: "select", options: GAME_GENRES },
    { key: "theme", label: "Theme", control: "select", options: GAME_THEMES },
    { key: "mode", label: "Mode", control: "select", options: GAME_MODES },
    { key: "from", label: "Released", control: "years" },
    { key: "rating", label: "Rating", control: "rating" },
    {
      key: "extras",
      label: "Include DLC and editions",
      control: "toggle",
      description: "Expansions, bundles, ports and other versions",
    },
    {
      key: "sort",
      label: "Sort by",
      control: "select",
      options: GAME_SORTS,
      browseOnly: true,
    },
  ],
  book: [
    {
      key: "author",
      label: "Author",
      control: "text",
      placeholder: "Clarice Lispector",
    },
    {
      key: "genre",
      label: "Subject",
      control: "select",
      options: BOOK_SUBJECTS,
    },
    {
      key: "publisher",
      label: "Publisher",
      control: "text",
      placeholder: "Companhia das Letras",
    },
    { key: "lang", label: "Language", control: "select", options: LANGUAGES },
    { key: "sort", label: "Sort by", control: "select", options: BOOK_SORTS },
  ],
  record: [
    {
      key: "artist",
      label: "Artist",
      control: "text",
      placeholder: "Gal Costa",
    },
    { key: "label", label: "Label", control: "text", placeholder: "Philips" },
    { key: "genre", label: "Genre", control: "select", options: RECORD_GENRES },
    { key: "style", label: "Style", control: "text", placeholder: "MPB" },
    { key: "from", label: "Year", control: "years" },
    {
      key: "country",
      label: "Country",
      control: "text",
      placeholder: "Brazil",
    },
    {
      key: "format",
      label: "Format",
      control: "select",
      options: RECORD_FORMATS,
    },
  ],
}

/** Keys that count as an active filter for a kind ("to" goes with "from"). */
export function activeFilters(
  type: MediaType,
  filters: SearchFilters
): Array<FilterKey> {
  return FILTER_FIELDS[type].flatMap((field) => {
    if (field.key === "from")
      return filters.from !== undefined || filters.to !== undefined
        ? ["from" as const]
        : []
    return filters[field.key] !== undefined ? [field.key] : []
  })
}

/** Only the filters that apply to `type`, so switching kinds doesn't leak. */
export function filtersFor(
  type: MediaType,
  filters: SearchFilters
): SearchFilters {
  const keys = new Set<FilterKey>(
    FILTER_FIELDS[type].flatMap((f) =>
      f.key === "from" ? (["from", "to"] as const) : [f.key]
    )
  )
  return Object.fromEntries(
    [...keys].flatMap((key) =>
      filters[key] === undefined ? [] : [[key, filters[key]]]
    )
  )
}
