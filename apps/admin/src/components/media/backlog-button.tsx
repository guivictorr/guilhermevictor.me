import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { BookmarkCheckIcon, BookmarkPlusIcon, CheckIcon } from "lucide-react"
import { toast } from "sonner"
import type { LibraryItemInput } from "@/lib/repo"
import {
  indexQuery,
  mediaKey,
  useAddToBacklog,
  useRemoveFromBacklog,
} from "@/queries/archive"

function useBacklogToggle(item: LibraryItemInput) {
  const { data: index } = useQuery(indexQuery())
  const add = useAddToBacklog()
  const remove = useRemoveFromBacklog()
  const key = mediaKey(item)
  const inBacklog = index?.backlog.has(key) ?? false
  const logged = index?.logged.has(key) ?? false

  function toggle() {
    if (inBacklog) {
      remove.mutate(item, {
        onSuccess: () =>
          toast("Removed from backlog", {
            action: { label: "Undo", onClick: () => add.mutate(item) },
          }),
      })
    } else {
      add.mutate(item, {
        onSuccess: () =>
          toast.success("Added to backlog", { description: item.title }),
      })
    }
  }

  return { inBacklog, logged, toggle, ready: index !== undefined }
}

/** Primary detail-page action next to "Log". */
export function BacklogButton({
  item,
  className,
}: {
  item: LibraryItemInput
  className?: string
}) {
  const { inBacklog, toggle, ready } = useBacklogToggle(item)
  const Icon = inBacklog ? BookmarkCheckIcon : BookmarkPlusIcon
  return (
    <Button
      variant={inBacklog ? "secondary" : "outline"}
      size="lg"
      className={cn("h-11 text-base", className)}
      onClick={toggle}
      disabled={!ready}
      aria-pressed={inBacklog}
    >
      <Icon />
      {inBacklog ? "In backlog" : "Backlog"}
    </Button>
  )
}

/**
 * Small poster-corner control for rails: ✓ when already logged,
 * otherwise a one-tap backlog toggle.
 */
export function CardBacklogBadge({ item }: { item: LibraryItemInput }) {
  const { inBacklog, logged, toggle, ready } = useBacklogToggle(item)
  if (!ready) return null
  if (logged)
    return (
      <span
        aria-label="Logged"
        className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
      >
        <CheckIcon className="size-4" strokeWidth={3} />
      </span>
    )
  const Icon = inBacklog ? BookmarkCheckIcon : BookmarkPlusIcon
  return (
    <button
      type="button"
      aria-label={inBacklog ? "Remove from backlog" : "Add to backlog"}
      aria-pressed={inBacklog}
      onClick={toggle}
      className={cn(
        "pressable flex size-7 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-colors",
        inBacklog
          ? "bg-primary text-primary-foreground"
          : "bg-background/70 text-foreground"
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}
