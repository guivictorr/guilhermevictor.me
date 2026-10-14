import { z } from "zod"
import { ImageRef, MediaType, WorkId } from "./common"

/** Lightweight shape used by search results, rails and library cards. */
export const MediaSummary = z.object({
  type: MediaType,
  /** Provider id: TMDB, IGDB, Discogs (numbers) or Google Books (string). */
  id: WorkId,
  title: z.string(),
  /** Secondary line, e.g. the artist for records. */
  subtitle: z.string().optional(),
  /** Records: what tells pressings apart (label, cat#, country, format, color). */
  pressing: z
    .object({
      label: z.string().optional(),
      catno: z.string().optional(),
      country: z.string().optional(),
      format: z.array(z.string()),
      /** Free-text format notes, usually the vinyl color. */
      variant: z.string().optional(),
    })
    .optional(),
  year: z.number().int().optional(),
  poster: ImageRef.optional(),
  overview: z.string().optional(),
})
export type MediaSummary = z.infer<typeof MediaSummary>

/** Provider community score, normalized to 0–5 so it sits next to our stars. */
export const ProviderRating = z.object({
  source: z.enum(["tmdb", "igdb", "discogs", "googlebooks"]),
  value: z.number().min(0).max(5),
  count: z.number().int().optional(),
})
export type ProviderRating = z.infer<typeof ProviderRating>

export const Person = z.object({
  id: z.number().int(),
  name: z.string(),
  /** Character for cast, job(s) for crew. */
  role: z.string().optional(),
  photo: ImageRef.optional(),
})
export type Person = z.infer<typeof Person>

export const Credits = z.object({
  cast: z.array(Person),
  crew: z.array(Person),
})
export type Credits = z.infer<typeof Credits>

/** Only YouTube videos are kept; `key` is the YouTube video id. */
export const Video = z.object({
  key: z.string(),
  name: z.string(),
  kind: z.string().optional(),
})
export type Video = z.infer<typeof Video>

export const CollectionRef = z.object({
  id: z.number().int(),
  name: z.string(),
})
export type CollectionRef = z.infer<typeof CollectionRef>

export const Collection = CollectionRef.extend({
  overview: z.string().optional(),
  parts: z.array(MediaSummary),
})
export type Collection = z.infer<typeof Collection>

export const Movie = z.object({
  type: z.literal("movie"),
  id: z.number().int(),
  imdbId: z.string().optional(),
  title: z.string(),
  originalTitle: z.string().optional(),
  status: z.string().optional(),
  releaseDate: z.string().optional(),
  year: z.number().int().optional(),
  runtime: z.number().int().optional(),
  overview: z.string().optional(),
  tagline: z.string().optional(),
  genres: z.array(z.string()),
  countries: z.array(z.string()),
  companies: z.array(z.string()),
  directors: z.array(z.string()),
  writers: z.array(z.string()),
  credits: Credits,
  providerRating: ProviderRating.optional(),
  trailer: Video.optional(),
  collection: CollectionRef.optional(),
  recommendations: z.array(MediaSummary),
  poster: ImageRef.optional(),
  backdrop: ImageRef.optional(),
})
export type Movie = z.infer<typeof Movie>

export const SeasonSummary = z.object({
  seasonNumber: z.number().int(),
  name: z.string(),
  episodeCount: z.number().int(),
  airDate: z.string().optional(),
  poster: ImageRef.optional(),
})
export type SeasonSummary = z.infer<typeof SeasonSummary>

export const Show = z.object({
  type: z.literal("show"),
  id: z.number().int(),
  imdbId: z.string().optional(),
  title: z.string(),
  originalTitle: z.string().optional(),
  firstAirDate: z.string().optional(),
  lastAirDate: z.string().optional(),
  year: z.number().int().optional(),
  status: z.string().optional(),
  overview: z.string().optional(),
  tagline: z.string().optional(),
  genres: z.array(z.string()),
  countries: z.array(z.string()),
  companies: z.array(z.string()),
  creators: z.array(z.string()),
  networks: z.array(z.string()),
  episodeCount: z.number().int().optional(),
  credits: Credits,
  providerRating: ProviderRating.optional(),
  trailer: Video.optional(),
  recommendations: z.array(MediaSummary),
  poster: ImageRef.optional(),
  backdrop: ImageRef.optional(),
  seasons: z.array(SeasonSummary),
})
export type Show = z.infer<typeof Show>

export const Episode = z.object({
  episodeNumber: z.number().int(),
  name: z.string(),
  airDate: z.string().optional(),
  runtime: z.number().int().optional(),
  overview: z.string().optional(),
  still: ImageRef.optional(),
})
export type Episode = z.infer<typeof Episode>

export const Season = SeasonSummary.extend({
  showId: z.number().int(),
  overview: z.string().optional(),
  episodes: z.array(Episode),
})
export type Season = z.infer<typeof Season>

/** HowLongToBeat-style estimates from IGDB, in hours. */
export const TimeToBeat = z.object({
  main: z.number().optional(),
  extra: z.number().optional(),
  completionist: z.number().optional(),
})
export type TimeToBeat = z.infer<typeof TimeToBeat>

