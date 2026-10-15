import type { LogEntry, LogInput, MediaType } from "@workspace/schemas"

export function mediaTypeOf(log: Pick<LogInput, "kind">): MediaType {
  return log.kind === "season" ? "show" : log.kind
}

/**
 * The date a log is "about": when it was watched or finished, not when it
 * was typed in. Undefined when you don't know (e.g. imported history).
 */
export function logDate(log: LogEntry): string | undefined {
  if (log.kind === "movie") return log.watchedAt
  if (log.kind === "record") return log.playedAt
  return log.finishedAt ?? log.startedAt
}

/** Newest first; undated logs last; ties broken by creation time. */
export function compareLogsDesc(a: LogEntry, b: LogEntry) {
  const da = logDate(a)
  const db = logDate(b)
  if (da !== db) {
    if (da === undefined) return 1
    if (db === undefined) return -1
    return db.localeCompare(da)
  }
  return b.createdAt.localeCompare(a.createdAt)
}

/** Descending on optional ISO dates, undefined last. */
export function compareDatesDesc(a?: string, b?: string) {
  if (a === b) return 0
  if (a === undefined) return 1
  if (b === undefined) return -1
  return b.localeCompare(a)
}

/**
 * Your rating for a work. Shows are rated per season: their rating is the
 * average of each season's latest rating (unrated seasons don't count).
 * Everything else uses the latest rated log.
 */
export function myRating(logs: Array<LogEntry>): number | undefined {
  const sorted = [...logs].sort(compareLogsDesc)
  const seasons = new Map<number, number>()
  for (const log of sorted)
    if (
      log.kind === "season" &&
      log.rating !== undefined &&
      !seasons.has(log.seasonNumber)
    )
      seasons.set(log.seasonNumber, log.rating)
  if (seasons.size) {
    const ratings = [...seasons.values()]
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length
  }
  return sorted.find((log) => log.rating !== undefined)?.rating
}
