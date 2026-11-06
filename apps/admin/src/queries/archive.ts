import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import type { QueryClient, QueryKey } from "@tanstack/react-query"
import { toast } from "sonner"
import type {
  ArchiveExport,
  BacklogItem,
  CollectionItem,
  CollectionItemDraft,
  CollectionItemInput,
  Flight,
  FlightInput,
  LogEntry,
  LogInput,
  MediaType,
} from "@workspace/schemas"
import { repo } from "@/lib/repo"
import type {
  ArchiveIndex,
  SteamPlaytimeMatch,
  CollectionSnapshot,
  LibraryItemInput,
  LogTarget,
  RecentLog,
} from "@/lib/repo"
import { LIBRARY_PAGE_SIZE } from "@/lib/repo/library-page"
import type { LibraryPageQuery } from "@/lib/repo/library-page"
import { mediaTypeOf } from "@/lib/repo/log-utils"

export const mediaKey = (target: LogTarget) => `${target.type}:${target.id}`

/*
 * Archive data comes from server functions (Postgres). Route loaders
 * prefetch what a screen needs; components read it with useSuspenseQuery.
 * Writes are optimistic (see docs/data-fetching.md): the cache changes
 * first and callers move on at once; a failure rolls back and offers a
 * retry in a toast. Only the affected queries refetch.
 */

export const archiveKeys = {
  all: ["archive"] as const,
  library: (type: MediaType) => [...archiveKeys.all, "library", type] as const,
  logs: (target: LogTarget) =>
    [...archiveKeys.all, "logs", target.type, target.id] as const,
  recent: (limit: number) => [...archiveKeys.all, "recent", limit] as const,
  /** Every `recent(limit)` and every `logs(target)`, for partial matching. */
  allRecent: () => [...archiveKeys.all, "recent"] as const,
  allLogs: () => [...archiveKeys.all, "logs"] as const,
  backlog: () => [...archiveKeys.all, "backlog"] as const,
  index: () => [...archiveKeys.all, "index"] as const,
  stats: () => [...archiveKeys.all, "stats"] as const,
  collection: () => [...archiveKeys.all, "collection"] as const,
  flights: () => [...archiveKeys.all, "flights"] as const,
}

export const libraryQuery = (type: MediaType) =>
  queryOptions({
    queryKey: archiveKeys.library(type),
    queryFn: () => repo.listLibrary(type),
  })

/**
 * A library one page at a time (infinite scroll). Its key sits under
 * `library(type)`, so every write that invalidates the library refreshes
 * the loaded pages too. The page size isn't in the key: the browser asks
 * for its screen's size, the server render for the user agent's.
 */
