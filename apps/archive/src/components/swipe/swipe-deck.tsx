import { ChevronLeftIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Component,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import { useQueryClient } from "@tanstack/react-query"
import { SwipeSlide } from "./swipe-slide"
import { prefetchWorkDetails } from "@/components/media/use-work-details"
import { imageUrl } from "@/lib/images"
import { logsQuery } from "@/queries/archive"
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
 * A list as full-screen cards: swipe up (or ↓/→) for the next item, Esc or
 * the back button to leave. It reopens on the card you left (per URL, for
 * this browser session). Covers the tab bar and dock (z-45) but stays
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
/** Cards to warm around the current one. */
const PREFETCH = [1, 2, -1]
const preloaded = new Set<string>()
/**
 * Fetches a cover into the HTTP cache without keeping a decoded bitmap
 * around: decoded full-screen images add up fast on a phone, and iOS
 * reloads the page when memory runs out.
 */
function preloadImage(src: string | undefined) {
  if (!src || preloaded.has(src)) return
  preloaded.add(src)
  const img = new Image()
  img.fetchPriority = "low"
  img.src = src
}

/**
 * Where each deck was, by its URL (taken when it opens), for this browser
 * session: a remount or reload resumes on the same card.
 */
const positionKey = () => `archive:swipe:${location.pathname}${location.search}`
const storage = {
  read: (key: string) => {
    try {
      return sessionStorage.getItem(key) ?? undefined
    } catch {
      return undefined
    }
  },
  write: (key: string, value: string) => {
    try {
      sessionStorage.setItem(key, value)
    } catch {
      // Storage blocked: the deck just starts at the top.
    }
  },
  remove: (key: string) => {
    try {
      sessionStorage.removeItem(key)
    } catch {
      // Nothing to forget.
    }
  },
}

const NEXT_KEYS = new Set(["ArrowDown", "ArrowRight", "PageDown", "j"])
const PREV_KEYS = new Set(["ArrowUp", "ArrowLeft", "PageUp", "k"])
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
  // Resume on the card you were on (after a reload, or when the list
  // behind remounted), else start at the top.
  const [storageKey] = useState(positionKey)
  const [index, setIndex] = useState(() => {
    const saved = storage.read(storageKey)
    return Math.max(0, saved ? items.findIndex((m) => keyOf(m) === saved) : 0)
  })
  const start = useRef(index)
  useLayoutEffect(() => {
    const el = scroller.current
    if (el && start.current > 0)
      el.scrollTo({ top: start.current * el.clientHeight, behavior: "instant" })
  }, [])
  useEffect(() => {
    const media = items[index]
    if (media) storage.write(storageKey, keyOf(media))
  }, [index, items, storageKey])
  // Closed while staying on this page (Close, Esc, Back): start fresh next
  // time. Leaving for a detail page, or a reload, keeps the position.
  useEffect(() => {
    const path = location.pathname
    return () => {
      const params = new URLSearchParams(location.search)
      if (location.pathname === path && !params.has("swipe"))
        storage.remove(storageKey)
    }
  }, [storageKey])

  // The next two cards (and the previous one) are ready before you get
  // there: details, your logs and the cover image, so nothing fills in late.
  const queryClient = useQueryClient()
  useEffect(() => {
    for (const offset of PREFETCH) {
      const media = items[index + offset]
      if (!media) continue
      void prefetchWorkDetails(queryClient, media)
      void queryClient.prefetchQuery(logsQuery(media))
      preloadImage(imageUrl(media.poster, "large"))
    }
  }, [index, items, queryClient])

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
      top: target * el.clientHeight,
      behavior: reduce ? "instant" : "smooth",
    })
  }

  // ↑/↓ (and ←/→) and Esc, unless typing or a sheet/menu is open.
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
      else if (NEXT_KEYS.has(event.key) || PREV_KEYS.has(event.key)) {
        event.preventDefault()
        go(index + (NEXT_KEYS.has(event.key) ? 1 : -1))
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
          const next = Math.round(el.scrollTop / el.clientHeight)
          if (next !== index) setIndex(next)
        }}
        className="flex h-full snap-y snap-mandatory [scrollbar-width:none] flex-col overflow-y-auto overscroll-contain"
      >
        {items.map((media, i) => (
          <section
            key={`${media.type}-${media.id}`}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${items.length}: ${media.title}`}
            className="h-full w-full shrink-0 snap-start snap-always"
          >
            {Math.abs(i - index) <= 1 ? (
              <SlideBoundary>
                <SwipeSlide item={toItem(media)} />
              </SlideBoundary>
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
          <div className="glass pointer-events-auto min-w-0 rounded-md border px-3.5 py-1.5 text-sm">
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

/**
 * One card failing (odd provider data, a render bug) shows a note in its
 * place instead of taking the whole deck, and your position, with it.
 */
class SlideBoundary extends Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error("Swipe card failed", error)
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
        Couldn't show this card. Swipe on to the next one.
      </div>
    )
  }
}
