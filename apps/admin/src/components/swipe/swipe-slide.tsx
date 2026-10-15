import { useQuery } from "@tanstack/react-query"
import type {
  CollectionItem,
  LogEntry,
  ProviderRating,
  Release,
  SeasonSummary,
} from "@workspace/schemas"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  BookmarkCheckIcon,
  BookmarkPlusIcon,
  HistoryIcon,
  ListOrderedIcon,
  PlusIcon,
} from "lucide-react"
import { useState } from "react"
import { useRateLatest } from "./use-rate-latest"
import { RatingsRow } from "@/components/detail-layout"
import { LogHistory } from "@/components/log/log-history"
import { LogSheet } from "@/components/log/log-sheet"
import type { LogTargetContext } from "@/components/log/log-sheet"
import { SeasonList } from "@/components/log/season-list"
import { useLogSheet } from "@/components/log/use-log-sheet"
import { MediaLink } from "@/components/media-card"
import { useBacklogToggle } from "@/components/media/backlog-button"
import { Poster } from "@/components/poster"
import { copyOptions, snapshotOf } from "@/components/records/copies"
import { CopySheet } from "@/components/records/copy-sheet"
import { ResponsiveSheet } from "@/components/responsive-sheet"
import { StarRatingInput } from "@/components/star-rating"
import { formatDate, formatRuntime, joinDefined } from "@/lib/format"
import { formatMoney } from "@/lib/grades"
import { imageUrl } from "@/lib/images"
import type { LibraryItemInput } from "@/lib/repo"
import { collectionQuery, indexQuery, mediaKey } from "@/queries/archive"
import {
  bookQuery,
  gameQuery,
  movieQuery,
  releaseQuery,
  showQuery,
} from "@/queries/media"

type Details = {
  /** One short line: runtime · director, platforms, author · pages… */
  facts?: string
  provider?: ProviderRating
  /** For the game log form. */
  platforms: Array<string>
  /** Platforms (icons later) or a record's format, as tags: never truncated. */
  tags: Array<string>
  seasons: Array<SeasonSummary>
  release?: Release
}

/** The provider facts worth a glance, from the kind's detail query. */
function useDetails(item: LibraryItemInput): Details {
  const id = Number(item.id)
  const movie = useQuery({ ...movieQuery(id), enabled: item.type === "movie" })
  const show = useQuery({ ...showQuery(id), enabled: item.type === "show" })
  const game = useQuery({ ...gameQuery(id), enabled: item.type === "game" })
  const book = useQuery({
    ...bookQuery(String(item.id)),
    enabled: item.type === "book",
  })
  const release = useQuery({
    ...releaseQuery(id),
    enabled: item.type === "record",
  })
  const none = { platforms: [], tags: [], seasons: [] }
  switch (item.type) {
    case "movie": {
      const m = movie.data
      return {
        ...none,
        facts: joinDefined([formatRuntime(m?.runtime), m?.directors.at(0)]),
        provider: m?.providerRating,
      }
    }
    case "show": {
      const s = show.data
      const count = s?.seasons.filter((x) => x.seasonNumber > 0).length
      return {
        ...none,
        facts: joinDefined([
          count === undefined
            ? undefined
            : `${count} season${count === 1 ? "" : "s"}`,
          s?.networks.at(0),
        ]),
        provider: s?.providerRating,
        seasons: s?.seasons ?? [],
      }
    }
    case "game": {
      const g = game.data
      return {
        ...none,
        facts: g?.developers.at(0),
        provider: g?.providerRating,
        platforms: g?.platforms ?? [],
        tags: g?.platforms ?? [],
      }
    }
    case "book": {
      const b = book.data
      return {
        ...none,
        facts: joinDefined([
          b?.authors.slice(0, 2).join(", "),
          b?.pages ? `${b.pages} pages` : undefined,
        ]),
        provider: b?.providerRating,
      }
    }
    case "record": {
      const r = release.data
      return {
        ...none,
        facts: r?.labels[0]?.name,
        tags: r?.format?.split(/,\s*/) ?? [],
        provider: r?.providerRating,
        release: r,
      }
    }
  }
}

