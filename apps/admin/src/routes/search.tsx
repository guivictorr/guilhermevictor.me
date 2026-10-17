import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query"
import {
  createFileRoute,
  stripSearchParams,
  useNavigate,
} from "@tanstack/react-router"
import { MediaType } from "@workspace/schemas"
import type { CollectionItem, MediaSummary } from "@workspace/schemas"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { Spinner } from "@workspace/ui/components/spinner"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"
import {
  SearchIcon,
  SearchXIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useEffect, useMemo, useState } from "react"
import { z } from "zod"
import {
  MediaCard,
  MediaGrid,
  MediaGridSkeleton,
} from "@/components/media-card"
import { PageBody, PageHeader } from "@/components/page-header"
import { LoadMore } from "@/components/load-more"
import { SwipeButton } from "@/components/swipe/swipe-button"
import { SwipeDeck } from "@/components/swipe/swipe-deck"
import { swipeSearch, useSwipe } from "@/components/swipe/swipe-search"
import { CardBacklogBadge } from "@/components/media/backlog-button"
import { ScrollRow, toBacklogItem } from "@/components/media/media-rail"
import { ReleaseResultList } from "@/components/records/release-result-list"
import { FilterSheet } from "@/components/search/filter-sheet"
import {
  FILTER_FIELDS,
  SearchFilters,
  activeFilters,
  filtersFor,
} from "@/lib/search-filters"
import { KINDS, KIND_ORDER } from "@/lib/media-kinds"
import type { FilterField } from "@/lib/search-filters"
import { collectionQuery, indexQuery, mediaKey } from "@/queries/archive"
import {
  searchPagesQuery,
  trendingQuery,
  watchProvidersQuery,
} from "@/queries/media"

const SearchParams = z
  .object({
    type: MediaType.catch("movie").default("movie"),
    // The router parses number-like values ("1984", ISBNs) as numbers.
    q: z.coerce.string().catch("").default(""),
  })
  .extend(SearchFilters.shape)
  .extend(swipeSearch.shape)

const PLACEHOLDER = {
  movie: "Search movies on TMDB",
  show: "Search shows on TMDB",
  game: "Search games on IGDB",
  book: "Search books by title, author or ISBN",
  record: "Search vinyl on Discogs",
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
  // With no query the page shows what's trending, rendered on the server so
  // the grid is in the first HTML. prefetchQuery never throws: a provider
  // error shows inline instead of failing the whole page.
  loader: ({ context, deps }) =>
    deps.q || deps.browsing
      ? undefined
      : context.queryClient.prefetchQuery(trendingQuery(deps.type)),
  head: () => ({ meta: [{ title: "Search · Archive" }] }),
  component: SearchPage,
})

