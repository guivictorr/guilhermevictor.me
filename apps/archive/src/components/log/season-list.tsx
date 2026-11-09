import { useQuery } from "@tanstack/react-query"
import type { SeasonLog, SeasonSummary } from "@workspace/schemas"
import { ChevronRightIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { describeLogDates } from "@/components/log/log-history"
import { LogSheet } from "@/components/log/log-sheet"
import { useLogSheet } from "@/components/log/use-log-sheet"
import { StarRating } from "@/components/star-rating"
import { joinDefined } from "@/lib/format"
import { sortSeasons } from "@/lib/seasons"
import type { LibraryItemInput } from "@/lib/repo"
import { logsQuery } from "@/queries/archive"

/**
 * Every season with what you logged for it. Tapping one edits its latest
 * log, or starts one; no season details, just the log. The caller titles it.
 */
export function SeasonList({
  item,
  seasons,
}: {
  item: LibraryItemInput
  seasons: Array<SeasonSummary>
}) {
  const { data: logs } = useQuery(logsQuery({ type: "show", id: item.id }))
  const sheet = useLogSheet()
  const [season, setSeason] = useState<SeasonSummary>()
  const ordered = sortSeasons(seasons)
  const logsOf = (n: number) =>
    (logs ?? []).filter(
      (log): log is SeasonLog => log.kind === "season" && log.seasonNumber === n
    )

  function open(target: SeasonSummary) {
    setSeason(target)
    const latest = logsOf(target.seasonNumber)[0]
    if (latest) sheet.openEdit(latest)
    else sheet.openNew()
  }

  if (!ordered.length) return null
  return (
    <section>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {ordered.map((s) => {
          const seasonLogs = logsOf(s.seasonNumber)
          const latest = seasonLogs[0]
          return (
            <li key={s.seasonNumber}>
              <button
                type="button"
                onClick={() => open(s)}
                className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 active:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {latest
                      ? joinDefined([
                          latest.status === "watching"
                            ? "Watching"
                            : latest.status === "abandoned"
                              ? "Abandoned"
                              : undefined,
                          describeLogDates(latest),
                          seasonLogs.length > 1
                            ? `${seasonLogs.length} logs`
                            : undefined,
                        ])
                      : `${s.episodeCount} episodes · not logged`}
                  </p>
                </div>
                {latest ? (
                  <StarRating rating={latest.rating} className="text-sm" />
                ) : (
                  <PlusIcon className="size-4 text-muted-foreground" />
                )}
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          )
        })}
      </ul>
      {season ? (
        <LogSheet
          open={sheet.open}
          onOpenChange={sheet.onOpenChange}
          editing={sheet.editing}
          target={{
            kind: "season",
            item,
            seasonNumber: season.seasonNumber,
            seasonName: season.name,
          }}
        />
      ) : null}
    </section>
  )
}
