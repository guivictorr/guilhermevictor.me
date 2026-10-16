import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import type { LogInput } from "@workspace/schemas"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu"
import {
  BookmarkCheckIcon,
  BookmarkPlusIcon,
  CheckIcon,
  ExternalLinkIcon,
  PencilLineIcon,
  Trash2Icon,
} from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { useBacklogToggle } from "./backlog-button"
import { useOpenLog, usePrefetchLog } from "@/components/log/log-host"
import { useMediaQuery } from "@/hooks/use-media-query"
import { DETAIL_ROUTE } from "@/lib/detail-routes"
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
export function quickActions(
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

/** Long press: ~450ms held still; moving or scrolling cancels it. */
const LONG_PRESS_MS = 450
const MOVE_TOLERANCE = 8

/**
 * Actions on a cover without a button on it. Desktop: right-click opens a
 * menu (log, log today, backlog, open, delete last log). Touch: a long
 * press opens the log sheet. A short tap still opens the page.
 */
export function CoverActions({
  item,
  children,
}: {
  item: LibraryItemInput
  children: React.ReactNode
}) {
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)")
  const openLog = useOpenLog()
  const prefetch = usePrefetchLog()
  // The menu (and its queries: logs, copies) mounts on first open only. A
  // grid has hundreds of covers; mounted up front, each would fetch its
  // logs on page load.
  const [menuUsed, setMenuUsed] = useState(false)

  if (fine)
    return (
      <ContextMenu
        onOpenChange={(open) => {
          if (!open) return
          setMenuUsed(true)
          prefetch(item)
        }}
      >
        <ContextMenuTrigger className="block">{children}</ContextMenuTrigger>
        {menuUsed ? (
          <CoverMenu item={item} onLog={() => void openLog(item)} />
        ) : null}
      </ContextMenu>
    )
  return (
    <LongPress
      onPressStart={() => prefetch(item)}
      onLongPress={() => void openLog(item)}
    >
      {children}
    </LongPress>
  )
}

function LongPress({
  onPressStart,
  onLongPress,
  children,
}: {
  /** A press began: warm what the sheet needs. */
  onPressStart: () => void
  onLongPress: () => void
  children: React.ReactNode
}) {
  const timer = useRef<number>(undefined)
  const start = useRef<{ x: number; y: number }>(undefined)
  const fired = useRef(false)
  const cancel = () => {
    window.clearTimeout(timer.current)
    start.current = undefined
  }
  return (
    <div
      // No iOS link preview or text selection on hold.
      className="select-none [-webkit-touch-callout:none]"
      onTouchStart={(e) => {
        const touch = e.touches[0]
        if (!touch || e.touches.length > 1) return
        fired.current = false
        start.current = { x: touch.clientX, y: touch.clientY }
        onPressStart()
        timer.current = window.setTimeout(() => {
          fired.current = true
          // Safari has no vibrate().
          if ("vibrate" in navigator) navigator.vibrate(10)
          onLongPress()
        }, LONG_PRESS_MS)
      }}
      onTouchMove={(e) => {
        const touch = e.touches[0]
        if (!touch || !start.current) return
        const moved = Math.hypot(
          touch.clientX - start.current.x,
          touch.clientY - start.current.y
        )
        if (moved > MOVE_TOLERANCE) cancel()
      }}
      onTouchEnd={cancel}
      onTouchCancel={cancel}
      // Android's long-press menu, and the click a long press ends with.
      onContextMenu={(e) => e.preventDefault()}
      onClickCapture={(e) => {
        if (!fired.current) return
        fired.current = false
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {children}
    </div>
  )
}

function CoverMenu({
  item,
  onLog,
}: {
  item: LibraryItemInput
  onLog: () => void
}) {
  const navigate = useNavigate()
  const { data: index } = useQuery(indexQuery())
  const logged = index?.logged.has(mediaKey(item)) ?? false
  const owned = index?.owned.has(mediaKey(item)) ?? false
  const { data: logs } = useQuery({
    ...logsQuery({ type: item.type, id: item.id }),
    enabled: logged,
  })
  const { data: collection } = useQuery({
    ...collectionQuery(),
    enabled: item.type === "record",
  })
  const backlog = useBacklogToggle(item)
  const addLog = useAddLog()
  const deleteLog = useDeleteLog()
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
    <ContextMenuContent className="min-w-52">
      <ContextMenuItem onClick={onLog}>
        <PencilLineIcon />
        {item.type === "show" ? "Log a season…" : "Log…"}
      </ContextMenuItem>
      {quickActions(item, logged, copyId).map((action) => (
        <ContextMenuItem key={action.label} onClick={() => log(action)}>
          <CheckIcon />
          {action.label}
        </ContextMenuItem>
      ))}
      <ContextMenuSeparator />
      {item.type === "record" && owned ? null : (
        <ContextMenuItem onClick={backlog.toggle} disabled={!backlog.ready}>
          {backlog.inBacklog ? <BookmarkCheckIcon /> : <BookmarkPlusIcon />}
          {backlog.inBacklog ? "Remove from backlog" : "Add to backlog"}
        </ContextMenuItem>
      )}
      <ContextMenuItem
        onClick={() =>
          void navigate({
            to: DETAIL_ROUTE[item.type],
            params: { id: String(item.id) },
          })
        }
      >
        <ExternalLinkIcon />
        Open
      </ContextMenuItem>
      {logged ? (
        <ContextMenuItem
          variant="destructive"
          onClick={deleteLatest}
          disabled={!latest || deleteLog.isPending}
        >
          <Trash2Icon />
          Delete last log
        </ContextMenuItem>
      ) : null}
    </ContextMenuContent>
  )
}
