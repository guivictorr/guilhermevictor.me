import type {
  Book,
  Game,
  ImageRef,
  Movie,
  Release,
  Season,
  Show,
} from "@workspace/schemas"
import { sql } from "drizzle-orm"
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  pgView,
  real,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export * from "./auth-schema"

/*
 * One table per kind of work, one log table per kind, plus flights.
 *
 * A work row exists while the work is in your archive: it has logs, it's in
 * the backlog (`backlog_added_at`), or (records) it's a copy you own. `data`
 * is the provider's details so pages work when the provider is down; the
 * other columns are copied out of it (or from the snapshot sent when you
 * logged it) so plain SQL can query them. Rows map to `@workspace/schemas`
 * (archive.ts) in `archive.server.ts`.
 */

const tz = (name: string) => timestamp(name, { withTimezone: true })
const textArray = (name: string) =>
  text(name)
    .array()
    .notNull()
    .default(sql`'{}'`)

/** Columns every work table has. */
const work = {
  title: text("title").notNull(),
  year: integer("year"),
  genres: textArray("genres"),
  poster: jsonb("poster").$type<ImageRef>(),
  /** Set while the work is in the backlog. */
  backlogAddedAt: tz("backlog_added_at"),
  addedAt: tz("added_at").notNull().defaultNow(),
  /** When `data` was last fetched from the provider. */
  fetchedAt: tz("fetched_at"),
}

const logTimestamps = {
  createdAt: tz("created_at").notNull().defaultNow(),
  updatedAt: tz("updated_at").notNull().defaultNow(),
}

const rating = () => smallint("rating")
const ratingCheck = (name: string, column: unknown) =>
  check(name, sql`${column} between 1 and 10`)

// --- works -------------------------------------------------------------------

export const movies = pgTable(
  "movies",
  {
    /** TMDB movie id. */
    id: integer("id").primaryKey(),
    ...work,
    originalTitle: text("original_title"),
    releaseDate: text("release_date"),
    /** Minutes. */
    runtime: integer("runtime"),
    directors: textArray("directors"),
    imdbId: text("imdb_id"),
    data: jsonb("data").$type<Movie>(),
  },
  (t) => [index("movies_backlog_idx").on(t.backlogAddedAt)]
)

export const shows = pgTable(
  "shows",
  {
    /** TMDB tv id. */
    id: integer("id").primaryKey(),
    ...work,
    originalTitle: text("original_title"),
    firstAirDate: text("first_air_date"),
    lastAirDate: text("last_air_date"),
    status: text("status"),
    creators: textArray("creators"),
    networks: textArray("networks"),
    imdbId: text("imdb_id"),
    data: jsonb("data").$type<Show>(),
    /** Episodes of the seasons you logged, by season number. */
    seasons: jsonb("seasons")
      .$type<Record<string, Season>>()
      .notNull()
      .default({}),
  },
  (t) => [index("shows_backlog_idx").on(t.backlogAddedAt)]
)

export const games = pgTable(
  "games",
  {
    /** IGDB game id. */
    id: integer("id").primaryKey(),
    ...work,
    releaseDate: text("release_date"),
    developers: textArray("developers"),
    publishers: textArray("publishers"),
    platforms: textArray("platforms"),
    steamId: text("steam_id"),
    /** Store ids: steam, gog, epic, microsoft, playstation, giantbomb. */
    externalIds: jsonb("external_ids")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    data: jsonb("data").$type<Game>(),
  },
  (t) => [index("games_backlog_idx").on(t.backlogAddedAt)]
)

export const books = pgTable(
  "books",
  {
    /** Google Books volume id (an edition), e.g. "zyTCAlFPjgYC". */
    id: text("id").primaryKey(),
    ...work,
    authors: textArray("authors"),
    publisher: text("publisher"),
    publishedDate: text("published_date"),
    pages: integer("pages"),
    /** ISO 639-1. */
    language: text("language"),
    categories: textArray("categories"),
    isbn13: text("isbn13"),
    isbn10: text("isbn10"),
    data: jsonb("data").$type<Book>(),
  },
  (t) => [index("books_backlog_idx").on(t.backlogAddedAt)]
)

/**
 * One row per physical copy you own, or per release you want (backlog,
 * no copy fields). Two copies of the same pressing are two rows.
 */
export const records = pgTable(
  "records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Discogs release id. */
    releaseId: integer("release_id").notNull(),
    masterId: integer("master_id"),
    title: text("title").notNull(),
    /** Display line, e.g. "Rita Lee & Roberto De Carvalho". */
    artist: text("artist").notNull(),
    artists: textArray("artists"),
    year: integer("year"),
    label: text("label"),
    catno: text("catno"),
    format: text("format"),
    genres: textArray("genres"),
    styles: textArray("styles"),
    barcodes: textArray("barcodes"),
    cover: jsonb("cover").$type<ImageRef>(),
    // The copy itself.
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
    /** Your Discogs rating at import time. */
    rating: rating(),
    folder: text("folder"),
    /** Set when imported from Discogs; makes re-imports idempotent. */
    // Discogs instance ids already exceed 32-bit integers.
    discogsInstanceId: bigint("discogs_instance_id", {
      mode: "number",
    }).unique(),
    backlogAddedAt: tz("backlog_added_at"),
    addedAt: tz("added_at").notNull().defaultNow(),
    updatedAt: tz("updated_at").notNull().defaultNow(),
    fetchedAt: tz("fetched_at"),
    data: jsonb("data").$type<Release>(),
  },
  (t) => [
    index("records_release_idx").on(t.releaseId),
    ratingCheck("records_rating", t.rating),
    check(
      "records_price",
      sql`(${t.priceAmount} is null) = (${t.priceCurrency} is null)`
    ),
  ]
)

