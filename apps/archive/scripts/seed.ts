/*
 * Loads an archive export (Settings → Export, format v2) into the database.
 *
 *   pnpm --filter archive db:seed path/to/archive-export.json
 *
 * REPLACES all archive data (not your account). Refuses to touch a
 * non-empty archive unless --replace is passed. Uses DATABASE_URL from the
 * environment or apps/archive/.env.
 */
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { ArchiveExport } from "@workspace/schemas"
import { sql } from "drizzle-orm"
import { pgRepository } from "../src/server/archive.server"
import { getDb } from "../src/server/db/client.server"

if (existsSync(".env")) process.loadEnvFile(".env")

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith("--"))
if (!file) {
  console.error("Usage: pnpm db:seed <export.json> [--replace]")
  process.exit(1)
}

const db = getDb()
const { rows } = await db.execute<{ count: number }>(
  sql`select (select count(*) from movies) + (select count(*) from shows) + (select count(*) from games) + (select count(*) from books) + (select count(*) from records) + (select count(*) from flights) as count`
)
const existing = Number(rows[0]?.count ?? 0)
if (existing > 0 && !args.includes("--replace")) {
  console.error(
    `The archive already has ${existing} rows. Pass --replace to overwrite it (export a backup first).`
  )
  process.exit(1)
}

const raw: unknown = JSON.parse(await readFile(file, "utf8"))
await pgRepository.importAll(ArchiveExport.parse(raw))
const exported = await pgRepository.exportAll()
console.log(
  `Seeded: ${exported.movies.length} movies, ${exported.shows.length} shows, ${exported.games.length} games, ${exported.books.length} books, ${exported.records.length} records, ${exported.logs.length} logs, ${exported.flights.length} flights.`
)
process.exit(0)
