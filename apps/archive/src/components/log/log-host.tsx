import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { LogEntry } from "@workspace/schemas"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { PlusIcon } from "lucide-react"
import { useSyncExternalStore } from "react"
import { LogHistory } from "@/components/log/log-history"
import { LogSheet } from "@/components/log/log-sheet"
import type { LogTargetContext } from "@/components/log/log-sheet"
import { SeasonList } from "@/components/log/season-list"
import { ResponsiveSheet } from "@/components/responsive-sheet"
import type { LibraryItemInput } from "@/lib/repo"
import { indexQuery, logsQuery, mediaKey } from "@/queries/archive"
import { gameQuery, showQuery } from "@/queries/media"

/*
 * One log sheet for the whole app: "Log" on Home, a long press on a cover,
 * the cover menu… all open it over the current screen, without navigating:
 * a new log, or your logs of the work (tap one to edit it).
 * It stays mounted, so opening is a real open/close transition (a sheet
 * mounted already open would just pop in).
 */

/** "new": the log form (seasons for shows); "logs": your logs + New log; "edit": one log. */
type View = "new" | "logs" | "edit"
type State = {
  item?: LibraryItemInput
  open: boolean
  view: View
  editing?: LogEntry
}

let state: State = { open: false, view: "new" }
const listeners = new Set<() => void>()
const set = (next: State) => {
  state = next
  for (const listener of listeners) listener()
}
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const getState = () => state

function present(item: LibraryItemInput, view: View, editing?: LogEntry) {
  // Records have copies, not logs: nothing to open.
  if (item.type === "record") return
  if (state.item && sameItem(state.item, item)) {
    // Same work: the current sheet closes as the next one opens.
    set({ item, open: true, view, editing })
    return
  }
  // Swap the target while closed, then open on the next frame, so the
  // sheet renders closed first and transitions in.
  set({ item, open: false, view, editing })
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (state.item === item) set({ item, open: true, view, editing })
    })
  )
}

/** Opens the new-log sheet for a work, over whatever screen you're on. */
export const openLog = (item: LibraryItemInput) => present(item, "new")

/** Opens your logs of a work (tap one to edit it, or add a new one). */
export const openLogs = (item: LibraryItemInput) => present(item, "logs")

const sameItem = (a: LibraryItemInput, b: LibraryItemInput) =>
  a.type === b.type && String(a.id) === String(b.id)

const close = () => set({ ...state, open: false })

/**
 * Warms what the sheet needs for a work (platforms, copies, seasons), e.g.
 * when a long press starts, so it opens filled in.
 */
export function usePrefetchLog() {
  const queryClient = useQueryClient()
  return (item: LibraryItemInput) => {
    if (item.type === "record") return
    const id = Number(item.id)
    if (item.type === "game") void queryClient.prefetchQuery(gameQuery(id))
    if (item.type === "show") void queryClient.prefetchQuery(showQuery(id))
    void queryClient.prefetchQuery(logsQuery(item))
  }
}

/** Opens the new-log sheet (records have no logs: nothing opens). */
export function useOpenLog() {
  return (item: LibraryItemInput) => openLog(item)
}

/**
 * Your logs of a work when it has any, otherwise straight to a new log
 * (a long press on a cover).
 */
export function useOpenLogOrLogs() {
  const queryClient = useQueryClient()
  const openNew = useOpenLog()
  return async (item: LibraryItemInput) => {
    // Raw query data: `select` (the Sets) isn't applied here.
    const index = await queryClient.ensureQueryData(indexQuery())
    if (index.logged.includes(mediaKey(item))) openLogs(item)
    else openNew(item)
  }
}

/** Mounted once, in the root layout. */
export function LogHost() {
  const { item, open, view, editing } = useSyncExternalStore(
    subscribe,
    getState,
    getState
  )
  if (!item) return null
  return <HostSheet item={item} open={open} view={view} editing={editing} />
}

function HostSheet({
  item,
  open,
  view,
  editing,
}: {
  item: LibraryItemInput
  open: boolean
  view: View
  editing?: LogEntry
}) {
  const openNew = useOpenLog()
  const id = Number(item.id)
  const game = useQuery({ ...gameQuery(id), enabled: item.type === "game" })
  const show = useQuery({ ...showQuery(id), enabled: item.type === "show" })
  const onOpenChange = (next: boolean) =>
    next ? set({ ...state, open: true }) : close()

  // Shows are logged per season: the season list, then its own sheet.
  // Every sheet stays mounted so switching views never pops one in.
  const target = ((): LogTargetContext | undefined => {
    if (editing?.kind === "season")
      return {
        kind: "season",
        item,
        seasonNumber: editing.seasonNumber,
        seasonName:
          show.data?.seasons.find(
            (s) => s.seasonNumber === editing.seasonNumber
          )?.name ?? `Season ${editing.seasonNumber}`,
      }
    switch (item.type) {
      case "movie":
        return { kind: "movie", item }
      // Whole-show logs from before seasons-only logging.
      case "show":
        return { kind: "show", item }
      case "book":
        return { kind: "book", item }
      case "game":
        return { kind: "game", item, platforms: game.data?.platforms ?? [] }
      case "record":
        return undefined
    }
  })()
  if (!target) return null

  return (
    <>
      <ResponsiveSheet
        open={open && view === "logs"}
        onOpenChange={(next) => (next ? openLogs(item) : close())}
        title="Your logs"
        description={item.title}
      >
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="pressable h-11 w-full text-base"
            onClick={() => openNew(item)}
          >
            <PlusIcon />
            {item.type === "show" ? "Log a season" : "New log"}
          </Button>
          <LogHistory
            type={item.type}
            id={item.id}
            onSelect={(log) => present(item, "edit", log)}
            emptyLabel="Nothing logged yet."
          />
        </div>
      </ResponsiveSheet>
      <ResponsiveSheet
        open={open && view === "new" && item.type === "show"}
        onOpenChange={onOpenChange}
        title="Seasons"
        description={item.title}
      >
        {show.data ? (
          <SeasonList item={item} seasons={show.data.seasons} />
        ) : (
          <SeasonListSkeleton />
        )}
      </ResponsiveSheet>
      <LogSheet
        open={
          open && (view === "edit" || (view === "new" && item.type !== "show"))
        }
        onOpenChange={onOpenChange}
        target={target}
        editing={view === "edit" ? editing : undefined}
      />
    </>
  )
}

export function SeasonListSkeleton() {
  return (
    <div className="divide-y overflow-hidden rounded-xl border bg-card">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex min-h-14 items-center gap-3 px-4">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
