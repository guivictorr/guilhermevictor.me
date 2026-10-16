import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { PlusIcon } from "lucide-react"
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
import { useLogSheet } from "@/components/log/use-log-sheet"
import { BacklogButton } from "@/components/media/backlog-button"
import {
  CollectionSection,
  LogsTabLabel,
  SynopsisSection,
  TrailerSection,
} from "@/components/media/detail-sections"
import { MediaRail } from "@/components/media/media-rail"
import { SwipeAction } from "@/components/swipe/swipe-button"
import { PeopleGrid } from "@/components/media/people-grid"
import { YourStatsCard } from "@/components/media/your-stats-card"
import { formatDate, formatRuntime, joinDefined } from "@/lib/format"
import { parseId } from "@/lib/params"
import { logsQuery } from "@/queries/archive"
import { movieQuery } from "@/queries/media"

export const Route = createFileRoute("/movies/$id")({
  validateSearch: logSearch,
  loader: ({ context, params }) => {
    // Your logs load alongside the details, not after them.
    void context.queryClient.prefetchQuery(
      logsQuery({ type: "movie", id: parseId(params.id) })
    )
    return context.queryClient.ensureQueryData(movieQuery(parseId(params.id)))
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.title} · Archive` : "Archive" }],
  }),
  pendingComponent: DetailSkeleton,
  component: MoviePage,
})

function MoviePage() {
  const { id } = Route.useParams()
  const { data: movie } = useSuspenseQuery(movieQuery(parseId(id)))
  const sheet = useLogSheet()
  useOpenLogFromSearch(sheet.openNew)
  const item = {
    type: "movie" as const,
    id: movie.id,
    title: movie.title,
    year: movie.year,
    poster: movie.poster,
    genres: movie.genres,
  }

  return (
    <article>
      <DetailHero
        type="movie"
        title={movie.title}
        poster={movie.poster}
        backdrop={movie.backdrop}
        backTo="/movies"
        tagline={movie.tagline}
        meta={joinDefined([
          movie.year,
          formatRuntime(movie.runtime),
          movie.directors.at(0),
        ])}
        genres={movie.genres}
        ratings={
          <RatingsRow
            provider={movie.providerRating}
            type="movie"
            id={movie.id}
          />
        }
        actions={
          <>
            <Button
              size="lg"
              className="h-11 text-base"
              onClick={sheet.openNew}
            >
              <PlusIcon />
              Log watch
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
                <SynopsisSection text={movie.overview} />
                <TrailerSection video={movie.trailer} />
                <CollectionSection collection={movie.collection} />
                {movie.recommendations.length ? (
                  <DetailSection
                    title="Recommendations"
                    action={
                      <SwipeAction
                        id="recommendations"
                        items={movie.recommendations}
                        title={`Like ${movie.title}`}
                      />
                    }
                  >
                    <MediaRail items={movie.recommendations} />
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
                  <PeopleGrid people={movie.credits.cast} />
                </DetailSection>
                <DetailSection title="Crew">
                  <PeopleGrid people={movie.credits.crew} />
                </DetailSection>
              </>
            ),
          },
          {
            value: "logs",
            label: <LogsTabLabel type="movie" id={movie.id} />,
            content: (
              <LogHistory
                type="movie"
                id={movie.id}
                onSelect={sheet.openEdit}
                emptyLabel="You haven't logged this movie yet."
              />
            ),
          },
        ]}
        aside={
          <>
            <YourStatsCard type="movie" id={movie.id} />
            <DetailsCard
              facts={[
                ["Status", movie.status],
                ["Released", formatDate(movie.releaseDate)],
                ["Runtime", formatRuntime(movie.runtime)],
                ["Directed by", movie.directors.join(", ")],
                ["Written by", movie.writers.slice(0, 3).join(", ")],
                ["Country", movie.countries.join(", ")],
                ["Production", movie.companies.slice(0, 4).join(", ")],
                ["Original title", movie.originalTitle],
                ["IMDb", movie.imdbId],
              ]}
            />
          </>
        }
      />

      <LogSheet
        open={sheet.open}
        onOpenChange={sheet.onOpenChange}
        editing={sheet.editing}
        target={{ kind: "movie", item }}
      />
    </article>
  )
}
