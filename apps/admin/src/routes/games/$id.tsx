import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { PlusIcon } from "lucide-react"
import {
  DetailBody,
  DetailHero,
  DetailSection,
  DetailSkeleton,
  DetailsCard,
  RatingsRow,
  SideCard,
} from "@/components/detail-layout"
import { LogHistory } from "@/components/log/log-history"
import { LogSheet } from "@/components/log/log-sheet"
import { logSearch, useOpenLogFromSearch } from "@/components/log/log-search"
import { useLogSheet } from "@/components/log/use-log-sheet"
import { BacklogButton } from "@/components/media/backlog-button"
import {
  LogsTabLabel,
  SynopsisSection,
} from "@/components/media/detail-sections"
import { MediaRail, ScrollRow } from "@/components/media/media-rail"
import { SwipeAction } from "@/components/swipe/swipe-button"
import {
  TimeToBeatCard,
  YourStatsCard,
} from "@/components/media/your-stats-card"
import { YouTubeVideo } from "@/components/media/youtube"
import { formatDate, joinDefined } from "@/lib/format"
import { imageUrl } from "@/lib/images"
import { parseId } from "@/lib/params"
import { gameQuery } from "@/queries/media"

export const Route = createFileRoute("/games/$id")({
  validateSearch: logSearch,
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(gameQuery(parseId(params.id))),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.title} · Archive` : "Archive" }],
  }),
  pendingComponent: DetailSkeleton,
  component: GamePage,
})

function GamePage() {
  const { id } = Route.useParams()
  const { data: game } = useSuspenseQuery(gameQuery(parseId(id)))
  const sheet = useLogSheet()
  useOpenLogFromSearch(sheet.openNew)
  const item = {
    type: "game" as const,
    id: game.id,
    title: game.title,
    year: game.year,
    poster: game.cover,
    genres: game.genres,
  }

  return (
    <article>
      <DetailHero
        type="game"
        title={game.title}
        poster={game.cover}
        backdrop={game.screenshots.at(0)}
        backTo="/games"
        meta={joinDefined([game.year, game.developers.at(0)])}
        genres={game.genres}
        ratings={
          <RatingsRow provider={game.providerRating} type="game" id={game.id} />
        }
        actions={
          <>
            <Button
              size="lg"
              className="h-11 text-base"
              onClick={sheet.openNew}
            >
              <PlusIcon />
              Log play
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
                <SynopsisSection text={game.summary} />
                {game.videos.length ? (
                  <DetailSection title="Videos">
                    <ScrollRow>
                      {game.videos.map((video) => (
                        <YouTubeVideo
                          key={video.key}
                          video={video}
                          className="w-72 shrink-0 snap-start md:w-96"
                        />
                      ))}
                    </ScrollRow>
                  </DetailSection>
                ) : null}
                {game.screenshots.length ? (
                  <DetailSection title="Screenshots">
                    <ScrollRow>
                      {game.screenshots.map((shot) => (
                        <img
                          key={shot.path}
                          src={imageUrl(shot, "still")}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="aspect-video w-64 shrink-0 snap-start rounded-lg bg-muted object-cover md:w-80"
                        />
                      ))}
                    </ScrollRow>
                  </DetailSection>
                ) : null}
                {game.similar.length ? (
                  <DetailSection
                    title="Similar games"
                    action={
                      <SwipeAction
                        id="similar"
                        items={game.similar}
                        title={`Like ${game.title}`}
                      />
                    }
                  >
                    <MediaRail items={game.similar} />
                  </DetailSection>
                ) : null}
              </>
            ),
          },
          {
            value: "logs",
            label: <LogsTabLabel type="game" id={game.id} />,
            content: (
              <LogHistory
                type="game"
                id={game.id}
                onSelect={sheet.openEdit}
                emptyLabel="You haven't logged this game yet."
              />
            ),
          },
        ]}
        aside={
          <>
            <YourStatsCard type="game" id={game.id} />
            <TimeToBeatCard timeToBeat={game.timeToBeat} gameId={game.id} />
            {game.platforms.length ? (
              <SideCard title="Platforms">
                <ul className="flex flex-wrap gap-1.5">
                  {game.platforms.map((platform) => (
                    <li key={platform}>
                      <Badge variant="outline">{platform}</Badge>
                    </li>
                  ))}
                </ul>
              </SideCard>
            ) : null}
            <DetailsCard
              facts={[
                ["Released", formatDate(game.releaseDate)],
                ["Developer", game.developers.join(", ")],
                ["Publisher", game.publishers.join(", ")],
              ]}
            />
          </>
        }
      />

      <LogSheet
        open={sheet.open}
        onOpenChange={sheet.onOpenChange}
        editing={sheet.editing}
        target={{ kind: "game", platforms: game.platforms, item }}
      />
    </article>
  )
}
