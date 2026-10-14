import { cn } from "@workspace/ui/lib/utils"
import { StarIcon } from "lucide-react"
import { useId } from "react"
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
      className={cn("text-star inline-flex items-center gap-px", className)}
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
 * Tappable 5-star input. Each star is split in two hit areas when half
 * stars are enabled; tapping the current value again clears the rating.
 * Arrow keys adjust by one step for keyboard users.
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

  const set = (next: number) =>
    onChange(next === value || next <= 0 ? undefined : Math.min(next, 10))

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
        className="text-star flex rounded-md text-[2rem] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {STARS.map((star) => {
          const fill = Math.min(Math.max(current - (star - 1) * 2, 0), 2) / 2
          return (
            <span key={star} className="relative px-0.5">
              <StarGlyph fill={fill} />
              <span className="absolute inset-0 flex">
                {ALLOW_HALF_STARS ? (
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden
                    className="h-full w-1/2"
                    onClick={() => set(star * 2 - 1)}
                  />
                ) : null}
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden
                  className="h-full flex-1"
                  onClick={() => set(star * 2)}
                />
              </span>
            </span>
          )
        })}
      </div>
      <span className="text-sm text-muted-foreground tabular-nums">
        {value === undefined ? "Tap to rate" : `${value / 2} / 5`}
      </span>
    </div>
  )
}
