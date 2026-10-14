import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { PlusIcon } from "lucide-react"
import {
  DetailBody,
  DetailHero,
  DetailSkeleton,
  DetailsCard,
} from "@/components/detail-layout"
import { LogHistory } from "@/components/log/log-history"
import { LogSheet } from "@/components/log/log-sheet"
import { useLogSheet } from "@/components/log/use-log-sheet"
import { SynopsisSection } from "@/components/media/detail-sections"
import { formatDate, formatRuntime, joinDefined } from "@/lib/format"
import { parseId } from "@/lib/params"
import { seasonQuery, showQuery } from "@/queries/media"

export const Route = createFileRoute("/shows/$id/seasons/$season")({
  loader: async ({ context, params }) => {
    const id = parseId(params.id)
    const season = parseId(params.season, { allowZero: true })
    const [show, seasonData] = await Promise.all([
      context.queryClient.ensureQueryData(showQuery(id)),
      context.queryClient.ensureQueryData(seasonQuery(id, season)),
    ])
    return { title: `${show.title} · ${seasonData.name}` }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.title} · Archive` : "Archive" }],
  }),
  pendingComponent: DetailSkeleton,
  component: SeasonPage,
})

function SeasonPage() {
  const params = Route.useParams()
  const id = parseId(params.id)
  const seasonNumber = parseId(params.season, { allowZero: true })
  const { data: show } = useSuspenseQuery(showQuery(id))
  const { data: season } = useSuspenseQuery(seasonQuery(id, seasonNumber))
  const sheet = useLogSheet()
  const runtime = season.episodes.reduce((sum, e) => sum + (e.runtime ?? 0), 0)

  return (
    <article>
      <DetailHero
        type="show"
        title={season.name}
        poster={season.poster ?? show.poster}
        backdrop={show.backdrop}
        backTo={`/shows/${id}`}
        eyebrow={show.title}
        meta={joinDefined([
          season.airDate?.slice(0, 4),
          `${season.episodes.length} episodes`,
        ])}
        actions={
          <Button size="lg" className="h-11 text-base" onClick={sheet.openNew}>
            <PlusIcon />
            Log season
          </Button>
        }
      />

      <DetailBody
        tabs={[
          {
            value: "episodes",
            label: "Episodes",
            content: (
              <>
                <SynopsisSection text={season.overview} />
                <ol className="divide-y overflow-hidden rounded-xl border bg-card">
                  {season.episodes.map((episode) => (
                    <li
                      key={episode.episodeNumber}
                      className="flex gap-3 px-4 py-3"
                    >
                      <span className="w-6 shrink-0 pt-px text-sm text-muted-foreground tabular-nums">
                        {episode.episodeNumber}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{episode.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {joinDefined([
                            formatDate(episode.airDate),
                            formatRuntime(episode.runtime),
                          ])}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            ),
          },
          {
            value: "logs",
            label: "My logs",
            content: (
              <LogHistory
                type="show"
                id={id}
                filter={(log) =>
                  log.kind === "season" && log.seasonNumber === seasonNumber
                }
                onSelect={sheet.openEdit}
                emptyLabel="You haven't logged this season yet."
              />
            ),
          },
        ]}
        aside={
          <DetailsCard
            facts={[
              ["Show", show.title],
              ["Aired", formatDate(season.airDate)],
              ["Episodes", season.episodes.length],
              ["Total runtime", formatRuntime(runtime)],
            ]}
          />
        }
      />

      <LogSheet
        open={sheet.open}
        onOpenChange={sheet.onOpenChange}
        editing={sheet.editing}
        target={{
          kind: "season",
          seasonNumber,
          seasonName: season.name,
          item: {
            type: "show",
            id: show.id,
            title: show.title,
            year: show.year,
            poster: show.poster,
            genres: show.genres,
          },
        }}
      />
    </article>
  )
}
