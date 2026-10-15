import {
  ArchiveExport,
  BookRow,
  CollectionItem,
  Flight,
  GameRow,
  LibraryItem,
  LogEntry,
  MovieRow,
  RecordRow,
  ShowRow,
} from "@workspace/schemas"
import type {
  BacklogItem,
  CollectionItemDraft,
  CollectionItemInput,
  FlightInput,
  LogInput,
  MediaType,
} from "@workspace/schemas"
import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm"
import {
  deriveIndex,
  deriveLibrary,
  deriveRecent,
  deriveStats,
} from "@/lib/repo/derive"
import { compareLogsDesc, mediaTypeOf } from "@/lib/repo/log-utils"
import type {
  ArchiveRepository,
  CollectionSnapshot,
  LibraryItemInput,
} from "@/lib/repo/types"
import { getDb } from "./db/client.server"
import { computeFacts } from "./facts.server"
import type { Db } from "./db/client.server"
import {
  bookLogs,
  books,
  flights,
  gameLogs,
  games,
  movieLogs,
  movies,
  recordLogs,
  records,
  showLogs,
  shows,
} from "./db/schema"
import {
  bookColumns,
  gameColumns,
  movieColumns,
  recordColumns,
  showColumns,
} from "./details.server"

/*
 * The archive in Postgres: one table per kind of work (movies, shows,
 * games, books, records), one log table per kind, and flights. Rows are
 * mapped back to the `@workspace/schemas` types the UI was built against,
 * and validated on the way out.
 */

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0]
type Conn = Db | Tx

// --- small helpers ------------------------------------------------------------

/** Drops SQL nulls (our schemas use optional fields, not null). */
function compact<T extends Record<string, unknown>>(row: T) {
  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== null))
}

const iso = (date: Date) => date.toISOString()
const isoOrUndefined = (date: Date | null) => (date ? iso(date) : undefined)
const dateOrNull = (value?: string) => (value ? new Date(value) : null)

/** "2024-06-13 08:07:00" (Postgres) → "2024-06-13T08:07" (boarding-pass local time). */
const toLocal = (value: string) => value.replace(" ", "T").replace(/:00$/, "")

const NUMERIC_KINDS = ["movie", "show", "game", "book"] as const
type NumericKind = (typeof NUMERIC_KINDS)[number]

const now = () => new Date()

// --- works: rows → library/backlog items ------------------------------------

type WorkRow = {
  id: number | string
  title: string
  year: number | null
  genres: Array<string>
  poster: LibraryItem["poster"] | null
  addedAt: Date
  backlogAddedAt: Date | null
}

function itemOf(type: MediaType, row: WorkRow, subtitle?: string): LibraryItem {
  return LibraryItem.parse({
    type,
    id: row.id,
    title: row.title,
    subtitle: subtitle || undefined,
    year: row.year ?? undefined,
    poster: row.poster ?? undefined,
    genres: row.genres,
    addedAt: iso(row.addedAt),
  })
}

type RecordDbRow = typeof records.$inferSelect

/** A release as a library/backlog item (records list one per release). */
function recordItem(row: RecordDbRow, addedAt = row.addedAt): LibraryItem {
  return LibraryItem.parse({
    type: "record",
    id: row.releaseId,
    title: row.title,
    subtitle: row.artist || undefined,
    year: row.year ?? undefined,
    poster: row.cover ?? undefined,
    genres: row.genres,
    addedAt: iso(addedAt),
  })
}

async function workItems(
  db: Conn,
  type: MediaType
): Promise<Array<LibraryItem>> {
  switch (type) {
    case "movie":
      return (await db.select().from(movies)).map((r) => itemOf(type, r))
    case "show":
      return (await db.select().from(shows)).map((r) => itemOf(type, r))
    case "game":
      return (await db.select().from(games)).map((r) => itemOf(type, r))
    case "book":
      return (await db.select().from(books)).map((r) =>
        itemOf(type, r, r.authors.join(", "))
      )
    case "record": {
      const rows = await db.select().from(records)
      const byRelease = new Map<number, LibraryItem>()
      for (const row of rows)
        if (!byRelease.has(row.releaseId))
          byRelease.set(row.releaseId, recordItem(row))
      return [...byRelease.values()]
    }
  }
}

