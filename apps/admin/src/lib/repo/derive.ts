import { BookStatus, GameStatus } from "@workspace/schemas"
import type {
  BacklogItem,
  CollectionItem,
  LibraryItem,
  LogEntry,
  MediaType,
} from "@workspace/schemas"
import {
  compareDatesDesc,
  compareLogsDesc,
  logDate,
  mediaTypeOf,
  myRating,
} from "./log-utils"
import type {
  ArchiveIndex,
  ArchiveStats,
  LibraryEntry,
  RecentLog,
  TypeStats,
} from "./types"

/*
 * Pure computations over archive rows. The server repository loads rows and
 * derives library entries, the home feed and stats here, so the logic has
 * one home whatever the storage is.
 */

export const itemKey = (type: string, id: string | number) => `${type}:${id}`

const MEDIA_TYPES: Array<MediaType> = [
  "movie",
  "show",
  "game",
  "book",
  "record",
]

const zeroCounts = (): Record<MediaType, number> => ({
  movie: 0,
  show: 0,
  game: 0,
  book: 0,
  record: 0,
})

function emptyTypeStats(): TypeStats {
  return { items: 0, logs: 0, ratings: Array<number>(10).fill(0), backlog: 0 }
}

export function deriveLibrary(
  items: Array<LibraryItem>,
  logs: Array<LogEntry>
): Array<LibraryEntry> {
  const logsByItem = Map.groupBy([...logs].sort(compareLogsDesc), (log) =>
    itemKey(mediaTypeOf(log), log.mediaId)
  )

  return items
    .flatMap((item): Array<LibraryEntry> => {
      const itemLogs = logsByItem.get(itemKey(item.type, item.id)) ?? []
      const latest = itemLogs.at(0)
      if (!latest) return []
      return [
        {
          ...item,
          logCount: itemLogs.length,
          lastLoggedAt: logDate(latest),
          rating: myRating(itemLogs),
          status:
            latest.kind === "game" ||
            latest.kind === "book" ||
            latest.kind === "season" ||
            latest.kind === "show"
              ? latest.status
              : undefined,
        },
      ]
    })
    .sort((a, b) => compareDatesDesc(a.lastLoggedAt, b.lastLoggedAt))
}

export function deriveRecent(
  items: Array<LibraryItem>,
  logs: Array<LogEntry>,
  limit: number
): Array<RecentLog> {
  const itemsByKey = new Map(
    items.map((item) => [itemKey(item.type, item.id), item])
  )
  return [...logs]
    .sort(compareLogsDesc)
    .flatMap((log) => {
      const item = itemsByKey.get(itemKey(mediaTypeOf(log), log.mediaId))
      return item ? [{ log, item }] : []
    })
    .slice(0, limit)
}

export function deriveIndex({
  logs,
  backlog,
  collection,
}: {
  logs: Array<Pick<LogEntry, "kind" | "mediaId">>
  backlog: Array<Pick<BacklogItem, "type" | "id">>
  collection: Array<Pick<CollectionItem, "releaseId">>
}): ArchiveIndex {
  return {
    logged: [...new Set(logs.map((l) => itemKey(mediaTypeOf(l), l.mediaId)))],
    backlog: backlog.map((b) => itemKey(b.type, b.id)),
    owned: [...new Set(collection.map((c) => itemKey("record", c.releaseId)))],
  }
}

export function deriveStats({
  items,
  logs,
  backlog,
  collection,
}: {
  items: Array<Pick<LibraryItem, "type">>
  logs: Array<LogEntry>
  backlog: Array<Pick<BacklogItem, "type">>
  collection: Array<Pick<CollectionItem, "releaseId">>
}): ArchiveStats {
  const byType: Record<MediaType, TypeStats> = {
    movie: emptyTypeStats(),
    show: emptyTypeStats(),
    game: emptyTypeStats(),
    book: emptyTypeStats(),
    record: emptyTypeStats(),
  }
  const gameStatuses = Object.fromEntries(
    GameStatus.options.map((s) => [s, 0])
  ) as ArchiveStats["gameStatuses"]
  const bookStatuses = Object.fromEntries(
    BookStatus.options.map((s) => [s, 0])
  ) as ArchiveStats["bookStatuses"]
  const years = new Map<number, Record<MediaType, number>>()
  let hoursPlayed = 0

  // Records count what you own; other kinds count what you've logged.
  for (const item of items)
    if (item.type !== "record") byType[item.type].items++
  byType.record.items = new Set(collection.map((c) => c.releaseId)).size
  for (const item of backlog) byType[item.type].backlog++

  for (const log of logs) {
    const type = mediaTypeOf(log)
    byType[type].logs++
    if (log.rating !== undefined) {
      const ratings = byType[type].ratings
      ratings[log.rating - 1] = (ratings[log.rating - 1] ?? 0) + 1
    }
    if (log.kind === "game") hoursPlayed += log.hoursPlayed ?? 0

    // Undated logs (imported history) can't be placed in a year.
    const date = logDate(log)
    if (date) {
      const year = Number(date.slice(0, 4))
      const counts = years.get(year) ?? zeroCounts()
      counts[type]++
      years.set(year, counts)
    }
  }

  // Each game/book counts once, by the status of its most recent log.
  const latest = new Map<string, LogEntry>()
  for (const log of [...logs].sort(compareLogsDesc)) {
    const key = itemKey(mediaTypeOf(log), log.mediaId)
    if (!latest.has(key)) latest.set(key, log)
  }
  for (const log of latest.values()) {
    if (log.kind === "game") gameStatuses[log.status]++
    if (log.kind === "book") bookStatuses[log.status]++
  }

  for (const type of MEDIA_TYPES) {
    const ratings = byType[type].ratings
    const count = ratings.reduce((sum, n) => sum + n, 0)
    if (count > 0)
      byType[type].averageRating =
        ratings.reduce((sum, n, i) => sum + n * (i + 1), 0) / count
  }

  return {
    byType,
    copies: collection.length,
    gameStatuses,
    bookStatuses,
    hoursPlayed,
    logsByYear: [...years.entries()]
      .sort(([a], [b]) => a - b)
      .map(([year, counts]) => ({ year, ...counts })),
  }
}

/** Upgrades exports written by older versions of the app before validating them. */
export function migrateExport(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null || !("logs" in raw)) return raw
  const logs = Array.isArray(raw.logs) ? (raw.logs as Array<unknown>) : []
  return {
    ...raw,
    logs: logs.map((log) =>
      // "dropped" was renamed to "abandoned".
      typeof log === "object" &&
      log !== null &&
      "status" in log &&
      log.status === "dropped"
        ? { ...log, status: "abandoned" }
        : log
    ),
  }
}
