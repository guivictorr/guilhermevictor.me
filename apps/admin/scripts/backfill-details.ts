/*
 * Fills in provider details (`data`) for every work in the archive and the
 * episodes of logged seasons. Skips what's already stored, so it's safe to
 * re-run after a provider outage or an import.
 *
 *   pnpm --filter admin db:backfill-details [--refresh] [--type=movie,show]
 *
 * --refresh re-fetches stored copies too (e.g. after changing what's kept);
 * --type limits the run to some kinds ("season" for logged seasons).
 * Uses DATABASE_URL and the provider keys from the environment or .env.
 */
import { existsSync } from "node:fs"
import type { MediaType } from "@workspace/schemas"
import { setTimeout as sleep } from "node:timers/promises"
import { sql } from "drizzle-orm"
import { getDb } from "../src/server/db/client.server"
import {
  ensureDetails,
  ensureSeasonDetails,
} from "../src/server/details.server"

if (existsSync(".env")) process.loadEnvFile(".env")

const refresh = process.argv.includes("--refresh")
const only = process.argv
  .find((a) => a.startsWith("--type="))
  ?.slice("--type=".length)
  .split(",")
const wanted = (kind: string) => !only || only.includes(kind)

type Job = { label: string; run: () => Promise<boolean> }

const db = getDb()
// Ids as text: Google Books ids are strings, the rest are numbers.
const { rows } = await db.execute<{ type: MediaType; id: string }>(sql`
  select 'movie' as type, id::text from movies
  union all select 'show', id::text from shows
  union all select 'game', id::text from games
  union all select 'book', id from books
  union select 'record', release_id::text from records
`)
const works = rows.map((w) => ({
  type: w.type,
  id: w.type === "book" ? w.id : Number(w.id),
}))
const { rows: seasons } = await db.execute<{
  show_id: number
  season_number: number
}>(sql`
  select distinct show_id, season_number from show_logs
  where season_number is not null
`)

// One queue per provider, each paced to stay under its rate limit.
const PROVIDER: Record<MediaType, string> = {
  movie: "tmdb",
  show: "tmdb",
  game: "igdb",
  book: "openlibrary",
  record: "discogs",
}
const DELAY_MS: Record<string, number> = {
  tmdb: 50,
  igdb: 600,
  openlibrary: 1000,
  discogs: 1100,
}

const queues = new Map<string, Array<Job>>()
const enqueue = (provider: string, job: Job) =>
  queues.set(provider, [...(queues.get(provider) ?? []), job])

for (const w of works.filter((work) => wanted(work.type)))
  enqueue(PROVIDER[w.type], {
    label: `${w.type}:${w.id}`,
    run: () => ensureDetails(w.type, w.id, { refresh }),
  })
for (const s of seasons.filter(() => wanted("season")))
  enqueue("tmdb", {
    label: `show:${s.show_id}/season ${s.season_number}`,
    run: () => ensureSeasonDetails(s.show_id, s.season_number, { refresh }),
  })

const failed: Array<string> = []
let done = 0
const total = [...queues.values()].reduce((n, q) => n + q.length, 0)
console.log(`Checking ${total} works and seasons…`)

await Promise.all(
  [...queues.entries()].map(async ([provider, jobs]) => {
    for (const job of jobs) {
      if (!(await job.run())) failed.push(job.label)
      done++
      if (done % 50 === 0) console.log(`${done}/${total}`)
      await sleep(DELAY_MS[provider] ?? 200)
    }
  })
)

console.log(`Done: ${total - failed.length}/${total} stored.`)
if (failed.length) console.log(`Failed (re-run later): ${failed.join(", ")}`)
process.exit(0)
