import type { LibraryEntry } from "./types"

/** Columns a library page can be ordered by (the grid's sort menu and the table headers). */
export const LIBRARY_SORTS = [
  "lastLoggedAt",
  "title",
  "rating",
  "year",
  "logCount",
] as const
export type LibrarySort = (typeof LIBRARY_SORTS)[number]

export type LibraryPageQuery = {
  sort: LibrarySort
  desc: boolean
  /** Title filter (case-insensitive substring). */
  q: string
}

/** How a library opens: most recently logged first, unfiltered. */
export const DEFAULT_LIBRARY_QUERY: LibraryPageQuery = {
  sort: "lastLoggedAt",
  desc: true,
  q: "",
}

export type LibraryPage = {
  items: Array<LibraryEntry>
  /** Entries matching the filter, across all pages. */
  total: number
  /** Offset of the next page; undefined on the last one. */
  nextOffset?: number
}

/** Phones get 15 per page, wider screens 30 (two to three grid rows). */
export const LIBRARY_PAGE_SIZE = { mobile: 15, desktop: 30 } as const

const collator = new Intl.Collator(undefined, { sensitivity: "base" })

/** Missing values (no rating, no year, never logged) always sort last. */
function compare(
  a: LibraryEntry,
  b: LibraryEntry,
  sort: LibrarySort,
  desc: boolean
) {
  const x = a[sort]
  const y = b[sort]
  if (x === undefined || y === undefined)
    return x === y ? 0 : x === undefined ? 1 : -1
  const order =
    typeof x === "string" && typeof y === "string"
      ? sort === "title"
        ? collator.compare(x, y)
        : x.localeCompare(y)
      : Number(x) - Number(y)
  return desc ? -order : order
}

/** One page of a derived library: filtered, ordered, sliced. */
export function pageLibrary(
  entries: Array<LibraryEntry>,
  { sort, desc, q }: LibraryPageQuery,
  offset: number,
  limit: number
): LibraryPage {
  const needle = q.trim().toLocaleLowerCase()
  const matching = needle
    ? entries.filter((e) => e.title.toLocaleLowerCase().includes(needle))
    : entries
  const sorted = [...matching].sort(
    (a, b) =>
      compare(a, b, sort, desc) ||
      collator.compare(a.title, b.title) ||
      String(a.id).localeCompare(String(b.id))
  )
  const items = sorted.slice(offset, offset + limit)
  const end = offset + items.length
  return {
    items,
    total: sorted.length,
    nextOffset: end < sorted.length ? end : undefined,
  }
}
