import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query"
import {
  createFileRoute,
  stripSearchParams,
  useNavigate,
} from "@tanstack/react-router"
import { MediaType } from "@workspace/schemas"
import type { MediaSummary } from "@workspace/schemas"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { ChevronLeftIcon, SearchXIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { MediaGridSkeleton } from "@/components/media-card"
import { PageBody, PageHeader } from "@/components/page-header"
import { SearchField, SurpriseButton } from "@/components/search-field"
import { LoadMore } from "@/components/load-more"
import { SwipeDeck } from "@/components/swipe/swipe-deck"
import { swipeSearch, useSwipe } from "@/components/swipe/swipe-search"
import { ScrollRow } from "@/components/media/media-rail"
import {
  BecauseYouRated,
  GenreTiles,
  QuickFilters,
  Trending,
  recommends,
} from "@/components/search/discover-home"
import { FilterSheet } from "@/components/search/filter-sheet"
import {
  ActiveFilters,
  EmptyResults,
  ResultsList,
  ResultsToolbar,
} from "@/components/search/results"
import { useArchiveMarks, useSearchView } from "@/components/search/search-view"
import { DETAIL_ROUTE } from "@/lib/detail-routes"
import { SearchFilters, activeFilters, filtersFor } from "@/lib/search-filters"
import { KINDS, KIND_ORDER } from "@/lib/media-kinds"
import { indexQuery } from "@/queries/archive"
import { searchPagesQuery, trendingQuery } from "@/queries/media"

const SearchParams = z
  .object({
    type: MediaType.catch("movie").default("movie"),
    // The router parses number-like values ("1984", ISBNs) as numbers.
    q: z.coerce.string().catch("").default(""),
  })
  .extend(SearchFilters.shape)
  .extend(swipeSearch.shape)

const PLACEHOLDER = {
  movie: "Movies by title",
  show: "Shows by title",
  game: "Games by title",
  book: "Books by title, author or ISBN",
  record: "Vinyl on Discogs",
}

export const Route = createFileRoute("/search")({
  // Keep URLs clean: defaults are implied, not written.
  search: { middlewares: [stripSearchParams({ type: "movie", q: "" })] },
  validateSearch: SearchParams,
  loaderDeps: ({ search }) => ({
    type: search.type,
    q: search.q,
    browsing: activeFilters(search.type, search).length > 0,
  }),
  // With no query the page is Discover: trending is rendered on the server
  // so the grid is in the first HTML. The index comes along so that HTML
  // already leaves out what you have ("new to you", hidden results);
  // without it they'd show until the client fetched it. prefetchQuery never
  // throws: a provider error shows inline instead of failing the page.
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.prefetchQuery(indexQuery()),
      deps.q || deps.browsing
        ? undefined
        : context.queryClient.prefetchQuery(trendingQuery(deps.type)),
    ]),
  head: () => ({ meta: [{ title: "Search · Archive" }] }),
  component: SearchPage,
})

/**
 * Two states on one page. Discover (no text, no filters): quick filters,
 * genres, picks from your ratings, trending. Results: the
 * same search bar stays put (so typing never loses focus), with the active
 * filters as chips, a count, sort, grid or list, and the swipe view.
 */
