import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  ArchiveIcon,
  ChevronRightIcon,
  PlusIcon,
  SettingsIcon,
} from "lucide-react"
import { describeLogDates } from "@/components/log/log-history"
import { MediaCard, MediaLink } from "@/components/media-card"
import { PageBody, PageHeader } from "@/components/page-header"
import { Poster } from "@/components/poster"
import { StarRating } from "@/components/star-rating"
import { MediaRail } from "@/components/media/media-rail"
import { FactsDeck } from "@/components/home/facts-deck"
import { dailyPicks } from "@/lib/daily-picks"
import { today } from "@/lib/format"
import { LIBRARY_SECTIONS } from "@/lib/media-kinds"
import type { LibrarySection } from "@/lib/media-kinds"
import {
  backlogQuery,
  libraryQuery,
  recentQuery,
  flightsQuery,
  statsQuery,
} from "@/queries/archive"

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Archive" }] }),
  component: HomePage,
})

function HomePage() {
  const recent = useQuery(recentQuery(15))
  const games = useQuery(libraryQuery("game"))
  const playing = games.data?.filter((g) => g.status === "playing") ?? []

  return (
    <>
      <PageHeader
        title="Archive"
        subtitle="Everything you've watched, played and collected."
        actions={
          <Link
            to="/settings"
            aria-label="Settings"
            className={buttonVariants({
              variant: "ghost",
              size: "icon-lg",
              className: "rounded-full md:hidden",
            })}
          >
            <SettingsIcon className="size-5" />
          </Link>
        }
      />
      <PageBody className="space-y-8">
        <Counts />
        <FactsDeck />
        <ForToday />

        {playing.length > 0 ? (
          <section>
            <SectionTitle title="Now playing" to="/games" />
            <div className="-mx-4 flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 md:mx-0 md:px-0">
              {playing.map((game) => (
                <div key={game.id} className="w-28 shrink-0 snap-start md:w-32">
                  <MediaCard media={game} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <SectionTitle title="Recently logged" />
          {recent.isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : recent.data?.length ? (
            <ul className="divide-y overflow-hidden rounded-xl border bg-card">
              {recent.data.map(({ log, item }) => (
                <li key={log.id}>
                  <MediaLink
                    media={item}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50 active:bg-muted"
                  >
                    <Poster
                      image={item.poster}
                      type={item.type}
                      title={item.title}
                      size="thumb"
                      className="w-11 shrink-0 rounded-md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.title}
                        {log.kind === "season" ? (
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            · S{log.seasonNumber}
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {describeLogDates(log)}
                      </p>
                      <StarRating
                        rating={log.rating}
                        className="mt-0.5 text-xs"
                      />
                    </div>
                    <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                  </MediaLink>
                </li>
              ))}
            </ul>
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ArchiveIcon />
                </EmptyMedia>
                <EmptyTitle>Your archive is empty</EmptyTitle>
                <EmptyDescription>
                  Log your first movie, season or game.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link
                  to="/search"
                  search={{ type: "movie", q: "" }}
                  className={buttonVariants({ size: "lg" })}
                >
                  <PlusIcon />
                  Find something
                </Link>
              </EmptyContent>
            </Empty>
          )}
        </section>
      </PageBody>
    </>
  )
}

function SectionTitle({
  title,
  to,
}: {
  title: string
  to?: "/games" | "/backlog"
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      {to ? (
        <Link
          to={to}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          See all
        </Link>
      ) : null}
    </div>
  )
}

/** Deciding what to do: today's picks from the backlog. */
function ForToday() {
  const { data: backlog } = useQuery(backlogQuery())
  const picks = useMemo(
    () => (backlog ? dailyPicks(backlog, today()) : []),
    [backlog]
  )
  if (!backlog?.length) return null
  return (
    <section>
      <SectionTitle title="For today" to="/backlog" />
      <MediaRail items={picks} />
    </section>
  )
}

/** One tile per library section: logged works, owned records, flights. */
function Counts() {
  const { data: stats } = useQuery(statsQuery())
  const { data: flights } = useQuery(flightsQuery())
  const value = (key: LibrarySection["key"]) =>
    key === "flight" ? flights?.length : stats?.byType[key].items
  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
      {LIBRARY_SECTIONS.map(({ key, plural, to }) => {
        const count = value(key)
        return (
          <Link
            key={key}
            to={to}
            className="pressable edge-highlight min-w-0 rounded-[20px] border bg-card p-3.5 transition-colors hover:bg-raised"
          >
            <div className="font-dots text-[1.75rem]">
              {count === undefined ? <Skeleton className="h-8 w-8" /> : count}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {plural}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
