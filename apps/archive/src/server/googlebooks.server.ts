import type { Book, ImageRef, MediaSummary } from "@workspace/schemas"
import { getGoogleBooksEnv } from "./env.server"

/*
 * Google Books (volumes). A volume is an edition: translations and reprints
 * are separate volumes, so a book you log is the edition you read.
 */

const API_URL = "https://www.googleapis.com/books/v1"

async function googleBooks<T>(
  path: string,
  params: Record<string, string | undefined> = {}
): Promise<T> {
  const url = new URL(API_URL + path)
  for (const [key, value] of Object.entries(params))
    if (value) url.searchParams.set(key, value)
  url.searchParams.set("key", getGoogleBooksEnv().GOOGLE_BOOKS_KEY)
  const res = await fetch(url, { headers: { Accept: "application/json" } })
  if (!res.ok) throw new Error(`Google Books ${res.status} on ${path}`)
  return (await res.json()) as T
}

type VolumeInfo = {
  title?: string
  subtitle?: string
  authors?: Array<string>
  publisher?: string
  publishedDate?: string
  description?: string
  industryIdentifiers?: Array<{ type: string; identifier: string }>
  pageCount?: number
  categories?: Array<string>
  averageRating?: number
  ratingsCount?: number
  imageLinks?: Record<string, string>
  language?: string
  infoLink?: string
  canonicalVolumeLink?: string
}
type Volume = {
  id: string
  volumeInfo: VolumeInfo
  searchInfo?: { textSnippet?: string }
}

/** Covers are built from the volume id at any width (see lib/images.ts). */
const cover = (v: Volume): ImageRef | undefined =>
  v.volumeInfo.imageLinks ? { provider: "googlebooks", path: v.id } : undefined

const yearOf = (date?: string) => {
  const year = Number(date?.slice(0, 4))
  return year > 0 ? year : undefined
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
}

/** Descriptions come as light HTML; keep paragraphs, drop the tags. */
export function plainText(html?: string) {
  if (!html) return undefined
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#\d+|\w+);/g, (match, code: string) =>
      code.startsWith("#")
        ? String.fromCodePoint(Number(code.slice(1)))
        : (ENTITIES[code] ?? match)
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return text || undefined
}

/** "Fiction / Science Fiction / General" → "Fiction", "Science Fiction". */
function categoriesOf(categories: Array<string> = []) {
  return [
    ...new Set(
      categories.flatMap((c) =>
        c
          .split("/")
          .map((part) => part.trim())
          .filter((part) => part && part !== "General")
      )
    ),
  ]
}

const summary = (v: Volume): MediaSummary => ({
  type: "book",
  id: v.id,
  title: v.volumeInfo.title ?? "Untitled",
  subtitle: v.volumeInfo.authors?.slice(0, 2).join(", "),
  year: yearOf(v.volumeInfo.publishedDate),
  poster: cover(v),
  overview: plainText(v.searchInfo?.textSnippet),
})

export type BookSearch = {
  query?: string
  author?: string
  subject?: string
  publisher?: string
  /** ISO 639-1, e.g. "pt". */
  language?: string
  orderBy?: "relevance" | "newest"
  /** 1-based page of 40 results. */
  page?: number
}

/**
 * Google's quoted phrases (`inauthor:"George Orwell"`) find nothing, so
 * each word gets its own prefix: `inauthor:george inauthor:orwell`.
 */
const field = (prefix: string, value?: string) =>
  value
    ?.split(/\s+/)
    .filter(Boolean)
    .map((word) => `${prefix}:${word}`)
    .join(" ")

/** Google's query syntax: free text plus inauthor:/subject:/inpublisher:/isbn:. */
export async function searchGoogleBooks(
  search: BookSearch
): Promise<Array<MediaSummary>> {
  const isbn = search.query?.replace(/[-\s]/g, "") ?? ""
  const terms = [
    /^(\d{9}[\dX]|\d{13})$/i.test(isbn) ? `isbn:${isbn}` : search.query,
    field("inauthor", search.author),
    field("subject", search.subject),
    field("inpublisher", search.publisher),
  ].filter(Boolean)
  if (!terms.length) return []
  const data = await googleBooks<{ items?: Array<Volume> }>("/volumes", {
    q: terms.join(" "),
    printType: "books",
    maxResults: "40",
    startIndex: search.page ? String((search.page - 1) * 40) : undefined,
    langRestrict: search.language,
    orderBy: search.orderBy,
  })
  // The same edition is sometimes listed twice.
  return [...new Map((data.items ?? []).map((v) => [v.id, v])).values()].map(
    summary
  )
}

/** No trending endpoint; recent fiction stands in on the search page. */
export function fetchTrendingBooks(): Promise<Array<MediaSummary>> {
  return searchGoogleBooks({ subject: "fiction", orderBy: "newest" })
}

export async function fetchBook(id: string): Promise<Book> {
  const v = await googleBooks<Volume>(`/volumes/${encodeURIComponent(id)}`)
  const info = v.volumeInfo
  const isbn = (type: string) =>
    info.industryIdentifiers?.find((i) => i.type === type)?.identifier
  return {
    type: "book",
    id: v.id,
    title: info.title ?? "Untitled",
    subtitle: info.subtitle,
    authors: info.authors ?? [],
    publisher: info.publisher,
    publishedDate: info.publishedDate,
    year: yearOf(info.publishedDate),
    description: plainText(info.description),
    categories: categoriesOf(info.categories),
    pages: info.pageCount || undefined,
    language: info.language,
    isbn13: isbn("ISBN_13"),
    isbn10: isbn("ISBN_10"),
    providerRating:
      info.averageRating && info.ratingsCount
        ? {
            source: "googlebooks",
            value: info.averageRating,
            count: info.ratingsCount,
          }
        : undefined,
    infoLink: info.canonicalVolumeLink ?? info.infoLink,
    cover: cover(v),
  }
}