function SearchPage() {
  const search = Route.useSearch()
  const { type, q } = search
  const filters = filtersFor(type, search)
  const active = activeFilters(type, filters)
  const discover = !q && !active.length
  const navigate = useNavigate({ from: Route.fullPath })
  const queryClient = useQueryClient()
  const [input, setInput] = useState(q)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const view = useSearchView()
  const marks = useArchiveMarks()

  const applyFilters = (next: SearchFilters) =>
    navigate({
      search: { type, q, ...filtersFor(type, next) },
      replace: true,
      viewTransition: false,
    })

  // Back to Discover from browsing (typed text has its own clear button).
  const backToDiscover = () => {
    setInput("")
    void navigate({ search: { type }, viewTransition: false })
  }

  // Debounce typing into the URL; the URL is the source of truth for the query.
  useEffect(() => {
    const next = input.trim()
    if (next === q) return
    const timeout = setTimeout(() => {
      void navigate({
        search: (prev) => ({ ...prev, q: next }),
        replace: true,
        viewTransition: false,
      })
    }, 300)
    return () => clearTimeout(timeout)
  }, [input, q, navigate])

  const results = useInfiniteQuery({
    ...searchPagesQuery(type, q, filters),
    placeholderData: keepPreviousData,
  })
  const { isFetching, isPending, isError, error } = results
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = results
  // Pages can overlap (providers reshuffle); keep each result once.
  const data = useMemo(
    () => [
      ...new Map(
        (results.data?.pages ?? [])
          .flat()
          .map((m) => [`${m.type}:${m.id}`, m] as const)
      ).values(),
    ],
    [results.data]
  )
  const hidden = (media: MediaSummary) =>
    (view.hideHave && marks.have(media)) ||
    (view.hideBacklog && marks.inBacklog(media))
  const shown = data.filter((m) => !hidden(m))
  const swipe = useSwipe("results")

  /** A random trending pick you don't have yet (Discover's shuffle). */
  function surprise() {
    const pool = queryClient.getQueryData(trendingQuery(type).queryKey) ?? []
    const fresh = pool.filter((m) => !marks.have(m) && !marks.inBacklog(m))
    const pick = fresh[Math.floor(Math.random() * fresh.length)]
    if (!pick) {
      toast("Nothing new to pick here", {
        description: "Try other filters or another kind.",
      })
      return
    }
    void navigate({
      to: DETAIL_ROUTE[pick.type],
      params: { id: String(pick.id) },
    })
  }

  return (
    <>
      {/*
       * Browsing results start with Back + search, like their own screen.
       * Typing keeps the title, so the bar doesn't jump on the first key.
       */}
      {discover || q ? <PageHeader title="Search" /> : null}
      {/*
       * The search bar is always this block's first child, so switching
       * between Discover and results never remounts it (typing keeps
       * focus). In results it sticks, with the active filters.
       */}
      <div
        className={cn(
          !discover &&
            "pt-safe sticky top-0 z-30 bg-background/90 backdrop-blur-xl"
        )}
      >
        <PageBody
          className={discover ? "space-y-4" : "space-y-3 pt-4 pb-3 md:pt-6"}
        >
          <div className="flex gap-2">
            {!discover && !q ? (
              <Button
                variant="secondary"
                size="icon"
                aria-label="Back to Discover"
                className="size-12 shrink-0 rounded-full"
                onClick={backToDiscover}
              >
                <ChevronLeftIcon className="size-5" />
              </Button>
            ) : null}
            <SearchField
              value={input}
              onChange={setInput}
              placeholder={
                discover || q ? PLACEHOLDER[type] : "Search within results"
              }
              icon={isFetching && !discover ? <Spinner /> : undefined}
            />
            {/* Discover only (results have Back instead); records' trending
                is your own collection, nothing to discover. */}
            {!discover || type === "record" ? null : (
              <SurpriseButton onClick={surprise} />
            )}
          </div>
          {discover ? (
            <>
              <KindPills
                value={type}
                onChange={(next) =>
                  // Filters are per kind; switching kinds starts clean.
                  navigate({
                    search: { type: next, q },
                    replace: true,
                    viewTransition: false,
                  })
                }
              />
              <QuickFilters
                type={type}
                filters={filters}
                onApply={applyFilters}
                onOpenFilters={() => setFiltersOpen(true)}
                hideHave={view.hideHave}
                onHideHave={view.setHideHave}
              />
            </>
          ) : (
            <ActiveFilters
              type={type}
              filters={filters}
              onChange={applyFilters}
              onOpenFilters={() => setFiltersOpen(true)}
            />
          )}
        </PageBody>
      </div>
      {/* Text searches can switch kinds; browsing is per kind (Back). */}
      {!discover && q ? (
        <PageBody className="pt-3">
          <KindPills
            value={type}
            onChange={(next) =>
              // Filters are per kind; switching kinds starts clean.
              navigate({
                search: { type: next, q },
                replace: true,
                viewTransition: false,
              })
            }
          />
        </PageBody>
      ) : null}

      <PageBody className="space-y-10 pt-4">
        {discover ? (
          <>
            <GenreTiles
              type={type}
              onPick={(genre) => applyFilters({ genre })}
            />
            {recommends(type) ? (
              <BecauseYouRated type={type} hide={hidden} />
            ) : null}
            <Trending
              type={type}
              hideHave={view.hideHave}
              hideBacklog={view.hideBacklog}
            />
          </>
        ) : isError ? (
          <SearchEmpty
            icon={<SearchXIcon />}
            title="Search failed"
            description={error.message}
          />
        ) : isPending ? (
          <MediaGridSkeleton />
        ) : shown.length === 0 && !hasNextPage ? (
          <EmptyResults
            type={type}
            query={q}
            filters={filters}
            onChange={applyFilters}
            onOpenFilters={() => setFiltersOpen(true)}
            hidden={data.length}
          />
        ) : (
          <div
            className={
              // Dim while a new search loads, not while appending pages.
              isFetching && !isFetchingNextPage
                ? "opacity-60 transition-opacity"
                : "transition-opacity"
            }
          >
            <ResultsToolbar
              type={type}
              query={q}
              filters={filters}
              loaded={shown.length}
              hasMore={hasNextPage}
              onSort={(sort) => applyFilters({ ...filters, sort })}
              layout={view.layout}
              onLayout={view.setLayout}
              onSwipe={shown.length ? swipe.openDeck : undefined}
            />
            <SwipeDeck
              open={swipe.open}
              items={shown}
              title={q ? `“${q}”` : "Results"}
              onClose={swipe.close}
              hasMore={hasNextPage}
              loadingMore={isFetchingNextPage}
              onNearEnd={() => void fetchNextPage()}
            />
            <ResultsList results={shown} layout={view.layout} />
            <LoadMore
              active={hasNextPage && !isFetchingNextPage}
              loading={isFetchingNextPage}
              onVisible={() => void fetchNextPage()}
            />
          </div>
        )}
      </PageBody>
      <FilterSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        type={type}
        query={q}
        filters={filters}
        view={view}
        onApply={(next, nextView) => {
          view.setHideHave(nextView.hideHave)
          view.setHideBacklog(nextView.hideBacklog)
          void applyFilters(next)
        }}
      />
    </>
  )
}

/** Media type as pills, like the library's kind switcher. */
function KindPills({
  value,
  onChange,
}: {
  value: MediaType
  onChange: (type: MediaType) => void
}) {
  return (
    <div role="radiogroup" aria-label="Media type">
      <ScrollRow className="snap-none gap-2 pb-1">
        {KIND_ORDER.map((type) => {
          const { plural } = KINDS[type]
          const active = type === value
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(type)}
              className={cn(
                "pressable inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium",
                active
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground"
              )}
            >
              {plural}
            </button>
          )
        })}
      </ScrollRow>
    </div>
  )
}

function SearchEmpty({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Empty className="min-h-[40dvh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription className="break-words">
          {description}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