export const libraryPagesQuery = (type: MediaType, query: LibraryPageQuery) =>
  infiniteQueryOptions({
    queryKey: [...archiveKeys.library(type), "pages", query] as const,
    queryFn: ({ pageParam }) =>
      repo.listLibraryPage({
        type,
        offset: pageParam,
        limit: clientPageSize(),
        ...query,
      }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset,
  })

/** Undefined on the server, which then sizes the page by user agent. */
function clientPageSize() {
  if (typeof window === "undefined") return undefined
  return window.matchMedia("(min-width: 48rem)").matches
    ? LIBRARY_PAGE_SIZE.desktop
    : LIBRARY_PAGE_SIZE.mobile
}

export const logsQuery = (target: LogTarget) =>
  queryOptions({
    queryKey: archiveKeys.logs(target),
    queryFn: () => repo.listLogs(target),
  })

export const recentQuery = (limit = 12) =>
  queryOptions({
    queryKey: archiveKeys.recent(limit),
    queryFn: () => repo.listRecent(limit),
  })

export const backlogQuery = () =>
  queryOptions({
    queryKey: archiveKeys.backlog(),
    queryFn: () => repo.listBacklog(),
  })

/** Sets of `type:id` keys; build them once per fetch, not per render. */
export const indexQuery = () =>
  queryOptions({
    queryKey: archiveKeys.index(),
    queryFn: () => repo.getIndex(),
    select: (index) => ({
      logged: new Set(index.logged),
      backlog: new Set(index.backlog),
      owned: new Set(index.owned),
    }),
  })

export const collectionQuery = () =>
  queryOptions({
    queryKey: archiveKeys.collection(),
    queryFn: () => repo.listCollection(),
  })

export const flightsQuery = () =>
  queryOptions({
    queryKey: archiveKeys.flights(),
    queryFn: () => repo.listFlights(),
  })

export const statsQuery = () =>
  queryOptions({
    queryKey: archiveKeys.stats(),
    queryFn: () => repo.getStats(),
  })

// --- writes: optimistic cache updates + precise invalidation ----------------

type Patch = { key: QueryKey; update: (old: unknown) => unknown }
const patch = <T>(key: QueryKey, update: (old: T) => T): Patch => ({
  key,
  update: (old) => (old === undefined ? old : update(old as T)),
})

/**
 * Applies cache patches before a write reaches the server: cancels
 * in-flight fetches of those keys (they'd overwrite the patch), snapshots
 * them, patches every matching query. Returns the rollback.
 */
async function applyOptimistic(
  queryClient: QueryClient,
  patches: Array<Patch>
) {
  await Promise.all(
    patches.map(({ key }) => queryClient.cancelQueries({ queryKey: key }))
  )
  const snapshots = patches.flatMap(({ key }) =>
    queryClient.getQueriesData({ queryKey: key })
  )
  for (const { key, update } of patches)
    queryClient.setQueriesData({ queryKey: key }, update)
  return () => {
    for (const [key, data] of snapshots) queryClient.setQueryData(key, data)
  }
}

type Rollback = { rollback?: () => void }

/**
 * Every optimistic write shares one queue (`scope`): the server applies
 * them in the order they were made, so editing or deleting a log that is
 * still being created just waits for it. `onMutate` isn't queued, so the
 * screen never waits.
 */
const WRITE_KEY = [...archiveKeys.all, "write"] as const
const WRITE_SCOPE = { id: "archive-write" }

const staleKeys = new Map<string, QueryKey>()

/**
 * Refetches what writes touched once the queue is empty: a refetch that
 * lands between two writes would wipe the second one's optimistic patch.
 * Not awaited, so a write settles as soon as the server answers.
 */
function refreshAfterWrites(queryClient: QueryClient, keys: Array<QueryKey>) {
  for (const key of keys) staleKeys.set(JSON.stringify(key), key)
  // The write that's settling still counts.
  if (queryClient.isMutating({ mutationKey: WRITE_KEY }) > 1) return
  const queryKeys = [...staleKeys.values()]
  staleKeys.clear()
  for (const queryKey of queryKeys)
    void queryClient.invalidateQueries({ queryKey })
}

/**
 * An optimistic archive write. Callers fire `mutate` and move on: success
 * needs no feedback (the cache already shows it), a failure rolls back and
 * toasts with Retry, which replays the same variables (ids included, so
 * a write that did reach the server isn't duplicated).
 */
function useArchiveWrite<TData, TVars, TContext extends Rollback>({
  mutationFn,
  onMutate,
  refresh,
  errorTitle,
}: {
  mutationFn: (vars: TVars) => Promise<TData>
  onMutate: (vars: TVars) => Promise<TContext>
  /** Query keys the write may have changed. */
  refresh: (vars: TVars, context: TContext | undefined) => Array<QueryKey>
  errorTitle: string
}) {
  const queryClient = useQueryClient()
  const mutation = useMutation<TData, Error, TVars, TContext>({
    mutationKey: WRITE_KEY,
    scope: WRITE_SCOPE,
    mutationFn,
    onMutate,
    onError: (error, vars, context) => {
      context?.rollback?.()
      toast.error(errorTitle, {
        description: error.message,
        action: { label: "Retry", onClick: () => retry(vars) },
      })
    },
    onSettled: (_data, _error, vars, context) =>
      refreshAfterWrites(queryClient, refresh(vars, context)),
  })
  const retry = (vars: TVars) => mutation.mutate(vars)
  return mutation
}

/** What a write to a kind's logs can change. */
function kindKeys(types: Array<MediaType>): Array<QueryKey> {
  return [
    archiveKeys.allRecent(),
    archiveKeys.index(),
    archiveKeys.stats(),
    // Logging a work takes it out of the backlog.
    archiveKeys.backlog(),
    ...types.flatMap((type) => [
      archiveKeys.library(type),
      [...archiveKeys.allLogs(), type],
    ]),
    ...(types.includes("record") ? [archiveKeys.collection()] : []),
  ]
}

const invalidateKeys = (queryClient: QueryClient, keys: Array<QueryKey>) =>
  Promise.all(
    keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
  )

const nowIso = () => new Date().toISOString()
const keyOf = (type: MediaType, id: unknown) => `${type}:${String(id)}`

/** A log as it will look once saved (same id), shown until the refetch. */
function pendingLog(input: LogInput, id: string): LogEntry {
  const now = nowIso()
  return { ...input, id, createdAt: now, updatedAt: now }
}

const withIndex = (update: (index: ArchiveIndex) => ArchiveIndex) =>
  patch<ArchiveIndex>(archiveKeys.index(), update)

const without = (list: Array<string>, key: string) =>
  list.filter((k) => k !== key)

const withKey = (list: Array<string>, key: string) =>
  list.includes(key) ? list : [...list, key]

function logPatches(log: LogEntry, item: LibraryItemInput): Array<Patch> {
  const type = mediaTypeOf(log)
  const key = keyOf(type, log.mediaId)
  return [
    patch<Array<LogEntry>>(
      archiveKeys.logs({ type, id: log.mediaId }),
      (logs) => [log, ...logs]
    ),
    patch<Array<RecentLog>>(archiveKeys.allRecent(), (recent) => [
      { log, item: { ...item, addedAt: log.createdAt } },
      ...recent,
    ]),
    withIndex((index) => ({
      ...index,
      logged: withKey(index.logged, key),
      backlog: without(index.backlog, key),
    })),
    patch<Array<BacklogItem>>(archiveKeys.backlog(), (items) =>
      items.filter((b) => keyOf(b.type, b.id) !== key)
    ),
  ]
}

function replaceLogPatches(
  id: string,
  next: (log: LogEntry) => LogEntry | undefined
) {
  return [
    patch<Array<LogEntry>>(archiveKeys.allLogs(), (logs) =>
      logs.flatMap((log) => (log.id === id ? (next(log) ?? []) : [log]))
    ),
    patch<Array<RecentLog>>(archiveKeys.allRecent(), (recent) =>
      recent.flatMap((r) => {
        if (r.log.id !== id) return [r]
        const log = next(r.log)
        return log ? [{ ...r, log }] : []
      })
    ),
  ]
}

/** Which kind a log id belongs to, from whichever logs list holds it. */
function typeOfLog(queryClient: QueryClient, id: string) {
  for (const [, logs] of queryClient.getQueriesData<Array<LogEntry>>({
    queryKey: archiveKeys.allLogs(),
  })) {
    const log = logs?.find((l) => l.id === id)
    if (log) return mediaTypeOf(log)
  }
  return undefined
}

type AddLogVars = {
  input: LogInput
  item: LibraryItemInput
  /** Defaults to a new uuid; pass one to restore a deleted log as it was. */
  id?: string
}

export function useAddLog() {
  const queryClient = useQueryClient()
  const mutation = useArchiveWrite({
    mutationFn: ({ input, item, id }: Required<AddLogVars>) =>
      repo.addLog(input, item, id),
    onMutate: async ({ input, item, id }): Promise<Rollback> => ({
      rollback: await applyOptimistic(
        queryClient,
        logPatches(pendingLog(input, id), item)
      ),
    }),
    refresh: ({ input }) => kindKeys([mediaTypeOf(input)]),
    errorTitle: "Couldn't save the log",
  })
  return {
    ...mutation,
    // The id is picked here, so the cache, the server and a retry agree.
    mutate: (vars: AddLogVars) =>
      mutation.mutate({ ...vars, id: vars.id ?? crypto.randomUUID() }),
  }
}

export function useUpdateLog() {
  const queryClient = useQueryClient()
  return useArchiveWrite({
    mutationFn: ({ id, input }: { id: string; input: LogInput }) =>
      repo.updateLog(id, input),
    onMutate: async ({ id, input }): Promise<Rollback> => ({
      rollback: await applyOptimistic(
        queryClient,
        replaceLogPatches(id, (log) => ({
          ...input,
          id,
          createdAt: log.createdAt,
          updatedAt: nowIso(),
        }))
      ),
    }),
    refresh: ({ input }) => kindKeys([mediaTypeOf(input)]),
    errorTitle: "Couldn't save the log",
  })
}

export function useMoveLog() {
  const queryClient = useQueryClient()
  return useArchiveWrite({
    mutationFn: ({
      id,
      input,
      item,
    }: {
      id: string
      input: LogInput
      item: LibraryItemInput
    }) => repo.moveLog(id, input, item),
    onMutate: async ({ id, input, item }): Promise<Rollback> => ({
      // Off the old work, onto the new one (same id and dates).
      rollback: await applyOptimistic(queryClient, [
        ...replaceLogPatches(id, () => undefined),
        patch<Array<LogEntry>>(
          archiveKeys.logs({ type: mediaTypeOf(input), id: input.mediaId }),
          (logs) => [pendingLog(input, id), ...logs]
        ),
        withIndex((index) => ({
          ...index,
          logged: withKey(index.logged, keyOf(item.type, item.id)),
        })),
      ]),
    }),
    refresh: ({ input }) => kindKeys([mediaTypeOf(input)]),
    errorTitle: "Couldn't move the log",
  })
}

export function useDeleteLog() {
  const queryClient = useQueryClient()
  return useArchiveWrite({
    mutationFn: (id: string) => repo.deleteLog(id),
    onMutate: async (id): Promise<Rollback & { type?: MediaType }> => ({
      type: typeOfLog(queryClient, id),
      rollback: await applyOptimistic(
        queryClient,
        replaceLogPatches(id, () => undefined)
      ),
    }),
    refresh: (_id, context) =>
      context?.type ? kindKeys([context.type]) : [archiveKeys.all],
    errorTitle: "Couldn't delete the log",
  })
}

/** Bulk writes touch everything: refresh all archive data. */
function useInvalidateArchive() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: archiveKeys.all })
}

