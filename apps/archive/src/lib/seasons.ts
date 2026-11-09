import type { LogEntry, SeasonSummary } from "@workspace/schemas"

/** Regular seasons in order, specials (season 0) last, like most TV apps. */
export const compareSeasonNumbers = (a: number, b: number) =>
  (a || Infinity) - (b || Infinity)

export const sortSeasons = <T extends Pick<SeasonSummary, "seasonNumber">>(
  seasons: ReadonlyArray<T>
) =>
  [...seasons].sort((a, b) =>
    compareSeasonNumbers(a.seasonNumber, b.seasonNumber)
  )

/**
 * Logs grouped by season (in season order), keeping the existing order
 * (newest first) within a season; non-season logs keep their place at the end.
 */
export const sortLogsBySeason = (logs: ReadonlyArray<LogEntry>) =>
  logs
    .map((log, index) => ({ log, index }))
    .sort((a, b) => {
      const sa = a.log.kind === "season" ? a.log.seasonNumber : undefined
      const sb = b.log.kind === "season" ? b.log.seasonNumber : undefined
      if (sa === undefined || sb === undefined)
        return sa === sb ? a.index - b.index : sa === undefined ? 1 : -1
      return compareSeasonNumbers(sa, sb) || a.index - b.index
    })
    .map(({ log }) => log)
