import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import type {
  ArchiveExport,
  CollectionItemDraft,
  CollectionItemInput,
  FlightInput,
  LogInput,
  MediaType,
} from "@workspace/schemas"
import { repo } from "@/lib/repo"
import type {
  SteamPlaytimeMatch,
  CollectionSnapshot,
  LibraryItemInput,
  LogTarget,
} from "@/lib/repo"

export const mediaKey = (target: LogTarget) => `${target.type}:${target.id}`

/*
 * Archive data comes from server functions (Postgres). Queries aren't
 * prefetched in loaders, so pages render their skeletons first.
 */

export const archiveKeys = {
  all: ["archive"] as const,
  library: (type: MediaType) => [...archiveKeys.all, "library", type] as const,
  logs: (target: LogTarget) =>
    [...archiveKeys.all, "logs", target.type, target.id] as const,
  recent: (limit: number) => [...archiveKeys.all, "recent", limit] as const,
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

/** Any write can change library stats, history and the home feed: refresh all archive data. */
function useInvalidateArchive() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: archiveKeys.all })
}

export function useAddLog() {
  const invalidate = useInvalidateArchive()
  return useMutation({
    mutationFn: ({
      input,
      item,
    }: {
      input: LogInput
      item: LibraryItemInput
    }) => repo.addLog(input, item),
    onSuccess: invalidate,
  })
}

export function useUpdateLog() {
  const invalidate = useInvalidateArchive()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LogInput }) =>
      repo.updateLog(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteLog() {
  const invalidate = useInvalidateArchive()
  return useMutation({
    mutationFn: (id: string) => repo.deleteLog(id),
    onSuccess: invalidate,
  })
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

export function useAddToBacklog() {
  const invalidate = useInvalidateArchive()
  return useMutation({
    mutationFn: (item: LibraryItemInput) => repo.addToBacklog(item),
    onSuccess: invalidate,
  })
}

export function useRemoveFromBacklog() {
  const invalidate = useInvalidateArchive()
  return useMutation({
    mutationFn: (target: LogTarget) => repo.removeFromBacklog(target),
    onSuccess: invalidate,
  })
}

export function useAddCollectionItem() {
  const invalidate = useInvalidateArchive()
  return useMutation({
    mutationFn: ({
      snapshot,
      input,
    }: {
      snapshot: CollectionSnapshot
      input: CollectionItemInput
    }) => repo.addCollectionItem(snapshot, input),
    onSuccess: invalidate,
  })
}

export function useUpdateCollectionItem() {
  const invalidate = useInvalidateArchive()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CollectionItemInput }) =>
      repo.updateCollectionItem(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteCollectionItem() {
  const invalidate = useInvalidateArchive()
  return useMutation({
    mutationFn: (id: string) => repo.deleteCollectionItem(id),
    onSuccess: invalidate,
  })
}

export function useImportCollection() {
  const invalidate = useInvalidateArchive()
  return useMutation({
    mutationFn: (drafts: Array<CollectionItemDraft>) =>
      repo.importCollection(drafts),
    onSuccess: invalidate,
  })
}

export function useFillFromSteam() {
  const invalidate = useInvalidateArchive()
  return useMutation({
    mutationFn: (entries: Array<SteamPlaytimeMatch>) =>
      repo.fillFromSteam(entries),
    onSuccess: invalidate,
  })
}

export function useSaveFlight() {
  const invalidate = useInvalidateArchive()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: FlightInput }) =>
      id ? repo.updateFlight(id, input) : repo.addFlight(input),
    onSuccess: invalidate,
  })
}

export function useDeleteFlight() {
  const invalidate = useInvalidateArchive()
  return useMutation({
    mutationFn: (id: string) => repo.deleteFlight(id),
    onSuccess: invalidate,
  })
}
