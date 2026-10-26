import { z } from "zod"

const TmdbEnv = z.object({
  TMDB_READ_TOKEN: z.string().min(1),
  TMDB_LANGUAGE: z.string().default("en-US"),
  /** Region for "streaming on" filters (ISO 3166-1). */
  TMDB_WATCH_REGION: z.string().length(2).default("BR"),
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

const GoogleBooksEnv = z.object({ GOOGLE_BOOKS_KEY: z.string().min(1) })

export const getGoogleBooksEnv = () => readEnv(GoogleBooksEnv)

const SteamEnv = z.object({
  STEAM_API_KEY: z.string().min(1),
  /** Your SteamID64, e.g. 76561197960287930. */
  STEAM_ID: z
    .string()
    .regex(/^\d{17}$/, "STEAM_ID must be a 17-digit SteamID64"),
})

export const getSteamEnv = () => readEnv(SteamEnv)

const DatabaseEnv = z.object({ DATABASE_URL: z.url() })

export const getDatabaseUrl = () => readEnv(DatabaseEnv).DATABASE_URL

const AuthEnv = z.object({
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  /** The email allowed to create the (single) account; comma-separate aliases. */
  OWNER_EMAIL: z.string().min(3),
  /** Numeric id of the only GitHub account that may sign in (api.github.com/users/<login>). */
  OWNER_GITHUB_ID: z.string().regex(/^\d+$/, "OWNER_GITHUB_ID must be numeric"),
})

export const getAuthEnv = () => readEnv(AuthEnv)
