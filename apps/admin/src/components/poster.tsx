import type { ImageRef, MediaType } from "@workspace/schemas"
import { cn } from "@workspace/ui/lib/utils"
import { useState } from "react"
import { imageUrl } from "@/lib/images"
import type { ImageSize } from "@/lib/images"
import { KINDS } from "@/lib/media-kinds"

/**
 * Cover art in the kind's shape (2:3 posters, square albums), with a typed
 * placeholder when the provider has no image or it fails to load.
 */
export function Poster({
  image,
  type,
  title,
  size = "poster",
  className,
  priority = false,
}: {
  image?: ImageRef
  type: MediaType
  title: string
  size?: ImageSize
  className?: string
  priority?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const src = imageUrl(image, size)
  const { icon: Icon, aspect } = KINDS[type]

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/5 ring-inset",
        aspect === "square" ? "aspect-square" : "aspect-[2/3]",
        className
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={title}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 p-2 text-center text-muted-foreground">
          <Icon className="size-6 opacity-60" />
          {size === "thumb" ? null : (
            <span className="line-clamp-3 text-xs">{title}</span>
          )}
        </div>
      )}
    </div>
  )
}
