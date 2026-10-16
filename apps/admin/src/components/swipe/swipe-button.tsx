import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { GalleryVerticalEndIcon } from "lucide-react"
import { SwipeDeck } from "./swipe-deck"
import { useSwipe } from "./swipe-search"
import type { CardMedia } from "@/components/media-card"

/** Opens a list's swipe view; lists render it only when they have items. */
export function SwipeButton({
  onClick,
  toolbar = false,
  className,
}: {
  onClick: () => void
  /** Icon-only, sized like the filter/sort controls next to it. */
  toolbar?: boolean
  className?: string
}) {
  if (toolbar)
    return (
      <Button
        variant="outline"
        size="icon"
        aria-label="Swipe view"
        title="Swipe view"
        className={cn("size-10 shrink-0 rounded-xl", className)}
        onClick={onClick}
      >
        <GalleryVerticalEndIcon />
      </Button>
    )
  return (
    <Button
      variant="secondary"
      size="sm"
      className={cn("shrink-0 rounded-full", className)}
      onClick={onClick}
    >
      <GalleryVerticalEndIcon />
      Swipe
    </Button>
  )
}

/**
 * Swipe button plus its deck, for a section header (rails on detail pages,
 * Home). `id` must be unique on the page: it's the `?swipe=` value.
 */
export function SwipeAction({
  id,
  items,
  title,
}: {
  id: string
  items: Array<CardMedia>
  title: string
}) {
  const swipe = useSwipe(id)
  if (!items.length) return null
  return (
    <>
      <SwipeButton onClick={swipe.openDeck} />
      <SwipeDeck
        open={swipe.open}
        items={items}
        title={title}
        onClose={swipe.close}
      />
    </>
  )
}
