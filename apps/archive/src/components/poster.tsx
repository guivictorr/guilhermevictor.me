import type { ImageRef, MediaType } from "@workspace/schemas"
import { cn } from "@workspace/ui/lib/utils"
import { useState } from "react"
import { imageUrl } from "@/lib/images"
import type { ImageSize } from "@/lib/images"
import { KINDS } from "@/lib/media-kinds"

/**
 * Cover art, shown as-is. Records are square sleeves, with the disc sliding
 * out when `vinyl` (detail pages); thumbnails and `bare` skip the disc.
 */
export function Poster({
  image,
  type,
  title,
  size = "poster",
  className,
  priority = false,
  bare = false,
  vinyl = false,
}: {
  image?: ImageRef
  type: MediaType
  title: string
  size?: ImageSize
  className?: string
  priority?: boolean
  /** Skip the vinyl disc (tiny thumbnails, dense lists). */
  bare?: boolean
  /** Records: show the vinyl sliding out of the sleeve (detail pages). */
  vinyl?: boolean
}) {
  const framed = !bare && size !== "thumb"
  const art = <CoverArt {...{ image, type, title, size, priority }} />

  if (type === "record")
    return (
      <div className={cn("relative isolate aspect-square", className)}>
        {framed && vinyl ? <VinylDisc image={image} /> : null}
        <div className="relative size-full overflow-hidden rounded-[3%] bg-field shadow-[0_1px_2px_rgb(0_0_0/0.3)]">
          {art}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-foreground/8 ring-inset"
          />
        </div>
      </div>
    )

  return (
    <div
      className={cn(
        "relative isolate aspect-[2/3] overflow-hidden rounded-[6%/4%] bg-field",
        className
      )}
    >
      {art}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-foreground/8 ring-inset"
      />
    </div>
  )
}

/** The image, or a typed placeholder (kind icon + title), never a broken image. */
function CoverArt({
  image,
  type,
  title,
  size,
  priority,
}: {
  image?: ImageRef
  type: MediaType
  title: string
  size: ImageSize
  priority: boolean
}) {
  const [failed, setFailed] = useState(false)
  const src = imageUrl(image, size)
  const { icon: Icon } = KINDS[type]
  if (src && !failed)
    return (
      <img
        src={src}
        alt={title}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
        className="size-full object-cover"
      />
    )
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 bg-field p-2 text-center text-muted-foreground">
      <Icon className="size-6 opacity-60" />
      {size === "thumb" ? null : (
        <span className="line-clamp-3 text-xs font-medium">{title}</span>
      )}
    </div>
  )
}

/** A record sliding out of its sleeve: grooves, a sheen, and the cover as label. */
function VinylDisc({ image }: { image?: ImageRef }) {
  const label = imageUrl(image, "thumb")
  return (
    <div
      aria-hidden
      className="absolute inset-y-[3%] right-0 -z-10 aspect-square translate-x-[38%] rounded-full bg-[repeating-radial-gradient(circle,#101010_0_1px,#181818_1px_3px)] shadow-[0_2px_12px_rgb(0_0_0/0.45)]"
    >
      <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_200deg,transparent,rgb(255_255_255/0.08)_15%,transparent_30%,transparent_55%,rgb(255_255_255/0.06)_70%,transparent_85%)]" />
      <span
        className="absolute inset-[33%] rounded-full bg-cover bg-center ring-2 ring-black/60"
        style={
          label
            ? { backgroundImage: `url(${label})` }
            : { background: "#ff6a1f" }
        }
      />
      <span className="absolute inset-[48.5%] rounded-full bg-background" />
    </div>
  )
}
