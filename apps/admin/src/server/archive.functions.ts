import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import {
  ArchiveExport,
  CollectionItem,
  CollectionItemDraft,
  CollectionItemInput,
  FlightInput,
  LibraryItem,
  LogInput,
  MediaType,
  WorkId,
} from "@workspace/schemas"
import { z } from "zod"
import { mediaTypeOf } from "@/lib/repo/log-utils"
import { pgRepository as repo } from "./archive.server"
import { requireOwner } from "./auth.functions"
import { LIBRARY_PAGE_SIZE, LIBRARY_SORTS } from "@/lib/repo/library-page"
import { ensureDetails, ensureSeasonDetails } from "./details.server"

/*
 * RPCs behind `remoteRepository` (src/lib/repo). One per repository method;
 * all of them require the owner's session. Works entering the archive get
 * their provider details stored (details.server.ts); a provider failure
 * there never fails the write.
 */

const Id = z.object({ id: z.uuid() })
const Target = z.object({ type: MediaType, id: WorkId })

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

/**
 * A page of a library, filtered and ordered on the server so a large
 * library never ships whole. Without a `limit` (the server render, before
 * the browser can measure its screen) the size follows the user agent.
 */
export const listLibraryPageFn = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .validator(
    z.object({
      type: MediaType,
      offset: z.number().int().min(0),
      limit: z.number().int().min(1).max(100).optional(),
      sort: z.enum(LIBRARY_SORTS),
      desc: z.boolean(),
      q: z.string().max(200),
    })
  )
  .handler(async ({ data: { type, offset, limit, ...query } }) => {
    const mobile = /Mobi|Android|iPhone|iPad/i.test(
      getRequestHeaders().get("user-agent") ?? ""
    )
    const size = limit ?? LIBRARY_PAGE_SIZE[mobile ? "mobile" : "desktop"]
    return repo.listLibraryPage({ type, offset, limit: size, ...query })
  })

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
  .validator(
    z.object({ input: LogInput, item: ItemInput, id: z.uuid().optional() })
  )
  .handler(async ({ data }) => {
    const log = await repo.addLog(data.input, data.item, data.id)
    await ensureDetails(mediaTypeOf(data.input), data.input.mediaId)
    if (data.input.kind === "season")
      await ensureSeasonDetails(data.input.mediaId, data.input.seasonNumber)
    return log
  })

export const updateLogFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(Id.extend({ input: LogInput }))
  .handler(({ data }) => repo.updateLog(data.id, data.input))

/** Moves a log to another work (logged the wrong one): same log, new work. */
export const moveLogFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(Id.extend({ input: LogInput, item: ItemInput }))
  .handler(async ({ data }) => {
    const log = await repo.moveLog(data.id, data.input, data.item)
    await ensureDetails(mediaTypeOf(data.input), data.input.mediaId)
    if (data.input.kind === "season")
      await ensureSeasonDetails(data.input.mediaId, data.input.seasonNumber)
    return log
  })

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
  .handler(async ({ data }) => {
    await repo.addToBacklog(data)
    await ensureDetails(data.type, data.id)
  })

export const removeFromBacklogFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(Target)
  .handler(({ data }) => repo.removeFromBacklog(data))

export const getIndexFn = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .handler(() => repo.getIndex())

export const getFactsFn = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .handler(() => repo.getFacts())

export const getStatsFn = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .handler(() => repo.getStats())

export const listCollectionFn = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .handler(() => repo.listCollection())

export const addCollectionItemFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(
    z.object({
      snapshot: Snapshot,
      input: CollectionItemInput,
      id: z.uuid().optional(),
    })
  )
  .handler(async ({ data }) => {
    const copy = await repo.addCollectionItem(
      data.snapshot,
      data.input,
      data.id
    )
    await ensureDetails("record", copy.releaseId)
    return copy
  })

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

export const fillFromSteamFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(
    z.object({
      entries: z
        .array(
          z.object({
            gameId: z.number().int().positive(),
            minutes: z.number().int().positive(),
          })
        )
        .max(20_000),
    })
  )
  .handler(({ data }) => repo.fillFromSteam(data.entries))

export const listFlightsFn = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .handler(() => repo.listFlights())

export const addFlightFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .validator(z.object({ input: FlightInput, id: z.uuid().optional() }))
  .handler(({ data }) => repo.addFlight(data.input, data.id))

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
  .validator(ArchiveExport)
  .handler(({ data }) => repo.importAll(data))

export const clearFn = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .handler(() => repo.clear())