// --- logs --------------------------------------------------------------------

export const movieLogs = pgTable(
  "movie_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    movieId: integer("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    watchedAt: date("watched_at"),
    rewatch: boolean("rewatch").notNull().default(false),
    rating: rating(),
    notes: text("notes"),
    ...logTimestamps,
  },
  (t) => [
    index("movie_logs_movie_idx").on(t.movieId),
    ratingCheck("movie_logs_rating", t.rating),
  ]
)

/** A season (`season_number`) or the whole show (`season_number` null). */
export const showLogs = pgTable(
  "show_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: integer("show_id")
      .notNull()
      .references(() => shows.id, { onDelete: "cascade" }),
    seasonNumber: integer("season_number"),
    startedAt: date("started_at"),
    finishedAt: date("finished_at"),
    rewatch: boolean("rewatch").notNull().default(false),
    rating: rating(),
    notes: text("notes"),
    ...logTimestamps,
  },
  (t) => [
    index("show_logs_show_idx").on(t.showId),
    ratingCheck("show_logs_rating", t.rating),
  ]
)

export const gameLogs = pgTable(
  "game_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    /** playing, finished (main story), completed (100%), paused, abandoned. */
    status: text("status").notNull(),
    platform: text("platform"),
    hoursPlayed: real("hours_played"),
    startedAt: date("started_at"),
    finishedAt: date("finished_at"),
    rating: rating(),
    notes: text("notes"),
    ...logTimestamps,
  },
  (t) => [
    index("game_logs_game_idx").on(t.gameId),
    ratingCheck("game_logs_rating", t.rating),
    check(
      "game_logs_status",
      sql`${t.status} in ('playing', 'finished', 'completed', 'paused', 'abandoned')`
    ),
  ]
)

export const bookLogs = pgTable(
  "book_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookId: text("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    /** physical, ebook, audiobook. */
    format: text("format"),
    reread: boolean("reread").notNull().default(false),
    startedAt: date("started_at"),
    finishedAt: date("finished_at"),
    rating: rating(),
    notes: text("notes"),
    ...logTimestamps,
  },
  (t) => [
    index("book_logs_book_idx").on(t.bookId),
    ratingCheck("book_logs_rating", t.rating),
    check(
      "book_logs_status",
      sql`${t.status} in ('reading', 'finished', 'abandoned')`
    ),
  ]
)

/** A play of a copy you own. Deleting the copy deletes its plays. */
export const recordLogs = pgTable(
  "record_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recordId: uuid("record_id")
      .notNull()
      .references(() => records.id, { onDelete: "cascade" }),
    playedAt: date("played_at"),
    rating: rating(),
    notes: text("notes"),
    ...logTimestamps,
  },
  (t) => [
    index("record_logs_record_idx").on(t.recordId),
    ratingCheck("record_logs_rating", t.rating),
  ]
)

// --- flights -----------------------------------------------------------------

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
    ...logTimestamps,
  },
  (t) => [index("flights_departure_idx").on(t.departure)]
)

// --- views (for SQL; the app reads the tables) --------------------------------

/** Every log of every kind, with the date it's "about". */
export const allLogs = pgView("all_logs", {
  id: uuid("id").notNull(),
  type: text("type").notNull(),
  /** Provider id as text (Google Books ids are strings). */
  workId: text("work_id").notNull(),
  title: text("title").notNull(),
  logDate: date("log_date"),
  rating: smallint("rating"),
  createdAt: tz("created_at").notNull(),
}).as(sql`
  select l.id, 'movie' as type, l.movie_id::text as work_id, w.title, l.watched_at as log_date, l.rating, l.created_at
    from movie_logs l join movies w on w.id = l.movie_id
  union all
  select l.id, 'show', l.show_id::text, w.title, coalesce(l.finished_at, l.started_at), l.rating, l.created_at
    from show_logs l join shows w on w.id = l.show_id
  union all
  select l.id, 'game', l.game_id::text, w.title, coalesce(l.finished_at, l.started_at), l.rating, l.created_at
    from game_logs l join games w on w.id = l.game_id
  union all
  select l.id, 'book', l.book_id, w.title, coalesce(l.finished_at, l.started_at), l.rating, l.created_at
    from book_logs l join books w on w.id = l.book_id
  union all
  select l.id, 'record', w.release_id::text, w.title, l.played_at, l.rating, l.created_at
    from record_logs l join records w on w.id = l.record_id
`)

/** Everything in the backlog, any kind. */
export const allBacklog = pgView("all_backlog", {
  type: text("type").notNull(),
  /** Provider id as text (Google Books ids are strings). */
  workId: text("work_id").notNull(),
  title: text("title").notNull(),
  year: integer("year"),
  backlogAddedAt: tz("backlog_added_at").notNull(),
}).as(sql`
  select 'movie' as type, id::text as work_id, title, year, backlog_added_at from movies where backlog_added_at is not null
  union all
  select 'show', id::text, title, year, backlog_added_at from shows where backlog_added_at is not null
  union all
  select 'game', id::text, title, year, backlog_added_at from games where backlog_added_at is not null
  union all
  select 'book', id, title, year, backlog_added_at from books where backlog_added_at is not null
  union all
  select 'record', release_id::text, title, year, backlog_added_at from records where backlog_added_at is not null
`)
