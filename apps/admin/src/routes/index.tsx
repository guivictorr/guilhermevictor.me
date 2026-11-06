import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query"
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
import { FactsDeck, FactsSkeleton } from "@/components/home/facts-deck"
import { NextFlightCard } from "@/components/home/next-flight-card"
import {
  CardRow,
  NOW_TYPES,
  NowCard,
  SuggestionCard,
  homeSlots,
  slotItems,
} from "@/components/home/feature-cards"
import {
  CardRowSkeleton,
  ListSkeleton,
  SuspenseSection,
} from "@/components/loaders"
import { prefetchWorkDetails } from "@/components/media/use-work-details"
import { airportsQuery } from "@/lib/airports"
import {
  backlogQuery,
  factsQuery,
  flightsQuery,
  libraryQuery,
  logsQuery,
  recentQuery,
} from "@/queries/archive"

export const Route = createFileRoute("/")({
  validateSearch: swipeSearch,
  // Start every section's data at once (no waterfalls), without blocking
  // the navigation: sections suspend into skeletons of their own size.
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(recentQuery(RECENT))
    void queryClient.prefetchQuery(factsQuery())
    void queryClient.prefetchQuery(flightsQuery())
    void queryClient.prefetchQuery(backlogQuery())
    for (const type of NOW_TYPES)
      void queryClient.prefetchQuery(libraryQuery(type))
    // Browser only from here: the server renders the cards without their
    // details, and details streamed in mid-hydration wouldn't match.
    if (typeof window === "undefined") return
    // Flight facts and the next flight need the airports file.
    void queryClient.prefetchQuery(airportsQuery())
    // Dependent prefetch: the cards' details (and the latest log of what's
    // in progress), as soon as the lists that pick them land.
    void Promise.all([
      queryClient.ensureQueryData(backlogQuery()),
      queryClient.ensureQueryData(libraryQuery("game")),
      queryClient.ensureQueryData(libraryQuery("show")),
      queryClient.ensureQueryData(libraryQuery("book")),
    ]).then(([backlog, game, show, book]) => {
      for (const slot of homeSlots({ game, show, book }, backlog)) {
        const [featured] = slotItems(slot)
        if (!featured) continue
        void prefetchWorkDetails(queryClient, featured)
        if ("now" in slot) void queryClient.prefetchQuery(logsQuery(featured))
      }
    }, noop)
  },
  head: () => ({ meta: [{ title: "Archive" }] }),
  component: HomePage,
})

const RECENT = 15
const noop = () => undefined

function HomePage() {
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
        <SuspenseSection fallback={<FactsSkeleton />}>
          <FactsDeck />
        </SuspenseSection>
        <SuspenseSection fallback={null}>
          <NextFlightCard />
        </SuspenseSection>
        <SuspenseSection fallback={<CardRowSkeleton />}>
          <Now />
        </SuspenseSection>
        <SuspenseSection fallback={<ListSkeleton title rows={5} />}>
          <RecentlyLogged />
        </SuspenseSection>
      </PageBody>
    </>
  )
}

/**
 * What you're in the middle of: a card per kind (game, show, book). A kind
 * with nothing in progress shows a pick from its backlog in that spot.
 */
function Now() {
  // One hook for all four lists: separate suspense hooks would wait in turn.
  const slots = useSuspenseQueries({
    queries: [
      backlogQuery(),
      libraryQuery("game"),
      libraryQuery("show"),
      libraryQuery("book"),
    ],
    combine: ([backlog, game, show, book]) =>
      homeSlots(
        { game: game.data, show: show.data, book: book.data },
        backlog.data
      ),
  })
  if (!slots.length) return null
  const suggesting = slots.some((slot) => !("now" in slot))
  return (
    <section>
      <SectionTitle
        title="Now"
        to={suggesting ? "/backlog" : undefined}
        swipe={
          <SwipeAction id="now" items={slots.flatMap(slotItems)} title="Now" />
        }
      />
      <CardRow>
        {slots.map((slot) =>
          "now" in slot ? (
            <NowCard key={slot.type} type={slot.type} entries={slot.now} />
          ) : (
            <SuggestionCard
              key={slot.type}
              type={slot.type}
              picks={slot.picks}
            />
          )
        )}
      </CardRow>
    </section>
  )
}

function RecentlyLogged() {
  const { data: recent } = useSuspenseQuery(recentQuery(RECENT))
  return (
    <section>
      <SectionTitle title="Recently logged" />
      {recent.length ? (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {recent.map(({ log, item }) => (
            <li key={log.id}>
              <MediaLink
                media={item}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 active:bg-muted"
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
                  <StarRating rating={log.rating} className="mt-0.5 text-xs" />
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
