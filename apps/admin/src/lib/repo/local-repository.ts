import {
  ArchiveExport,
  BacklogItem,
  CollectionItem,
  GameStatus,
  LibraryItem,
  LogEntry,
} from "@workspace/schemas"
import type { MediaType } from "@workspace/schemas"
import { z } from "zod"
import { compareLogsDesc, logDate, mediaTypeOf } from "./log-utils"
import type {
  ArchiveRepository,
  ArchiveStats,
  LibraryEntry,
  TypeStats,
} from "./types"

/*
 * Mock persistence for the frontend phase. Data lives in this browser only;
 * use Settings → Export to keep a copy until the real API exists.
 */

const STORAGE_KEY = "archive:v1"

const Stored = z.object({
  items: z.array(LibraryItem),
  logs: z.array(LogEntry),
  backlog: z.array(BacklogItem).default([]),
  collection: z.array(CollectionItem).default([]),
})
type Stored = z.infer<typeof Stored>

const empty = (): Stored => ({
  items: [],
  logs: [],
  backlog: [],
  collection: [],
})

/** Upgrades data written by older versions of the app before validating it. */
function migrate(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null || !("logs" in raw)) return raw
  const logs = Array.isArray(raw.logs) ? (raw.logs as Array<unknown>) : []
  return {
    ...raw,
    logs: logs.map((log) =>
      // "dropped" was renamed to "abandoned".
      typeof log === "object" &&
      log !== null &&
      "status" in log &&
      log.status === "dropped"
        ? { ...log, status: "abandoned" }
        : log
    ),
  }
}

function read(): Stored {
  if (typeof window === "undefined") return empty()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty()
    const parsed = Stored.safeParse(migrate(JSON.parse(raw)))
    if (parsed.success) return parsed.data
    // Keep unreadable data around instead of silently wiping it.
    window.localStorage.setItem(`${STORAGE_KEY}:corrupt:${Date.now()}`, raw)
    return empty()
  } catch {
    return empty()
  }
}

function write(data: Stored) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const itemKey = (type: string, id: number) => `${type}:${id}`
const MEDIA_TYPES: Array<MediaType> = ["movie", "show", "game", "record"]
const zeroCounts = (): Record<MediaType, number> => ({
  movie: 0,
  show: 0,
  game: 0,
  record: 0,
})

function emptyTypeStats(): TypeStats {
  return { items: 0, logs: 0, ratings: Array<number>(10).fill(0), backlog: 0 }
}

