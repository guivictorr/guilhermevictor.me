import { useQueries, useQuery } from "@tanstack/react-query"
import type { MediaSummary, MediaType } from "@workspace/schemas"
import {
  ChevronRightIcon,
  LayoutGridIcon,
  ListIcon,
  SearchXIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react"
import { useFilterChips } from "./filter-chips"
import { formatCount } from "./search-view"
import type { ResultsLayout } from "./search-view"
import { MediaCard, MediaGrid, MediaLink } from "@/components/media-card"
import { CardBacklogBadge } from "@/components/media/backlog-button"
import { toBacklogItem } from "@/components/media/media-rail"
import { Poster } from "@/components/poster"
import { ListToolbar, ViewSwitch } from "@/components/list-toolbar"
import { ReleaseResultList } from "@/components/records/release-result-list"
import { KINDS } from "@/lib/media-kinds"
import { joinDefined } from "@/lib/format"
import { FILTER_FIELDS, withoutField } from "@/lib/search-filters"
import type { FilterKey, SearchFilters } from "@/lib/search-filters"
import { countQuery } from "@/queries/media"

const DEFAULT = "__default"

const countLabel = (type: MediaType, n: number) =>
  `${formatCount(n)} ${n === 1 ? KINDS[type].label.toLowerCase() : KINDS[type].plural.toLowerCase()}`

/** "Filters (n)" plus each active filter as a removable chip. */
export function ActiveFilters({
  type,
  filters,
  onChange,
  onOpenFilters,
}: {
  type: MediaType
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
  onOpenFilters: () => void
}) {
  const chips = useFilterChips(type, filters)
  return (
    <ul
      className="fade-x -mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0"
      aria-label="Active filters"
    >
      <li className="shrink-0">
        <button
          type="button"
          onClick={onOpenFilters}
          className="pressable inline-flex h-9 items-center gap-1.5 rounded-full border ps-3 pe-3 text-sm font-medium"
        >
          <SlidersHorizontalIcon className="size-4" />
          Filters
          {chips.length ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-xs text-background tabular-nums">
              {chips.length}
            </span>
          ) : null}
        </button>
      </li>
      {chips.map((chip) => (
        <li key={chip.key} className="shrink-0">
          <button
            type="button"
            onClick={() => onChange(withoutField(type, filters, chip.key))}
            aria-label={`Remove filter ${chip.label}`}
            className="pressable inline-flex h-9 max-w-64 items-center gap-1 rounded-full bg-foreground ps-3.5 pe-2 text-sm font-medium text-background"
          >
            <span className="truncate">{chip.label}</span>
            <XIcon className="size-4 shrink-0" />
          </button>
        </li>
      ))}
      {chips.length > 1 ? (
        <li className="shrink-0">
          <button
            type="button"
            onClick={() => onChange({ sort: filters.sort })}
            className="h-9 px-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        </li>
      ) : null}
    </ul>
  )
}

/** How many, in what order, and grid / list / swipe. */
export function ResultsToolbar({
  type,
  query,
  filters,
  loaded,
  hasMore,
  onSort,
  layout,
  onLayout,
  onSwipe,
}: {
  type: MediaType
  query: string
  filters: SearchFilters
  /** Results on screen (after hiding what you have). */
  loaded: number
  hasMore: boolean
  onSort: (sort: string | undefined) => void
  layout: ResultsLayout
  onLayout: (layout: ResultsLayout) => void
  /** Opens the swipe view; left out when there's nothing to swipe. */
  onSwipe?: () => void
}) {
  const count = useQuery(countQuery(type, query, filters))
  const sortField = FILTER_FIELDS[type].find((f) => f.key === "sort")
  const sorts = sortField && "options" in sortField ? sortField.options : []
  // The provider's default order is "relevance" with text, else the first.
  const sortItems = query
    ? [{ value: DEFAULT, label: "Most relevant" }, ...sorts]
    : sorts.map((o, i) => (i === 0 ? { ...o, value: DEFAULT } : o))

  return (
    <ListToolbar
      className="mb-4"
      count={
        typeof count.data === "number"
          ? countLabel(type, count.data)
          : `${loaded.toLocaleString("en-US")}${hasMore ? "+" : ""} results`
      }
      sort={{
        items: sortItems,
        value: filters.sort ?? DEFAULT,
        onChange: (v) => onSort(v === DEFAULT ? undefined : v),
      }}
      view={
        <ViewSwitch
          // Records are a list of pressings: no grid/list choice.
          options={
            type === "record"
              ? []
              : [
                  {
                    value: "grid" as const,
                    label: "Grid",
                    icon: <LayoutGridIcon className="size-4" />,
                  },
                  {
                    value: "list" as const,
                    label: "List",
                    icon: <ListIcon className="size-4" />,
                  },
                ]
          }
          value={layout}
          onChange={onLayout}
          onSwipe={onSwipe}
        />
      }
    />
  )
}

