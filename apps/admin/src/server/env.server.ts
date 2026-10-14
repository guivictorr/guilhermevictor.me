import { z } from "zod"

const TmdbEnv = z.object({
  TMDB_READ_TOKEN: z.string().min(1),
  TMDB_LANGUAGE: z.string().default("en-US"),
})

const IgdbEnv = z.object({
  IGDB_CLIENT_ID: z.string().min(1),
  IGDB_CLIENT_SECRET: z.string().min(1),
})

const DiscogsEnv = z.object({
  DISCOGS_TOKEN: z.string().min(1),
})

/** Validated per provider, so a missing IGDB key doesn't break TMDB (and vice versa). */
function readEnv<T extends z.ZodType>(schema: T): z.infer<T> {
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ")
    throw new Error(
      `Missing or invalid env vars: ${missing}. See apps/admin/.env.example`
    )
  }
  return parsed.data
}

export const getTmdbEnv = () => readEnv(TmdbEnv)
export const getIgdbEnv = () => readEnv(IgdbEnv)
export const getDiscogsEnv = () => readEnv(DiscogsEnv)
