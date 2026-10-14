import type { Video } from "@workspace/schemas"
import { cn } from "@workspace/ui/lib/utils"
import { PlayIcon } from "lucide-react"
import { useState } from "react"

/**
 * Lightweight YouTube embed: a thumbnail until tapped, so pages don't pay for
 * the YouTube iframe (≈1 MB of JS) unless the video is actually played.
 */
export function YouTubeVideo({
  video,
  className,
}: {
  video: Video
  className?: string
}) {
  const [playing, setPlaying] = useState(false)

  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/5",
        className
      )}
    >
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.key}?autoplay=1&playsinline=1&rel=0`}
          title={video.name}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play ${video.name}`}
          className="group absolute inset-0 size-full"
        >
          <img
            src={`https://i.ytimg.com/vi/${video.key}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <span className="absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition-transform duration-150 ease-(--ease-out) group-active:scale-95">
            <PlayIcon className="ml-0.5 size-6" fill="currentColor" />
          </span>
          <span className="absolute inset-x-3 bottom-2.5 truncate text-left text-sm font-medium text-white">
            {video.name}
          </span>
        </button>
      )}
    </div>
  )
}
