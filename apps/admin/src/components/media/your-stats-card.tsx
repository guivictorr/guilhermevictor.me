import { useQuery } from "@tanstack/react-query"
import type { LogEntry, MediaType, TimeToBeat } from "@workspace/schemas"
import { SideCard } from "@/components/detail-layout"
import { StarRating } from "@/components/star-rating"
import { formatDate } from "@/lib/format"
import { gameStatusLabel } from "@/lib/game-status"
import { logDate } from "@/lib/repo"
import { logsQuery } from "@/queries/archive"

/** `logs` arrive newest first. */
function summarize(logs: Array<LogEntry>) {
  const latest = logs[0]
  const rated = logs.flatMap((l) => (l.rating === undefined ? [] : [l.rating]))
  const dates = logs
    .map(logDate)
    .filter((d): d is string => d !== undefined)
    .sort()
  return {
    count: logs.length,
    latestRating: rated.at(0),
    average: rated.length
      ? rated.reduce((sum, r) => sum + r, 0) / rated.length
      : undefined,
    first: dates.at(0),
    last: dates.at(-1),
    hours: logs.reduce(
      (sum, l) => sum + (l.kind === "game" ? (l.hoursPlayed ?? 0) : 0),
      0
    ),
    seasons: new Set(
      logs.flatMap((l) => (l.kind === "season" ? [l.seasonNumber] : []))
    ).size,
    status:
      latest?.kind === "game" ? gameStatusLabel(latest.status) : undefined,
  }
}

/** Your relationship with this work, from your own logs. */
export function YourStatsCard({ type, id }: { type: MediaType; id: number }) {
  const { data: logs } = useQuery(logsQuery({ type, id }))
  if (!logs?.length) return null
  const s = summarize(logs)

  const rows: Array<[string, React.ReactNode]> = [
    [
      type === "game" || type === "record" ? "Times played" : "Times logged",
      s.count,
    ],
    ...(type === "show" && s.seasons > 0
      ? [["Seasons logged", s.seasons] as [string, number]]
      : []),
    ...(s.status ? [["Status", s.status] as [string, string]] : []),
    ...(s.hours ? [["Hours played", `${s.hours}h`] as [string, string]] : []),
    ...(s.first
      ? [["First", formatDate(s.first)] as [string, string | undefined]]
      : []),
    ...(s.last && s.last !== s.first
      ? [["Latest", formatDate(s.last)] as [string, string | undefined]]
      : []),
  ]

  return (
    <SideCard title="Your stats">
      {s.latestRating !== undefined ? (
        <div className="mb-3 flex items-center gap-2">
          <StarRating rating={s.latestRating} className="text-xl" />
          {s.average !== undefined && s.count > 1 ? (
            <span className="text-xs text-muted-foreground">
              avg {(s.average / 2).toFixed(1)}
            </span>
          ) : null}
        </div>
      ) : null}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </SideCard>
  )
}

/** IGDB estimates next to the hours you've logged. */
export function TimeToBeatCard({
  timeToBeat,
  gameId,
}: {
  timeToBeat?: TimeToBeat
  gameId: number
}) {
  const { data: logs } = useQuery(logsQuery({ type: "game", id: gameId }))
  if (!timeToBeat) return null
  const yours = (logs ?? []).reduce(
    (sum, l) => sum + (l.kind === "game" ? (l.hoursPlayed ?? 0) : 0),
    0
  )
  const rows = [
    ["Main story", timeToBeat.main],
    ["Main + extra", timeToBeat.extra],
    ["Completionist", timeToBeat.completionist],
  ] as const
  const max = Math.max(yours, ...rows.map(([, h]) => h ?? 0))

  return (
    <SideCard title="Time to beat">
      <ul className="space-y-2.5 text-sm">
        {rows.map(([label, value]) =>
          value ? (
            <li key={label}>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">{value}h</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground/40"
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
            </li>
          ) : null
        )}
        {yours > 0 ? (
          <li>
            <div className="flex justify-between">
              <span className="font-medium">You</span>
              <span className="font-medium tabular-nums">{yours}h</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="bg-star h-full rounded-full"
                style={{ width: `${(yours / max) * 100}%` }}
              />
            </div>
          </li>
        ) : null}
      </ul>
    </SideCard>
  )
}
