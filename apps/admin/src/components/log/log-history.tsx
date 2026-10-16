import { useQuery } from "@tanstack/react-query"
import type { LogEntry, MediaType, WorkId } from "@workspace/schemas"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ChevronRightIcon, RotateCcwIcon } from "lucide-react"
import { BOOK_FORMAT_OPTIONS, BOOK_STATUS_OPTIONS } from "@/lib/book-status"
import { GAME_STATUS_OPTIONS } from "@/lib/game-status"
import { SHOW_STATUS_OPTIONS } from "@/lib/show-status"
import { StarRating } from "@/components/star-rating"
import { formatDate, joinDefined } from "@/lib/format"
import { sortLogsBySeason } from "@/lib/seasons"
import { logsQuery } from "@/queries/archive"

const showStatusLabel = (status: string) =>
  SHOW_STATUS_OPTIONS.find((o) => o.value === status)?.label

/** Human summary of a log's dates. */
export function describeLogDates(log: LogEntry) {
  const unknown = "Date unknown"
  if (log.kind === "movie") return formatDate(log.watchedAt) ?? unknown
  if (log.kind === "record") return formatDate(log.playedAt) ?? unknown
  const start = formatDate(log.startedAt)
  const end = formatDate(log.finishedAt)
  if (start && end) return start === end ? end : `${start} → ${end}`
  if (end) return `Finished ${end}`
  if (start) return `Started ${start}`
  return unknown
}

export function LogHistory({
  type,
  id,
  filter,
  onSelect,
  emptyLabel = "No logs yet.",
}: {
  type: MediaType
  id: WorkId
  filter?: (log: LogEntry) => boolean
  onSelect: (log: LogEntry) => void
  emptyLabel?: string
}) {
  const { data, isPending } = useQuery(logsQuery({ type, id }))

  if (isPending) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16 rounded-xl" />
      </div>
    )
  }

  const filtered = filter ? data?.filter(filter) : data
  // Shows read best season by season.
  const logs =
    type === "show" && filtered ? sortLogsBySeason(filtered) : filtered
  if (!logs?.length)
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>

  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {logs.map((log) => (
        <li key={log.id}>
          <button
            type="button"
            onClick={() => onSelect(log)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 active:bg-muted"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-medium">
                  {describeLogDates(log)}
                </span>
                <StarRating rating={log.rating} className="text-sm" />
                <LogBadges log={log} />
              </div>
              {log.notes ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {log.notes}
                </p>
              ) : null}
            </div>
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </li>
      ))}
    </ul>
  )
}

/**
 * A log's details as one line of text ("Playing · PC · 32h", "S2 ·
 * Rewatch"), for places too narrow for badges.
 */
export function describeLogExtras(log: LogEntry) {
  switch (log.kind) {
    case "game":
      return joinDefined([
        GAME_STATUS_OPTIONS.find((o) => o.value === log.status)?.label,
        log.platform,
        log.hoursPlayed !== undefined ? `${log.hoursPlayed}h` : undefined,
      ])
    case "book":
      return joinDefined([
        BOOK_STATUS_OPTIONS.find((o) => o.value === log.status)?.label,
        BOOK_FORMAT_OPTIONS.find((o) => o.value === log.format)?.label,
        log.reread ? "Re-read" : undefined,
      ])
    case "season":
      return joinDefined([
        log.seasonNumber === 0 ? "Specials" : `S${log.seasonNumber}`,
        log.status === "finished" ? undefined : showStatusLabel(log.status),
        log.rewatch ? "Rewatch" : undefined,
      ])
    case "show":
      return joinDefined([
        log.status === "finished" ? undefined : showStatusLabel(log.status),
        log.rewatch ? "Rewatch" : undefined,
      ])
    case "movie":
      return log.rewatch ? "Rewatch" : ""
    case "record":
      return ""
  }
}

export function LogBadges({ log }: { log: LogEntry }) {
  if (log.kind === "game") {
    const status = GAME_STATUS_OPTIONS.find(
      (o) => o.value === log.status
    )?.label
    const meta = joinDefined([
      log.platform,
      log.hoursPlayed !== undefined ? `${log.hoursPlayed}h` : undefined,
    ])
    return (
      <>
        <Badge variant="secondary">{status}</Badge>
        {meta ? (
          <span className="text-xs text-muted-foreground">{meta}</span>
        ) : null}
      </>
    )
  }
  if (log.kind === "book") {
    const status = BOOK_STATUS_OPTIONS.find(
      (o) => o.value === log.status
    )?.label
    const format = BOOK_FORMAT_OPTIONS.find(
      (o) => o.value === log.format
    )?.label
    return (
      <>
        <Badge variant="secondary">{status}</Badge>
        {format ? (
          <span className="text-xs text-muted-foreground">{format}</span>
        ) : null}
        {log.reread ? (
          <Badge variant="outline">
            <RotateCcwIcon />
            Re-read
          </Badge>
        ) : null}
      </>
    )
  }
  const rewatch =
    (log.kind === "movie" || log.kind === "season" || log.kind === "show") &&
    log.rewatch
  return (
    <>
      {log.kind === "show" ? (
        <Badge variant="secondary">Whole show</Badge>
      ) : log.kind === "season" ? (
        <Badge variant="secondary">
          {log.seasonNumber === 0 ? "Specials" : `S${log.seasonNumber}`}
        </Badge>
      ) : null}
      {(log.kind === "season" || log.kind === "show") &&
      log.status !== "finished" ? (
        <Badge variant="secondary">{showStatusLabel(log.status)}</Badge>
      ) : null}
      {rewatch ? (
        <Badge variant="outline">
          <RotateCcwIcon />
          Rewatch
        </Badge>
      ) : null}
    </>
  )
}
