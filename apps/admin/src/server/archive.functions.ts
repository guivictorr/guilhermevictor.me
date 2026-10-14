import { createServerFn } from "@tanstack/react-start"
import {
  ArchiveExport,
  CollectionItem,
  CollectionItemDraft,
  CollectionItemInput,
  FlightInput,
  LibraryItem,
  LogInput,
  MediaType,
} from "@workspace/schemas"
import { z } from "zod"
import { migrateExport } from "@/lib/repo/derive"
import { pgRepository as repo } from "./archive.server"
import { requireOwner } from "./auth.functions"

/*
 * RPCs behind `remoteRepository` (src/lib/repo). One per repository method;
 * all of them require the owner's session.
 */

const Id = z.object({ id: z.uuid() })
const Target = z.object({ type: MediaType, id: z.number().int() })

const ItemInput = LibraryItem.omit({ addedAt: true })

const Snapshot = CollectionItem.pick({
  type: true,
  releaseId: true,
  title: true,
  artist: true,
  year: true,
  format: true,
  label: true,
  catno: true,
  genres: true,
  styles: true,
  cover: true,
})

export const listLibraryFn = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(z.object({ type: MediaType }))
  .handler(({ data }) => repo.listLibrary(data.type))

export const listLogsFn = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(Target)
  .handler(({ data }) => repo.listLogs(data))

export const listRecentFn = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(z.object({ limit: z.number().int().min(1).max(100) }))
  .handler(({ data }) => repo.listRecent(data.limit))

export const addLogFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(z.object({ input: LogInput, item: ItemInput }))
  .handler(({ data }) => repo.addLog(data.input, data.item))

export const updateLogFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(Id.extend({ input: LogInput }))
  .handler(({ data }) => repo.updateLog(data.id, data.input))

export const deleteLogFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(Id)
  .handler(({ data }) => repo.deleteLog(data.id))

export const listBacklogFn = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .handler(() => repo.listBacklog())

export const addToBacklogFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(ItemInput)
  .handler(({ data }) => repo.addToBacklog(data))

export const removeFromBacklogFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(Target)
  .handler(({ data }) => repo.removeFromBacklog(data))

export const getIndexFn = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .handler(() => repo.getIndex())

export const getStatsFn = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .handler(() => repo.getStats())

export const listCollectionFn = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .handler(() => repo.listCollection())

export const addCollectionItemFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(z.object({ snapshot: Snapshot, input: CollectionItemInput }))
  .handler(({ data }) => repo.addCollectionItem(data.snapshot, data.input))

export const updateCollectionItemFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(Id.extend({ input: CollectionItemInput }))
  .handler(({ data }) => repo.updateCollectionItem(data.id, data.input))

export const deleteCollectionItemFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(Id)
  .handler(({ data }) => repo.deleteCollectionItem(data.id))

export const importCollectionFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(z.object({ drafts: z.array(CollectionItemDraft).max(10_000) }))
  .handler(({ data }) => repo.importCollection(data.drafts))

export const listFlightsFn = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .handler(() => repo.listFlights())

export const addFlightFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(FlightInput)
  .handler(({ data }) => repo.addFlight(data))

export const updateFlightFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(Id.extend({ input: FlightInput }))
  .handler(({ data }) => repo.updateFlight(data.id, data.input))

export const deleteFlightFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(Id)
  .handler(({ data }) => repo.deleteFlight(data.id))

export const exportAllFn = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .handler(() => repo.exportAll())

export const importAllFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  // Old exports are upgraded before validation.
  .validator((raw: ArchiveExport) => ArchiveExport.parse(migrateExport(raw)))
  .handler(({ data }) => repo.importAll(data))

export const clearFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .handler(() => repo.clear())
