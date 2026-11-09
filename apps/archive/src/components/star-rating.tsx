import { cn } from "@workspace/ui/lib/utils"
import { StarIcon } from "lucide-react"
import { useId, useRef, useState } from "react"
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
  /** The star just clicked, while the pointer is still on it. */
  const clickedAt = useRef<number>(undefined)

  /**
   * The rating under the pointer, from the star it's on (left half = half
   * star). Measured per star, so it stays right however wide the row is
   * laid out; off the stars it's undefined (no change).
   */
  function valueAt(e: React.MouseEvent<HTMLElement>) {
    const star = (e.target as HTMLElement).closest<HTMLElement>("[data-star]")
    if (!star) return undefined
    const index = Number(star.dataset.star)
    const box = star.getBoundingClientRect()
    const half = e.clientX - box.left < box.width / 2
    const rating = index * 2 - (half && step === 1 ? 1 : 0)
    return Math.max(step, rating)
  }

  const shown = preview ?? current

  // Stars only: the value is in aria-valuetext for screen readers.
  return (
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
        if (next === undefined) return
        onChange(next === value ? undefined : next)
        // Show the result, not the hover: no preview until the pointer
        // moves on to another star.
        setPreview(undefined)
        clickedAt.current = next
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return
        const hovered = valueAt(e)
        if (hovered === undefined) {
          setPreview(undefined)
          return
        }
        if (hovered === clickedAt.current) return
        clickedAt.current = undefined
        setPreview(hovered)
      }}
      onPointerLeave={() => {
        clickedAt.current = undefined
        setPreview(undefined)
      }}
      style={{ touchAction: "manipulation" }}
      className="text-star flex w-fit cursor-pointer rounded-md text-[2rem] outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {STARS.map((star) => (
        <span key={star} data-star={star} className="px-0.5">
          <StarGlyph
            fill={Math.min(Math.max(shown - (star - 1) * 2, 0), 2) / 2}
          />
        </span>
      ))}
    </div>
  )
}
