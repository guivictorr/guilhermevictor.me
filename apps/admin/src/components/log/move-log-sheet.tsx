import { useQuery } from "@tanstack/react-query"
import type { LogEntry, MediaSummary } from "@workspace/schemas"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import { SearchIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { toBacklogItem } from "@/components/media/media-rail"
import { Poster } from "@/components/poster"
import { ResponsiveSheet } from "@/components/responsive-sheet"
import { joinDefined } from "@/lib/format"
import type { LibraryItemInput } from "@/lib/repo"
import { mediaTypeOf } from "@/lib/repo/log-utils"
import { useMoveLog } from "@/queries/archive"
import { searchQuery } from "@/queries/media"

/**
 * Pick the work a log should have been on (logged the wrong item): search
 * the same provider, tap the right one, and the log moves there with all
 * its data. Undo moves it back.
 */
export function MoveLogSheet({
  open,
  onOpenChange,
  log,
  item,
  onMoved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: LogEntry
  /** Where the log is now. */
  item: LibraryItemInput
  onMoved: () => void
}) {
  const type = mediaTypeOf(log)
  // Wrong matches usually share the title, so start from it.
  const [text, setText] = useState(item.title)
  const [query, setQuery] = useState(item.title)
  useEffect(() => {
    const timeout = setTimeout(() => setQuery(text.trim()), 300)
    return () => clearTimeout(timeout)
  }, [text])
  const { data, isFetching } = useQuery({
    ...searchQuery(type, query),
    enabled: open && query.length > 0,
  })
  const results = (data ?? []).filter((r) => String(r.id) !== String(item.id))
  const move = useMoveLog()

  function moveTo(media: MediaSummary) {
    const target = toBacklogItem(media)
    const { id, createdAt: _c, updatedAt: _u, ...input } = log
    const moved = { ...input, mediaId: media.id } as typeof input
    move.mutate(
      { id, input: moved, item: target },
      {
        onSuccess: () => {
          onOpenChange(false)
          onMoved()
          toast.success(`Moved to ${media.title}`, {
            description: `From ${item.title}`,
            action: {
              label: "Undo",
              onClick: () => move.mutate({ id, input, item }),
            },
          })
        },
        onError: (error) =>
          toast.error("Couldn't move the log", {
            description: error instanceof Error ? error.message : undefined,
          }),
      }
    )
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Move log to…"
      description={`Currently on ${item.title}. Pick the right one; dates, rating and notes come along.`}
    >
      <div className="flex flex-col gap-3">
        <InputGroup className="h-11 rounded-xl">
          <InputGroupAddon>
            {isFetching ? <Spinner /> : <SearchIcon />}
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label="Search"
            autoComplete="off"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="text-base"
          />
        </InputGroup>
        {results.length ? (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {results.slice(0, 20).map((media) => (
              <li key={`${media.type}-${media.id}`}>
                <button
                  type="button"
                  disabled={move.isPending}
                  onClick={() => moveTo(media)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 active:bg-muted disabled:opacity-50"
                >
                  <Poster
                    image={media.poster}
                    type={media.type}
                    title={media.title}
                    size="thumb"
                    className="w-10 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {media.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {joinDefined([media.subtitle, media.year])}
                    </p>
                    {/* Ports share title and cover; the platform tells them apart. */}
                    {media.platforms?.length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {media.platforms.map((platform) => (
                          <Badge
                            key={platform}
                            variant="outline"
                            className="h-5 px-1.5 text-[0.6875rem]"
                          >
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isFetching
              ? "Searching…"
              : query
                ? "No other matches. Try another title."
                : "Type a title."}
          </p>
        )}
      </div>
    </ResponsiveSheet>
  )
}
