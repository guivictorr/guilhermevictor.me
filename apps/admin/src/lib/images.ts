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

const GOOGLE_WIDTHS: Record<ImageSize, number> = {
  thumb: 120,
  poster: 360,
  large: 720,
  backdrop: 800,
  still: 300,
}

export function imageUrl(
  ref: ImageRef | undefined,
  size: ImageSize
): string | undefined {
  if (!ref) return undefined
  // Discogs URLs are signed and fixed-size; use them as-is.
  if (ref.provider === "discogs") return ref.path
  if (ref.provider === "googlebooks")
    // `fife=w…` asks Google for an exact width (up to ~800px).
    return `https://books.google.com/books/content?id=${encodeURIComponent(ref.path)}&printsec=frontcover&img=1&zoom=1&fife=w${GOOGLE_WIDTHS[size]}`
  if (ref.provider === "tmdb")
    return `https://image.tmdb.org/t/p/${TMDB_SIZES[size]}${ref.path}`
  return `https://images.igdb.com/igdb/image/upload/${IGDB_SIZES[size]}/${ref.path}.jpg`
}
