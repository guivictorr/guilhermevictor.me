import { z } from "zod"
import { CollectionItem } from "./collection"
import { Flight } from "./flight"
import {
  ImageRef,
  IsoDate,
  IsoDateTime,
  MediaType,
  Rating,
  WorkId,
} from "./common"

/*
 * Log fields are placeholders until the per-type column spec is defined.
 * Keep input schemas (what forms submit) separate from stored schemas
 * (input + id/timestamps) so the future API can reuse the inputs as-is.
 */

const optionalText = z.string().trim().max(5000).optional()

const finishAfterStart = <
  T extends z.ZodType<{ startedAt?: string; finishedAt?: string }>,
>(
  schema: T
) =>
  schema.refine(
    (v) => !v.startedAt || !v.finishedAt || v.startedAt <= v.finishedAt,
    {
      message: "Finish date must be after start date",
      path: ["finishedAt"],
    }
  )

const stored = {
  id: z.uuid(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
}

const movieLogFields = z.object({
  kind: z.literal("movie"),
  mediaId: z.number().int(),
  /** Missing = you don't remember when (e.g. imported history). */
  watchedAt: IsoDate.optional(),
  rating: Rating.optional(),
  rewatch: z.boolean(),
  notes: optionalText,
})

/** The whole show at once, when you don't track it season by season. */
const showLogFields = z.object({
  kind: z.literal("show"),
  mediaId: z.number().int(),
  startedAt: IsoDate.optional(),
  finishedAt: IsoDate.optional(),
  rating: Rating.optional(),
  rewatch: z.boolean(),
  notes: optionalText,
})

const seasonLogFields = z.object({
  kind: z.literal("season"),
  mediaId: z.number().int(),
  seasonNumber: z.number().int().min(0),
  startedAt: IsoDate.optional(),
  finishedAt: IsoDate.optional(),
  rating: Rating.optional(),
  rewatch: z.boolean(),
  notes: optionalText,
})

/** finished = main story done; completed = 100%. */
export const GameStatus = z.enum([
  "playing",
  "finished",
  "completed",
  "paused",
  "abandoned",
])
export type GameStatus = z.infer<typeof GameStatus>

const gameLogFields = z.object({
  kind: z.literal("game"),
  mediaId: z.number().int(),
  status: GameStatus,
  platform: z.string().optional(),
  startedAt: IsoDate.optional(),
  finishedAt: IsoDate.optional(),
  hoursPlayed: z.number().min(0).max(100000).optional(),
  rating: Rating.optional(),
  notes: optionalText,
})

export const BookStatus = z.enum(["reading", "finished", "abandoned"])
export type BookStatus = z.infer<typeof BookStatus>

export const BookFormat = z.enum(["physical", "ebook", "audiobook"])
export type BookFormat = z.infer<typeof BookFormat>

const bookLogFields = z.object({
  kind: z.literal("book"),
  /** Google Books volume id. */
  mediaId: z.string(),
  status: BookStatus,
  format: BookFormat.optional(),
  startedAt: IsoDate.optional(),
  finishedAt: IsoDate.optional(),
  rating: Rating.optional(),
  reread: z.boolean(),
  notes: optionalText,
})

/** A listening session of a copy you own. */
const recordLogFields = z.object({
  kind: z.literal("record"),
  /** Discogs release id. */
  mediaId: z.number().int(),
  /** The copy you played (a row in `records`). */
  copyId: z.uuid(),
  playedAt: IsoDate.optional(),
  rating: Rating.optional(),
  notes: optionalText,
})

export const MovieLogInput = movieLogFields
export const RecordLogInput = recordLogFields
export const ShowLogInput = finishAfterStart(showLogFields)
export const BookLogInput = finishAfterStart(bookLogFields)
export type BookLogInput = z.infer<typeof BookLogInput>
export type ShowLogInput = z.infer<typeof ShowLogInput>
export type RecordLogInput = z.infer<typeof RecordLogInput>
export const SeasonLogInput = finishAfterStart(seasonLogFields)
export const GameLogInput = finishAfterStart(gameLogFields)
export type MovieLogInput = z.infer<typeof MovieLogInput>
export type SeasonLogInput = z.infer<typeof SeasonLogInput>
export type GameLogInput = z.infer<typeof GameLogInput>

export const LogInput = z.union([
  MovieLogInput,
  SeasonLogInput,
  GameLogInput,
  RecordLogInput,
  ShowLogInput,
  BookLogInput,
])
export type LogInput = z.infer<typeof LogInput>

export const MovieLog = movieLogFields.extend(stored)
export const SeasonLog = finishAfterStart(seasonLogFields.extend(stored))
export const ShowLog = finishAfterStart(showLogFields.extend(stored))
export const BookLog = finishAfterStart(bookLogFields.extend(stored))
export type BookLog = z.infer<typeof BookLog>
export type ShowLog = z.infer<typeof ShowLog>
export const GameLog = finishAfterStart(gameLogFields.extend(stored))
export const RecordLog = recordLogFields.extend(stored)
export type RecordLog = z.infer<typeof RecordLog>
export type MovieLog = z.infer<typeof MovieLog>
export type SeasonLog = z.infer<typeof SeasonLog>
export type GameLog = z.infer<typeof GameLog>

export const LogEntry = z.union([
  MovieLog,
  ShowLog,
  SeasonLog,
  GameLog,
  BookLog,
  RecordLog,
])
export type LogEntry = z.infer<typeof LogEntry>

/**
 * Denormalized snapshot of a work saved when it is first logged,
 * so library screens render without hitting TMDB/IGDB.
 */
export const LibraryItem = z.object({
  type: MediaType,
  id: WorkId,
  title: z.string(),
  subtitle: z.string().optional(),
  year: z.number().int().optional(),
  poster: ImageRef.optional(),
  genres: z.array(z.string()),
  addedAt: IsoDateTime,
})
export type LibraryItem = z.infer<typeof LibraryItem>

/** Something to watch/play later. Any media type; removed once it's logged. */
export const BacklogItem = LibraryItem
export type BacklogItem = z.infer<typeof BacklogItem>

/**
 * Export format v1 (before the database). Still read for data left in the
 * browser and produced by the Obsidian importer until it moves to v2.
 */
export const LegacyArchiveExport = z.object({
  version: z.literal(1),
  exportedAt: IsoDateTime,
  items: z.array(LibraryItem),
  logs: z.array(LogEntry),
  backlog: z.array(BacklogItem).default([]),
  collection: z.array(CollectionItem).default([]),
  flights: z.array(Flight).default([]),
})
export type LegacyArchiveExport = z.infer<typeof LegacyArchiveExport>
