import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useSyncExternalStore } from "react"
import { toast } from "sonner"
import { LogSheet } from "@/components/log/log-sheet"
import type { LogTargetContext } from "@/components/log/log-sheet"
import { SeasonList } from "@/components/log/season-list"
import { copyOptions } from "@/components/records/copies"
import { ResponsiveSheet } from "@/components/responsive-sheet"
import type { LibraryItemInput } from "@/lib/repo"
import { collectionQuery } from "@/queries/archive"
import { gameQuery, showQuery } from "@/queries/media"

/*
 * One log sheet for the whole app: "Log" on Home, a long press on a cover,
 * the cover menu… all open it over the current screen, without navigating.
 * It stays mounted, so opening is a real open/close transition (a sheet
 * mounted already open would just pop in).
 */

type State = { item?: LibraryItemInput; open: boolean }

let state: State = { open: false }
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

/** Opens the log sheet for a work, over whatever screen you're on. */
export function openLog(item: LibraryItemInput) {
  if (state.item && sameItem(state.item, item)) {
    set({ item, open: true })
    return
  }
  // Swap the target while closed, then open on the next frame, so the
  // sheet renders closed first and transitions in.
  set({ item, open: false })
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (state.item === item) set({ item, open: true })
    })
  )
}

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
    const id = Number(item.id)
    if (item.type === "game") void queryClient.prefetchQuery(gameQuery(id))
    if (item.type === "show") void queryClient.prefetchQuery(showQuery(id))
    if (item.type === "record")
      void queryClient.prefetchQuery(collectionQuery())
  }
}

/** Opens the sheet, unless a record has no copy to log a play on. */
export function useOpenLog() {
  const queryClient = useQueryClient()
  return async (item: LibraryItemInput) => {
    if (item.type === "record") {
      const copies = await queryClient.ensureQueryData(collectionQuery())
      if (!copies.some((c) => c.releaseId === item.id)) {
        toast("Add a copy first", {
          description: "Plays are logged on a copy you own.",
        })
        return
      }
    }
    openLog(item)
  }
}

/** Mounted once, in the root layout. */
export function LogHost() {
  const { item, open } = useSyncExternalStore(subscribe, getState, getState)
  if (!item) return null
  return <HostSheet item={item} open={open} />
}

function HostSheet({ item, open }: { item: LibraryItemInput; open: boolean }) {
  const id = Number(item.id)
  const game = useQuery({ ...gameQuery(id), enabled: item.type === "game" })
  const show = useQuery({ ...showQuery(id), enabled: item.type === "show" })
  const { data: collection } = useQuery({
    ...collectionQuery(),
    enabled: item.type === "record",
  })
  const onOpenChange = (next: boolean) => (next ? openLog(item) : close())

  // Shows are logged per season: the season list, then its own sheet.
  // Both sheets stay mounted so switching kinds never pops one in.
  const target: LogTargetContext =
    item.type === "movie" || item.type === "show"
      ? { kind: "movie", item }
      : item.type === "book"
        ? { kind: "book", item }
        : item.type === "game"
          ? { kind: "game", item, platforms: game.data?.platforms ?? [] }
          : {
              kind: "record",
              item,
              copies: copyOptions(
                (collection ?? []).filter((c) => c.releaseId === item.id)
              ),
            }

  return (
    <>
      <ResponsiveSheet
        open={open && item.type === "show"}
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
        open={open && item.type !== "show"}
        onOpenChange={onOpenChange}
        target={target}
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