/** Covers in a grid, or a dense list to compare at a glance. */
export function ResultsList({
  results,
  layout,
}: {
  results: Array<MediaSummary>
  layout: ResultsLayout
}) {
  if (results[0]?.type === "record")
    return <ReleaseResultList results={results} dimOwned={false} />
  if (layout === "list")
    return (
      <ul className="divide-y overflow-hidden rounded-[20px] border bg-card">
        {results.map((media) => (
          <li
            key={`${media.type}-${media.id}`}
            className="flex items-center gap-3 py-2 ps-2 pe-3"
          >
            <MediaLink
              media={media}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <Poster
                image={media.poster}
                type={media.type}
                title={media.title}
                size="thumb"
                className="w-12 shrink-0"
              />
              <span className="min-w-0">
                <span className="line-clamp-2 text-sm font-medium">
                  {media.title}
                </span>
                <span className="block truncate text-xs text-muted-foreground tabular-nums">
                  {joinDefined([media.year, media.subtitle])}
                </span>
              </span>
            </MediaLink>
            <CardBacklogBadge item={toBacklogItem(media)} />
          </li>
        ))}
      </ul>
    )
  return (
    <MediaGrid>
      {results.map((media) => (
        <MediaCard
          key={`${media.type}-${media.id}`}
          media={media}
          badge={<CardBacklogBadge item={toBacklogItem(media)} />}
        />
      ))}
    </MediaGrid>
  )
}

/**
 * Nothing matched: say so, and offer the cheapest way out, each filter
 * you could drop with how many results it brings back (when countable).
 */
export function EmptyResults({
  type,
  query,
  filters,
  onChange,
  onOpenFilters,
  hidden,
}: {
  type: MediaType
  query: string
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
  onOpenFilters: () => void
  /** Results that exist but are hidden (you have them). */
  hidden: number
}) {
  const chips = useFilterChips(type, filters)
  const counts = useQueries({
    queries: chips.map((chip) =>
      countQuery(type, query, withoutField(type, filters, chip.key))
    ),
  })
  const relax = chips
    .map((chip, i) => ({ ...chip, count: counts[i]?.data }))
    // Countable ones first, most results first; zero brings nothing back.
    .filter((r) => r.count !== 0)
    .sort((a, b) => (b.count ?? -1) - (a.count ?? -1))
  const plural = KINDS[type].plural.toLowerCase()
  const drop = (key: FilterKey) => onChange(withoutField(type, filters, key))

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div className="space-y-2">
        <SearchXIcon className="size-6 text-muted-foreground" />
        <h2 className="type-heading text-xl text-balance">
          {hidden
            ? `All ${hidden} results are ${type === "record" ? "already yours" : "already logged or saved"}`
            : chips.length > 1
              ? `No ${plural} match all ${chips.length} filters`
              : query
                ? `Nothing matched “${query}”`
                : `No ${plural} match`}
        </h2>
        <p className="text-[0.9375rem] text-pretty text-muted-foreground">
          {hidden
            ? "Turn off “Hide what I’ve logged” or “Hide my backlog” in Filters to see them."
            : relax.length
              ? "Drop one and see what comes back."
              : "Try other words or fewer filters."}
        </p>
      </div>
      {!hidden && relax.length ? (
        <ul className="edge-highlight divide-y overflow-hidden rounded-[20px] border bg-card">
          {relax.map((r) => (
            <li key={r.key}>
              <button
                type="button"
                onClick={() => drop(r.key)}
                className="flex min-h-14 w-full items-center gap-3 px-4 text-left hover:bg-muted/50 active:bg-muted"
              >
                <span className="min-w-0 flex-1 truncate text-[0.9375rem]">
                  Without <span className="font-semibold">{r.label}</span>
                </span>
                {typeof r.count === "number" ? (
                  <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                    {countLabel(type, r.count)}
                  </span>
                ) : null}
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        onClick={onOpenFilters}
        className="text-[0.9375rem] font-medium underline underline-offset-4"
      >
        Edit filters
      </button>
    </div>
  )
}
