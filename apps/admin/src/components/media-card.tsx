import { Link } from "@tanstack/react-router"
import type { ImageRef, MediaType } from "@workspace/schemas"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { Poster } from "./poster"

export type CardMedia = {
  type: MediaType
  id: number
  title: string
  subtitle?: string
  year?: number
  poster?: ImageRef
}

const DETAIL_ROUTE = {
  movie: "/movies/$id",
  show: "/shows/$id",
  game: "/games/$id",
  record: "/records/$id",
} as const satisfies Record<CardMedia["type"], string>

/** Typed link to a work's detail page. */
export function MediaLink({
  media,
  className,
  children,
}: {
  media: Pick<CardMedia, "type" | "id">
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      to={DETAIL_ROUTE[media.type]}
      params={{ id: String(media.id) }}
      className={className}
    >
      {children}
    </Link>
  )
}

/**
 * Poster + title card. `badge` sits on the poster corner (✓ logged, backlog
 * toggle…) outside the link, so it can hold its own button.
 */
export function MediaCard({
  media,
  meta,
  badge,
}: {
  media: CardMedia
  meta?: React.ReactNode
  badge?: React.ReactNode
}) {
  return (
    <div className="relative min-w-0">
      <MediaLink
        media={media}
        className="pressable group block min-w-0 rounded-lg outline-none"
      >
        <Poster
          image={media.poster}
          type={media.type}
          title={media.title}
          className="transition-shadow group-focus-visible:ring-3 group-focus-visible:ring-ring/50"
        />
        <div className="mt-2 min-w-0 px-0.5">
          <p className="truncate text-sm leading-tight font-medium">
            {media.title}
          </p>
          {media.subtitle ? (
            <p className="truncate text-xs text-muted-foreground">
              {media.subtitle}
            </p>
          ) : null}
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {media.year ? <span>{media.year}</span> : null}
            {meta}
          </div>
        </div>
      </MediaLink>
      {badge ? (
        <div className="absolute top-1.5 right-1.5 flex gap-1">{badge}</div>
      ) : null}
    </div>
  )
}

export function MediaGrid({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7",
        className
      )}
      {...props}
    />
  )
}

export function MediaGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <MediaGrid aria-busy aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[2/3] rounded-lg" />
          <Skeleton className="mt-2 h-3.5 w-4/5" />
          <Skeleton className="mt-1.5 h-3 w-1/3" />
        </div>
      ))}
    </MediaGrid>
  )
}
