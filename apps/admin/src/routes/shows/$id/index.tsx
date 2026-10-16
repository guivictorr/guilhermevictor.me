import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useCallback, useState } from "react"
import type { SeasonSummary, Show } from "@workspace/schemas"
import { Button } from "@workspace/ui/components/button"
import { CheckIcon, PlusIcon } from "lucide-react"
import {
  DetailBody,
  DetailHero,
  DetailSection,
  DetailSkeleton,
  DetailsCard,
  RatingsRow,
} from "@/components/detail-layout"
import { LogHistory } from "@/components/log/log-history"
import { LogSheet } from "@/components/log/log-sheet"
import { logSearch, useOpenLogFromSearch } from "@/components/log/log-search"
import { SeasonList } from "@/components/log/season-list"
import { useLogSheet } from "@/components/log/use-log-sheet"
import { ResponsiveSheet } from "@/components/responsive-sheet"
import { BacklogButton } from "@/components/media/backlog-button"
import {
  LogsTabLabel,
  SynopsisSection,
  TrailerSection,
} from "@/components/media/detail-sections"
import { MediaRail, ScrollRow } from "@/components/media/media-rail"
import { SwipeAction } from "@/components/swipe/swipe-button"
import { PeopleGrid } from "@/components/media/people-grid"
import { YourStatsCard } from "@/components/media/your-stats-card"
import { Poster } from "@/components/poster"
import { formatDate, joinDefined } from "@/lib/format"
import { parseId } from "@/lib/params"
import { sortSeasons } from "@/lib/seasons"
import { logsQuery } from "@/queries/archive"
import { showQuery } from "@/queries/media"

