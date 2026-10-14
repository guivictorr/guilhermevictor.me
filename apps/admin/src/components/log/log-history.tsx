import { useQuery } from "@tanstack/react-query"
import type { LogEntry, MediaType } from "@workspace/schemas"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ChevronRightIcon, RotateCcwIcon } from "lucide-react"
import { GAME_STATUS_OPTIONS } from "@/lib/game-status"
import { StarRating } from "@/components/star-rating"
import { formatDate, joinDefined } from "@/lib/format"
import { logsQuery } from "@/queries/archive"

/** Human summary of a log's dates. */
export function describeLogDates(log: LogEntry) {
  if (log.kind === "movie") return formatDate(log.watchedAt)
  if (log.kind === "record") return formatDate(log.playedAt)
  const start = formatDate(log.startedAt)
  const end = formatDate(log.finishedAt)
  if (start && end) return start === end ? end : `${start} → ${end}`
  if (end) return `Finished ${end}`
  if (start) return `Started ${start}`
  return `Logged ${formatDate(log.createdAt)}`
}

export function LogHistory({
  type,
  id,
  filter,
  onSelect,
  emptyLabel = "No logs yet.",
}: {
  type: MediaType
  id: number
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

  const logs = filter ? data?.filter(filter) : data
  if (!logs?.length)
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>

  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {logs.map((log) => (
        <li key={log.id}>
          <button
            type="button"
            onClick={() => onSelect(log)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted"
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

function LogBadges({ log }: { log: LogEntry }) {
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
  if ((log.kind === "movie" || log.kind === "season") && log.rewatch) {
    return (
      <Badge variant="outline">
        <RotateCcwIcon />
        Rewatch
      </Badge>
    )
  }
  return null
}
