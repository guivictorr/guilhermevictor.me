import {
  ArchiveExport,
  BacklogItem,
  CollectionItem,
  Flight,
  LibraryItem,
  LogEntry,
} from "@workspace/schemas"
import type {
  CollectionItemInput,
  FlightInput,
  LogInput,
  MediaType,
} from "@workspace/schemas"
import { and, desc, eq, inArray, sql } from "drizzle-orm"
import type { SQL } from "drizzle-orm"
import {
  deriveIndex,
  deriveLibrary,
  deriveStats,
  migrateExport,
} from "@/lib/repo/derive"
import { mediaTypeOf } from "@/lib/repo/log-utils"
import type { ArchiveRepository, LibraryItemInput } from "@/lib/repo/types"
import { getDb } from "./db/client.server"
import type { Db } from "./db/client.server"
import {
  backlogItems,
  collectionItems,
  flights,
  libraryItems,
  logs,
} from "./db/schema"

/*
 * The archive in Postgres. Rows are mapped back to the `@workspace/schemas`
 * types (and validated) on the way out, so the API, the export file and the
 * UI all see exactly the shapes the frontend was built against.
 */

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0]

// --- row → domain -----------------------------------------------------------

/** Drops SQL nulls (our schemas use optional fields, not null). */
function compact(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== null))
}

const iso = (date: Date) => date.toISOString()

function toItem(row: typeof libraryItems.$inferSelect): LibraryItem {
  return LibraryItem.parse({ ...compact(row), addedAt: iso(row.addedAt) })
}

function toLog(row: typeof logs.$inferSelect): LogEntry {
  const { mediaType: _type, logDate: _date, ...fields } = row
  return LogEntry.parse({
    ...compact(fields),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  })
}

function toCopy(row: typeof collectionItems.$inferSelect): CollectionItem {
  const { priceAmount, priceCurrency, ...fields } = row
  return CollectionItem.parse({
    ...compact(fields),
    type: "record",
    price:
      priceAmount !== null && priceCurrency !== null
        ? { amount: priceAmount, currency: priceCurrency }
        : undefined,
    addedAt: iso(row.addedAt),
    updatedAt: iso(row.updatedAt),
  })
}

/** "2024-06-13 08:07:00" (Postgres) → "2024-06-13T08:07" (boarding-pass local time). */
const toLocal = (value: string) => value.replace(" ", "T").replace(/:00$/, "")

function toFlight(row: typeof flights.$inferSelect): Flight {
  return Flight.parse({
    ...compact(row),
    departure: toLocal(row.departure),
    arrival: row.arrival === null ? undefined : toLocal(row.arrival),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  })
}

// --- domain → row -----------------------------------------------------------

/** Every kind-specific field, so writes can null out the ones a kind lacks. */
type AnyLogFields = Partial<{
  seasonNumber: number
  watchedAt: string
  playedAt: string
  startedAt: string
  finishedAt: string
  rewatch: boolean
  reread: boolean
  status: string
  platform: string
  hoursPlayed: number
  format: string
}>

function logValues(input: LogInput) {
  const f: AnyLogFields = input
  return {
    kind: input.kind,
    mediaType: mediaTypeOf(input),
    mediaId: input.mediaId,
    seasonNumber: f.seasonNumber ?? null,
    rating: input.rating ?? null,
    notes: input.notes ?? null,
    watchedAt: f.watchedAt ?? null,
    playedAt: f.playedAt ?? null,
    startedAt: f.startedAt ?? null,
    finishedAt: f.finishedAt ?? null,
    rewatch: f.rewatch ?? null,
    reread: f.reread ?? null,
    status: f.status ?? null,
    platform: f.platform ?? null,
    hoursPlayed: f.hoursPlayed ?? null,
    format: f.format ?? null,
  }
}

function itemValues(item: LibraryItemInput) {
  return {
    type: item.type,
    id: item.id,
    title: item.title,
    subtitle: item.subtitle ?? null,
    year: item.year ?? null,
    poster: item.poster ?? null,
    genres: item.genres,
  }
}

