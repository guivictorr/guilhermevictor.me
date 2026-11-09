/**
 * Ratings are stored 1–10 and displayed as 5 stars.
 * Flip this to false to only allow whole stars (even values).
 */
export const ALLOW_HALF_STARS = true as boolean

export const toStars = (rating: number) => rating / 2

export function formatRating(rating: number | undefined) {
  if (rating === undefined) return "Not rated"
  // Show averages aren't whole: "3.7 stars".
  const stars = Math.round(toStars(rating) * 10) / 10
  return `${stars} star${stars === 1 ? "" : "s"}`
}
