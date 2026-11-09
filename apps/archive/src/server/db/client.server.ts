import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { getDatabaseUrl } from "../env.server"
import * as schema from "./schema"

function connect() {
  // A small pool: one user, and Neon's free tier caps connections.
  const pool = new Pool({ connectionString: getDatabaseUrl(), max: 5 })
  return drizzle({ client: pool, schema })
}

export type Db = ReturnType<typeof connect>

let instance: Db | undefined

/** Lazily connects, so builds and provider-only routes work without a database. */
export function getDb(): Db {
  instance ??= connect()
  return instance
}
