import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"

/*
 * Loading states (docs/data-fetching.md). A screen's loader starts its
 * queries; each section reads them with useSuspenseQuery inside a
 * <SuspenseSection> whose fallback has the section's real size, so nothing
 * shifts. Content that had to wait fades in once; cached content (a tab you
 * come back to) renders as is, with no animation.
 */

export function SuspenseSection({
  fallback,
  children,
}: {
  fallback: React.ReactNode
  children: React.ReactNode
}) {
  const waited = useRef(false)
  return (
    <Suspense fallback={<Fallback waited={waited}>{fallback}</Fallback>}>
      <Reveal waited={waited}>{children}</Reveal>
    </Suspense>
  )
}

function Fallback({
  waited,
  children,
}: {
  waited: React.RefObject<boolean>
  children: React.ReactNode
}) {
  useEffect(() => {
    waited.current = true
  }, [waited])
  return children
}

function Reveal({
  waited,
  children,
}: {
  waited: React.RefObject<boolean>
  children: React.ReactNode
}) {
  // Read once, at the render that replaced the fallback.
  const animate = useRef(waited.current).current
  return animate ? <div className="animate-reveal">{children}</div> : children
}

/** A section title placeholder, same height as `type-heading text-lg`. */
export function TitleSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("mb-3 h-7 w-40", className)} />
}

/** Large feature cards in a row (Home's "Now"). */
export function CardRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <section aria-hidden>
      <TitleSkeleton />
      <div className="-mx-4 flex gap-3 overflow-hidden px-4 *:w-[85%] *:shrink-0 md:mx-0 md:grid md:grid-cols-3 md:px-0 md:*:w-auto">
        {Array.from({ length: count }, (_, i) => (
          <Skeleton key={i} className="h-44 rounded-[24px]" />
        ))}
      </div>
    </section>
  )
}

/** A divided list of rows (logs, recent, seasons). */
export function ListSkeleton({
  rows = 4,
  title = false,
  rowClassName = "h-16",
}: {
  rows?: number
  title?: boolean
  rowClassName?: string
}) {
  return (
    <div aria-hidden>
      {title ? <TitleSkeleton /> : null}
      <div className="divide-y overflow-hidden rounded-xl border bg-card">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className={cn("flex items-center gap-3 px-3", rowClassName)}
          >
            <Skeleton className="aspect-[2/3] w-11 shrink-0 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Fades an image in once it has loaded, so a blurred background never
 * flashes in half-decoded. Already-cached images (a tab you come back to)
 * show at once: no fade, no blink.
 */
export function useImageReveal(src: string | undefined) {
  const [loaded, setLoaded] = useState<{ src?: string; instant: boolean }>()
  const ref = useCallback(
    (node: HTMLImageElement | null) => {
      if (node?.complete && node.naturalWidth > 0)
        setLoaded({ src, instant: true })
    },
    [src]
  )
  const shown = loaded?.src === src
  return {
    ref,
    onLoad: () =>
      setLoaded((prev) => (prev?.src === src ? prev : { src, instant: false })),
    "data-loaded": shown || undefined,
    "data-instant": (shown && loaded?.instant) || undefined,
  }
}

/** Classes for a revealed image: hidden until loaded, then `opacity`. */
export const REVEAL_IMAGE =
  "opacity-0 transition-opacity duration-300 ease-out data-instant:transition-none"
