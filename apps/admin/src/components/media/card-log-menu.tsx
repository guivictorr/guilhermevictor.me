import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import type { LogInput } from "@workspace/schemas"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import { CheckIcon, PencilLineIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { CardBacklogBadge } from "./backlog-button"
import { DETAIL_ROUTE } from "@/components/media-card"
import { today } from "@/lib/format"
import type { LibraryItemInput } from "@/lib/repo"
import {
  collectionQuery,
  indexQuery,
  logsQuery,
  mediaKey,
  useAddLog,
  useDeleteLog,
} from "@/queries/archive"

type QuickAction = { label: string; input: () => LogInput | undefined }

/** One-tap logs for today, per kind. `again` = you've logged it before. */
function quickActions(
  item: LibraryItemInput,
  again: boolean,
  copyId: string | undefined
): Array<QuickAction> {
  const date = today()
  switch (item.type) {
    case "movie":
      return [
        {
          label: again ? "Watched again today" : "Watched today",
          input: () => ({
            kind: "movie",
            mediaId: Number(item.id),
            watchedAt: date,
            rewatch: again,
          }),
        },
      ]
    case "show":
      // Shows are logged per season: "Log with details…" opens the list.
      return []
    case "game":
      return [
        {
          label: "Finished today",
          input: () => ({
            kind: "game",
            mediaId: Number(item.id),
            status: "finished",
            finishedAt: date,
          }),
        },
        {
          label: "Playing since today",
          input: () => ({
            kind: "game",
            mediaId: Number(item.id),
            status: "playing",
            startedAt: date,
          }),
        },
      ]
    case "book":
      return [
        {
          label: "Finished today",
          input: () => ({
            kind: "book",
            mediaId: String(item.id),
            status: "finished",
            finishedAt: date,
            reread: again,
          }),
        },
        {
          label: "Reading since today",
          input: () => ({
            kind: "book",
            mediaId: String(item.id),
            status: "reading",
            startedAt: date,
            reread: again,
          }),
        },
      ]
    case "record":
      // Plays need a copy you own.
      return copyId
        ? [
            {
              label: "Played today",
              input: () => ({
                kind: "record",
                mediaId: Number(item.id),
                copyId,
                playedAt: date,
              }),
            },
          ]
        : []
  }
}

/**
 * Poster-corner log control: ✓ when logged, + when not. Opens a small menu
 * to log today without a form, open the full log sheet, or delete the
 * latest log (with Undo).
 */
export function CardLogBadge({ item }: { item: LibraryItemInput }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data: index } = useQuery(indexQuery())
  // Only fetched while the menu is open.
  const { data: logs } = useQuery({
    ...logsQuery({ type: item.type, id: item.id }),
    enabled: open,
  })
  const { data: collection } = useQuery({
    ...collectionQuery(),
    enabled: open && item.type === "record",
  })
  const addLog = useAddLog()
  const deleteLog = useDeleteLog()

  if (!index) return null
  const logged = index.logged.has(mediaKey(item))
  const copyId = collection?.find((c) => c.releaseId === item.id)?.id
  const latest = logs?.[0]

  function log(action: QuickAction) {
    const input = action.input()
    if (!input) return
    addLog.mutate(
      { input, item },
      {
        onSuccess: () =>
          toast.success("Logged", {
            description: `${item.title} · ${action.label}`,
          }),
        onError: () => toast.error("Couldn't log"),
      }
    )
  }

  function deleteLatest() {
    if (!latest) return
    const { id, createdAt: _c, updatedAt: _u, ...input } = latest
    deleteLog.mutate(id, {
      onSuccess: () =>
        toast("Log deleted", {
          description: item.title,
          action: {
            label: "Undo",
            onClick: () => addLog.mutate({ input, item }),
          },
        }),
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label={logged ? `Logged · log ${item.title}` : `Log ${item.title}`}
        className={cn(
          // 28px visually; the pseudo-element makes the target 44px.
          "pressable relative flex size-7 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-colors after:absolute after:-inset-2",
          // Glass either way: a grid where everything is logged shouldn't
          // turn orange; only the check carries the signal color.
          "bg-background/70",
          logged ? "text-signal-text" : "text-foreground"
        )}
      >
        {logged ? (
          <CheckIcon className="size-4" strokeWidth={3} />
        ) : (
          <PlusIcon className="size-4" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-48">
        {quickActions(item, logged, copyId).map((action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={() => log(action)}
            disabled={addLog.isPending}
            className="min-h-10"
          >
            <CheckIcon />
            {action.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onClick={() =>
            void navigate({
              to: DETAIL_ROUTE[item.type],
              params: { id: String(item.id) },
              search: { log: "new" },
            })
          }
          className="min-h-10"
        >
          <PencilLineIcon />
          Log with details…
        </DropdownMenuItem>
        {logged ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={deleteLatest}
              disabled={!latest || deleteLog.isPending}
              className="min-h-10"
            >
              <Trash2Icon />
              Delete last log
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Rails and search: log menu, plus the backlog toggle until it's logged. */
export function CardBadges({ item }: { item: LibraryItemInput }) {
  const { data: index } = useQuery(indexQuery())
  const logged = index?.logged.has(mediaKey(item)) ?? false
  return (
    <>
      {logged ? null : <CardBacklogBadge item={item} />}
      <CardLogBadge item={item} />
    </>
  )
}