/**
 * One item of a list's swipe view: big cover over its own blurred art, a
 * line of facts, and quick actions (rate, log, backlog, your logs; seasons
 * for shows) pinned to the bottom.
 */
export function SwipeSlide({ item }: { item: LibraryItemInput }) {
  const details = useDetails(item)
  const rating = useRateLatest(item)
  const { inBacklog, toggle, ready } = useBacklogToggle(item)
  const { data: index } = useQuery(indexQuery())
  const { data: collection } = useQuery({
    ...collectionQuery(),
    enabled: item.type === "record",
  })
  const copies = (collection ?? []).filter((c) => c.releaseId === item.id)
  const owned =
    item.type === "record" && (index?.owned.has(mediaKey(item)) ?? false)
  const sheet = useLogSheet()
  const [panel, setPanel] = useState<"logs" | "seasons">()
  const [copySheet, setCopySheet] = useState<{
    open: boolean
    editing?: CollectionItem
  }>({ open: false })
  const background = imageUrl(item.poster, "large")

  const target = (editing?: LogEntry): LogTargetContext => {
    if (editing?.kind === "season")
      return {
        kind: "season",
        item,
        seasonNumber: editing.seasonNumber,
        seasonName: `Season ${editing.seasonNumber}`,
      }
    switch (item.type) {
      case "movie":
        return { kind: "movie", item }
      case "show":
        return { kind: "show", item }
      case "game":
        return { kind: "game", item, platforms: details.platforms }
      case "book":
        return { kind: "book", item }
      case "record":
        return { kind: "record", item, copies: copyOptions(copies) }
    }
  }

  return (
    <div className="relative isolate flex h-full flex-col overflow-hidden">
      {/* The cover itself, blurred, as the backdrop. */}
      {background ? (
        <img
          src={background}
          alt=""
          aria-hidden
          className="absolute inset-0 -z-10 size-full scale-125 object-cover opacity-80 blur-3xl"
        />
      ) : null}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-background/20 via-background/50 to-background"
      />

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 pt-[calc(env(safe-area-inset-top,0px)+4.5rem)]">
        <MediaLink
          media={item}
          className={cn(
            "pressable block min-h-0 shrink rounded-[3%] shadow-2xl",
            item.type === "record"
              ? "aspect-square h-[min(42dvh,80vw)]"
              : "aspect-[2/3] h-[min(46dvh,110vw)]"
          )}
        >
          <Poster
            image={item.poster}
            type={item.type}
            title={item.title}
            size="large"
            priority
            className="size-full"
          />
        </MediaLink>
        <div className="w-full max-w-md text-center">
          <h2 className="type-title line-clamp-2 text-2xl text-balance">
            {item.title}
          </h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {joinDefined([item.subtitle, item.year, details.facts])}
          </p>
          {details.tags.length ? (
            <ul
              aria-label={item.type === "game" ? "Platforms" : "Format"}
              className="mt-2 flex flex-wrap justify-center gap-1"
            >
              {details.tags.map((tag) => (
                <li key={tag}>
                  <Badge
                    variant="outline"
                    className="h-5 px-1.5 text-[0.6875rem]"
                  >
                    {tag}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-2 flex justify-center">
            <RatingsRow
              provider={details.provider}
              type={item.type}
              id={item.id}
            />
          </div>
          {copies.length ? (
            <CopyChips
              copies={copies}
              onSelect={(copy) => setCopySheet({ open: true, editing: copy })}
            />
          ) : null}
        </div>
      </div>

      {/* Quick actions; the one orange button is Log. */}
      <div className="pb-safe px-4 pt-4">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 pb-4">
          <div
            className={cn(!rating.canRate && "pointer-events-none opacity-40")}
          >
            <StarRatingInput value={rating.value} onChange={rating.rate} />
          </div>
          {!rating.canRate ? (
            <p className="text-xs text-muted-foreground">
              Add a copy to your collection to rate plays.
            </p>
          ) : null}
          <div className="grid w-full [grid-auto-columns:minmax(0,1fr)] grid-flow-col gap-2">
            <Button
              size="lg"
              className="h-12"
              onClick={sheet.openNew}
              disabled={item.type === "record" && !copies.length}
            >
              <PlusIcon />
              Log
            </Button>
            {owned ? null : (
              <Button
                variant="secondary"
                size="lg"
                className="h-12"
                onClick={toggle}
                disabled={!ready}
                aria-pressed={inBacklog}
              >
                {inBacklog ? <BookmarkCheckIcon /> : <BookmarkPlusIcon />}
                {inBacklog ? "Saved" : "Backlog"}
              </Button>
            )}
            <Button
              variant="secondary"
              size="lg"
              className="h-12"
              onClick={() => setPanel("logs")}
            >
              <HistoryIcon />
              Logs
              {rating.logCount ? (
                <span className="text-muted-foreground tabular-nums">
                  {rating.logCount}
                </span>
              ) : null}
            </Button>
            {item.type === "show" ? (
              <Button
                variant="secondary"
                size="lg"
                className="h-12"
                onClick={() => setPanel("seasons")}
                disabled={!details.seasons.length}
              >
                <ListOrderedIcon />
                Seasons
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <ResponsiveSheet
        open={panel === "logs"}
        onOpenChange={(open) => setPanel(open ? "logs" : undefined)}
        title="Your logs"
        description={item.title}
      >
        <LogHistory
          type={item.type}
          id={item.id}
          onSelect={(log) => {
            setPanel(undefined)
            sheet.openEdit(log)
          }}
          emptyLabel="Nothing logged yet."
        />
      </ResponsiveSheet>
      {item.type === "show" ? (
        <ResponsiveSheet
          open={panel === "seasons"}
          onOpenChange={(open) => setPanel(open ? "seasons" : undefined)}
          title="Seasons"
          description={item.title}
        >
          <SeasonList item={item} seasons={details.seasons} />
        </ResponsiveSheet>
      ) : null}
      {details.release ? (
        <CopySheet
          open={copySheet.open}
          onOpenChange={(open) => setCopySheet((s) => ({ ...s, open }))}
          editing={copySheet.editing}
          snapshot={snapshotOf(details.release)}
        />
      ) : null}
      <LogSheet
        open={sheet.open}
        onOpenChange={sheet.onOpenChange}
        editing={sheet.editing}
        target={target(sheet.editing)}
      />
    </div>
  )
}

/**
 * Your copies of a record, one tappable line each: condition, price and
 * store at a glance; tap to edit the copy.
 */
function CopyChips({
  copies,
  onSelect,
}: {
  copies: Array<CollectionItem>
  onSelect: (copy: CollectionItem) => void
}) {
  return (
    <ul
      aria-label="Your copies"
      className="mt-3 flex flex-col items-center gap-1.5"
    >
      {copies.map((copy) => (
        <li key={copy.id}>
          <button
            type="button"
            onClick={() => onSelect(copy)}
            className="pressable glass flex min-h-9 flex-wrap items-center justify-center gap-1 rounded-full border px-3 py-1 text-xs"
          >
            {copy.mediaCondition ? (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[0.6875rem]"
              >
                Media {copy.mediaCondition}
              </Badge>
            ) : null}
            {copy.sleeveCondition ? (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[0.6875rem]"
              >
                Sleeve {copy.sleeveCondition}
              </Badge>
            ) : null}
            <span className="text-muted-foreground">
              {joinDefined([
                copy.variant,
                formatMoney(copy.price),
                copy.store,
                copy.acquiredAt ? formatDate(copy.acquiredAt) : undefined,
              ]) || "No details yet"}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
