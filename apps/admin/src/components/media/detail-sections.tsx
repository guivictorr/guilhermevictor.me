import { useQuery } from "@tanstack/react-query"
import type { CollectionRef, MediaType, Video } from "@workspace/schemas"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { MediaRail } from "./media-rail"
import { YouTubeVideo } from "./youtube"
import { DetailSection } from "@/components/detail-layout"
import { logsQuery, indexQuery, mediaKey } from "@/queries/archive"
import { collectionQuery } from "@/queries/media"

export function SynopsisSection({ text }: { text?: string }) {
  if (!text) return null
  return (
    <DetailSection title="Synopsis">
      <p className="text-[0.9375rem] leading-relaxed text-pretty">{text}</p>
    </DetailSection>
  )
}

export function TrailerSection({ video }: { video?: Video }) {
  if (!video) return null
  return (
    <DetailSection title="Trailer">
      <YouTubeVideo video={video} />
    </DetailSection>
  )
}

/** "In this collection", with how many of its movies you've logged. */
export function CollectionSection({
  collection,
}: {
  collection?: CollectionRef
}) {
  const { data, isPending } = useQuery({
    ...collectionQuery(collection?.id ?? 0),
    enabled: collection !== undefined,
  })
  const { data: index } = useQuery(indexQuery())
  if (!collection) return null

  const parts = data?.parts ?? []
  const logged = parts.filter((p) => index?.logged.has(mediaKey(p))).length

  return (
    <DetailSection
      title={collection.name}
      action={
        parts.length ? (
          <span className="text-sm text-muted-foreground tabular-nums">
            {logged}/{parts.length} logged
          </span>
        ) : null
      }
    >
      {isPending ? (
        <div className="flex gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton
              key={i}
              className="aspect-[2/3] w-28 rounded-lg md:w-32"
            />
          ))}
        </div>
      ) : (
        <MediaRail items={parts} />
      )}
    </DetailSection>
  )
}

/** Tab label with a count of your logs, e.g. "My logs 3". */
export function LogsTabLabel({
  type,
  id,
  label = "My logs",
}: {
  type: MediaType
  id: number
  label?: string
}) {
  const { data } = useQuery(logsQuery({ type, id }))
  return (
    <>
      {label}
      {data?.length ? (
        <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
          {data.length}
        </span>
      ) : null}
    </>
  )
}
