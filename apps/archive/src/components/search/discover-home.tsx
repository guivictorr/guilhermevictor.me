import { useQuery } from "@tanstack/react-query"
import type {
  CollectionItem,
  MediaSummary,
  MediaType,
} from "@workspace/schemas"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { CheckIcon, SlidersHorizontalIcon } from "lucide-react"
import { useState } from "react"
import { GENRE_TILES } from "./presets"
import { useArchiveMarks } from "./search-view"
import { MediaRail } from "@/components/media/media-rail"
import { StarRating } from "@/components/star-rating"
import { SwipeButton } from "@/components/swipe/swipe-button"
import { SwipeDeck } from "@/components/swipe/swipe-deck"
import { useSwipe } from "@/components/swipe/swipe-search"
import { imageUrl } from "@/lib/images"
import { KINDS } from "@/lib/media-kinds"
import type { SearchFilters } from "@/lib/search-filters"
import { FILTER_FIELDS } from "@/lib/search-filters"
import { collectionQuery, libraryQuery } from "@/queries/archive"
import {
  gameQuery,
  movieQuery,
  searchQuery,
  showQuery,
  trendingQuery,
} from "@/queries/media"

/*
 * Search before you type: quick filters, genres, picks seeded by your own
 * ratings, and what's trending.
 */

type Hide = (media: MediaSummary) => boolean

/** One-tap filters; the full set lives in the sheet. */
export function QuickFilters({
  type,
  filters,
  onApply,
  onOpenFilters,
  hideHave,
  onHideHave,
}: {
  type: MediaType
  filters: SearchFilters
  onApply: (filters: SearchFilters) => void
  onOpenFilters: () => void
  hideHave: boolean
  onHideHave: (on: boolean) => void
}) {
  const toggle = (on: boolean, next: SearchFilters) =>
    onApply(
      on
        ? { ...filters, ...next }
        : {
            ...filters,
            ...Object.fromEntries(Object.keys(next).map((k) => [k, undefined])),
          }
    )
  const rated = type === "movie" || type === "show" || type === "game"

  return (
    <div className="space-y-2.5">
      <p className="type-overline text-subtle">Quick filters</p>
      <div className="fade-x -mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <button
          type="button"
          onClick={onOpenFilters}
          className="pressable inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border ps-3 pe-3.5 text-sm font-medium"
        >
          <SlidersHorizontalIcon className="size-4" />
          Filters
        </button>
        <QuickChip on={hideHave} onChange={onHideHave}>
          {type === "record" ? "Not owned" : "Not logged"}
        </QuickChip>
        {type === "movie" ? (
          <QuickChip
            on={filters.runtime === "under2h"}
            onChange={(on) => toggle(on, { runtime: "under2h" })}
          >
            Under 2h
          </QuickChip>
        ) : null}
        {rated ? (
          <QuickChip
            on={filters.rating === 4}
            onChange={(on) => toggle(on, { rating: 4 })}
          >
            Rated 4★+
          </QuickChip>
        ) : null}
      </div>
    </div>
  )
}

function QuickChip({
  on,
  onChange,
  children,
}: {
  on: boolean
  onChange: (on: boolean) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={cn(
        "pressable inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3.5 text-sm font-medium",
        on ? "bg-foreground ps-3 text-background" : "bg-muted"
      )}
    >
      {on ? <CheckIcon className="size-4" /> : null}
      {children}
    </button>
  )
}

export function SectionHeading({
  overline,
  title,
  aside,
}: {
  overline?: string
  title: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        {overline ? (
          <p className="type-overline mb-0.5 text-subtle">{overline}</p>
        ) : null}
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          {title}
        </h2>
      </div>
      {aside}
    </div>
  )
}

/** The first covers a search finds (browse results are cached server-side). */
function useCovers(type: MediaType, filters: SearchFilters, count: number) {
  const { data } = useQuery({
    ...searchQuery(type, "", filters),
    select: (results) => results.filter((m) => m.poster).slice(0, count),
  })
  return data
}

/** A cover as decoration: the card around it carries the name. */
function CoverImage({
  media,
  className,
}: {
  media?: MediaSummary
  className?: string
}) {
  const src = imageUrl(media?.poster, "thumb")
  return (
    <span
      aria-hidden
      className={cn("block overflow-hidden bg-muted", className)}
    >
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ) : null}
    </span>
  )
}