function SearchPage() {
  const search = Route.useSearch()
  const { type, q } = search
  const filters = filtersFor(type, search)
  const active = activeFilters(type, filters)
  const navigate = useNavigate({ from: Route.fullPath })
  const [input, setInput] = useState(q)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const applyFilters = (next: SearchFilters) =>
    navigate({
      search: { type, q, ...filtersFor(type, next) },
      replace: true,
      viewTransition: false,
    })

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
  const swipe = useSwipe("results")
  const [dimHave, setDimHave] = useSearchToggle("archive:search-gray-have")
  const [hideBacklog, setHideBacklog] = useSearchToggle(
    "archive:search-hide-backlog"
  )
  const have = useHave()
  const inBacklog = useInBacklog()
  // Backlogged works are left out of the list; with "Gray out" on,
  // swiping also skips what you already have.
  const shown = hideBacklog ? data.filter((m) => !inBacklog(m)) : data
  const swipeItems = dimHave ? shown.filter((m) => !have(m)) : shown

  return (
    <>
      <PageHeader title="Search" />
      <PageBody className="space-y-3">
        <div className="flex gap-2">
          <InputGroup className="h-11 flex-1 rounded-xl">
            <InputGroupAddon>
              {isFetching ? <Spinner /> : <SearchIcon />}
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Search"
              placeholder={PLACEHOLDER[type]}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="text-base"
            />
            {input ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label="Clear search"
                  onClick={() => setInput("")}
                >
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
          <Button
            variant="outline"
            size="lg"
            className="relative h-11 rounded-xl"
            aria-label={`Filters${active.length ? ` (${active.length} active)` : ""}`}
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontalIcon />
            <span className="max-sm:sr-only">Filters</span>
            {active.length ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground tabular-nums">
                {active.length}
              </span>
            ) : null}
          </Button>
        </div>

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

        <FilterChips type={type} filters={filters} onChange={applyFilters} />

        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Switch size="sm" checked={dimHave} onCheckedChange={setDimHave} />
            Gray out what I already have
          </label>
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Switch
              size="sm"
              checked={hideBacklog}
              onCheckedChange={setHideBacklog}
            />
            Hide my backlog
          </label>
        </div>

        <div className="pt-3">
          {!q && !active.length ? (
            <Trending
              type={type}
              dim={dimHave ? have : undefined}
              hide={hideBacklog ? inBacklog : undefined}
            />
          ) : isError ? (
            <SearchEmpty
              icon={<SearchXIcon />}
              title="Search failed"
              description={error.message}
            />
          ) : isPending ? (
            <MediaGridSkeleton />
          ) : data.length === 0 ? (
            <SearchEmpty
              icon={<SearchXIcon />}
              title="No results"
              description={
                q
                  ? `Nothing matched “${q}”${active.length ? " with these filters" : ""}.`
                  : "Nothing matches these filters."
              }
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
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground tabular-nums">
                  {shown.length}
                  {hasNextPage ? "+" : ""} result
                  {shown.length === 1 && !hasNextPage ? "" : "s"}
                </p>
                {swipeItems.length ? (
                  <SwipeButton onClick={swipe.openDeck} />
                ) : null}
              </div>
              <SwipeDeck
                open={swipe.open}
                items={swipeItems}
                title={q ? `“${q}”` : "Results"}
                onClose={swipe.close}
                hasMore={hasNextPage}
                loadingMore={isFetchingNextPage}
                onNearEnd={() => void fetchNextPage()}
              />
              {type === "record" ? (
                <ReleaseResultList results={shown} dimOwned={dimHave} />
              ) : (
                <MediaGrid>
                  {shown.map((media) => (
                    <MediaCard
                      key={`${media.type}-${media.id}`}
                      media={media}
                      dimmed={dimHave && have(media)}
                      badge={<CardBacklogBadge item={toBacklogItem(media)} />}
                    />
                  ))}
                </MediaGrid>
              )}
              <LoadMore
                active={hasNextPage && !isFetchingNextPage}
                loading={isFetchingNextPage}
                onVisible={() => void fetchNextPage()}
              />
            </div>
          )}
        </div>
      </PageBody>
      <FilterSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        type={type}
        filters={filters}
        hasQuery={Boolean(q)}
        onApply={applyFilters}
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
          const { plural, icon: Icon } = KINDS[type]
          const active = type === value
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(type)}
              className={cn(
                "pressable inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border ps-3 pe-3.5 text-sm font-medium",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {plural}
            </button>
          )
        })}
      </ScrollRow>
    </div>
  )
}

/** Active filters as removable chips under the search bar. */
function FilterChips({
  type,
  filters,
  onChange,
}: {
  type: MediaType
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
}) {
  const { data: providers } = useQuery({
    ...watchProvidersQuery(type === "show" ? "show" : "movie"),
    enabled:
      filters.provider !== undefined && (type === "movie" || type === "show"),
  })
  const chips = FILTER_FIELDS[type].flatMap((field) => {
    const label = chipLabel(field, filters, providers)
    return label ? [{ key: field.key, label }] : []
  })
  if (!chips.length) return null
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...filters,
                [chip.key]: undefined,
                ...(chip.key === "from" ? { to: undefined } : {}),
              })
            }
            className="pressable inline-flex h-8 items-center gap-1 rounded-full border bg-card pr-2 pl-3 text-sm"
            aria-label={`Remove filter ${chip.label}`}
          >
            {chip.label}
            <XIcon className="size-3.5 text-muted-foreground" />
          </button>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={() => onChange({})}
          className="h-8 px-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Clear all
        </button>
      </li>
    </ul>
  )
}

