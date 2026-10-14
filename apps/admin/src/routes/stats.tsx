import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { MediaType } from "@workspace/schemas"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useState } from "react"
import { BarChart } from "@/components/charts/bar-chart"
import { PageBody, PageHeader } from "@/components/page-header"
import { SegmentedControl } from "@/components/segmented-control"
import { BOOK_STATUS_OPTIONS } from "@/lib/book-status"
import { GAME_STATUS_OPTIONS } from "@/lib/game-status"
import { KINDS, KIND_ORDER } from "@/lib/media-kinds"
import type { ArchiveStats } from "@/lib/repo"
import { statsQuery } from "@/queries/archive"

export const Route = createFileRoute("/stats")({
  head: () => ({ meta: [{ title: "Stats · Archive" }] }),
  component: StatsPage,
})

type RatingScope = MediaType | "all"

const SCOPE_OPTIONS: ReadonlyArray<{ value: RatingScope; label: string }> = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "show", label: "Shows" },
  { value: "game", label: "Games" },
  { value: "book", label: "Books" },
  { value: "record", label: "Records" },
]

function StatsPage() {
  const { data: stats, isPending } = useQuery(statsQuery())

  return (
    <>
      <PageHeader title="Stats" subtitle="Your archive in numbers." />
      <PageBody className="max-w-4xl space-y-8">
        {isPending || !stats ? (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
        ) : (
          <>
            <Totals stats={stats} />
            <RatingDistribution stats={stats} />
            <StatusCard
              title="Games by status"
              counts={stats.gameStatuses}
              options={GAME_STATUS_OPTIONS}
            />
            <StatusCard
              title="Books by status"
              counts={stats.bookStatuses}
              options={BOOK_STATUS_OPTIONS}
            />
            <LogsByYear stats={stats} />
          </>
        )}
      </PageBody>
    </>
  )
}

function Card({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Totals({ stats }: { stats: ArchiveStats }) {
  const tiles = KIND_ORDER.map((type) => {
    const s = stats.byType[type]
    const isRecord = type === "record"
    return {
      label: KINDS[type].plural,
      value: s.items,
      sub: [
        isRecord && stats.copies !== s.items
          ? `${stats.copies} copies`
          : undefined,
        `${s.logs} ${isRecord ? "play" : "log"}${s.logs === 1 ? "" : "s"}`,
        s.averageRating !== undefined
          ? `avg ★ ${(s.averageRating / 2).toFixed(1)}`
          : undefined,
        `${s.backlog} in backlog`,
      ]
        .filter(Boolean)
        .join(" · "),
    }
  })

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">{tile.label}</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">
            {tile.value}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{tile.sub}</div>
        </div>
      ))}
      <div className="rounded-xl border bg-card p-4">
        <div className="text-xs text-muted-foreground">Hours played</div>
        <div className="mt-1 text-3xl font-semibold tabular-nums">
          {Math.round(stats.hoursPlayed)}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          across all games
        </div>
      </div>
    </div>
  )
}

function RatingDistribution({ stats }: { stats: ArchiveStats }) {
  const [scope, setScope] = useState<RatingScope>("all")
  const counts =
    scope === "all"
      ? Array.from({ length: 10 }, (_, i) =>
          KIND_ORDER.reduce(
            (sum, t) => sum + (stats.byType[t].ratings[i] ?? 0),
            0
          )
        )
      : stats.byType[scope].ratings
  const total = counts.reduce((sum, n) => sum + n, 0)

  return (
    <Card
      title="Your ratings"
      action={
        <SegmentedControl
          label="Ratings for"
          value={scope}
          options={SCOPE_OPTIONS}
          onValueChange={setScope}
          className="w-auto min-w-64"
        />
      }
    >
      {total === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No ratings yet.
        </p>
      ) : (
        <BarChart
          label="Number of logs per star rating"
          barClassName="bg-star"
          bars={counts.map((count, i) => {
            const stars = (i + 1) / 2
            return {
              // Label whole stars only; half-star bars sit between them.
              label: Number.isInteger(stars) ? `${stars}★` : "",
              value: count,
              detail: `${stars}★ · ${count} log${count === 1 ? "" : "s"}`,
            }
          })}
        />
      )}
    </Card>
  )
}

function StatusCard({
  title,
  counts,
  options,
}: {
  title: string
  counts: Record<string, number>
  options: ReadonlyArray<{ value: string; label: string }>
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return null
  return (
    <Card title={title}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {options.map(({ value, label }) => (
          <li key={value} className="rounded-lg bg-muted/50 p-3">
            <div className="text-2xl font-semibold tabular-nums">
              {counts[value] ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function LogsByYear({ stats }: { stats: ArchiveStats }) {
  if (!stats.logsByYear.length) return null
  return (
    <Card title="Logs per year">
      <BarChart
        label="Number of logs per year"
        bars={stats.logsByYear.map((y) => {
          const total = y.movie + y.show + y.game + y.book + y.record
          return {
            label: String(y.year),
            value: total,
            detail: `${y.year}: ${y.movie} movies · ${y.show} seasons · ${y.game} games · ${y.book} books · ${y.record} plays`,
          }
        })}
      />
    </Card>
  )
}
