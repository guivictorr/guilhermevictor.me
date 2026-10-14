/*
 * Loads an archive export (Settings → Export, or the Obsidian importer's
 * References/.import/archive-import.json) into the database.
 *
 *   pnpm --filter admin db:seed ../../References/.import/archive-import.json
 *
 * REPLACES all archive data (not accounts or API keys). Refuses to touch a
 * non-empty archive unless --replace is passed. Uses DATABASE_URL from the
 * environment or apps/admin/.env.
 */
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { ArchiveExport } from "@workspace/schemas"
import { sql } from "drizzle-orm"
import { migrateExport } from "../src/lib/repo/derive"
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
  sql`select (select count(*) from library_items) + (select count(*) from backlog_items) + (select count(*) from collection_items) + (select count(*) from flights) as count`
)
const existing = Number(rows[0]?.count ?? 0)
if (existing > 0 && !args.includes("--replace")) {
  console.error(
    `The archive already has ${existing} rows. Pass --replace to overwrite it (export a backup first).`
  )
  process.exit(1)
}

const raw: unknown = JSON.parse(await readFile(file, "utf8"))
await pgRepository.importAll(ArchiveExport.parse(migrateExport(raw)))
const exported = await pgRepository.exportAll()
console.log(
  `Seeded: ${exported.items.length} items, ${exported.logs.length} logs, ${exported.backlog.length} backlog, ${exported.collection.length} copies, ${exported.flights.length} flights.`
)
process.exit(0)
