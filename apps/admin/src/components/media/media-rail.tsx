import type { MediaSummary } from "@workspace/schemas"
import { cn } from "@workspace/ui/lib/utils"
import { CardBadges } from "./card-log-menu"
import { MediaCard } from "@/components/media-card"

/** Search results don't carry genres; the snapshot is refreshed when logged. */
export const toBacklogItem = (media: MediaSummary) => ({
  type: media.type,
  id: media.id,
  title: media.title,
  subtitle: media.subtitle,
  year: media.year,
  poster: media.poster,
  genres: [],
})

/** Horizontal, snap-scrolling row of posters (collections, recommendations…). */
export function MediaRail({
  items,
  className,
}: {
  items: Array<MediaSummary>
  className?: string
}) {
  if (!items.length) return null
  return (
    <ScrollRow className={className}>
      {items.map((media) => (
        <div
          key={`${media.type}-${media.id}`}
          className="w-28 shrink-0 snap-start md:w-32"
        >
          <MediaCard
            media={media}
            badge={<CardBadges item={toBacklogItem(media)} />}
          />
        </div>
      ))}
    </ScrollRow>
  )
}

/**
 * Bleeds to the screen edge on mobile (content scrolls under the gutter),
 * but keeps the first item aligned with the page padding.
 */
export function ScrollRow({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "-mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 md:mx-0 md:scroll-px-0 md:px-0",
        className
      )}
    >
      {children}
    </div>
  )
}
