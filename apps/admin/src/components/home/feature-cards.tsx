import { useQuery } from "@tanstack/react-query"
import type { BacklogItem, MediaType } from "@workspace/schemas"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { PlusIcon } from "lucide-react"
import { useMemo } from "react"
import { RatingsRow } from "@/components/detail-layout"
import {
  describeLogDates,
  describeLogExtras,
} from "@/components/log/log-history"
import { REVEAL_IMAGE, useImageReveal } from "@/components/loaders"
import { useOpenLog } from "@/components/log/log-host"
import { MediaLink } from "@/components/media-card"
import { useWorkDetails } from "@/components/media/use-work-details"
import { Poster } from "@/components/poster"
import { shuffle } from "@/lib/daily-picks"
import { joinDefined, today } from "@/lib/format"
import { imageUrl } from "@/lib/images"
import { KINDS } from "@/lib/media-kinds"
import type { LibraryEntry, LibraryItemInput } from "@/lib/repo"
import { logsQuery } from "@/queries/archive"

/**
 * A work as a large card: its screenshot/backdrop blurred behind, the
 * cover, and a few lines of what matters. The whole card opens the page.
 */
function FeatureCard({
  item,
  overline,
  line,
  footer,
  className,
}: {
  item: LibraryItemInput
  overline: string
  /** Under the title; defaults to the provider facts. */
  line?: string
  footer?: React.ReactNode
  className?: string
}) {
  const details = useWorkDetails(item)
  // Wide art when the provider has it; else the cover, blurred harder.
  // Picked only once details settle, so it never swaps cover → backdrop.
  // Heavy blur hides detail, so a blurred cover only needs a thumbnail.
  const art = details.ready
    ? details.backdrop
      ? imageUrl(details.backdrop, "card")
      : imageUrl(item.poster, "thumb")
    : undefined
  const reveal = useImageReveal(art)
  return (
    <article
      className={cn(
        "edge-highlight relative isolate overflow-hidden rounded-[24px] border bg-card",
        className
      )}
    >
      {art ? (
        <img
          src={art}
          alt=""
          aria-hidden
          decoding="async"
          {...reveal}
          className={cn(
            "absolute inset-0 -z-10 size-full object-cover data-loaded:opacity-70",
            REVEAL_IMAGE,
            details.backdrop ? "scale-105 blur-[2px]" : "scale-125 blur-2xl"
          )}
        />
      ) : null}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/85 to-background/30"
      />
      <MediaLink media={item} className="flex gap-4 p-4 outline-none">
        <Poster
          image={item.poster}
          type={item.type}
          title={item.title}
          className={cn(
            // Concentric with the card: 24px corner − 16px inset.
            "shrink-0 rounded-[8px] shadow-lg",
            item.type === "record" ? "w-24" : "w-20 md:w-24"
          )}
        />
        <div className="flex min-w-0 flex-col py-0.5">
          <p className="type-overline text-signal-text">{overline}</p>
          <h3 className="type-heading mt-1 line-clamp-2 text-lg text-balance">
            {item.title}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {line ??
              joinDefined([
                // Books' facts already start with the author.
                details.facts?.includes(item.subtitle ?? "\u0000")
                  ? undefined
                  : item.subtitle,
                item.year,
                details.facts,
              ])}
          </p>
          <div className="mt-auto pt-2">
            <RatingsRow
              provider={details.provider}
              type={item.type}
              id={item.id}
            />
          </div>
        </div>
      </MediaLink>
      {footer}
    </article>
  )
}

/** Each kind's works in progress, by the status of their latest log. */
export function nowGroups([games, shows, books]: ReadonlyArray<
  Array<LibraryEntry>
>) {
  return [
    {
      type: "game" as const,
      entries: (games ?? []).filter((e) => e.status === "playing"),
    },
    {
      type: "show" as const,
      entries: (shows ?? []).filter((e) => e.status === "watching"),
    },
    {
      type: "book" as const,
      entries: (books ?? []).filter((e) => e.status === "reading"),
    },
  ].filter((group) => group.entries.length > 0)
}

