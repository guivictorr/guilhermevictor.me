import { z } from "zod"
import { CollectionItemInput, Money } from "./collection"
import { ImageRef, IsoDateTime } from "./common"
import { Flight } from "./flight"
import { LogEntry } from "./log"
import { Book, Game, Movie, Release, Season, Show } from "./media"

/*
 * What the database stores per work, and the export file format (v2).
 * One table per kind. Each row is a work in your archive: logged, in the
 * backlog (`backlogAddedAt`), or for records an owned copy. `data` keeps the
 * provider details (minus recommendations/videos) so pages work when the
 * provider is down; the other fields are a snapshot used until `data` exists.
 */

const work = {
  title: z.string(),
  /** Author(s) for books, artist for records. */
  subtitle: z.string().optional(),
  year: z.number().int().optional(),
  poster: ImageRef.optional(),
  genres: z.array(z.string()),
  /** Set while the work is in the backlog. */
  backlogAddedAt: IsoDateTime.optional(),
  addedAt: IsoDateTime,
  /** When `data` was last fetched from the provider. */
  fetchedAt: IsoDateTime.optional(),
}

export const MovieRow = z.object({
  id: z.number().int(),
  ...work,
  data: Movie.optional(),
})
export type MovieRow = z.infer<typeof MovieRow>

export const ShowRow = z.object({
  id: z.number().int(),
  ...work,
  data: Show.optional(),
  /** Episodes of the seasons you logged. */
  seasons: z.array(Season).default([]),
})
export type ShowRow = z.infer<typeof ShowRow>

export const GameRow = z.object({
  id: z.number().int(),
  ...work,
  data: Game.optional(),
})
export type GameRow = z.infer<typeof GameRow>

export const BookRow = z.object({
  id: z.number().int(),
  ...work,
  data: Book.optional(),
})
export type BookRow = z.infer<typeof BookRow>

/**
 * One physical copy, or a release you want (`backlogAddedAt` set, no copy
 * fields). Two copies of the same pressing are two rows.
 */
export const RecordRow = CollectionItemInput.extend({
  id: z.uuid(),
  /** Discogs release id. */
  releaseId: z.number().int(),
  title: z.string(),
  artist: z.string(),
  year: z.number().int().optional(),
  format: z.string().optional(),
  label: z.string().optional(),
  catno: z.string().optional(),
  genres: z.array(z.string()),
  styles: z.array(z.string()),
  cover: ImageRef.optional(),
  rating: z.number().int().min(1).max(10).optional(),
  folder: z.string().optional(),
  discogsInstanceId: z.number().int().optional(),
  price: Money.optional(),
  backlogAddedAt: IsoDateTime.optional(),
  addedAt: IsoDateTime,
  updatedAt: IsoDateTime,
  fetchedAt: IsoDateTime.optional(),
  data: Release.optional(),
})
export type RecordRow = z.infer<typeof RecordRow>

export const ArchiveExport = z.object({
  version: z.literal(2),
  exportedAt: IsoDateTime,
  movies: z.array(MovieRow).default([]),
  shows: z.array(ShowRow).default([]),
  games: z.array(GameRow).default([]),
  books: z.array(BookRow).default([]),
  records: z.array(RecordRow).default([]),
  logs: z.array(LogEntry).default([]),
  flights: z.array(Flight).default([]),
})
export type ArchiveExport = z.infer<typeof ArchiveExport>