export const Route = createFileRoute("/shows/$id/")({
  validateSearch: logSearch,
  loader: ({ context, params }) => {
    // Your logs load alongside the details, not after them.
    void context.queryClient.prefetchQuery(
      logsQuery({ type: "show", id: parseId(params.id) })
    )
    return context.queryClient.ensureQueryData(showQuery(parseId(params.id)))
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.title} · Archive` : "Archive" }],
  }),
  pendingComponent: DetailSkeleton,
  component: ShowPage,
})

function ShowPage() {
  const { id } = Route.useParams()
  const { data: show } = useSuspenseQuery(showQuery(parseId(id)))
  const navigate = Route.useNavigate()
  const sheet = useLogSheet()
  // Shows are logged and rated per season.
  const [seasonsOpen, setSeasonsOpen] = useState(false)
  const openSeasons = useCallback(() => setSeasonsOpen(true), [])
  useOpenLogFromSearch(openSeasons)
  const regularSeasons = show.seasons.filter((s) => s.seasonNumber > 0).length
  const item = {
    type: "show" as const,
    id: show.id,
    title: show.title,
    year: show.year,
    poster: show.poster,
    genres: show.genres,
  }

  return (
    <article>
      <DetailHero
        type="show"
        title={show.title}
        poster={show.poster}
        backdrop={show.backdrop}
        backTo="/shows"
        tagline={show.tagline}
        meta={joinDefined([
          show.year,
          `${regularSeasons} season${regularSeasons === 1 ? "" : "s"}`,
          show.networks.at(0),
        ])}
        genres={show.genres}
        ratings={
          <RatingsRow provider={show.providerRating} type="show" id={show.id} />
        }
        actions={
          <>
            {/* Shows are logged per season; the show's rating is their average. */}
            <Button size="lg" className="h-11 text-base" onClick={openSeasons}>
              <PlusIcon />
              Log season
            </Button>
            <BacklogButton item={item} />
          </>
        }
      />

      <DetailBody
        tabs={[
          {
            value: "about",
            label: "About",
            content: (
              <>
                <SynopsisSection text={show.overview} />
                <SeasonsSection show={show} />
                <TrailerSection video={show.trailer} />
                {show.recommendations.length ? (
                  <DetailSection
                    title="Recommendations"
                    action={
                      <SwipeAction
                        id="recommendations"
                        items={show.recommendations}
                        title={`Like ${show.title}`}
                      />
                    }
                  >
                    <MediaRail items={show.recommendations} />
                  </DetailSection>
                ) : null}
              </>
            ),
          },
          {
            value: "credits",
            label: "Cast & Crew",
            content: (
              <>
                <DetailSection title="Cast">
                  <PeopleGrid people={show.credits.cast} />
                </DetailSection>
                <DetailSection title="Crew">
                  <PeopleGrid people={show.credits.crew} />
                </DetailSection>
              </>
            ),
          },
          {
            value: "logs",
            label: <LogsTabLabel type="show" id={show.id} />,
            content: (
              <LogHistory
                type="show"
                id={show.id}
                // Whole-show logs edit here; season logs on their season page.
                onSelect={(log) =>
                  log.kind === "season"
                    ? navigate({
                        to: "/shows/$id/seasons/$season",
                        params: { id, season: String(log.seasonNumber) },
                      })
                    : sheet.openEdit(log)
                }
                emptyLabel="Log the whole show, or open a season to log it."
              />
            ),
          },
        ]}
        aside={
          <>
            <YourStatsCard type="show" id={show.id} />
            <DetailsCard
              facts={[
                ["Status", show.status],
                ["First aired", formatDate(show.firstAirDate)],
                ["Last aired", formatDate(show.lastAirDate)],
                ["Seasons", regularSeasons],
                ["Episodes", show.episodeCount],
                ["Created by", show.creators.join(", ")],
                ["Network", show.networks.join(", ")],
                ["Country", show.countries.join(", ")],
                ["Production", show.companies.slice(0, 4).join(", ")],
                ["Original title", show.originalTitle],
                ["IMDb", show.imdbId],
              ]}
            />
          </>
        }
      />
      <ResponsiveSheet
        open={seasonsOpen}
        onOpenChange={setSeasonsOpen}
        title="Seasons"
        description={show.title}
      >
        <SeasonList item={item} seasons={show.seasons} />
      </ResponsiveSheet>
      {/* Edits whole-show logs from before seasons-only logging. */}
      <LogSheet
        open={sheet.open}
        onOpenChange={sheet.onOpenChange}
        editing={sheet.editing}
        target={{ kind: "show", item }}
      />
    </article>
  )
}

function SeasonsSection({ show }: { show: Show }) {
  const { data: logs } = useQuery(logsQuery({ type: "show", id: show.id }))
  const logCounts = new Map<number, number>()
  for (const log of logs ?? [])
    if (log.kind === "season")
      logCounts.set(
        log.seasonNumber,
        (logCounts.get(log.seasonNumber) ?? 0) + 1
      )

  const seasons = sortSeasons(show.seasons)
  const regular = show.seasons.filter((s) => s.seasonNumber > 0)
  const loggedRegular = regular.filter((s) =>
    logCounts.has(s.seasonNumber)
  ).length

  return (
    <DetailSection
      title="Seasons"
      action={
        <span className="text-sm text-muted-foreground tabular-nums">
          {loggedRegular}/{regular.length} logged
        </span>
      }
    >
      <ScrollRow>
        {seasons.map((season) => (
          <SeasonCard
            key={season.seasonNumber}
            showId={show.id}
            season={season}
            fallbackPoster={show.poster}
            logCount={logCounts.get(season.seasonNumber) ?? 0}
          />
        ))}
      </ScrollRow>
    </DetailSection>
  )
}

function SeasonCard({
  showId,
  season,
  fallbackPoster,
  logCount,
}: {
  showId: number
  season: SeasonSummary
  fallbackPoster: Show["poster"]
  logCount: number
}) {
  return (
    <Link
      to="/shows/$id/seasons/$season"
      params={{ id: String(showId), season: String(season.seasonNumber) }}
      className="pressable relative block w-28 shrink-0 snap-start md:w-32"
    >
      <Poster
        image={season.poster ?? fallbackPoster}
        type="show"
        title={season.name}
      />
      {logCount > 0 ? (
        <span
          aria-label={`Logged ${logCount} time${logCount === 1 ? "" : "s"}`}
          className="absolute top-1.5 right-1.5 flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground shadow-md"
        >
          <CheckIcon className="size-3.5" strokeWidth={3} />
          {logCount > 1 ? logCount : null}
        </span>
      ) : null}
      <p className="mt-2 truncate text-sm font-medium">{season.name}</p>
      <p className="text-xs text-muted-foreground">
        {joinDefined([
          `${season.episodeCount} eps`,
          season.airDate?.slice(0, 4),
        ])}
      </p>
    </Link>
  )
}