function chipLabel(
  field: FilterField,
  filters: SearchFilters,
  providers?: Array<{ value: string; label: string }>
): string | undefined {
  switch (field.control) {
    case "years": {
      const { from, to } = filters
      if (from === undefined && to === undefined) return undefined
      if (from === to) return String(from)
      return `${from ?? "…"}–${to ?? "…"}`
    }
    case "rating":
      return filters.rating === undefined ? undefined : `${filters.rating}★+`
    case "toggle":
      return filters.extras === "1" ? "With DLC & editions" : undefined
    case "providers":
      return filters.provider === undefined
        ? undefined
        : (providers?.find((p) => p.value === filters.provider)?.label ??
            "Streaming")
    case "select": {
      const value = filters[field.key]
      if (value === undefined) return undefined
      const option = field.options.find((o) => o.value === String(value))
      return field.key === "sort"
        ? option?.label
        : `${field.label}: ${option?.label ?? value}`
    }
    case "text": {
      const value = filters[field.key]
      return value === undefined ? undefined : `${field.label}: ${value}`
    }
  }
}

/** Several copies of one release should show once. */
function uniqueReleases(items: Array<CollectionItem>) {
  const seen = new Set<number>()
  return items.filter((c) => !seen.has(c.releaseId) && seen.add(c.releaseId))
}

const TRENDING_TITLE: Record<MediaType, string> = {
  movie: "Trending movies this week",
  show: "Trending shows this week",
  game: "Popular games right now",
  book: "Trending books this week",
  record: "Recently added to your collection",
}

/** Logged works, and records you own: what search can gray out. */
function useHave() {
  const { data: index } = useQuery(indexQuery())
  return (media: MediaSummary) =>
    media.type === "record"
      ? (index?.owned.has(mediaKey(media)) ?? false)
      : (index?.logged.has(mediaKey(media)) ?? false)
}

/** In your backlog: what search can hide. */
function useInBacklog() {
  const { data: index } = useQuery(indexQuery())
  return (media: MediaSummary) => index?.backlog.has(mediaKey(media)) ?? false
}

/** A search switch, on by default; remembered in this browser only. */
function useSearchToggle(key: string) {
  const [on, setOn] = useState(true)
  useEffect(() => {
    try {
      if (localStorage.getItem(key) === "off") setOn(false)
    } catch {
      // Blocked storage: keep the default.
    }
  }, [key])
  const update = (next: boolean) => {
    setOn(next)
    try {
      localStorage.setItem(key, next ? "on" : "off")
    } catch {
      // Not remembered, still applied.
    }
  }
  return [on, update] as const
}

function Trending({
  type,
  dim,
  hide,
}: {
  type: MediaType
  /** Grays these covers (already in your archive). */
  dim?: (media: MediaSummary) => boolean
  /** Leaves these out (in your backlog). */
  hide?: (media: MediaSummary) => boolean
}) {
  const swipe = useSwipe("trending")
  // Discogs has no trending list: show your own latest additions instead.
  const trending = useQuery({
    ...trendingQuery(type),
    enabled: type !== "record",
  })
  const collection = useQuery({
    ...collectionQuery(),
    enabled: type === "record",
  })
  const isPending =
    type === "record" ? collection.isPending : trending.isPending
  const isError = type === "record" ? collection.isError : trending.isError
  const all: Array<MediaSummary> =
    type === "record"
      ? uniqueReleases(collection.data ?? [])
          .slice(0, 18)
          .map((c) => ({
            type: "record",
            id: c.releaseId,
            title: c.title,
            subtitle: c.artist,
            year: c.year,
            poster: c.cover,
          }))
      : (trending.data ?? [])
  const data = hide ? all.filter((m) => !hide(m)) : all
  // Grayed-out covers (already in your archive) are left out of swipe.
  const swipeItems = dim ? data.filter((m) => !dim(m)) : data

  if (isError || (!isPending && data.length === 0))
    return (
      <SearchEmpty
        icon={<SearchIcon />}
        title="Find something to log"
        description="Search by title. Results come from TMDB, IGDB, Google Books and Discogs."
      />
    )

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">
          {TRENDING_TITLE[type]}
        </h2>
        {swipeItems.length ? <SwipeButton onClick={swipe.openDeck} /> : null}
      </div>
      <SwipeDeck
        open={swipe.open}
        items={swipeItems}
        title={TRENDING_TITLE[type]}
        onClose={swipe.close}
      />
      {isPending ? (
        <MediaGridSkeleton />
      ) : (
        <MediaGrid>
          {data.map((media) => (
            <MediaCard
              key={`${media.type}-${media.id}`}
              media={media}
              dimmed={dim?.(media) ?? false}
              badge={<CardBacklogBadge item={toBacklogItem(media)} />}
            />
          ))}
        </MediaGrid>
      )}
    </section>
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
