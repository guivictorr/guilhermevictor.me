import type { ImageRef } from "@workspace/schemas"

/** Size presets per render context, mapped to each provider's own sizes. */
export type ImageSize = "thumb" | "poster" | "large" | "backdrop" | "still"

const TMDB_SIZES: Record<ImageSize, string> = {
  thumb: "w92",
  poster: "w342",
  large: "w780",
  backdrop: "w1280",
  still: "w300",
}

const IGDB_SIZES: Record<ImageSize, string> = {
  thumb: "t_cover_small",
  poster: "t_cover_big",
  large: "t_cover_big_2x",
  backdrop: "t_1080p",
  still: "t_screenshot_med",
}

export function imageUrl(
  ref: ImageRef | undefined,
  size: ImageSize
): string | undefined {
  if (!ref) return undefined
  // Discogs URLs are signed and fixed-size; use them as-is.
  if (ref.provider === "discogs") return ref.path
  if (ref.provider === "openlibrary") {
    // Covers come in S/M/L; author photos use the /a/ path.
    const olSize = size === "thumb" ? "S" : size === "poster" ? "M" : "L"
    const [kind, id] = ref.path.startsWith("author:")
      ? ["a", ref.path.slice(7)]
      : ["b", ref.path]
    return `https://covers.openlibrary.org/${kind}/id/${id}-${olSize}.jpg`
  }
  if (ref.provider === "tmdb")
    return `https://image.tmdb.org/t/p/${TMDB_SIZES[size]}${ref.path}`
  return `https://images.igdb.com/igdb/image/upload/${IGDB_SIZES[size]}/${ref.path}.jpg`
}
