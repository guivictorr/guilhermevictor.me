import { cn } from "@workspace/ui/lib/utils"
import { useState } from "react"

export type Bar = {
  label: string
  value: number
  /** Tooltip text; defaults to "label: value". */
  detail?: string
}

/**
 * Single-series vertical bar chart (one hue, so no legend: the section
 * title names it). Bars are focusable so the tooltip works by keyboard too.
 */
export function BarChart({
  bars,
  barClassName = "bg-foreground/70",
  height = 140,
  label,
}: {
  bars: Array<Bar>
  barClassName?: string
  height?: number
  /** Accessible name for the whole chart. */
  label: string
}) {
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(1, ...bars.map((b) => b.value))

  return (
    <figure aria-label={label} className="select-none">
      <div className="relative flex items-end gap-0.5" style={{ height }}>
        {/* Recessive baseline */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
        {bars.map((bar, i) => {
          const pct = (bar.value / max) * 100
          const detail = bar.detail ?? `${bar.label}: ${bar.value}`
          return (
            <button
              // Labels can repeat or be blank (half-star bars); index is stable here.
              key={i}
              type="button"
              aria-label={detail}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              // Full-height hit target, bigger than the mark itself.
              className="group relative flex h-full flex-1 items-end outline-none"
            >
              <span
                className={cn(
                  // Cap width so a single bar doesn't become a slab.
                  "mx-auto w-full max-w-12 rounded-t-[4px] transition-opacity duration-150",
                  barClassName,
                  bar.value === 0 && "opacity-0",
                  active !== null && active !== i && "opacity-40",
                  "group-focus-visible:ring-2 group-focus-visible:ring-ring"
                )}
                style={{ height: `max(${pct}%, ${bar.value ? 2 : 0}px)` }}
              />
              {active === i ? (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md"
                >
                  {detail}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      <div className="mt-1.5 flex gap-0.5" aria-hidden>
        {bars.map((bar, i) => (
          <span
            key={i}
            className="flex-1 text-center text-[0.6875rem] text-muted-foreground tabular-nums"
          >
            {bar.label}
          </span>
        ))}
      </div>
    </figure>
  )
}