export function useImportArchive() {
  const invalidate = useInvalidateArchive()
  return useMutation({
    mutationFn: (data: ArchiveExport) => repo.importAll(data),
    onSuccess: invalidate,
  })
}

export function useClearArchive() {
  const invalidate = useInvalidateArchive()
  return useMutation({
    mutationFn: () => repo.clear(),
    onSuccess: invalidate,
  })
}

const backlogKeys = (type: MediaType): Array<QueryKey> => [
  archiveKeys.backlog(),
  archiveKeys.index(),
  archiveKeys.library(type),
]

export function useAddToBacklog() {
  const queryClient = useQueryClient()
  return useArchiveWrite({
    mutationFn: (item: LibraryItemInput) => repo.addToBacklog(item),
    onMutate: async (item): Promise<Rollback> => {
      const key = keyOf(item.type, item.id)
      return {
        rollback: await applyOptimistic(queryClient, [
          patch<Array<BacklogItem>>(archiveKeys.backlog(), (items) => [
            { ...item, addedAt: nowIso() },
            ...items.filter((b) => keyOf(b.type, b.id) !== key),
          ]),
          withIndex((index) => ({
            ...index,
            backlog: withKey(index.backlog, key),
          })),
        ]),
      }
    },
    refresh: (item) => backlogKeys(item.type),
    errorTitle: "Couldn't add to the backlog",
  })
}

