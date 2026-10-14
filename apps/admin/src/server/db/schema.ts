import type { ImageRef } from "@workspace/schemas"
import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export * from "./auth-schema"

/*
 * Archive tables. They mirror `@workspace/schemas` (the export format); rows
 * are mapped back to those Zod types in `archive.server.ts`. Provider ids are
 * integers (TMDB/IGDB/Discogs ids, Open Library work number).
 */

export const mediaType = pgEnum("media_type", [
  "movie",
  "show",
  "game",
  "book",
  "record",
])
export const logKind = pgEnum("log_kind", [
  "movie",
  "show",
  "season",
  "game",
  "book",
  "record",
])

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}

/** Snapshot of a work, saved when it's first logged (library) or backlogged. */
const snapshot = {
  type: mediaType("type").notNull(),
  id: integer("id").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  year: integer("year"),
  poster: jsonb("poster").$type<ImageRef>(),
  genres: text("genres")
    .array()
    .notNull()
    .default(sql`'{}'`),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
}

/** Logged works. A row exists only while the work has at least one log. */
export const libraryItems = pgTable("library_items", snapshot, (t) => [
  primaryKey({ columns: [t.type, t.id] }),
])

export const backlogItems = pgTable("backlog_items", snapshot, (t) => [
  primaryKey({ columns: [t.type, t.id] }),
])

/**
 * One experience of a work. Kind-specific fields are nullable columns
 * (instead of JSON) so the data stays easy to query with plain SQL.
 */
export const logs = pgTable(
  "logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: logKind("kind").notNull(),
    /** `season` and `show` logs belong to a show. */
    mediaType: mediaType("media_type").notNull(),
    mediaId: integer("media_id").notNull(),
    seasonNumber: integer("season_number"),
    rating: smallint("rating"),
    notes: text("notes"),
    /** movie */
    watchedAt: date("watched_at"),
    /** record */
    playedAt: date("played_at"),
    startedAt: date("started_at"),
    finishedAt: date("finished_at"),
    /** movie, show, season */
    rewatch: boolean("rewatch"),
    /** book */
    reread: boolean("reread"),
    /** game: playing/finished/completed/paused/abandoned; book: reading/finished/abandoned */
    status: text("status"),
    /** game */
    platform: text("platform"),
    hoursPlayed: real("hours_played"),
    /** book: physical/ebook/audiobook */
    format: text("format"),
    /** watched/played, else finished, else started (same as `logDate()`). */
    logDate: date("log_date").generatedAlwaysAs(
      sql`coalesce(watched_at, played_at, finished_at, started_at)`
    ),
    ...timestamps,
  },
  (t) => [
    index("logs_media_idx").on(t.mediaType, t.mediaId),
    index("logs_date_idx").on(t.logDate),
    foreignKey({
      columns: [t.mediaType, t.mediaId],
      foreignColumns: [libraryItems.type, libraryItems.id],
    }).onDelete("cascade"),
    check("logs_rating_range", sql`${t.rating} between 1 and 10`),
    check(
      "logs_media_type_matches_kind",
      sql`${t.mediaType}::text = case ${t.kind} when 'season' then 'show' else ${t.kind}::text end`
    ),
    check(
      "logs_season_number",
      sql`(${t.kind} = 'season') = (${t.seasonNumber} is not null)`
    ),
  ]
)

/** A physical copy of a record (Discogs release) you own. */
export const collectionItems = pgTable(
  "collection_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseId: integer("release_id").notNull(),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    year: integer("year"),
    format: text("format"),
    label: text("label"),
    catno: text("catno"),
    genres: text("genres")
      .array()
      .notNull()
      .default(sql`'{}'`),
    styles: text("styles")
      .array()
      .notNull()
      .default(sql`'{}'`),
    cover: jsonb("cover").$type<ImageRef>(),
    rating: smallint("rating"),
    folder: text("folder"),
    discogsInstanceId: integer("discogs_instance_id").unique(),
    mediaCondition: text("media_condition"),
    sleeveCondition: text("sleeve_condition"),
    variant: text("variant"),
    acquiredAt: date("acquired_at"),
    priceAmount: numeric("price_amount", {
      precision: 12,
      scale: 2,
      mode: "number",
    }),
    priceCurrency: text("price_currency"),
    store: text("store"),
    notes: text("notes"),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("collection_release_idx").on(t.releaseId),
    check("collection_rating_range", sql`${t.rating} between 1 and 10`),
    check(
      "collection_price_complete",
      sql`(${t.priceAmount} is null) = (${t.priceCurrency} is null)`
    ),
  ]
)

/** Flights. Times are local to each airport (no offset), like a boarding pass. */
export const flights = pgTable(
  "flights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    from: text("from_airport").notNull(),
    to: text("to_airport").notNull(),
    departure: timestamp("departure", { mode: "string" }).notNull(),
    arrival: timestamp("arrival", { mode: "string" }),
    flightNumber: text("flight_number"),
    airline: text("airline"),
    aircraft: text("aircraft"),
    registration: text("registration"),
    seat: text("seat"),
    cabin: text("cabin"),
    reservation: text("reservation"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [index("flights_departure_idx").on(t.departure)]
)