/** Most recently logged first. */
export const latestFirst = (entries: Array<LibraryEntry>) =>
  [...entries].sort((a, b) =>
    (b.lastLoggedAt ?? "").localeCompare(a.lastLoggedAt ?? "")
  )

const NOW = {
  game: { overline: "Now playing", also: "Also playing" },
  show: { overline: "Now watching", also: "Also watching" },
  book: { overline: "Now reading", also: "Also reading" },
} as const

/**
 * What you're in the middle of, big: the game you're playing, the show
 * you're watching, the book you're reading (latest first). Others of the
 * same kind are listed underneath.
 */
export function NowCard({
  type,
  entries,
}: {
  type: keyof typeof NOW
  entries: Array<LibraryEntry>
}) {
  const [current, ...others] = latestFirst(entries)
  const openLog = useOpenLog()
  const { data: logs } = useQuery({
    ...logsQuery({ type, id: current?.id ?? 0 }),
    enabled: current !== undefined,
  })
  if (!current) return null
  const latest = logs?.[0]
  return (
    <FeatureCard
      item={current}
      overline={NOW[type].overline}
      line={
        latest
          ? joinDefined([describeLogExtras(latest), describeLogDates(latest)])
          : undefined
      }
      footer={
        <div className="flex items-center gap-3 border-t border-border/60 px-4 py-2.5">
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {others.length
              ? `${NOW[type].also}: ${others.map((e) => e.title).join(", ")}`
              : "The only one in progress"}
          </p>
          {/* Opens the log sheet over Home; no navigation. */}
          <Button size="sm" onClick={() => void openLog(current)}>
            <PlusIcon />
            {type === "show" ? "Log season" : "Log"}
          </Button>
        </div>
      }
    />
  )
}

/**
 * Today's suggestions: three cards, each a different kind from your
 * backlog, one pick featured and a second one beside it. Same all day
 * (seeded by the date), new tomorrow.
 */
export function todayPicks(backlog: Array<BacklogItem>, day = today()) {
  const byKind = Map.groupBy(backlog, (b) => b.type)
  const kinds = shuffle([...byKind.keys()], day).slice(0, 3)
  return kinds.map((type) => ({
    type,
    picks: shuffle(byKind.get(type) ?? [], `${day}:${type}`).slice(0, 2),
  }))
}

export function useTodayPicks(backlog: Array<BacklogItem>) {
  return useMemo(() => todayPicks(backlog), [backlog])
}

export function ForTodayCards({
  groups,
}: {
  groups: Array<{ type: MediaType; picks: Array<BacklogItem> }>
}) {
  return (
    <CardRow>
      {groups.map(({ type, picks: [main, alt] }) =>
        main ? (
          <FeatureCard
            key={type}
            item={main}
            overline={KINDS[type].label}
            footer={
              alt ? (
                <MediaLink
                  media={alt}
                  className="flex items-center gap-3 border-t border-border/60 px-4 py-2 hover:bg-muted/40"
                >
                  <Poster
                    image={alt.poster}
                    type={alt.type}
                    title={alt.title}
                    size="thumb"
                    className="w-7 shrink-0"
                  />
                  <span className="min-w-0 truncate text-xs">
                    <span className="text-muted-foreground">Or </span>
                    <span className="font-medium">{alt.title}</span>
                    {alt.year ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · {alt.year}
                      </span>
                    ) : null}
                  </span>
                </MediaLink>
              ) : null
            }
          />
        ) : null
      )}
    </CardRow>
  )
}

/**
 * Large cards side by side: a snap-scrolling row on phones (the next card
 * peeks in), three columns on desktop.
 */
export function CardRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="fade-x -mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 *:w-[85%] *:shrink-0 *:snap-start md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0 md:*:w-auto">
      {children}
    </div>
  )
}
