import { Link } from "@tanstack/react-router"
import type { MediaType } from "@workspace/schemas"
import { cn } from "@workspace/ui/lib/utils"
import { ScrollRow } from "@/components/media/media-rail"
import { KINDS } from "@/lib/media-kinds"

/**
 * Kind pills (same look as the library switcher) with counts; the choice is
 * the page's `?kind=` search param. Used by Backlog and Review.
 */
export function KindFilter({
  to,
  active,
  total,
  counts,
}: {
  to: "/backlog"
  active?: MediaType
  total: number
  counts: Array<readonly [MediaType, number]>
}) {
  const pill = (selected: boolean) =>
    cn(
      "pressable inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
      selected
        ? "border-primary bg-primary text-primary-foreground"
        : "text-muted-foreground hover:text-foreground"
    )
  const count = (n: number) => (
    <span className="tabular-nums opacity-70">{n}</span>
  )
  return (
    <nav aria-label="Kinds">
      <ScrollRow className="snap-none gap-2 pb-1">
        <Link
          to={to}
          search={(prev) => ({ ...prev, kind: undefined })}
          aria-current={active ? undefined : "page"}
          className={pill(!active)}
        >
          All {count(total)}
        </Link>
        {counts.map(([type, n]) => {
          const { plural, icon: Icon } = KINDS[type]
          return (
            <Link
              key={type}
              to={to}
              search={(prev) => ({ ...prev, kind: type })}
              aria-current={active === type ? "page" : undefined}
              className={pill(active === type)}
            >
              <Icon className="size-4" />
              {plural} {count(n)}
            </Link>
          )
        })}
      </ScrollRow>
    </nav>
  )
}
