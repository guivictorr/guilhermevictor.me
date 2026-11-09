import { Spinner } from "@workspace/ui/components/spinner"
import { useEffect, useRef } from "react"

/** Loads the next page when it scrolls into view (600px early). */
export function LoadMore({
  active,
  loading,
  onVisible,
}: {
  active: boolean
  loading: boolean
  onVisible: () => void
}) {
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el || !active) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onVisible()
      },
      { rootMargin: "600px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [active, onVisible])
  return (
    <div ref={sentinel} className="flex justify-center py-6">
      {loading ? <Spinner /> : null}
    </div>
  )
}
