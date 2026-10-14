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
