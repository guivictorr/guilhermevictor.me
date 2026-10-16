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
import { MediaLink } from "@/components/media-card"
import { PageBody, PageHeader } from "@/components/page-header"
import { swipeSearch } from "@/components/swipe/swipe-search"
import { Poster } from "@/components/poster"
import { StarRating } from "@/components/star-rating"
import { SwipeAction } from "@/components/swipe/swipe-button"
import { FactsDeck } from "@/components/home/facts-deck"
import { NextFlightCard } from "@/components/home/next-flight-card"
import {
  ForTodayCards,
  CardRow,
  NowCard,
  useTodayPicks,
} from "@/components/home/feature-cards"
import { backlogQuery, libraryQuery, recentQuery } from "@/queries/archive"

export const Route = createFileRoute("/")({
  validateSearch: swipeSearch,
  head: () => ({ meta: [{ title: "Archive" }] }),
  component: HomePage,
})

function HomePage() {
  const recent = useQuery(recentQuery(15))
  const games = useQuery(libraryQuery("game"))
  const shows = useQuery(libraryQuery("show"))
  const books = useQuery(libraryQuery("book"))
  // What you're in the middle of, by the status of each work's latest log.
  const now = [
    {
      type: "game" as const,
      entries: games.data?.filter((e) => e.status === "playing") ?? [],
    },
    {
      type: "show" as const,
      entries: shows.data?.filter((e) => e.status === "watching") ?? [],
    },
    {
      type: "book" as const,
      entries: books.data?.filter((e) => e.status === "reading") ?? [],
    },
  ].filter((group) => group.entries.length > 0)

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
        <FactsDeck />
        <NextFlightCard />
        <ForToday />

        {now.length > 0 ? (
          <section>
            <SectionTitle
              title="Now"
              swipe={
                <SwipeAction
                  id="now"
                  items={now.flatMap((group) => group.entries)}
                  title="In progress"
                />
              }
            />
            <CardRow>
              {now.map((group) => (
                <NowCard
                  key={group.type}
                  type={group.type}
                  entries={group.entries}
                />
              ))}
            </CardRow>
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
  swipe,
}: {
  title: string
  to?: "/games" | "/backlog"
  swipe?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="mr-auto font-heading text-lg font-semibold">{title}</h2>
      {swipe}
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
  const groups = useTodayPicks(backlog)
  if (!groups.length) return null
  return (
    <section>
      <SectionTitle
        title="For today"
        to="/backlog"
        swipe={
          <SwipeAction
            id="today"
            items={groups.flatMap((g) => g.picks)}
            title="For today"
          />
        }
      />
      <ForTodayCards groups={groups} />
    </section>
  )
}
