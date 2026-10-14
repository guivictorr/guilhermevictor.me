import type {
  Author,
  Book,
  BookEdition,
  ImageRef,
  MediaSummary,
} from "@workspace/schemas"
import { getGoogleBooksKey } from "./env.server"

const BASE_URL = "https://openlibrary.org"
// Open Library asks API users to identify themselves.
const USER_AGENT = "ArchivePersonalApp/0.1 (personal archive)"

async function openLibrary<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(BASE_URL + path)
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value)
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  })
  if (!res.ok) throw new Error(`Open Library ${res.status} on ${path}`)
  return (await res.json()) as T
}

/** Work ids look like "/works/OL21464434W"; we route on the number. */
export const workKey = (id: number) => `OL${id}W`
const workId = (key: string) => Number(key.match(/OL(\d+)W/)?.[1])

const cover = (id?: number | null): ImageRef | undefined =>
  id && id > 0 ? { provider: "openlibrary", path: String(id) } : undefined

/** Descriptions/bios are either a string or { type, value }. */
type TextValue = string | { value: string } | undefined
const text = (v: TextValue) =>
  (typeof v === "string" ? v : v?.value)?.trim() || undefined

/**
 * Open Library uses MARC language codes. Most match ISO 639-2 and Intl
 * can name them; the bibliographic variants below don't.
 */
const MARC_TO_ISO: Record<string, string> = {
  fre: "fra",
  ger: "deu",
  chi: "zho",
  dut: "nld",
  cze: "ces",
  gre: "ell",
  per: "fas",
  rum: "ron",
}
const languageNames = new Intl.DisplayNames(["en"], { type: "language" })
function languageName(code: string) {
  try {
    return languageNames.of(MARC_TO_ISO[code] ?? code) ?? code
  } catch {
    return code
  }
}

type SearchDoc = {
  key: string
  title: string
  subtitle?: string
  author_name?: Array<string>
  first_publish_year?: number
  cover_i?: number
}

const summary = (d: SearchDoc): MediaSummary => ({
  type: "book",
  id: workId(d.key),
  title: d.title,
  subtitle: d.author_name?.slice(0, 2).join(", "),
  year: d.first_publish_year,
  poster: cover(d.cover_i),
})

const SEARCH_FIELDS =
  "key,title,subtitle,author_name,first_publish_year,cover_i"

export async function searchOpenLibrary(
  query: string
): Promise<Array<MediaSummary>> {
  // Bare ISBNs search exactly; everything else is a general query.
  const isbn = query.replace(/[-\s]/g, "")
  const params: Record<string, string> = /^(\d{9}[\dX]|\d{13})$/i.test(isbn)
    ? { isbn }
    : { q: query }
  const data = await openLibrary<{ docs: Array<SearchDoc> }>("/search.json", {
    ...params,
    fields: SEARCH_FIELDS,
    limit: "30",
  })
  return data.docs.filter((d) => d.key.startsWith("/works/")).map(summary)
}

export async function fetchTrendingBooks(): Promise<Array<MediaSummary>> {
  const data = await openLibrary<{ works: Array<SearchDoc> }>(
    "/trending/weekly.json",
    { limit: "24" }
  )
  return data.works.map(summary)
}

type RawWork = {
  title: string
  subtitle?: string
  description?: TextValue
  covers?: Array<number>
  subjects?: Array<string>
  subject_places?: Array<string>
  subject_times?: Array<string>
  first_publish_date?: string
  authors?: Array<{ author: { key: string } }>
}
type RawEdition = {
  key: string
  title: string
  publishers?: Array<string>
  publish_date?: string
  number_of_pages?: number
  isbn_13?: Array<string>
  isbn_10?: Array<string>
  covers?: Array<number>
  languages?: Array<{ key: string }>
  physical_format?: string
}
type RawAuthor = {
  name: string
  bio?: TextValue
  birth_date?: string
  death_date?: string
  photos?: Array<number>
}

const editionOf = (e: RawEdition): BookEdition => ({
  key: e.key.replace("/books/", ""),
  title: e.title,
  publisher: e.publishers?.[0],
  publishDate: e.publish_date,
  pages: e.number_of_pages,
  isbn: e.isbn_13?.[0] ?? e.isbn_10?.[0],
  language: e.languages?.[0]
    ? languageName(e.languages[0].key.replace("/languages/", ""))
    : undefined,
  format: e.physical_format,
  cover: cover(e.covers?.[0]),
})

