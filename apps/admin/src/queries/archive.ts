import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import type { QueryClient, QueryKey } from "@tanstack/react-query"
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
 * first, rolls back on error, and only the affected queries refetch.
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
  facts: () => [...archiveKeys.all, "facts"] as const,
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

export const factsQuery = () =>
  queryOptions({
    queryKey: archiveKeys.facts(),
    queryFn: () => repo.getFacts(),
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

/** What a write to a kind's logs can change; refetched in parallel. */
function invalidateKinds(queryClient: QueryClient, types: Array<MediaType>) {
  const keys: Array<QueryKey> = [
    archiveKeys.allRecent(),
    archiveKeys.index(),
    archiveKeys.stats(),
    archiveKeys.facts(),
    // Logging a work takes it out of the backlog.
    archiveKeys.backlog(),
    ...types.flatMap((type) => [
      archiveKeys.library(type),
      [...archiveKeys.allLogs(), type],
    ]),
    ...(types.includes("record") ? [archiveKeys.collection()] : []),
  ]
  return Promise.all(
    keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
  )
}

const nowIso = () => new Date().toISOString()
const keyOf = (type: MediaType, id: unknown) => `${type}:${String(id)}`

/** A log as it will look once saved, shown until the server answers. */
function pendingLog(input: LogInput, id = crypto.randomUUID()): LogEntry {
  const now = nowIso()
  return { ...input, id, createdAt: now, updatedAt: now }
}

const withIndex = (update: (index: ArchiveIndex) => ArchiveIndex) =>
  patch<ArchiveIndex>(archiveKeys.index(), update)

const without = (list: Array<string>, key: string) =>
  list.filter((k) => k !== key)

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
      logged: index.logged.includes(key)
        ? index.logged
        : [...index.logged, key],
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

export function useAddLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      item,
    }: {
      input: LogInput
      item: LibraryItemInput
    }) => repo.addLog(input, item),
    onMutate: async ({ input, item }): Promise<Rollback> => ({
      rollback: await applyOptimistic(
        queryClient,
        logPatches(pendingLog(input), item)
      ),
    }),
    onError: (_e, _v, context) => context?.rollback?.(),
    onSettled: (_d, _e, { input }) =>
      invalidateKinds(queryClient, [mediaTypeOf(input)]),
  })
}

export function useUpdateLog() {
  const queryClient = useQueryClient()
  return useMutation({
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
    onError: (_e, _v, context) => context?.rollback?.(),
    onSettled: (_d, _e, { input }) =>
      invalidateKinds(queryClient, [mediaTypeOf(input)]),
  })
}

export function useMoveLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      item,
    }: {
      id: string
      input: LogInput
      item: LibraryItemInput
    }) => repo.moveLog(id, input, item),
    onMutate: async ({ id }): Promise<Rollback> => ({
      // Off the old work right away; the new one fills in on refetch.
      rollback: await applyOptimistic(
        queryClient,
        replaceLogPatches(id, () => undefined)
      ),
    }),
    onError: (_e, _v, context) => context?.rollback?.(),
    onSettled: (_d, _e, { input }) =>
      invalidateKinds(queryClient, [mediaTypeOf(input)]),
  })
}

export function useDeleteLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => repo.deleteLog(id),
    onMutate: async (id): Promise<Rollback & { type?: MediaType }> => ({
      type: typeOfLog(queryClient, id),
      rollback: await applyOptimistic(
        queryClient,
        replaceLogPatches(id, () => undefined)
      ),
    }),
    onError: (_e, _v, context) => context?.rollback?.(),
    onSettled: (_d, _e, _id, context) =>
      context?.type
        ? invalidateKinds(queryClient, [context.type])
        : queryClient.invalidateQueries({ queryKey: archiveKeys.all }),
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

function invalidateBacklog(queryClient: QueryClient, type: MediaType) {
  return Promise.all(
    [
      archiveKeys.backlog(),
      archiveKeys.index(),
      archiveKeys.facts(),
      archiveKeys.library(type),
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey }))
  )
}

export function useAddToBacklog() {
  const queryClient = useQueryClient()
  return useMutation({
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
            backlog: [...without(index.backlog, key), key],
          })),
        ]),
      }
    },
    onError: (_e, _v, context) => context?.rollback?.(),
    onSettled: (_d, _e, item) => invalidateBacklog(queryClient, item.type),
  })
}

export function useRemoveFromBacklog() {
  const queryClient = useQueryClient()
  return useMutation({
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
    onError: (_e, _v, context) => context?.rollback?.(),
    onSettled: (_d, _e, target) => invalidateBacklog(queryClient, target.type),
  })
}

/** Copies change the records library, plays, value and index. */
const invalidateCollection = (queryClient: QueryClient) =>
  invalidateKinds(queryClient, ["record"])

export function useAddCollectionItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      snapshot,
      input,
    }: {
      snapshot: CollectionSnapshot
      input: CollectionItemInput
    }) => repo.addCollectionItem(snapshot, input),
    onSettled: () => invalidateCollection(queryClient),
  })
}

export function useUpdateCollectionItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CollectionItemInput }) =>
      repo.updateCollectionItem(id, input),
    onMutate: async ({ id, input }): Promise<Rollback> => ({
      rollback: await applyOptimistic(queryClient, [
        patch<Array<CollectionItem>>(archiveKeys.collection(), (items) =>
          items.map((c) => (c.id === id ? { ...c, ...input } : c))
        ),
      ]),
    }),
    onError: (_e, _v, context) => context?.rollback?.(),
    onSettled: () => invalidateCollection(queryClient),
  })
}

export function useDeleteCollectionItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => repo.deleteCollectionItem(id),
    onMutate: async (id): Promise<Rollback> => ({
      rollback: await applyOptimistic(queryClient, [
        patch<Array<CollectionItem>>(archiveKeys.collection(), (items) =>
          items.filter((c) => c.id !== id)
        ),
      ]),
    }),
    onError: (_e, _v, context) => context?.rollback?.(),
    onSettled: () => invalidateCollection(queryClient),
  })
}

export function useImportCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (drafts: Array<CollectionItemDraft>) =>
      repo.importCollection(drafts),
    onSuccess: () => invalidateCollection(queryClient),
  })
}

export function useFillFromSteam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entries: Array<SteamPlaytimeMatch>) =>
      repo.fillFromSteam(entries),
    onSuccess: () => invalidateKinds(queryClient, ["game"]),
  })
}

const invalidateFlights = (queryClient: QueryClient) =>
  Promise.all(
    [archiveKeys.flights(), archiveKeys.facts()].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey })
    )
  )

export function useSaveFlight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: FlightInput }) =>
      id ? repo.updateFlight(id, input) : repo.addFlight(input),
    onMutate: async ({ id, input }): Promise<Rollback> => {
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
                    id: crypto.randomUUID(),
                    createdAt: now,
                    updatedAt: now,
                  },
                ]
          ),
        ]),
      }
    },
    onError: (_e, _v, context) => context?.rollback?.(),
    onSettled: () => invalidateFlights(queryClient),
  })
}

export function useDeleteFlight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => repo.deleteFlight(id),
    onMutate: async (id): Promise<Rollback> => ({
      rollback: await applyOptimistic(queryClient, [
        patch<Array<Flight>>(archiveKeys.flights(), (flights) =>
          flights.filter((f) => f.id !== id)
        ),
      ]),
    }),
    onError: (_e, _v, context) => context?.rollback?.(),
    onSettled: () => invalidateFlights(queryClient),
  })
}
