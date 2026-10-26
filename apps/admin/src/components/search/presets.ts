import type { MediaType } from "@workspace/schemas"

/** A few genres as tiles on the Discover screen (value = filter value). */
export const GENRE_TILES: Record<MediaType, Array<string>> = {
  movie: ["878", "27", "80", "16", "99", "10749", "35", "53"],
  show: ["10765", "80", "16", "35", "18", "9648", "99", "10759"],
  game: ["12", "5", "8", "31", "32", "15", "9", "10"],
  book: [
    "Fiction",
    "Science Fiction",
    "Fantasy",
    "Mystery",
    "History",
    "Philosophy",
    "Comics & Graphic Novels",
    "Poetry",
  ],
  record: [
    "Rock",
    "Jazz",
    "Electronic",
    "Funk / Soul",
    "Latin",
    "Hip Hop",
    "Pop",
    "Classical",
  ],
}