/** Editable copy fields; all of them, so cleared inputs actually clear. */
function copyInputValues(input: CollectionItemInput) {
  return {
    mediaCondition: input.mediaCondition ?? null,
    sleeveCondition: input.sleeveCondition ?? null,
    variant: input.variant ?? null,
    acquiredAt: input.acquiredAt ?? null,
    priceAmount: input.price?.amount ?? null,
    priceCurrency: input.price?.currency ?? null,
    store: input.store ?? null,
    notes: input.notes ?? null,
  }
}

function copyValues(item: Omit<CollectionItem, "updatedAt" | "type">) {
  return {
    ...copyInputValues(item),
    id: item.id,
    releaseId: item.releaseId,
    title: item.title,
    artist: item.artist,
    year: item.year ?? null,
    format: item.format ?? null,
    label: item.label ?? null,
    catno: item.catno ?? null,
    genres: item.genres,
    styles: item.styles,
    cover: item.cover ?? null,
    rating: item.rating ?? null,
    folder: item.folder ?? null,
    discogsInstanceId: item.discogsInstanceId ?? null,
    addedAt: new Date(item.addedAt),
  }
}

function flightValues(input: FlightInput) {
  return {
    from: input.from,
    to: input.to,
    departure: input.departure,
    arrival: input.arrival ?? null,
    flightNumber: input.flightNumber ?? null,
    airline: input.airline ?? null,
    aircraft: input.aircraft ?? null,
    registration: input.registration ?? null,
    seat: input.seat ?? null,
    cabin: input.cabin ?? null,
    reservation: input.reservation ?? null,
    notes: input.notes ?? null,
  }
}

// --- queries ----------------------------------------------------------------

/** Same order as `compareLogsDesc`: newest log date first, undated last. */
const logOrder = [
  sql`${logs.logDate} desc nulls last`,
  desc(logs.createdAt),
] satisfies Array<SQL>

const isWork = (type: MediaType, id: number) =>
  and(eq(logs.mediaType, type), eq(logs.mediaId, id))

const inBacklog = (type: MediaType, id: number) =>
  and(eq(backlogItems.type, type), eq(backlogItems.id, id))

async function insertChunks<T>(
  rows: Array<T>,
  insert: (chunk: Array<T>) => Promise<unknown>
) {
  // Stays well under Postgres' 65k bind-parameter limit.
  for (let i = 0; i < rows.length; i += 500)
    await insert(rows.slice(i, i + 500))
}

async function wipeArchive(tx: Tx) {
  // Logs go with their items (FK cascade). Auth tables are never touched.
  await tx.delete(libraryItems)
  await tx.delete(backlogItems)
  await tx.delete(collectionItems)
  await tx.delete(flights)
}

