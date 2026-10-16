import { cn } from "@workspace/ui/lib/utils"
import { StarIcon } from "lucide-react"
import { useId, useState } from "react"
import { ALLOW_HALF_STARS, formatRating } from "@/lib/rating"

const STARS = [1, 2, 3, 4, 5]

/** Read-only stars for a 1–10 rating. */
export function StarRating({
  rating,
  className,
}: {
  rating?: number
  className?: string
}) {
  if (rating === undefined) return null
  return (
    <span
      role="img"
      aria-label={formatRating(rating)}
      className={cn(
        "text-star inline-flex items-center gap-px tabular-nums",
        className
      )}
    >
      {STARS.map((star) => (
        <StarGlyph
          key={star}
          fill={Math.min(Math.max(rating - (star - 1) * 2, 0), 2) / 2}
        />
      ))}
    </span>
  )
}

function StarGlyph({ fill, className }: { fill: number; className?: string }) {
  return (
    <span className={cn("relative inline-block size-[1em]", className)}>
      <StarIcon
        className="absolute inset-0 size-full text-muted-foreground/30"
        fill="currentColor"
        strokeWidth={0}
      />
      {fill > 0 ? (
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${fill * 100}%` }}
        >
          <StarIcon
            className="size-[1em]"
            fill="currentColor"
            strokeWidth={0}
          />
        </span>
      ) : null}
    </span>
  )
}

/**
 * 5-star input on the 1–10 scale (half stars when enabled).
 * Mouse: hover previews, click sets. Touch: tap sets (no dragging).
 * Clicking/tapping the current value again clears it. Arrow keys step,
 * Backspace clears.
 */
export function StarRatingInput({
  value,
  onChange,
  id,
}: {
  value: number | undefined
  onChange: (value: number | undefined) => void
  id?: string
}) {
  const fallbackId = useId()
  const step = ALLOW_HALF_STARS ? 1 : 2
  const current = value ?? 0
  const [preview, setPreview] = useState<number>()

  /** The rating under the pointer, from its position across the stars. */
  function valueAt(e: React.MouseEvent<HTMLElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(Math.max((e.clientX - box.left) / box.width, 0), 1)
    return Math.max(step, Math.ceil((ratio * 10) / step) * step)
  }

  const shown = preview ?? current

  return (
    <div className="flex items-center gap-3">
      <div
        id={id ?? fallbackId}
        role="slider"
        tabIndex={0}
        aria-label="Rating"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={current}
        aria-valuetext={formatRating(value)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault()
            onChange(Math.min(current + step, 10))
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault()
            onChange(current - step <= 0 ? undefined : current - step)
          } else if (e.key === "Backspace" || e.key === "Delete") {
            onChange(undefined)
          }
        }}
        onClick={(e) => {
          // Tap/click only: the star under the pointer; the current value
          // again clears it. No dragging, so swipes never change a rating.
          const next = valueAt(e)
          onChange(next === value ? undefined : next)
          setPreview(undefined)
        }}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse") setPreview(valueAt(e))
        }}
        onPointerLeave={() => setPreview(undefined)}
        style={{ touchAction: "manipulation" }}
        className="text-star flex cursor-pointer rounded-md text-[2rem] outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {STARS.map((star) => (
          <span key={star} className="px-0.5">
            <StarGlyph
              fill={Math.min(Math.max(shown - (star - 1) * 2, 0), 2) / 2}
            />
          </span>
        ))}
      </div>
      <span className="text-sm text-muted-foreground tabular-nums">
        {shown === 0 ? "Tap to rate" : `${shown / 2} / 5`}
      </span>
    </div>
  )
}