/** A few genres of the kind; a tap browses it. */
export function GenreTiles({
  type,
  onPick,
}: {
  type: MediaType
  onPick: (genre: string) => void
}) {
  const field = FILTER_FIELDS[type].find((f) => f.key === "genre")
  const options = field && "options" in field ? field.options : []
  const tiles = GENRE_TILES[type].flatMap((value) => {
    const option = options.find((o) => o.value === value)
    return option ? [option] : []
  })
  if (!tiles.length) return null
  return (
    <section>
      <SectionHeading title="Browse by genre" />
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.value}>
            <GenreTile
              type={type}
              genre={tile.value}
              label={tile.label}
              onPick={() => onPick(tile.value)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function GenreTile({
  type,
  genre,
  label,
  onPick,
}: {
  type: MediaType
  genre: string
  label: string
  onPick: () => void
}) {
  const covers = useCovers(type, { genre }, 2)
  const square = type === "record"
  return (
    <button
      type="button"
      onClick={onPick}
      className="pressable edge-highlight relative block h-[72px] w-full overflow-hidden rounded-xl border bg-card text-left hover:bg-muted/50"
    >
      {/* Two covers peeking from the right edge, the first one behind. */}
      <CoverImage
        media={covers?.[0]}
        className={cn(
          "absolute top-2.5 -right-2.5 rotate-12 rounded-md shadow-md",
          square ? "size-12" : "h-[60px] w-10"
        )}
      />
      <CoverImage
        media={covers?.[1]}
        className={cn(
          "absolute top-[18px] right-[22px] -rotate-6 rounded-sm shadow-md",
          square ? "size-[42px]" : "h-[51px] w-[34px]"
        )}
      />
      {/* Over the covers' edge, so a long word ("Documentary") still fits. */}
      <span className="absolute right-12 bottom-3 left-3.5 z-10 line-clamp-2 text-[0.9375rem] leading-tight font-semibold [text-shadow:0_1px_8px_var(--color-card)]">
        {label}
      </span>
    </button>
  )
}

/** Recommendations from a work you rated highly (movies, shows, games). */
export function BecauseYouRated({
  type,
  hide,
}: {
  type: "movie" | "show" | "game"
  hide: Hide
}) {
  const { data: library } = useQuery(libraryQuery(type))
  // One of your five most recent top ratings, picked once per visit.
  const [pick] = useState(() => Math.random())
  const top = (library ?? [])
    .filter((entry) => (entry.rating ?? 0) >= 9)
    .sort((a, b) => (b.lastLoggedAt ?? "").localeCompare(a.lastLoggedAt ?? ""))
    .slice(0, 5)
  const seed = top[Math.floor(pick * top.length)]
  const id = Number(seed?.id)
  const movie = useQuery({
    ...movieQuery(id),
    enabled: type === "movie" && !!seed,
  })
  const show = useQuery({
    ...showQuery(id),
    enabled: type === "show" && !!seed,
  })
  const game = useQuery({
    ...gameQuery(id),
    enabled: type === "game" && !!seed,
  })
  if (!seed) return null
  const items =
    type === "movie"
      ? movie.data?.recommendations
      : type === "show"
        ? show.data?.recommendations
        : game.data?.similar
  const shown = items?.filter((m) => !hide(m))

  return (
    <section>
      <SectionHeading
        overline="Because you rated"
        title={
          <>
            <span className="truncate">{seed.title}</span>
            <StarRating rating={seed.rating} className="text-sm" />
          </>
        }
      />
      {shown === undefined ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton
              key={i}
              className="aspect-[2/3] w-28 shrink-0 rounded-lg md:w-32"
            />
          ))}
        </div>
      ) : shown.length ? (
        <MediaRail items={shown} />
      ) : (
        <p className="text-sm text-muted-foreground">
          You have everything it recommends.
        </p>
      )}
    </section>
  )
}

const TRENDING_TITLE: Record<MediaType, string> = {
  movie: "Trending this week",
  show: "Trending this week",
  game: "Popular right now",
  book: "New fiction",
  record: "Recently added to your collection",
}

/** The same lists once what you have is hidden. */
const TRENDING_NEW: Record<MediaType, string> = {
  movie: "Trending, new to you",
  show: "Trending, new to you",
  game: "Popular, new to you",
  book: "New fiction, new to you",
  record: "Recently added to your collection",
}

/** Several copies of one release should show once. */
function uniqueReleases(items: Array<CollectionItem>) {
  const seen = new Set<number>()
  return items.filter((c) => !seen.has(c.releaseId) && seen.add(c.releaseId))
}

/** What's trending, minus what you have (when hiding it). */
export function Trending({
  type,
  hideHave,
  hideBacklog,
}: {
  type: MediaType
  hideHave: boolean
  hideBacklog: boolean
}) {
  const swipe = useSwipe("trending")
  const marks = useArchiveMarks()
  // Discogs has no trending list: show your own latest additions instead.
  const trending = useQuery({
    ...trendingQuery(type),
    enabled: type !== "record",
  })
  const collection = useQuery({
    ...collectionQuery(),
    enabled: type === "record",
  })
  // Hiding what you have needs the index: without it the grid would show
  // those works and then drop them when it lands.
  const isPending =
    (type === "record" ? collection.isPending : trending.isPending) ||
    (type !== "record" && (hideHave || hideBacklog) && marks.isPending)
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
  // Your own collection is never "new to you".
  const hiding = type !== "record"
  const data = all.filter(
    (m) =>
      !(hiding && hideHave && marks.have(m)) &&
      !(hiding && hideBacklog && marks.inBacklog(m))
  )
  if (!isPending && !data.length) return null

  const newToYou = hiding && (hideHave || hideBacklog)
  const title = newToYou ? TRENDING_NEW[type] : TRENDING_TITLE[type]
  return (
    <section>
      <SectionHeading
        title={title}
        aside={data.length ? <SwipeButton onClick={swipe.openDeck} /> : null}
      />
      {newToYou ? (
        <p className="-mt-2 mb-3 text-sm text-muted-foreground">
          {hideHave && hideBacklog
            ? "Logged and backlog hidden"
            : hideHave
              ? "Logged hidden"
              : "Backlog hidden"}
        </p>
      ) : null}
      <SwipeDeck
        open={swipe.open}
        items={data}
        title={title}
        onClose={swipe.close}
      />
      {isPending ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton
              key={i}
              className="aspect-[2/3] w-28 shrink-0 rounded-lg md:w-32"
            />
          ))}
        </div>
      ) : (
        <MediaRail items={data} />
      )}
    </section>
  )
}

/** Kinds whose details carry recommendations. */
export const recommends = (
  type: MediaType
): type is "movie" | "show" | "game" =>
  type === "movie" || type === "show" || type === "game"

export const kindPlural = (type: MediaType) => KINDS[type].plural.toLowerCase()
