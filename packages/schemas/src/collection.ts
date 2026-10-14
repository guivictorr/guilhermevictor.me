import { z } from "zod"
import { ImageRef, IsoDate, IsoDateTime, Rating } from "./common"

/** Goldmine grading scale, as used by Discogs. */
export const Grade = z.enum(["M", "NM", "VG+", "VG", "G+", "G", "F", "P"])
export type Grade = z.infer<typeof Grade>

export const Money = z.object({
  amount: z.number().min(0),
  currency: z.string().length(3),
})
export type Money = z.infer<typeof Money>

/** Editable fields of a physical copy you own. */
export const CollectionItemInput = z.object({
  mediaCondition: Grade.optional(),
  sleeveCondition: Grade.optional(),
  /** Copy-specific variant, e.g. "Red marbled, numbered #123". */
  variant: z.string().trim().max(500).optional(),
  acquiredAt: IsoDate.optional(),
  price: Money.optional(),
  store: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(5000).optional(),
})
export type CollectionItemInput = z.infer<typeof CollectionItemInput>

/**
 * One physical copy (you can own several copies of the same release).
 * Carries a snapshot of the release so the collection renders offline.
 */
export const CollectionItem = CollectionItemInput.extend({
  id: z.uuid(),
  type: z.literal("record"),
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
  /** Your Discogs rating at import time (1–10 scale like ours). */
  rating: Rating.optional(),
  folder: z.string().optional(),
  /** Set when imported from Discogs; makes re-imports idempotent. */
  discogsInstanceId: z.number().int().optional(),
  addedAt: IsoDateTime,
  updatedAt: IsoDateTime,
})
export type CollectionItem = z.infer<typeof CollectionItem>

/** What the Discogs import produces before ids/timestamps are assigned. */
export const CollectionItemDraft = CollectionItem.omit({
  id: true,
  updatedAt: true,
})
export type CollectionItemDraft = z.infer<typeof CollectionItemDraft>