export const pgRepository: ArchiveRepository = {
  async listLibrary(type) {
    const db = getDb()
    const [items, typeLogs] = await Promise.all([
      db.select().from(libraryItems).where(eq(libraryItems.type, type)),
      db.select().from(logs).where(eq(logs.mediaType, type)),
    ])
    return deriveLibrary(items.map(toItem), typeLogs.map(toLog))
  },

  async listLogs({ type, id }) {
    const rows = await getDb()
      .select()
      .from(logs)
      .where(isWork(type, id))
      .orderBy(...logOrder)
    return rows.map(toLog)
  },

  async listRecent(limit) {
    const rows = await getDb()
      .select()
      .from(logs)
      .innerJoin(
        libraryItems,
        and(
          eq(libraryItems.type, logs.mediaType),
          eq(libraryItems.id, logs.mediaId)
        )
      )
      .orderBy(...logOrder)
      .limit(limit)
    return rows.map((row) => ({
      log: toLog(row.logs),
      item: toItem(row.library_items),
    }))
  },

  async addLog(input, item) {
    const type = mediaTypeOf(input)
    return getDb().transaction(async (tx) => {
      // Refresh the snapshot on every log so titles/posters stay current.
      const { type: _type, id: _id, ...snapshot } = itemValues(item)
      await tx
        .insert(libraryItems)
        .values(itemValues(item))
        .onConflictDoUpdate({
          target: [libraryItems.type, libraryItems.id],
          set: snapshot,
        })
      const [row] = await tx.insert(logs).values(logValues(input)).returning()
      // Watched/played it: it's no longer "later".
      await tx.delete(backlogItems).where(inBacklog(type, input.mediaId))
      if (!row) throw new Error("Log was not saved")
      return toLog(row)
    })
  },

  async updateLog(id, input) {
    const [row] = await getDb()
      .update(logs)
      .set({ ...logValues(input), updatedAt: new Date() })
      .where(eq(logs.id, id))
      .returning()
    if (!row) throw new Error("Log not found")
    return toLog(row)
  },

  async deleteLog(id) {
    await getDb().transaction(async (tx) => {
      const [log] = await tx.delete(logs).where(eq(logs.id, id)).returning()
      if (!log) return
      // Drop the item once its last log is gone; the library only shows logged works.
      const [remaining] = await tx
        .select({ id: logs.id })
        .from(logs)
        .where(isWork(log.mediaType, log.mediaId))
        .limit(1)
      if (!remaining)
        await tx
          .delete(libraryItems)
          .where(
            and(
              eq(libraryItems.type, log.mediaType),
              eq(libraryItems.id, log.mediaId)
            )
          )
    })
  },

  async listBacklog() {
    const rows = await getDb()
      .select()
      .from(backlogItems)
      .orderBy(desc(backlogItems.addedAt))
    return rows.map((row) => BacklogItem.parse(toItem(row)))
  },

  async addToBacklog(item) {
    await getDb()
      .insert(backlogItems)
      .values(itemValues(item))
      .onConflictDoNothing()
  },

  async removeFromBacklog({ type, id }) {
    await getDb().delete(backlogItems).where(inBacklog(type, id))
  },

  async getIndex() {
    const db = getDb()
    const [logged, backlog, owned] = await Promise.all([
      db
        .selectDistinct({ kind: logs.mediaType, mediaId: logs.mediaId })
        .from(logs),
      db
        .select({ type: backlogItems.type, id: backlogItems.id })
        .from(backlogItems),
      db
        .selectDistinct({ releaseId: collectionItems.releaseId })
        .from(collectionItems),
    ])
    return deriveIndex({ logs: logged, backlog, collection: owned })
  },

  async getStats() {
    const db = getDb()
    const [items, allLogs, backlog, collection] = await Promise.all([
      db.select({ type: libraryItems.type }).from(libraryItems),
      db.select().from(logs),
      db.select({ type: backlogItems.type }).from(backlogItems),
      db.select({ releaseId: collectionItems.releaseId }).from(collectionItems),
    ])
    return deriveStats({
      items,
      logs: allLogs.map(toLog),
      backlog,
      collection,
    })
  },

  async listCollection() {
    const rows = await getDb()
      .select()
      .from(collectionItems)
      .orderBy(desc(collectionItems.addedAt))
    return rows.map(toCopy)
  },

  async addCollectionItem(snapshot, input) {
    return getDb().transaction(async (tx) => {
      const [row] = await tx
        .insert(collectionItems)
        .values({
          ...copyValues({
            ...snapshot,
            ...input,
            id: crypto.randomUUID(),
            addedAt: new Date().toISOString(),
          }),
        })
        .returning()
      // Owning it now: it's no longer on the want list.
      await tx
        .delete(backlogItems)
        .where(inBacklog("record", snapshot.releaseId))
      if (!row) throw new Error("Copy was not saved")
      return toCopy(row)
    })
  },

  async updateCollectionItem(id, input) {
    const [row] = await getDb()
      .update(collectionItems)
      .set({ ...copyInputValues(input), updatedAt: new Date() })
      .where(eq(collectionItems.id, id))
      .returning()
    if (!row) throw new Error("Copy not found")
    return toCopy(row)
  },

  async deleteCollectionItem(id) {
    await getDb().delete(collectionItems).where(eq(collectionItems.id, id))
  },

  async importCollection(drafts) {
    return getDb().transaction(async (tx) => {
      // Idempotent: the unique Discogs instance id skips copies seen before.
      const added = await tx
        .insert(collectionItems)
        .values(
          drafts.map((d) => copyValues({ ...d, id: crypto.randomUUID() }))
        )
        .onConflictDoNothing({ target: collectionItems.discogsInstanceId })
        .returning({ id: collectionItems.id })
      const releaseIds = [...new Set(drafts.map((d) => d.releaseId))]
      if (releaseIds.length > 0)
        await tx
          .delete(backlogItems)
          .where(
            and(
              eq(backlogItems.type, "record"),
              inArray(backlogItems.id, releaseIds)
            )
          )
      return { added: added.length, skipped: drafts.length - added.length }
    })
  },

  async listFlights() {
    const rows = await getDb()
      .select()
      .from(flights)
      .orderBy(desc(flights.departure))
    return rows.map(toFlight)
  },

  async addFlight(input) {
    const [row] = await getDb()
      .insert(flights)
      .values(flightValues(input))
      .returning()
    if (!row) throw new Error("Flight was not saved")
    return toFlight(row)
  },

  async updateFlight(id, input) {
    const [row] = await getDb()
      .update(flights)
      .set({ ...flightValues(input), updatedAt: new Date() })
      .where(eq(flights.id, id))
      .returning()
    if (!row) throw new Error("Flight not found")
    return toFlight(row)
  },

  async deleteFlight(id) {
    await getDb().delete(flights).where(eq(flights.id, id))
  },

  async exportAll() {
    const db = getDb()
    const [items, allLogs, backlog, collection, allFlights] = await Promise.all(
      [
        db.select().from(libraryItems),
        db
          .select()
          .from(logs)
          .orderBy(...logOrder),
        db.select().from(backlogItems),
        db.select().from(collectionItems),
        db.select().from(flights).orderBy(desc(flights.departure)),
      ]
    )
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      items: items.map(toItem),
      logs: allLogs.map(toLog),
      backlog: backlog.map(toItem),
      collection: collection.map(toCopy),
      flights: allFlights.map(toFlight),
    }
  },

  async importAll(input) {
    const data = ArchiveExport.parse(migrateExport(input))
    await getDb().transaction(async (tx) => {
      await wipeArchive(tx)
      await insertChunks(data.items, (chunk) =>
        tx.insert(libraryItems).values(
          chunk.map((item) => ({
            ...itemValues(item),
            addedAt: new Date(item.addedAt),
          }))
        )
      )
      await insertChunks(data.logs, (chunk) =>
        tx.insert(logs).values(
          chunk.map((log) => ({
            ...logValues(log),
            id: log.id,
            createdAt: new Date(log.createdAt),
            updatedAt: new Date(log.updatedAt),
          }))
        )
      )
      await insertChunks(data.backlog, (chunk) =>
        tx.insert(backlogItems).values(
          chunk.map((item) => ({
            ...itemValues(item),
            addedAt: new Date(item.addedAt),
          }))
        )
      )
      await insertChunks(data.collection, (chunk) =>
        tx.insert(collectionItems).values(
          chunk.map((copy) => ({
            ...copyValues(copy),
            updatedAt: new Date(copy.updatedAt),
          }))
        )
      )
      await insertChunks(data.flights, (chunk) =>
        tx.insert(flights).values(
          chunk.map((flight) => ({
            ...flightValues(flight),
            id: flight.id,
            createdAt: new Date(flight.createdAt),
            updatedAt: new Date(flight.updatedAt),
          }))
        )
      )
    })
  },

  async clear() {
    await getDb().transaction(wipeArchive)
  },
}
