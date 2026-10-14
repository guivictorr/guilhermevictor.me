import type {
  Collection,
  Credits,
  MediaSummary,
  Movie,
  ProviderRating,
  Season,
  Show,
  Video,
} from "@workspace/schemas"
import { getTmdbEnv } from "./env.server"

const BASE_URL = "https://api.themoviedb.org/3"

async function tmdb<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const env = getTmdbEnv()
  const url = new URL(BASE_URL + path)
  url.searchParams.set("language", env.TMDB_LANGUAGE)
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value)

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.TMDB_READ_TOKEN}`,
      Accept: "application/json",
    },
  })
  if (!res.ok) throw new Error(`TMDB ${res.status} on ${path}`)
  return (await res.json()) as T
}

// Raw payloads: only the fields we read.
type TmdbNamed = { name: string }
type TmdbMovieResult = {
  id: number
  title: string
  release_date?: string
  poster_path?: string | null
  overview?: string
}
type TmdbTvResult = {
  id: number
  name: string
  first_air_date?: string
  poster_path?: string | null
  overview?: string
}
type TmdbVideos = {
  results: Array<{
    key: string
    name: string
    site: string
    type: string
    official?: boolean
  }>
}
type TmdbDetailsCommon = {
  vote_average?: number
  vote_count?: number
  status?: string
  tagline?: string
  genres: Array<TmdbNamed>
  backdrop_path?: string | null
  production_companies?: Array<TmdbNamed>
  production_countries?: Array<{ iso_3166_1: string; name: string }>
  videos?: TmdbVideos
}
type TmdbCastMember = {
  id: number
  name: string
  character?: string
  profile_path?: string | null
}
type TmdbCrewMember = {
  id: number
  name: string
  job: string
  profile_path?: string | null
}
type TmdbMovie = TmdbMovieResult &
  TmdbDetailsCommon & {
    imdb_id?: string | null
    original_title?: string
    runtime?: number | null
    belongs_to_collection?: { id: number; name: string } | null
    credits?: { cast: Array<TmdbCastMember>; crew: Array<TmdbCrewMember> }
    recommendations?: { results: Array<TmdbMovieResult> }
  }
type TmdbSeasonSummary = {
  season_number: number
  name: string
  episode_count: number
  air_date?: string | null
  poster_path?: string | null
}
type TmdbShow = TmdbTvResult &
  TmdbDetailsCommon & {
    original_name?: string
    last_air_date?: string | null
    number_of_episodes?: number
    created_by: Array<TmdbNamed>
    networks: Array<TmdbNamed>
    seasons: Array<TmdbSeasonSummary>
    external_ids?: { imdb_id?: string | null }
    aggregate_credits?: {
      cast: Array<{
        id: number
        name: string
        profile_path?: string | null
        roles?: Array<{ character: string }>
      }>
      crew: Array<{
        id: number
        name: string
        profile_path?: string | null
        jobs?: Array<{ job: string }>
      }>
    }
    recommendations?: { results: Array<TmdbTvResult> }
  }
type TmdbSeason = TmdbSeasonSummary & {
  overview?: string
  episodes: Array<{
    episode_number: number
    name: string
    air_date?: string | null
    runtime?: number | null
    overview?: string
    still_path?: string | null
  }>
}
type TmdbCollection = {
  id: number
  name: string
  overview?: string
  parts: Array<TmdbMovieResult>
}

const image = (path?: string | null) =>
  path ? { provider: "tmdb" as const, path } : undefined
const text = (value?: string | null) => (value ? value : undefined)
const yearOf = (date?: string | null) =>
  date ? Number(date.slice(0, 4)) || undefined : undefined
const unique = (values: Array<string>) => [...new Set(values)]

/** Crew jobs worth showing, in display order. */
const KEY_JOBS = [
  "Director",
  "Screenplay",
  "Writer",
  "Story",
  "Novel",
  "Original Music Composer",
  "Director of Photography",
  "Editor",
  "Producer",
]
const WRITER_JOBS = new Set(["Screenplay", "Writer", "Story", "Novel"])
const jobRank = (jobs: Array<string>) =>
  Math.min(...jobs.map((j) => KEY_JOBS.indexOf(j)))

/** Video results respect `language`; also accept English and language-less ones. */
function videoParams() {
  const lang = getTmdbEnv().TMDB_LANGUAGE.split("-")[0] ?? "en"
  return { include_video_language: unique([lang, "en", "null"]).join(",") }
}

function pickTrailer(videos?: TmdbVideos): Video | undefined {
  const youtube = (videos?.results ?? []).filter((v) => v.site === "YouTube")
  const best =
    youtube.find((v) => v.type === "Trailer" && v.official) ??
    youtube.find((v) => v.type === "Trailer") ??
    youtube.find((v) => v.type === "Teaser")
  return best ? { key: best.key, name: best.name, kind: best.type } : undefined
}

function providerRating(
  details: TmdbDetailsCommon
): ProviderRating | undefined {
  if (!details.vote_count || details.vote_average === undefined)
    return undefined
  return {
    source: "tmdb",
    // TMDB scores 0–10; we show 0–5 stars.
    value: Math.round((details.vote_average / 2) * 10) / 10,
    count: details.vote_count,
  }
}

const movieSummary = (r: TmdbMovieResult): MediaSummary => ({
  type: "movie",
  id: r.id,
  title: r.title,
  year: yearOf(r.release_date),
  poster: image(r.poster_path),
  overview: text(r.overview),
})

const showSummary = (r: TmdbTvResult): MediaSummary => ({
  type: "show",
  id: r.id,
  title: r.name,
  year: yearOf(r.first_air_date),
  poster: image(r.poster_path),
  overview: text(r.overview),
})

function movieCredits(credits: TmdbMovie["credits"]): Credits {
  // One entry per person, merging jobs ("Director, Screenplay").
  const crew = new Map<
    number,
    { member: TmdbCrewMember; jobs: Array<string> }
  >()
  for (const member of credits?.crew ?? []) {
    if (!KEY_JOBS.includes(member.job)) continue
    const entry = crew.get(member.id)
    if (entry) entry.jobs.push(member.job)
    else crew.set(member.id, { member, jobs: [member.job] })
  }

  return {
    cast: (credits?.cast ?? []).slice(0, 24).map((c) => ({
      id: c.id,
      name: c.name,
      role: text(c.character),
      photo: image(c.profile_path),
    })),
    crew: [...crew.values()]
      .sort((a, b) => jobRank(a.jobs) - jobRank(b.jobs))
      .slice(0, 16)
      .map(({ member, jobs }) => ({
        id: member.id,
        name: member.name,
        role: jobs.join(", "),
        photo: image(member.profile_path),
      })),
  }
}

function showCredits(credits: TmdbShow["aggregate_credits"]): Credits {
  return {
    cast: (credits?.cast ?? []).slice(0, 24).map((c) => ({
      id: c.id,
      name: c.name,
      role: text(c.roles?.[0]?.character),
      photo: image(c.profile_path),
    })),
    crew: (credits?.crew ?? [])
      .map((c) => ({
        member: c,
        jobs: unique((c.jobs ?? []).map((j) => j.job)).filter((j) =>
          KEY_JOBS.includes(j)
        ),
      }))
      .filter(({ jobs }) => jobs.length > 0)
      .sort((a, b) => jobRank(a.jobs) - jobRank(b.jobs))
      .slice(0, 16)
      .map(({ member, jobs }) => ({
        id: member.id,
        name: member.name,
        role: jobs.join(", "),
        photo: image(member.profile_path),
      })),
  }
}

/** TMDB's weekly trending list (first page, ~20 items). */
export async function fetchTrendingTmdb(
  type: "movie" | "show"
): Promise<Array<MediaSummary>> {
  if (type === "movie") {
    const data = await tmdb<{ results: Array<TmdbMovieResult> }>(
      "/trending/movie/week"
    )
    return data.results.map(movieSummary)
  }
  const data = await tmdb<{ results: Array<TmdbTvResult> }>("/trending/tv/week")
  return data.results.map(showSummary)
}

export async function searchTmdb(
  type: "movie" | "show",
  query: string
): Promise<Array<MediaSummary>> {
  if (type === "movie") {
    const data = await tmdb<{ results: Array<TmdbMovieResult> }>(
      "/search/movie",
      { query, include_adult: "false" }
    )
    return data.results.map(movieSummary)
  }
  const data = await tmdb<{ results: Array<TmdbTvResult> }>("/search/tv", {
    query,
    include_adult: "false",
  })
  return data.results.map(showSummary)
}

export async function fetchMovie(id: number): Promise<Movie> {
  const m = await tmdb<TmdbMovie>(`/movie/${id}`, {
    append_to_response: "credits,videos,recommendations",
    ...videoParams(),
  })
  const crew = m.credits?.crew ?? []
  return {
    type: "movie",
    id: m.id,
    imdbId: text(m.imdb_id),
    title: m.title,
    originalTitle:
      m.original_title !== m.title ? text(m.original_title) : undefined,
    status: text(m.status),
    releaseDate: text(m.release_date),
    year: yearOf(m.release_date),
    runtime: m.runtime ?? undefined,
    overview: text(m.overview),
    tagline: text(m.tagline),
    genres: m.genres.map((g) => g.name),
    countries: (m.production_countries ?? []).map((c) => c.name),
    companies: (m.production_companies ?? []).map((c) => c.name),
    directors: unique(
      crew.filter((c) => c.job === "Director").map((c) => c.name)
    ),
    writers: unique(
      crew.filter((c) => WRITER_JOBS.has(c.job)).map((c) => c.name)
    ),
    credits: movieCredits(m.credits),
    providerRating: providerRating(m),
    trailer: pickTrailer(m.videos),
    collection: m.belongs_to_collection
      ? { id: m.belongs_to_collection.id, name: m.belongs_to_collection.name }
      : undefined,
    recommendations: (m.recommendations?.results ?? [])
      .slice(0, 20)
      .map(movieSummary),
    poster: image(m.poster_path),
    backdrop: image(m.backdrop_path),
  }
}

export async function fetchShow(id: number): Promise<Show> {
  const s = await tmdb<TmdbShow>(`/tv/${id}`, {
    append_to_response: "external_ids,aggregate_credits,videos,recommendations",
    ...videoParams(),
  })
  return {
    type: "show",
    id: s.id,
    imdbId: text(s.external_ids?.imdb_id),
    title: s.name,
    originalTitle:
      s.original_name !== s.name ? text(s.original_name) : undefined,
    firstAirDate: text(s.first_air_date),
    lastAirDate: text(s.last_air_date),
    year: yearOf(s.first_air_date),
    status: text(s.status),
    overview: text(s.overview),
    tagline: text(s.tagline),
    genres: s.genres.map((g) => g.name),
    countries: (s.production_countries ?? []).map((c) => c.name),
    companies: (s.production_companies ?? []).map((c) => c.name),
    creators: s.created_by.map((c) => c.name),
    networks: s.networks.map((n) => n.name),
    episodeCount: s.number_of_episodes,
    credits: showCredits(s.aggregate_credits),
    providerRating: providerRating(s),
    trailer: pickTrailer(s.videos),
    recommendations: (s.recommendations?.results ?? [])
      .slice(0, 20)
      .map(showSummary),
    poster: image(s.poster_path),
    backdrop: image(s.backdrop_path),
    seasons: s.seasons.map((season) => ({
      seasonNumber: season.season_number,
      name: season.name,
      episodeCount: season.episode_count,
      airDate: text(season.air_date),
      poster: image(season.poster_path),
    })),
  }
}

export async function fetchSeason(
  showId: number,
  seasonNumber: number
): Promise<Season> {
  const s = await tmdb<TmdbSeason>(`/tv/${showId}/season/${seasonNumber}`)
  return {
    showId,
    seasonNumber: s.season_number,
    name: s.name,
    episodeCount: s.episodes.length,
    airDate: text(s.air_date),
    poster: image(s.poster_path),
    overview: text(s.overview),
    episodes: s.episodes.map((e) => ({
      episodeNumber: e.episode_number,
      name: e.name,
      airDate: text(e.air_date),
      runtime: e.runtime ?? undefined,
      overview: text(e.overview),
      still: image(e.still_path),
    })),
  }
}

export async function fetchCollection(id: number): Promise<Collection> {
  const c = await tmdb<TmdbCollection>(`/collection/${id}`)
  return {
    id: c.id,
    name: c.name,
    overview: text(c.overview),
    // Release order; unreleased entries (no date) go last.
    parts: [...c.parts]
      .sort((a, b) =>
        (a.release_date || "9999").localeCompare(b.release_date || "9999")
      )
      .map(movieSummary),
  }
}