export function useRemoveFromBacklog() {
  const queryClient = useQueryClient()
  return useArchiveWrite({
    mutationFn: (target: LogTarget) => repo.removeFromBacklog(target),
    onMutate: async (target): Promise<Rollback> => {
      const key = keyOf(target.type, target.id)
      return {
        rollback: await applyOptimistic(queryClient, [
          patch<Array<BacklogItem>>(archiveKeys.backlog(), (items) =>
            items.filter((b) => keyOf(b.type, b.id) !== key)
          ),
          withIndex((index) => ({
            ...index,
            backlog: without(index.backlog, key),
          })),
        ]),
      }
    },
    refresh: (target) => backlogKeys(target.type),
    errorTitle: "Couldn't remove from the backlog",
  })
}

/** Copies change the records library, plays, value and index. */
const collectionKeys = () => kindKeys(["record"])

type AddCopyVars = {
  snapshot: CollectionSnapshot
  input: CollectionItemInput
  id?: string
}

export function useAddCollectionItem() {
  const queryClient = useQueryClient()
  const mutation = useArchiveWrite({
    mutationFn: ({ snapshot, input, id }: Required<AddCopyVars>) =>
      repo.addCollectionItem(snapshot, input, id),
    onMutate: async ({ snapshot, input, id }): Promise<Rollback> => {
      const key = keyOf("record", snapshot.releaseId)
      const now = nowIso()
      const copy: CollectionItem = {
        ...snapshot,
        ...input,
        id,
        addedAt: now,
        updatedAt: now,
      }
      return {
        rollback: await applyOptimistic(queryClient, [
          patch<Array<CollectionItem>>(archiveKeys.collection(), (items) => [
            ...items,
            copy,
          ]),
          // Buying something you wanted takes it out of the backlog.
          withIndex((index) => ({
            ...index,
            owned: withKey(index.owned, key),
            backlog: without(index.backlog, key),
          })),
          patch<Array<BacklogItem>>(archiveKeys.backlog(), (items) =>
            items.filter((b) => keyOf(b.type, b.id) !== key)
          ),
        ]),
      }
    },
    refresh: collectionKeys,
    errorTitle: "Couldn't add the copy",
  })
  return {
    ...mutation,
    mutate: (vars: AddCopyVars) =>
      mutation.mutate({ ...vars, id: vars.id ?? crypto.randomUUID() }),
  }
}