export const Game = z.object({
  type: z.literal("game"),
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  releaseDate: z.string().optional(),
  year: z.number().int().optional(),
  summary: z.string().optional(),
  genres: z.array(z.string()),
  platforms: z.array(z.string()),
  developers: z.array(z.string()),
  publishers: z.array(z.string()),
  providerRating: ProviderRating.optional(),
  timeToBeat: TimeToBeat.optional(),
  /** Store ids (e.g. `{ steam: "292030" }`), for matching games elsewhere. */
  externalIds: z.record(z.string(), z.string()).default({}),
  videos: z.array(Video),
  similar: z.array(MediaSummary),
  cover: ImageRef.optional(),
  screenshots: z.array(ImageRef),
})
export type Game = z.infer<typeof Game>

/** "Written-By – Baptista, Lee"; `tracks` scopes a release-level credit ("A1 to A3"). */
export const Credit = z.object({
  role: z.string(),
  names: z.array(z.string()),
  tracks: z.string().optional(),
})
export type Credit = z.infer<typeof Credit>

export const Track = z.object({
  /** Headings ("Side A") and index tracks group the real tracks. */
  kind: z.enum(["track", "heading", "index"]),
  position: z.string(),
  title: z.string(),
  duration: z.string().optional(),
  /** Track-specific artists (e.g. "feat.") and credits. */
  artists: z.array(z.string()),
  credits: z.array(Credit),
  /** Parts of an index track (medleys, suites). */
  subTracks: z
    .array(
      z.object({
        position: z.string(),
        title: z.string(),
        duration: z.string().optional(),
      })
    )
    .optional(),
})
export type Track = z.infer<typeof Track>

/** Pressing plants, copyright holders, studios… */
export const Company = z.object({
  role: z.string(),
  name: z.string(),
  catno: z.string().optional(),
})
export type Company = z.infer<typeof Company>

/** Barcode, matrix/runout etchings, rights society… */
export const Identifier = z.object({
  type: z.string(),
  description: z.string().optional(),
  value: z.string(),
})
export type Identifier = z.infer<typeof Identifier>

/** A Discogs release (a specific pressing). Named Release to avoid TS's Record. */
export const Release = z.object({
  type: z.literal("record"),
  /** Discogs release id. */
  id: z.number().int(),
  masterId: z.number().int().optional(),
  title: z.string(),
  artists: z.array(z.string()),
  year: z.number().int().optional(),
  released: z.string().optional(),
  country: z.string().optional(),
  labels: z.array(z.object({ name: z.string(), catno: z.string().optional() })),
  /** Human format line, e.g. "Vinyl, LP, Album, Reissue, 180 Gram, Light Green". */
  format: z.string().optional(),
  genres: z.array(z.string()),
  styles: z.array(z.string()),
  tracklist: z.array(Track),
  credits: z.array(Credit),
  companies: z.array(Company),
  identifiers: z.array(Identifier),
  notes: z.string().optional(),
  series: z.array(z.string()),
  videos: z.array(Video),
  providerRating: ProviderRating.optional(),
  community: z
    .object({ have: z.number().int(), want: z.number().int() })
    .optional(),
  forSale: z.number().int().optional(),
  lowestPrice: z.number().optional(),
  discogsUrl: z.string().optional(),
  cover: ImageRef.optional(),
  images: z.array(ImageRef),
})
export type Release = z.infer<typeof Release>

/** One pressing of a master release ("Other versions"). */
export const ReleaseVersion = z.object({
  id: z.number().int(),
  title: z.string(),
  format: z.string().optional(),
  label: z.string().optional(),
  catno: z.string().optional(),
  country: z.string().optional(),
  year: z.number().int().optional(),
  thumb: ImageRef.optional(),
  have: z.number().int().optional(),
  want: z.number().int().optional(),
})
export type ReleaseVersion = z.infer<typeof ReleaseVersion>

export const MasterRelease = z.object({
  id: z.number().int(),
  /** Year of the original release. */
  year: z.number().int().optional(),
  mainReleaseId: z.number().int().optional(),
  versions: z.array(ReleaseVersion),
  totalVersions: z.number().int(),
})
export type MasterRelease = z.infer<typeof MasterRelease>

/**
 * A book as a Google Books volume (a specific edition, so translations are
 * separate books).
 */
export const Book = z.object({
  type: z.literal("book"),
  /** Google Books volume id. */
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  authors: z.array(z.string()),
  publisher: z.string().optional(),
  /** "2005", "2005-06" or "2005-06-14". */
  publishedDate: z.string().optional(),
  year: z.number().int().optional(),
  description: z.string().optional(),
  categories: z.array(z.string()),
  pages: z.number().int().optional(),
  /** ISO 639-1, e.g. "pt". */
  language: z.string().optional(),
  isbn13: z.string().optional(),
  isbn10: z.string().optional(),
  providerRating: ProviderRating.optional(),
  /** Google Books page for the volume. */
  infoLink: z.string().optional(),
  cover: ImageRef.optional(),
})
export type Book = z.infer<typeof Book>