const allWorkItems = async (db: Conn) =>
  (
    await Promise.all(
      (["movie", "show", "game", "book", "record"] as const).map((t) =>
        workItems(db, t)
      )
    )
  ).flat()

/** Book ids are Google Books volume ids (strings); the rest are numbers. */
const numericId = (id: string | number) => Number(id)
const bookId = (id: string | number) => String(id)

/** Insert values for a new work row from the snapshot the UI sends. */
function snapshotValues(item: LibraryItemInput) {
  return {
    title: item.title,
    year: item.year ?? null,
    genres: item.genres,
    poster: item.poster ?? null,
  }
}

// --- logs: rows ↔ LogEntry ----------------------------------------------------

const logCommon = (row: {
  id: string
  rating: number | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}) => ({
  id: row.id,
  rating: row.rating,
  notes: row.notes,
  createdAt: iso(row.createdAt),
  updatedAt: iso(row.updatedAt),
})

const movieLogEntry = (row: typeof movieLogs.$inferSelect): LogEntry =>
  LogEntry.parse(
    compact({
      kind: "movie",
      mediaId: row.movieId,
      watchedAt: row.watchedAt,
      rewatch: row.rewatch,
      ...logCommon(row),
    })
  )

const showLogEntry = (row: typeof showLogs.$inferSelect): LogEntry =>
  LogEntry.parse(
    compact({
      kind: row.seasonNumber === null ? "show" : "season",
      mediaId: row.showId,
      seasonNumber: row.seasonNumber,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      rewatch: row.rewatch,
      ...logCommon(row),
    })
  )

const gameLogEntry = (row: typeof gameLogs.$inferSelect): LogEntry =>
  LogEntry.parse(
    compact({
      kind: "game",
      mediaId: row.gameId,
      status: row.status,
      platform: row.platform,
      hoursPlayed: row.hoursPlayed,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      ...logCommon(row),
    })
  )

const bookLogEntry = (row: typeof bookLogs.$inferSelect): LogEntry =>
  LogEntry.parse(
    compact({
      kind: "book",
      mediaId: row.bookId,
      status: row.status,
      format: row.format,
      reread: row.reread,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      ...logCommon(row),
    })
  )

const recordLogEntry = (
  row: typeof recordLogs.$inferSelect,
  releaseId: number
): LogEntry =>
  LogEntry.parse(
    compact({
      kind: "record",
      mediaId: releaseId,
      copyId: row.recordId,
      playedAt: row.playedAt,
      ...logCommon(row),
    })
  )

/** Logs of one kind, optionally of one work. */
async function selectLogs(
  db: Conn,
  type: MediaType,
  id?: string | number
): Promise<Array<LogEntry>> {
  switch (type) {
    case "movie":
      return (
        await db
          .select()
          .from(movieLogs)
          .where(
            id === undefined ? undefined : eq(movieLogs.movieId, numericId(id))
          )
      ).map(movieLogEntry)
    case "show":
      return (
        await db
          .select()
          .from(showLogs)
          .where(
            id === undefined ? undefined : eq(showLogs.showId, numericId(id))
          )
      ).map(showLogEntry)
    case "game":
      return (
        await db
          .select()
          .from(gameLogs)
          .where(
            id === undefined ? undefined : eq(gameLogs.gameId, numericId(id))
          )
      ).map(gameLogEntry)
    case "book":
      return (
        await db
          .select()
          .from(bookLogs)
          .where(id === undefined ? undefined : eq(bookLogs.bookId, bookId(id)))
      ).map(bookLogEntry)
    case "record":
      return (
        await db
          .select({ log: recordLogs, releaseId: records.releaseId })
          .from(recordLogs)
          .innerJoin(records, eq(records.id, recordLogs.recordId))
          .where(
            id === undefined ? undefined : eq(records.releaseId, numericId(id))
          )
      ).map((r) => recordLogEntry(r.log, r.releaseId))
  }
}

const allLogs = async (db: Conn) =>
  (
    await Promise.all(
      (["movie", "show", "game", "book", "record"] as const).map((t) =>
        selectLogs(db, t)
      )
    )
  ).flat()