export function useUpdateCollectionItem() {
  const queryClient = useQueryClient()
  return useArchiveWrite({
    mutationFn: ({ id, input }: { id: string; input: CollectionItemInput }) =>
      repo.updateCollectionItem(id, input),
    onMutate: async ({ id, input }): Promise<Rollback> => ({
      rollback: await applyOptimistic(queryClient, [
        patch<Array<CollectionItem>>(archiveKeys.collection(), (items) =>
          items.map((c) => (c.id === id ? { ...c, ...input } : c))
        ),
      ]),
    }),
    refresh: collectionKeys,
    errorTitle: "Couldn't save the copy",
  })
}

export function useDeleteCollectionItem() {
  const queryClient = useQueryClient()
  return useArchiveWrite({
    mutationFn: (id: string) => repo.deleteCollectionItem(id),
    onMutate: async (id): Promise<Rollback> => ({
      rollback: await applyOptimistic(queryClient, [
        patch<Array<CollectionItem>>(archiveKeys.collection(), (items) =>
          items.filter((c) => c.id !== id)
        ),
      ]),
    }),
    refresh: collectionKeys,
    errorTitle: "Couldn't remove the copy",
  })
}

export function useImportCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (drafts: Array<CollectionItemDraft>) =>
      repo.importCollection(drafts),
    onSuccess: () => invalidateKeys(queryClient, collectionKeys()),
  })
}

export function useFillFromSteam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entries: Array<SteamPlaytimeMatch>) =>
      repo.fillFromSteam(entries),
    onSuccess: () => invalidateKeys(queryClient, kindKeys(["game"])),
  })
}

const flightKeys = () => [archiveKeys.flights()]

type SaveFlightVars = {
  input: FlightInput
  /** The flight being edited; without it a new one is created. */
  id?: string
  /** Id for a new flight; defaults to a new uuid (pass one to restore). */
  newId?: string
}

export function useSaveFlight() {
  const queryClient = useQueryClient()
  const mutation = useArchiveWrite({
    mutationFn: ({ id, newId, input }: SaveFlightVars) =>
      id ? repo.updateFlight(id, input) : repo.addFlight(input, newId),
    onMutate: async ({ id, newId, input }): Promise<Rollback> => {
      const now = nowIso()
      return {
        rollback: await applyOptimistic(queryClient, [
          patch<Array<Flight>>(archiveKeys.flights(), (flights) =>
            id
              ? flights.map((f) =>
                  f.id === id
                    ? { ...input, id, createdAt: f.createdAt, updatedAt: now }
                    : f
                )
              : [
                  ...flights,
                  {
                    ...input,
                    id: newId ?? crypto.randomUUID(),
                    createdAt: now,
                    updatedAt: now,
                  },
                ]
          ),
        ]),
      }
    },
    refresh: flightKeys,
    errorTitle: "Couldn't save the flight",
  })
  return {
    ...mutation,
    mutate: (vars: SaveFlightVars) =>
      mutation.mutate(
        vars.id ? vars : { ...vars, newId: vars.newId ?? crypto.randomUUID() }
      ),
  }
}

export function useDeleteFlight() {
  const queryClient = useQueryClient()
  return useArchiveWrite({
    mutationFn: (id: string) => repo.deleteFlight(id),
    onMutate: async (id): Promise<Rollback> => ({
      rollback: await applyOptimistic(queryClient, [
        patch<Array<Flight>>(archiveKeys.flights(), (flights) =>
          flights.filter((f) => f.id !== id)
        ),
      ]),
    }),
    refresh: flightKeys,
    errorTitle: "Couldn't delete the flight",
  })
}
