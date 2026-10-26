import { Link } from "@tanstack/react-router"
import type { MediaType } from "@workspace/schemas"
import { cn } from "@workspace/ui/lib/utils"
import { ScrollRow } from "@/components/media/media-rail"
import { KINDS } from "@/lib/media-kinds"

/**
 * Kind pills with counts, the same look as Search's kinds and the library
 * switcher (text only, the current one filled); the choice is the page's
 * `?kind=` search param. Used by Backlog.
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
      "pressable inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium",
      selected ? "bg-foreground text-background" : "bg-muted text-foreground"
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
          const { plural } = KINDS[type]
          return (
            <Link
              key={type}
              to={to}
              search={(prev) => ({ ...prev, kind: type })}
              aria-current={active === type ? "page" : undefined}
              className={pill(active === type)}
            >
              {plural} {count(n)}
            </Link>
          )
        })}
      </ScrollRow>
    </nav>
  )
}