const logFields = (input: { rating?: number; notes?: string }) => ({
  rating: input.rating ?? null,
  notes: input.notes ?? null,
})

/** Plays only go on copies you own. */
async function assertOwnedCopy(db: Conn, copyId: string, releaseId: number) {
  const [copy] = await db
    .select({ id: records.id })
    .from(records)
    .where(
      and(
        eq(records.id, copyId),
        eq(records.releaseId, releaseId),
        isNull(records.backlogAddedAt)
      )
    )
  if (!copy) throw new Error("Plays can only be logged on a copy you own")
}

/** Inserts (no `id`) or updates (`id`) a log in its kind's table. */
async function writeLog(
  db: Conn,
  input: LogInput,
  id?: string
): Promise<LogEntry | undefined> {
  const updatedAt = now()
  switch (input.kind) {
    case "movie": {
      const values = {
        movieId: input.mediaId,
        watchedAt: input.watchedAt ?? null,
        rewatch: input.rewatch,
        ...logFields(input),
      }
      const [row] = id
        ? await db
            .update(movieLogs)
            .set({ ...values, updatedAt })
            .where(eq(movieLogs.id, id))
            .returning()
        : await db.insert(movieLogs).values(values).returning()
      return row && movieLogEntry(row)
    }
    case "show":
    case "season": {
      const values = {
        showId: input.mediaId,
        seasonNumber: input.kind === "season" ? input.seasonNumber : null,
        startedAt: input.startedAt ?? null,
        finishedAt: input.finishedAt ?? null,
        rewatch: input.rewatch,
        ...logFields(input),
      }
      const [row] = id
        ? await db
            .update(showLogs)
            .set({ ...values, updatedAt })
            .where(eq(showLogs.id, id))
            .returning()
        : await db.insert(showLogs).values(values).returning()
      return row && showLogEntry(row)
    }
    case "game": {
      const values = {
        gameId: input.mediaId,
        status: input.status,
        platform: input.platform ?? null,
        hoursPlayed: input.hoursPlayed ?? null,
        startedAt: input.startedAt ?? null,
        finishedAt: input.finishedAt ?? null,
        ...logFields(input),
      }
      const [row] = id
        ? await db
            .update(gameLogs)
            .set({ ...values, updatedAt })
            .where(eq(gameLogs.id, id))
            .returning()
        : await db.insert(gameLogs).values(values).returning()
      return row && gameLogEntry(row)
    }
    case "book": {
      const values = {
        bookId: input.mediaId,
        status: input.status,
        format: input.format ?? null,
        reread: input.reread,
        startedAt: input.startedAt ?? null,
        finishedAt: input.finishedAt ?? null,
        ...logFields(input),
      }
      const [row] = id
        ? await db
            .update(bookLogs)
            .set({ ...values, updatedAt })
            .where(eq(bookLogs.id, id))
            .returning()
        : await db.insert(bookLogs).values(values).returning()
      return row && bookLogEntry(row)
    }
    case "record": {
      await assertOwnedCopy(db, input.copyId, input.mediaId)
      const values = {
        recordId: input.copyId,
        playedAt: input.playedAt ?? null,
        ...logFields(input),
      }
      const [row] = id
        ? await db
            .update(recordLogs)
            .set({ ...values, updatedAt })
            .where(eq(recordLogs.id, id))
            .returning()
        : await db.insert(recordLogs).values(values).returning()
      return row && recordLogEntry(row, input.mediaId)
    }
  }
}

/** Creates the work row if needed and takes it out of the backlog. */
async function upsertLoggedWork(
  db: Conn,
  type: NumericKind,
  item: LibraryItemInput
) {
  const values = snapshotValues(item)
  const id = numericId(item.id)
  const set = { backlogAddedAt: null }
  switch (type) {
    case "movie":
      await db
        .insert(movies)
        .values({ ...values, id })
        .onConflictDoUpdate({ target: movies.id, set })
      return
    case "show":
      await db
        .insert(shows)
        .values({ ...values, id })
        .onConflictDoUpdate({ target: shows.id, set })
      return
    case "game":
      await db
        .insert(games)
        .values({ ...values, id })
        .onConflictDoUpdate({ target: games.id, set })
      return
    case "book":
      await db
        .insert(books)
        .values({
          ...values,
          id: bookId(item.id),
          authors: item.subtitle ? item.subtitle.split(", ") : [],
        })
        .onConflictDoUpdate({ target: books.id, set })
  }
}