export const localRepository: ArchiveRepository = {
  async listLibrary(type) {
    const { items, logs } = read()
    const logsByItem = Map.groupBy([...logs].sort(compareLogsDesc), (log) =>
      itemKey(mediaTypeOf(log), log.mediaId)
    )

    return items
      .filter((item) => item.type === type)
      .flatMap((item): Array<LibraryEntry> => {
        const itemLogs = logsByItem.get(itemKey(item.type, item.id)) ?? []
        const latest = itemLogs.at(0)
        if (!latest) return []
        return [
          {
            ...item,
            logCount: itemLogs.length,
            lastLoggedAt: logDate(latest),
            rating: itemLogs.find((l) => l.rating !== undefined)?.rating,
            status: latest.kind === "game" ? latest.status : undefined,
          },
        ]
      })
      .sort((a, b) => b.lastLoggedAt.localeCompare(a.lastLoggedAt))
  },

  async listLogs({ type, id }) {
    return read()
      .logs.filter((log) => mediaTypeOf(log) === type && log.mediaId === id)
      .sort(compareLogsDesc)
  },

  async listRecent(limit) {
    const { items, logs } = read()
    const itemsByKey = new Map(
      items.map((item) => [itemKey(item.type, item.id), item])
    )
    return [...logs]
      .sort(compareLogsDesc)
      .flatMap((log) => {
        const item = itemsByKey.get(itemKey(mediaTypeOf(log), log.mediaId))
        return item ? [{ log, item }] : []
      })
      .slice(0, limit)
  },

  async addLog(input, itemInput) {
    const data = read()
    const now = new Date().toISOString()
    const type = mediaTypeOf(input)
    const log = LogEntry.parse({
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    })

    const existing = data.items.findIndex(
      (i) => i.type === type && i.id === input.mediaId
    )
    // Refresh the snapshot on every log so titles/posters stay current.
    const item = LibraryItem.parse({
      ...itemInput,
      addedAt: data.items[existing]?.addedAt ?? now,
    })
    if (existing >= 0) data.items[existing] = item
    else data.items.push(item)

    data.logs.push(log)
    // Watched/played it: it's no longer "later".
    data.backlog = data.backlog.filter(
      (b) => !(b.type === type && b.id === input.mediaId)
    )
    write(data)
    return log
  },

  async updateLog(id, input) {
    const data = read()
    const index = data.logs.findIndex((log) => log.id === id)
    const current = data.logs[index]
    if (!current) throw new Error("Log not found")
    const updated = LogEntry.parse({
      ...input,
      id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    })
    data.logs[index] = updated
    write(data)
    return updated
  },

  async deleteLog(id) {
    const data = read()
    const log = data.logs.find((l) => l.id === id)
    if (!log) return
    data.logs = data.logs.filter((l) => l.id !== id)
    // Drop the item once its last log is gone; the library only shows logged works.
    const type = mediaTypeOf(log)
    const stillLogged = data.logs.some(
      (l) => mediaTypeOf(l) === type && l.mediaId === log.mediaId
    )
    if (!stillLogged)
      data.items = data.items.filter(
        (i) => !(i.type === type && i.id === log.mediaId)
      )
    write(data)
  },

  async listBacklog() {
    return [...read().backlog].sort((a, b) =>
      b.addedAt.localeCompare(a.addedAt)
    )
  },

  async addToBacklog(itemInput) {
    const data = read()
    if (
      data.backlog.some(
        (b) => b.type === itemInput.type && b.id === itemInput.id
      )
    )
      return
    data.backlog.push(
      BacklogItem.parse({ ...itemInput, addedAt: new Date().toISOString() })
    )
    write(data)
  },

  async removeFromBacklog({ type, id }) {
    const data = read()
    data.backlog = data.backlog.filter((b) => !(b.type === type && b.id === id))
    write(data)
  },

  async getIndex() {
    const { logs, backlog, collection } = read()
    return {
      logged: [...new Set(logs.map((l) => itemKey(mediaTypeOf(l), l.mediaId)))],
      backlog: backlog.map((b) => itemKey(b.type, b.id)),
      owned: [
        ...new Set(collection.map((c) => itemKey("record", c.releaseId))),
      ],
    }
  },

  async getStats() {
    const { items, logs, backlog, collection } = read()
    const byType: Record<MediaType, TypeStats> = {
      movie: emptyTypeStats(),
      show: emptyTypeStats(),
      game: emptyTypeStats(),
      record: emptyTypeStats(),
    }
    const gameStatuses = Object.fromEntries(
      GameStatus.options.map((s) => [s, 0])
    ) as ArchiveStats["gameStatuses"]
    const years = new Map<number, Record<MediaType, number>>()
    let hoursPlayed = 0

    // Records count what you own; other kinds count what you've logged.
    for (const item of items)
      if (item.type !== "record") byType[item.type].items++
    byType.record.items = new Set(collection.map((c) => c.releaseId)).size
    for (const item of backlog) byType[item.type].backlog++

    for (const log of logs) {
      const type = mediaTypeOf(log)
      byType[type].logs++
      if (log.rating !== undefined) {
        const ratings = byType[type].ratings
        ratings[log.rating - 1] = (ratings[log.rating - 1] ?? 0) + 1
      }
      if (log.kind === "game") hoursPlayed += log.hoursPlayed ?? 0

      const year = Number(logDate(log).slice(0, 4))
      const counts = years.get(year) ?? zeroCounts()
      counts[type]++
      years.set(year, counts)
    }

    // Each game counts once, by the status of its most recent log.
    const latestGameLogs = new Map<number, LogEntry>()
    for (const log of [...logs].sort(compareLogsDesc))
      if (log.kind === "game" && !latestGameLogs.has(log.mediaId))
        latestGameLogs.set(log.mediaId, log)
    for (const log of latestGameLogs.values())
      if (log.kind === "game") gameStatuses[log.status]++

    for (const type of MEDIA_TYPES) {
      const ratings = byType[type].ratings
      const count = ratings.reduce((sum, n) => sum + n, 0)
      if (count > 0)
        byType[type].averageRating =
          ratings.reduce((sum, n, i) => sum + n * (i + 1), 0) / count
    }

    return {
      byType,
      copies: collection.length,
      gameStatuses,
      hoursPlayed,
      logsByYear: [...years.entries()]
        .sort(([a], [b]) => a - b)
        .map(([year, counts]) => ({ year, ...counts })),
    }
  },

  async listCollection() {
    return [...read().collection].sort((a, b) =>
      b.addedAt.localeCompare(a.addedAt)
    )
  },

  async addCollectionItem(snapshot, input) {
    const data = read()
    const now = new Date().toISOString()
    const item = CollectionItem.parse({
      ...snapshot,
      ...input,
      id: crypto.randomUUID(),
      addedAt: now,
      updatedAt: now,
    })
    data.collection.push(item)
    // Owning it now: it's no longer on the want list.
    data.backlog = data.backlog.filter(
      (b) => !(b.type === "record" && b.id === item.releaseId)
    )
    write(data)
    return item
  },

  async updateCollectionItem(id, input) {
    const data = read()
    const index = data.collection.findIndex((c) => c.id === id)
    const current = data.collection[index]
    if (!current) throw new Error("Copy not found")
    // Replace every editable field so cleared inputs actually clear.
    const updated = CollectionItem.parse({
      ...current,
      mediaCondition: undefined,
      sleeveCondition: undefined,
      variant: undefined,
      acquiredAt: undefined,
      price: undefined,
      store: undefined,
      notes: undefined,
      ...input,
      updatedAt: new Date().toISOString(),
    })
    data.collection[index] = updated
    write(data)
    return updated
  },

  async deleteCollectionItem(id) {
    const data = read()
    data.collection = data.collection.filter((c) => c.id !== id)
    write(data)
  },

  async importCollection(drafts) {
    const data = read()
    const known = new Set(
      data.collection.flatMap((c) =>
        c.discogsInstanceId === undefined ? [] : [c.discogsInstanceId]
      )
    )
    const now = new Date().toISOString()
    // Only new copies are added: local edits to imported ones are kept.
    const fresh = drafts
      .filter(
        (d) =>
          d.discogsInstanceId === undefined || !known.has(d.discogsInstanceId)
      )
      .map((d) =>
        CollectionItem.parse({ ...d, id: crypto.randomUUID(), updatedAt: now })
      )
    data.collection.push(...fresh)
    const owned = new Set(data.collection.map((c) => c.releaseId))
    data.backlog = data.backlog.filter(
      (b) => !(b.type === "record" && owned.has(b.id))
    )
    write(data)
    return { added: fresh.length, skipped: drafts.length - fresh.length }
  },

  async exportAll() {
    const { items, logs, backlog, collection } = read()
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      items,
      logs,
      backlog,
      collection,
    }
  },

  async importAll(input) {
    const data = ArchiveExport.parse(migrate(input))
    write({
      items: data.items,
      logs: data.logs,
      backlog: data.backlog,
      collection: data.collection,
    })
  },

  async clear() {
    write(empty())
  },
}
