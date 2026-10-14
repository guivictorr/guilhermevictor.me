import type { LogEntry, LogInput, MediaType } from "@workspace/schemas"

export function mediaTypeOf(log: Pick<LogInput, "kind">): MediaType {
  return log.kind === "season" ? "show" : log.kind
}

/** The date a log is "about": when it was watched or finished, not when it was typed in. */
export function logDate(log: LogEntry): string {
  if (log.kind === "movie") return log.watchedAt
  if (log.kind === "record") return log.playedAt
  return log.finishedAt ?? log.startedAt ?? log.createdAt.slice(0, 10)
}

/** Newest first; ties broken by creation time so same-day logs stay stable. */
export function compareLogsDesc(a: LogEntry, b: LogEntry) {
  return (
    logDate(b).localeCompare(logDate(a)) ||
    b.createdAt.localeCompare(a.createdAt)
  )
}
