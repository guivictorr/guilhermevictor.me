import type { Game, MediaSummary, TimeToBeat } from "@workspace/schemas"
import { getIgdbEnv } from "./env.server"

const API_URL = "https://api.igdb.com/v4"
const TOKEN_URL = "https://id.twitch.tv/oauth2/token"

// App access tokens last ~60 days; keep one per server instance.
let token: { value: string; expiresAt: number } | undefined

async function getToken(): Promise<string> {
  if (token && token.expiresAt > Date.now()) return token.value

  const env = getIgdbEnv()
  const url = new URL(TOKEN_URL)
  url.searchParams.set("client_id", env.IGDB_CLIENT_ID)
  url.searchParams.set("client_secret", env.IGDB_CLIENT_SECRET)
  url.searchParams.set("grant_type", "client_credentials")

  const res = await fetch(url, { method: "POST" })
  if (!res.ok) throw new Error(`Twitch auth ${res.status}`)
  const data = (await res.json()) as {
    access_token: string
    expires_in: number
  }
  // Refresh a minute early so in-flight requests never use an expired token.
  token = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return token.value
}

async function igdb<T>(
  endpoint: string,
  body: string,
  retry = true
): Promise<T> {
  const res = await fetch(`${API_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": getIgdbEnv().IGDB_CLIENT_ID,
      Authorization: `Bearer ${await getToken()}`,
      Accept: "application/json",
    },
    body,
  })
  if (res.status === 401 && retry) {
    token = undefined
    return igdb(endpoint, body, false)
  }
  if (!res.ok) throw new Error(`IGDB ${res.status} on ${endpoint}`)
  return (await res.json()) as T
}

type IgdbImage = { image_id: string }
type IgdbGameSummary = {
  id: number
  name: string
  summary?: string
  first_release_date?: number
  cover?: IgdbImage
}
type IgdbGame = IgdbGameSummary & {
  slug: string
  total_rating?: number
  total_rating_count?: number
  genres?: Array<{ name: string }>
  platforms?: Array<{ name: string; abbreviation?: string }>
  screenshots?: Array<IgdbImage>
  videos?: Array<{ video_id: string; name?: string }>
  similar_games?: Array<IgdbGameSummary>
  external_games?: Array<{ uid?: string; external_game_source?: number }>
  involved_companies?: Array<{
    developer: boolean
    publisher: boolean
    company: { name: string }
  }>
}
type IgdbTimeToBeat = {
  hastily?: number
  normally?: number
  completely?: number
}

const image = (img?: IgdbImage) =>
  img ? { provider: "igdb" as const, path: img.image_id } : undefined
const releaseDate = (unix?: number) =>
  unix ? new Date(unix * 1000).toISOString().slice(0, 10) : undefined
const yearOf = (unix?: number) =>
  unix ? new Date(unix * 1000).getUTCFullYear() : undefined
/** IGDB reports seconds; round to half hours. */
const hours = (seconds?: number) =>
  seconds ? Math.round((seconds / 3600) * 2) / 2 : undefined

/** Apicalypse strings are double-quoted; escape so user input can't break the query. */
const quote = (value: string) =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`

const summary = (g: IgdbGameSummary): MediaSummary => ({
  type: "game",
  id: g.id,
  title: g.name,
  year: yearOf(g.first_release_date),
  poster: image(g.cover),
  overview: g.summary,
})

export async function searchIgdb(query: string): Promise<Array<MediaSummary>> {
  const games = await igdb<Array<IgdbGameSummary>>(
    "games",
    `search ${quote(query)}; fields name,summary,first_release_date,cover.image_id; where version_parent = null; limit 30;`
  )
  return games.map(summary)
}

const SUMMARY_FIELDS = "name,summary,first_release_date,cover.image_id"

/**
 * Most popular games right now, by IGDB's own page-visit popularity
 * (popularity_type 1). Falls back to "most rated recent releases" if the
 * popularity endpoint returns nothing.
 */
export async function fetchPopularGames(): Promise<Array<MediaSummary>> {
  const primitives = await igdb<Array<{ game_id: number }>>(
    "popularity_primitives",
    "fields game_id,value; where popularity_type = 1; sort value desc; limit 30;"
  ).catch(() => [])
  const ids = primitives.map((p) => p.game_id)

  if (ids.length) {
    const games = await igdb<Array<IgdbGameSummary>>(
      "games",
      `fields ${SUMMARY_FIELDS}; where id = (${ids.join(",")}); limit ${ids.length};`
    )
    // The games endpoint doesn't keep our order; restore the popularity ranking.
    const byId = new Map(games.map((g) => [g.id, g]))
    return ids.flatMap((id) => {
      const game = byId.get(id)
      return game ? [summary(game)] : []
    })
  }

  const oneYearAgo = Math.floor(Date.now() / 1000) - 365 * 24 * 3600
  const games = await igdb<Array<IgdbGameSummary>>(
    "games",
    `fields ${SUMMARY_FIELDS}; where first_release_date > ${oneYearAgo} & total_rating_count > 5 & version_parent = null; sort total_rating_count desc; limit 30;`
  )
  return games.map(summary)
}

const GAME_FIELDS = [
  "name",
  "slug",
  "summary",
  "first_release_date",
  "total_rating",
  "total_rating_count",
  "cover.image_id",
  "genres.name",
  "platforms.name",
  "platforms.abbreviation",
  "screenshots.image_id",
  "videos.video_id",
  "videos.name",
  "similar_games.name",
  "similar_games.first_release_date",
  "similar_games.cover.image_id",
  "involved_companies.developer",
  "involved_companies.publisher",
  "involved_companies.company.name",
  "external_games.uid",
  "external_games.external_game_source",
].join(",")

/** IGDB `external_game_sources` ids worth keeping for matching elsewhere. */
const EXTERNAL_SOURCES: Partial<Record<number, string>> = {
  1: "steam",
  3: "giantbomb",
  5: "gog",
  11: "microsoft",
  26: "epic",
  36: "playstation",
}

function externalIds(games: IgdbGame["external_games"]) {
  const ids: Record<string, string> = {}
  for (const g of games ?? []) {
    const source = EXTERNAL_SOURCES[g.external_game_source ?? -1]
    if (source && g.uid) ids[source] ??= g.uid
  }
  return ids
}

/** Time to beat is a separate endpoint and often missing; never fail the page over it. */
async function fetchTimeToBeat(id: number): Promise<TimeToBeat | undefined> {
  try {
    const [ttb] = await igdb<Array<IgdbTimeToBeat>>(
      "game_time_to_beats",
      `fields hastily,normally,completely; where game_id = ${id}; limit 1;`
    )
    if (!ttb) return undefined
    const result = {
      main: hours(ttb.hastily),
      extra: hours(ttb.normally),
      completionist: hours(ttb.completely),
    }
    return Object.values(result).some(Boolean) ? result : undefined
  } catch {
    return undefined
  }
}

export async function fetchGame(id: number): Promise<Game | undefined> {
  const [[g], timeToBeat] = await Promise.all([
    igdb<Array<IgdbGame>>(
      "games",
      `fields ${GAME_FIELDS}; where id = ${id}; limit 1;`
    ),
    fetchTimeToBeat(id),
  ])
  if (!g) return undefined
  const companies = g.involved_companies ?? []
  return {
    type: "game",
    id: g.id,
    slug: g.slug,
    title: g.name,
    releaseDate: releaseDate(g.first_release_date),
    year: yearOf(g.first_release_date),
    summary: g.summary,
    genres: (g.genres ?? []).map((x) => x.name),
    platforms: (g.platforms ?? []).map((p) => p.name),
    developers: companies.filter((c) => c.developer).map((c) => c.company.name),
    publishers: companies.filter((c) => c.publisher).map((c) => c.company.name),
    providerRating:
      g.total_rating !== undefined && g.total_rating_count
        ? {
            source: "igdb",
            // IGDB scores 0–100; we show 0–5 stars.
            value: Math.round((g.total_rating / 20) * 10) / 10,
            count: g.total_rating_count,
          }
        : undefined,
    timeToBeat,
    externalIds: externalIds(g.external_games),
    videos: (g.videos ?? []).slice(0, 8).map((v) => ({
      key: v.video_id,
      name: v.name ?? "Video",
    })),
    similar: (g.similar_games ?? []).slice(0, 20).map(summary),
    cover: image(g.cover),
    screenshots: (g.screenshots ?? [])
      .slice(0, 12)
      .flatMap((s) => image(s) ?? []),
  }
}