/** Deletes a work row once it has no logs and isn't in the backlog. */
async function pruneWork(db: Conn, type: NumericKind, id: string | number) {
  switch (type) {
    case "movie":
      await db.execute(sql`delete from movies w where w.id = ${id}
        and w.backlog_added_at is null
        and not exists (select 1 from movie_logs l where l.movie_id = w.id)`)
      return
    case "show":
      await db.execute(sql`delete from shows w where w.id = ${id}
        and w.backlog_added_at is null
        and not exists (select 1 from show_logs l where l.show_id = w.id)`)
      return
    case "game":
      await db.execute(sql`delete from games w where w.id = ${id}
        and w.backlog_added_at is null
        and not exists (select 1 from game_logs l where l.game_id = w.id)`)
      return
    case "book":
      await db.execute(sql`delete from books w where w.id = ${id}
        and w.backlog_added_at is null
        and not exists (select 1 from book_logs l where l.book_id = w.id)`)
  }
}

// --- records: rows ↔ collection items ----------------------------------------

function toCopy(row: RecordDbRow): CollectionItem {
  return CollectionItem.parse({
    ...compact({
      id: row.id,
      releaseId: row.releaseId,
      title: row.title,
      artist: row.artist,
      year: row.year,
      format: row.format,
      label: row.label,
      catno: row.catno,
      cover: row.cover,
      rating: row.rating,
      folder: row.folder,
      discogsInstanceId: row.discogsInstanceId,
      mediaCondition: row.mediaCondition,
      sleeveCondition: row.sleeveCondition,
      variant: row.variant,
      acquiredAt: row.acquiredAt,
      store: row.store,
      notes: row.notes,
    }),
    type: "record",
    genres: row.genres,
    styles: row.styles,
    price:
      row.priceAmount !== null && row.priceCurrency !== null
        ? { amount: row.priceAmount, currency: row.priceCurrency }
        : undefined,
    addedAt: iso(row.addedAt),
    updatedAt: iso(row.updatedAt),
  })
}

/** Copy fields; all of them, so cleared inputs actually clear. */
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

function releaseSnapshotValues(snapshot: Omit<CollectionSnapshot, "type">) {
  return {
    releaseId: snapshot.releaseId,
    title: snapshot.title,
    artist: snapshot.artist,
    year: snapshot.year ?? null,
    format: snapshot.format ?? null,
    label: snapshot.label ?? null,
    catno: snapshot.catno ?? null,
    genres: snapshot.genres,
    styles: snapshot.styles,
    cover: snapshot.cover ?? null,
  }
}

function draftValues(draft: Omit<CollectionItemDraft, "type">) {
  return {
    ...releaseSnapshotValues(draft),
    ...copyInputValues(draft),
    rating: draft.rating ?? null,
    folder: draft.folder ?? null,
    discogsInstanceId: draft.discogsInstanceId ?? null,
    addedAt: new Date(draft.addedAt),
  }
}

const ownedCopies = isNull(records.backlogAddedAt)
const wantedRelease = (releaseId: number) =>
  and(eq(records.releaseId, releaseId), isNotNull(records.backlogAddedAt))

// --- flights ------------------------------------------------------------------

