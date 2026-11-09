import { Link } from "@tanstack/react-router"
import { useEffect, useRef } from "react"
import { ScrollRow } from "@/components/media/media-rail"
import { LIBRARY_SECTIONS } from "@/lib/media-kinds"

/**
 * Kind switcher at the top of every library page. On phones the tab bar
 * has a single "Library" tab, so this is how you move between kinds.
 */
export function LibraryNav() {
  const ref = useRef<HTMLElement>(null)
  // Kinds overflow on narrow phones; keep the current one visible.
  useEffect(() => {
    ref.current
      ?.querySelector('[data-status="active"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [])
  return (
    <nav ref={ref} aria-label="Library">
      <ScrollRow className="snap-none gap-2 pb-1">
        {/* Same pills as Search's kinds: text only, the current one filled. */}
        {LIBRARY_SECTIONS.map(({ key, plural, to }) => (
          <Link
            key={key}
            to={to}
            className="pressable inline-flex h-9 shrink-0 items-center rounded-full bg-muted px-4 text-sm font-medium text-foreground data-[status=active]:bg-foreground data-[status=active]:text-background"
          >
            {plural}
          </Link>
        ))}
      </ScrollRow>
    </nav>
  )
}
