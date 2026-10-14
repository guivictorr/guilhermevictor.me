/**
 * Ratings are stored 1–10 and displayed as 5 stars.
 * Flip this to false to only allow whole stars (even values).
 */
export const ALLOW_HALF_STARS = true as boolean

export const toStars = (rating: number) => rating / 2

export function formatRating(rating: number | undefined) {
  if (rating === undefined) return "Not rated"
  const stars = toStars(rating)
  return `${stars} star${stars === 1 ? "" : "s"}`
}