function toFlight(row: typeof flights.$inferSelect): Flight {
  return Flight.parse({
    ...compact(row),
    departure: toLocal(row.departure),
    arrival: row.arrival === null ? undefined : toLocal(row.arrival),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  })
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

// --- export / import ----------------------------------------------------------

const workExport = (row: WorkRow & { fetchedAt: Date | null }) => ({
  id: row.id,
  title: row.title,
  year: row.year ?? undefined,
  poster: row.poster ?? undefined,
  genres: row.genres,
  backlogAddedAt: isoOrUndefined(row.backlogAddedAt),
  addedAt: iso(row.addedAt),
  fetchedAt: isoOrUndefined(row.fetchedAt),
})

const workImport = <TId extends number | string>(row: {
  id: TId
  title: string
  year?: number
  poster?: LibraryItem["poster"]
  genres: Array<string>
  backlogAddedAt?: string
  addedAt: string
  fetchedAt?: string
}) => ({
  id: row.id,
  title: row.title,
  year: row.year ?? null,
  poster: row.poster ?? null,
  genres: row.genres,
  backlogAddedAt: dateOrNull(row.backlogAddedAt),
  addedAt: new Date(row.addedAt),
  fetchedAt: dateOrNull(row.fetchedAt),
})

async function insertChunks<T>(
  rows: Array<T>,
  insert: (chunk: Array<T>) => Promise<unknown>
) {
  // Stays well under Postgres' 65k bind-parameter limit.
  for (let i = 0; i < rows.length; i += 200)
    await insert(rows.slice(i, i + 200))
}

async function wipeArchive(tx: Tx) {
  // Logs go with their works (FK cascade). Auth tables are never touched.
  await tx.delete(movies)
  await tx.delete(shows)
  await tx.delete(games)
  await tx.delete(books)
  await tx.delete(records)
  await tx.delete(flights)
}

// --- the repository ------------------------------------------------------------

export const pgRepository: ArchiveRepository = {
  async listLibrary(type) {
    const db = getDb()
    const [items, logs] = await Promise.all([
      workItems(db, type),
      selectLogs(db, type),
    ])
    return deriveLibrary(items, logs)
  },

  async listLogs({ type, id }) {
    return (await selectLogs(getDb(), type, id)).sort(compareLogsDesc)
  },

  async listRecent(limit) {
    const db = getDb()
    const [items, logs] = await Promise.all([allWorkItems(db), allLogs(db)])
    return deriveRecent(items, logs, limit)
  },

  async addLog(input, item) {
    const type = mediaTypeOf(input)
    return getDb().transaction(async (tx) => {
      if (type !== "record") await upsertLoggedWork(tx, type, item)
      const log = await writeLog(tx, input)
      if (!log) throw new Error("Log was not saved")
      return log
    })
  },

  async updateLog(id, input) {
    const log = await writeLog(getDb(), input, id)
    if (!log) throw new Error("Log not found")
    return log
  },

  async deleteLog(id) {
    await getDb().transaction(async (tx) => {
      const [movie] = await tx
        .delete(movieLogs)
        .where(eq(movieLogs.id, id))
        .returning()
      if (movie) return pruneWork(tx, "movie", movie.movieId)
      const [show] = await tx
        .delete(showLogs)
        .where(eq(showLogs.id, id))
        .returning()
      if (show) {
        // Forget the season's episodes once it has no logs left.
        if (show.seasonNumber !== null)
          await tx.execute(sql`update shows set seasons = seasons - ${String(show.seasonNumber)}::text
            where id = ${show.showId} and not exists (
              select 1 from show_logs where show_id = ${show.showId} and season_number = ${show.seasonNumber})`)
        return pruneWork(tx, "show", show.showId)
      }
      const [game] = await tx
        .delete(gameLogs)
        .where(eq(gameLogs.id, id))
        .returning()
      if (game) return pruneWork(tx, "game", game.gameId)
      const [book] = await tx
        .delete(bookLogs)
        .where(eq(bookLogs.id, id))
        .returning()
      if (book) return pruneWork(tx, "book", book.bookId)
      // A play: the copy stays, you still own it.
      await tx.delete(recordLogs).where(eq(recordLogs.id, id))
    })
  },

  async listBacklog() {
    const db = getDb()
    const flagged = <T extends WorkRow>(
      type: MediaType,
      rows: Array<T>,
      subtitle?: (r: T) => string
    ) =>
      rows.flatMap((r) =>
        r.backlogAddedAt
          ? [
              {
                ...itemOf(type, r, subtitle?.(r)),
                addedAt: iso(r.backlogAddedAt),
              },
            ]
          : []
      )
    const [m, s, g, b, r] = await Promise.all([
      db.select().from(movies).where(isNotNull(movies.backlogAddedAt)),
      db.select().from(shows).where(isNotNull(shows.backlogAddedAt)),
      db.select().from(games).where(isNotNull(games.backlogAddedAt)),
      db.select().from(books).where(isNotNull(books.backlogAddedAt)),
      db.select().from(records).where(isNotNull(records.backlogAddedAt)),
    ])
    const items: Array<BacklogItem> = [
      ...flagged("movie", m),
      ...flagged("show", s),
      ...flagged("game", g),
      ...flagged("book", b, (row) => row.authors.join(", ")),
      ...r.flatMap((row) =>
        row.backlogAddedAt ? [recordItem(row, row.backlogAddedAt)] : []
      ),
    ]
    return items.sort((x, y) => y.addedAt.localeCompare(x.addedAt))
  },

  async addToBacklog(item) {
    const db = getDb()
    const backlogAddedAt = now()
    // Keep the original date if it's already there.
    const keep = (
      table: typeof movies | typeof shows | typeof games | typeof books
    ) => ({
      backlogAddedAt: sql`coalesce(${table.backlogAddedAt}, ${backlogAddedAt})`,
    })
    const values = { ...snapshotValues(item), backlogAddedAt }
    const id = numericId(item.id)
    switch (item.type) {
      case "movie":
        await db
          .insert(movies)
          .values({ ...values, id })
          .onConflictDoUpdate({ target: movies.id, set: keep(movies) })
        return
      case "show":
        await db
          .insert(shows)
          .values({ ...values, id })
          .onConflictDoUpdate({ target: shows.id, set: keep(shows) })
        return
      case "game":
        await db
          .insert(games)
          .values({ ...values, id })
          .onConflictDoUpdate({ target: games.id, set: keep(games) })
        return
      case "book":
        await db
          .insert(books)
          .values({
            ...values,
            id: bookId(item.id),
            authors: item.subtitle ? item.subtitle.split(", ") : [],
          })
          .onConflictDoUpdate({ target: books.id, set: keep(books) })
        return
      case "record": {
        // A want: a row with no copy fields. Nothing to do if you have it.
        const [existing] = await db
          .select({ id: records.id })
          .from(records)
          .where(eq(records.releaseId, id))
          .limit(1)
        if (existing) return
        await db.insert(records).values({
          releaseId: id,
          title: item.title,
          artist: item.subtitle ?? "",
          year: item.year ?? null,
          genres: item.genres,
          cover: item.poster ?? null,
          backlogAddedAt,
        })
      }
    }
  },

  async removeFromBacklog({ type, id }) {
    await getDb().transaction(async (tx) => {
      switch (type) {
        case "movie":
          await tx
            .update(movies)
            .set({ backlogAddedAt: null })
            .where(eq(movies.id, numericId(id)))
          return pruneWork(tx, type, id)
        case "show":
          await tx
            .update(shows)
            .set({ backlogAddedAt: null })
            .where(eq(shows.id, numericId(id)))
          return pruneWork(tx, type, id)
        case "game":
          await tx
            .update(games)
            .set({ backlogAddedAt: null })
            .where(eq(games.id, numericId(id)))
          return pruneWork(tx, type, id)
        case "book":
          await tx
            .update(books)
            .set({ backlogAddedAt: null })
            .where(eq(books.id, bookId(id)))
          return pruneWork(tx, type, id)
        case "record":
          await tx.delete(records).where(wantedRelease(numericId(id)))
      }
    })
  },

  async getIndex() {
    const db = getDb()
    const [logs, backlog, owned] = await Promise.all([
      allLogs(db),
      this.listBacklog(),
      db
        .selectDistinct({ releaseId: records.releaseId })
        .from(records)
        .where(ownedCopies),
    ])
    return deriveIndex({ logs, backlog, collection: owned })
  },

  async getStats() {
    const db = getDb()
    const [logs, backlog, owned] = await Promise.all([
      allLogs(db),
      this.listBacklog(),
      db
        .select({ releaseId: records.releaseId })
        .from(records)
        .where(ownedCopies),
    ])
    // A work counts once it has a log.
    const logged = new Map(
      logs.map((l) => [
        `${mediaTypeOf(l)}:${l.mediaId}`,
        { type: mediaTypeOf(l) },
      ])
    )
    return deriveStats({
      items: [...logged.values()],
      logs,
      backlog,
      collection: owned,
    })
  },

  getFacts: computeFacts,

  async listCollection() {
    const rows = await getDb()
      .select()
      .from(records)
      .where(ownedCopies)
      .orderBy(desc(records.addedAt))
    return rows.map(toCopy)
  },

  async addCollectionItem(snapshot, input) {
    return getDb().transaction(async (tx) => {
      // Buying something you wanted turns the want into the copy.
      const [wanted] = await tx
        .select({ id: records.id })
        .from(records)
        .where(wantedRelease(snapshot.releaseId))
        .limit(1)
      const values = {
        ...releaseSnapshotValues(snapshot),
        ...copyInputValues(input),
        backlogAddedAt: null,
      }
      const [row] = wanted
        ? await tx
            .update(records)
            .set({ ...values, addedAt: now(), updatedAt: now() })
            .where(eq(records.id, wanted.id))
            .returning()
        : await tx.insert(records).values(values).returning()
      if (!row) throw new Error("Copy was not saved")
      return toCopy(row)
    })
  },

  async updateCollectionItem(id, input) {
    const [row] = await getDb()
      .update(records)
      .set({ ...copyInputValues(input), updatedAt: now() })
      .where(and(eq(records.id, id), ownedCopies))
      .returning()
    if (!row) throw new Error("Copy not found")
    return toCopy(row)
  },

  async deleteCollectionItem(id) {
    await getDb().delete(records).where(eq(records.id, id))
  },

  async importCollection(drafts) {
    return getDb().transaction(async (tx) => {
      const instanceIds = drafts.flatMap((d) => d.discogsInstanceId ?? [])
      const releaseIds = [...new Set(drafts.map((d) => d.releaseId))]
      // Idempotent: copies already synced (same Discogs instance) are skipped.
      const synced = new Set(
        instanceIds.length
          ? (
              await tx
                .select({ id: records.discogsInstanceId })
                .from(records)
                .where(inArray(records.discogsInstanceId, instanceIds))
            ).map((r) => r.id)
          : []
      )
      // Copies added by hand or imported from Obsidian aren't tied to Discogs
      // yet. A new Discogs copy of the same release links to one of them
      // instead of becoming a second copy: your price, store and notes stay,
      // empty fields (condition, folder, rating…) come from Discogs.
      const unlinked = releaseIds.length
        ? await tx
            .select()
            .from(records)
            .where(
              and(
                ownedCopies,
                isNull(records.discogsInstanceId),
                inArray(records.releaseId, releaseIds)
              )
            )
            .orderBy(records.addedAt)
        : []
      const fresh: typeof drafts = []
      let linked = 0
      for (const draft of drafts) {
        if (draft.discogsInstanceId === undefined) {
          fresh.push(draft)
          continue
        }
        if (synced.has(draft.discogsInstanceId)) continue
        const index = unlinked.findIndex((r) => r.releaseId === draft.releaseId)
        const copy = index === -1 ? undefined : unlinked.splice(index, 1)[0]
        if (!copy) {
          fresh.push(draft)
          continue
        }
        const discogs = draftValues(draft)
        const hasPrice = copy.priceAmount !== null
        await tx
          .update(records)
          .set({
            discogsInstanceId: discogs.discogsInstanceId,
            folder: copy.folder ?? discogs.folder,
            rating: copy.rating ?? discogs.rating,
            mediaCondition: copy.mediaCondition ?? discogs.mediaCondition,
            sleeveCondition: copy.sleeveCondition ?? discogs.sleeveCondition,
            variant: copy.variant ?? discogs.variant,
            acquiredAt: copy.acquiredAt ?? discogs.acquiredAt,
            priceAmount: hasPrice ? copy.priceAmount : discogs.priceAmount,
            priceCurrency: hasPrice
              ? copy.priceCurrency
              : discogs.priceCurrency,
            store: copy.store ?? discogs.store,
            notes: copy.notes ?? discogs.notes,
            updatedAt: now(),
          })
          .where(eq(records.id, copy.id))
        linked++
      }
      const added = fresh.length
        ? await tx
            .insert(records)
            .values(fresh.map(draftValues))
            .onConflictDoNothing({ target: records.discogsInstanceId })
            .returning({ id: records.id })
        : []
      if (releaseIds.length)
        await tx
          .delete(records)
          .where(
            and(
              inArray(records.releaseId, releaseIds),
              isNotNull(records.backlogAddedAt)
            )
          )
      return {
        added: added.length,
        linked,
        skipped: drafts.length - added.length - linked,
      }
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
      .set({ ...flightValues(input), updatedAt: now() })
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
    const [m, s, g, b, r, logs, f] = await Promise.all([
      db.select().from(movies),
      db.select().from(shows),
      db.select().from(games),
      db.select().from(books),
      db.select().from(records),
      allLogs(db),
      db.select().from(flights).orderBy(desc(flights.departure)),
    ])
    return ArchiveExport.parse({
      version: 2,
      exportedAt: new Date().toISOString(),
      movies: m.map((row) =>
        MovieRow.parse({ ...workExport(row), data: row.data ?? undefined })
      ),
      shows: s.map((row) =>
        ShowRow.parse({
          ...workExport(row),
          data: row.data ?? undefined,
          seasons: Object.values(row.seasons),
        })
      ),
      games: g.map((row) =>
        GameRow.parse({ ...workExport(row), data: row.data ?? undefined })
      ),
      books: b.map((row) =>
        BookRow.parse({
          ...workExport(row),
          subtitle: row.authors.join(", ") || undefined,
          data: row.data ?? undefined,
        })
      ),
      records: r.map((row) =>
        RecordRow.parse({
          ...toCopy(row),
          backlogAddedAt: isoOrUndefined(row.backlogAddedAt),
          fetchedAt: isoOrUndefined(row.fetchedAt),
          data: row.data ?? undefined,
        })
      ),
      logs: logs.sort(compareLogsDesc),
      flights: f.map(toFlight),
    })
  },

  async importAll(input) {
    const data = ArchiveExport.parse(input)
    await getDb().transaction(async (tx) => {
      await wipeArchive(tx)
      await insertChunks(data.movies, (chunk) =>
        tx.insert(movies).values(
          chunk.map((row) => ({
            ...workImport(row),
            ...(row.data ? movieColumns(row.data) : {}),
          }))
        )
      )
      await insertChunks(data.shows, (chunk) =>
        tx.insert(shows).values(
          chunk.map((row) => ({
            ...workImport(row),
            ...(row.data ? showColumns(row.data) : {}),
            seasons: Object.fromEntries(
              row.seasons.map((x) => [String(x.seasonNumber), x])
            ),
          }))
        )
      )
      await insertChunks(data.games, (chunk) =>
        tx.insert(games).values(
          chunk.map((row) => ({
            ...workImport(row),
            ...(row.data ? gameColumns(row.data) : {}),
          }))
        )
      )
      await insertChunks(data.books, (chunk) =>
        tx.insert(books).values(
          chunk.map((row) => ({
            ...workImport(row),
            authors: row.subtitle ? row.subtitle.split(", ") : [],
            ...(row.data ? bookColumns(row.data) : {}),
          }))
        )
      )
      await insertChunks(data.records, (chunk) =>
        tx.insert(records).values(
          chunk.map((row) => ({
            ...draftValues(row),
            id: row.id,
            backlogAddedAt: dateOrNull(row.backlogAddedAt),
            updatedAt: new Date(row.updatedAt),
            fetchedAt: dateOrNull(row.fetchedAt),
            ...(row.data ? recordColumns(row.data) : {}),
          }))
        )
      )
      for (const log of data.logs) {
        const written = await writeLog(tx, log)
        if (!written) throw new Error(`Log ${log.id} was not imported`)
        // Keep the original ids and timestamps.
        await tx.execute(sql`update ${sql.identifier(logTable(log))}
          set id = ${log.id}, created_at = ${log.createdAt}, updated_at = ${log.updatedAt}
          where id = ${written.id}`)
      }
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

function logTable(log: LogEntry) {
  switch (log.kind) {
    case "movie":
      return "movie_logs"
    case "show":
    case "season":
      return "show_logs"
    case "game":
      return "game_logs"
    case "book":
      return "book_logs"
    case "record":
      return "record_logs"
  }
}
