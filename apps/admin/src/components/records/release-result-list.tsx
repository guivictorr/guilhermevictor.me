import { useQuery } from "@tanstack/react-query"
import type { MediaSummary } from "@workspace/schemas"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"
import { CheckIcon } from "lucide-react"
import { CardBacklogBadge } from "@/components/media/backlog-button"
import { toBacklogItem } from "@/components/media/media-rail"
import { MediaLink } from "@/components/media-card"
import { Poster } from "@/components/poster"
import { joinDefined } from "@/lib/format"
import { indexQuery, mediaKey } from "@/queries/archive"

/** Descriptors worth a chip; "LP"/"Album" are on almost every result. */
const NOISE = new Set(["LP", "Album", '12"'])

/**
 * Vinyl search results as rows instead of covers: many pressings share the
 * same artwork, so label, catalog number, country, year and color are what
 * tell them apart.
 */
export function ReleaseResultList({
  results,
  dimOwned = false,
}: {
  results: Array<MediaSummary>
  /** Gray the covers of pressings you own. */
  dimOwned?: boolean
}) {
  const { data: index } = useQuery(indexQuery())

  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {results.map((r) => {
        const p = r.pressing
        const owned = index?.owned.has(mediaKey(r))
        const chips = (p?.format ?? []).filter((f) => !NOISE.has(f))
        return (
          <li key={r.id} className="relative">
            <MediaLink
              media={r}
              className="flex gap-3 py-3 pr-14 pl-3 hover:bg-muted/50 active:bg-muted"
            >
              <Poster
                image={r.poster}
                type="record"
                title={r.title}
                size="thumb"
                className={cn(
                  "w-16 shrink-0 self-start rounded-md",
                  dimOwned && owned && "opacity-55 grayscale"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.title}</p>
                {r.subtitle ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {r.subtitle}
                  </p>
                ) : null}
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {joinDefined([
                    p?.label && p.catno
                      ? `${p.label} – ${p.catno}`
                      : (p?.label ?? p?.catno),
                    p?.country,
                    r.year,
                  ])}
                </p>
                {chips.length || p?.variant ? (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {p?.variant ? (
                      <Badge
                        variant="secondary"
                        className="max-w-full truncate"
                      >
                        {p.variant}
                      </Badge>
                    ) : null}
                    {chips.map((chip) => (
                      <Badge key={chip} variant="outline">
                        {chip}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </MediaLink>
            <div className="absolute top-3 right-3">
              {owned ? (
                <span
                  aria-label="In your collection"
                  className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  <CheckIcon className="size-4" strokeWidth={3} />
                </span>
              ) : (
                <CardBacklogBadge item={toBacklogItem(r)} />
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
