import { z } from "zod"

export const MediaType = z.enum(["movie", "show", "game", "record"])
export type MediaType = z.infer<typeof MediaType>

export const ImageProvider = z.enum(["tmdb", "igdb", "discogs"])
export type ImageProvider = z.infer<typeof ImageProvider>

/**
 * TMDB/IGDB: we store only the provider path/id and build URLs at render
 * time so we can pick a size per context. Discogs URLs are signed, so
 * `path` holds the full URL there.
 */
export const ImageRef = z.object({
  provider: ImageProvider,
  path: z.string().min(1),
})
export type ImageRef = z.infer<typeof ImageRef>

/**
 * Ratings are stored as integers 1–10 and shown as 0.5–5 stars.
 * This keeps half stars possible without a data migration.
 */
export const Rating = z.number().int().min(1).max(10)
export type Rating = z.infer<typeof Rating>

/** Calendar date without time, e.g. "2026-10-13". */
export const IsoDate = z.iso.date({ error: "Enter a valid date" })
export type IsoDate = z.infer<typeof IsoDate>

export const IsoDateTime = z.iso.datetime()
export type IsoDateTime = z.infer<typeof IsoDateTime>
