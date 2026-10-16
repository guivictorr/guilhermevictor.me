import { ChevronLeftIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { SwipeSlide } from "./swipe-slide"
import type { CardMedia } from "@/components/media-card"
import type { LibraryItemInput } from "@/lib/repo"

/** Card-sized items become loggable works (genres come with the details). */
const toItem = (media: CardMedia): LibraryItemInput => ({
  type: media.type,
  id: media.id,
  title: media.title,
  subtitle: media.subtitle,
  year: media.year,
  poster: media.poster,
  genres: [],
})

/**
 * A list as full-screen cards: swipe (or ←/→) to the next item, Esc or the
 * back button to leave. Covers the tab bar and sidebar (z-45) but stays
 * under sheets and menus (z-50), so logging opens on top. Only the current
 * card and its neighbours render.
 */
type More = {
  /** The list has more beyond what's loaded (e.g. search pages). */
  hasMore?: boolean
  loadingMore?: boolean
  /** Called near the last card, to load the next page. */
  onNearEnd?: () => void
}

export function SwipeDeck({
  open,
  items,
  title,
  onClose,
  ...more
}: {
  open: boolean
  items: Array<CardMedia>
  title: string
  onClose: () => void
} & More) {
  // Client-only: a reload with `?swipe=` renders the page first, then this.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted || !open || !items.length) return null
  // Portalled so no page container (transforms, overflow) can clip it.
  return createPortal(
    <Deck items={items} title={title} onClose={onClose} {...more} />,
    document.body
  )
}

const keyOf = (m: CardMedia) => `${m.type}:${m.id}`
/** Start loading the next page this many cards before the end. */
const NEAR_END = 3

function Deck({
  items: live,
  title,
  onClose,
  hasMore = false,
  loadingMore = false,
  onNearEnd,
}: {
  items: Array<CardMedia>
  title: string
  onClose: () => void
} & More) {
  // The list as it was when opened: rating or logging here can re-sort the
  // page's list (e.g. by rating), which mustn't shuffle the cards in place.
  // Items loaded later (the next search page) are added at the end.
  const [snapshot] = useState(live)
  const items = useMemo(() => {
    const seen = new Set(snapshot.map(keyOf))
    return [...snapshot, ...live.filter((m) => !seen.has(keyOf(m)))]
  }, [snapshot, live])
  const scroller = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  // Keep swiping past what's loaded: fetch the next page near the end.
  const nearEnd = useRef(onNearEnd)
  nearEnd.current = onNearEnd
  useEffect(() => {
    if (hasMore && !loadingMore && index >= items.length - NEAR_END)
      nearEnd.current?.()
  }, [index, items.length, hasMore, loadingMore])

  // The page behind shouldn't scroll while the deck is up, and its reserved
  // scrollbar gutter would show as a strip down the deck's right edge.
  useEffect(() => {
    const { style } = document.documentElement
    const { overflow, scrollbarGutter } = style
    style.overflow = "hidden"
    style.scrollbarGutter = "auto"
    return () => {
      style.overflow = overflow
      style.scrollbarGutter = scrollbarGutter
    }
  }, [])

  function go(next: number) {
    const el = scroller.current
    if (!el) return
    const target = Math.max(0, Math.min(items.length - 1, next))
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    el.scrollTo({
      left: target * el.clientWidth,
      behavior: reduce ? "instant" : "smooth",
    })
  }

  // ←/→ and Esc, unless typing or a sheet/menu is open.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (
        target?.closest(
          "input, textarea, select, [contenteditable], [role=slider]"
        )
      )
        return
      if (document.querySelector("[role=dialog], [role=menu]")) return
      if (event.key === "Escape") onClose()
      else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault()
        go(index + (event.key === "ArrowRight" ? 1 : -1))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={title}
      className="fixed inset-0 z-[45] bg-background"
    >
      <div
        ref={scroller}
        data-scroll-deck
        onScroll={(event) => {
          const el = event.currentTarget
          const next = Math.round(el.scrollLeft / el.clientWidth)
          if (next !== index) setIndex(next)
        }}
        className="flex h-full snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overscroll-contain"
      >
        {items.map((media, i) => (
          <section
            key={`${media.type}-${media.id}`}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${items.length}: ${media.title}`}
            className="h-full w-full shrink-0 snap-center snap-always"
          >
            {Math.abs(i - index) <= 1 ? (
              <SwipeSlide item={toItem(media)} />
            ) : null}
          </section>
        ))}
      </div>

      {/* Glass top bar: the only way out besides Esc and Back. */}
      <div className="pt-safe pointer-events-none absolute inset-x-0 top-0">
        <div className="flex items-center gap-3 px-4 pt-3">
          <Button
            variant="secondary"
            size="icon-lg"
            aria-label="Close"
            className="pointer-events-auto rounded-full border-border/60 bg-background/70 shadow-sm backdrop-blur-md"
            onClick={onClose}
          >
            <ChevronLeftIcon className="size-5" />
          </Button>
          <div className="glass pointer-events-auto min-w-0 rounded-full border px-3.5 py-1.5 text-sm">
            <span className="truncate font-medium">{title}</span>{" "}
            <span
              className="text-muted-foreground tabular-nums"
              aria-live="polite"
            >
              {index + 1} / {items.length}
              {hasMore ? "+" : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