const median = (values: Array<number>) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : undefined
}

export async function fetchBook(id: number): Promise<Book> {
  const key = workKey(id)
  const [work, editions, ratings, shelves] = await Promise.all([
    openLibrary<RawWork>(`/works/${key}.json`),
    openLibrary<{ size: number; entries: Array<RawEdition> }>(
      `/works/${key}/editions.json`,
      { limit: "50" }
    ),
    openLibrary<{ summary: { average?: number; count?: number } }>(
      `/works/${key}/ratings.json`
    ).catch(() => undefined),
    openLibrary<{
      counts: {
        want_to_read: number
        currently_reading: number
        already_read: number
      }
    }>(`/works/${key}/bookshelves.json`).catch(() => undefined),
  ])

  const authorKeys = (work.authors ?? []).map((a) => a.author.key)
  const authors = await Promise.all(
    authorKeys.slice(0, 3).map(async (k) => ({
      key: k.replace("/authors/", ""),
      name:
        (await openLibrary<RawAuthor>(`${k}.json`).catch(() => undefined))
          ?.name ?? "Unknown",
    }))
  )

  const eds = editions.entries.map(editionOf)
  const years = editions.entries.flatMap((e) => {
    const year = Number(e.publish_date?.match(/\d{4}/)?.[0])
    return year ? [year] : []
  })
  const description =
    text(work.description) ??
    (await googleDescription(eds.flatMap((e) => (e.isbn ? [e.isbn] : []))))

  return {
    type: "book",
    id,
    title: work.title,
    subtitle: work.subtitle,
    authors,
    year: years.length ? Math.min(...years) : undefined,
    description,
    subjects: (work.subjects ?? []).slice(0, 12),
    places: (work.subject_places ?? []).slice(0, 6),
    times: (work.subject_times ?? []).slice(0, 6),
    pages: median(eds.flatMap((e) => (e.pages ? [e.pages] : []))),
    languages: [
      ...new Set(eds.flatMap((e) => (e.language ? [e.language] : []))),
    ],
    editions: eds,
    editionCount: editions.size,
    providerRating:
      ratings?.summary.average && ratings.summary.count
        ? {
            source: "openlibrary",
            value: Math.round(ratings.summary.average * 10) / 10,
            count: ratings.summary.count,
          }
        : undefined,
    shelves: shelves
      ? {
          wantToRead: shelves.counts.want_to_read,
          reading: shelves.counts.currently_reading,
          read: shelves.counts.already_read,
        }
      : undefined,
    openLibraryUrl: `${BASE_URL}/works/${key}`,
    cover: cover(work.covers?.[0]) ?? eds.find((e) => e.cover)?.cover,
  }
}

export async function fetchAuthor(key: string): Promise<Author> {
  const a = await openLibrary<RawAuthor>(`/authors/${key}.json`)
  return {
    key,
    name: a.name,
    bio: text(a.bio),
    birthDate: a.birth_date,
    deathDate: a.death_date,
    photo:
      a.photos?.[0] && a.photos[0] > 0
        ? { provider: "openlibrary", path: `author:${a.photos[0]}` }
        : undefined,
  }
}

/** Other works by an author, most read first. */
export async function fetchAuthorWorks(
  key: string
): Promise<Array<MediaSummary>> {
  const data = await openLibrary<{ docs: Array<SearchDoc> }>("/search.json", {
    author: key,
    sort: "readinglog",
    fields: SEARCH_FIELDS,
    limit: "20",
  })
  return data.docs.map(summary)
}

/**
 * Open Library often lacks descriptions. With a Google Books key set, fill
 * the gap from Google by ISBN; without one, skip (keyless calls get 429s).
 */
async function googleDescription(isbns: Array<string>) {
  const apiKey = getGoogleBooksKey()
  const isbn = isbns[0]
  if (!apiKey || !isbn) return undefined
  try {
    const url = new URL("https://www.googleapis.com/books/v1/volumes")
    url.searchParams.set("q", `isbn:${isbn}`)
    url.searchParams.set("key", apiKey)
    const res = await fetch(url)
    if (!res.ok) return undefined
    const data = (await res.json()) as {
      items?: Array<{ volumeInfo: { description?: string } }>
    }
    // Google returns light HTML; keep paragraphs, drop tags.
    return data.items?.[0]?.volumeInfo.description
      ?.replace(/<br\s*\/?>|<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim()
  } catch {
    return undefined
  }
}
