import { z } from "zod"
import { CollectionItem } from "./collection"
import { ImageRef, IsoDate, IsoDateTime, MediaType, Rating } from "./common"

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
  watchedAt: IsoDate,
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

/** A listening session for a record. */
const recordLogFields = z.object({
  kind: z.literal("record"),
  mediaId: z.number().int(),
  playedAt: IsoDate,
  rating: Rating.optional(),
  notes: optionalText,
})

export const MovieLogInput = movieLogFields
export const RecordLogInput = recordLogFields
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
])
export type LogInput = z.infer<typeof LogInput>

export const MovieLog = movieLogFields.extend(stored)
export const SeasonLog = finishAfterStart(seasonLogFields.extend(stored))
export const GameLog = finishAfterStart(gameLogFields.extend(stored))
export const RecordLog = recordLogFields.extend(stored)
export type RecordLog = z.infer<typeof RecordLog>
export type MovieLog = z.infer<typeof MovieLog>
export type SeasonLog = z.infer<typeof SeasonLog>
export type GameLog = z.infer<typeof GameLog>

export const LogEntry = z.union([MovieLog, SeasonLog, GameLog, RecordLog])
export type LogEntry = z.infer<typeof LogEntry>

/**
 * Denormalized snapshot of a work saved when it is first logged,
 * so library screens render without hitting TMDB/IGDB.
 */
export const LibraryItem = z.object({
  type: MediaType,
  id: z.number().int(),
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

export const ArchiveExport = z.object({
  version: z.literal(1),
  exportedAt: IsoDateTime,
  items: z.array(LibraryItem),
  logs: z.array(LogEntry),
  // Optional so exports made before the backlog existed still import.
  backlog: z.array(BacklogItem).default([]),
  collection: z.array(CollectionItem).default([]),
})
export type ArchiveExport = z.infer<typeof ArchiveExport>
