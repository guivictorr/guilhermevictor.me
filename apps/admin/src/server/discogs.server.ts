import type {
  CollectionItemDraft,
  Credit,
  Grade,
  ImageRef,
  MasterRelease,
  MediaSummary,
  Release,
} from "@workspace/schemas"
import type { SearchFilters } from "@/lib/search-filters"
import { getDiscogsEnv } from "./env.server"

const API_URL = "https://api.discogs.com"
// Discogs requires a descriptive User-Agent on every request.
const USER_AGENT = "ArchivePersonalApp/0.1 +https://github.com"

async function discogs<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(API_URL + path)
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value)

  const res = await fetch(url, {
    headers: {
      Authorization: `Discogs token=${getDiscogsEnv().DISCOGS_TOKEN}`,
      "User-Agent": USER_AGENT,
      Accept: "application/vnd.discogs.v2.discogs+json",
    },
  })
  if (res.status === 429)
    throw new Error("Discogs rate limit hit, try again in a minute")
  if (!res.ok) throw new Error(`Discogs ${res.status} on ${path}`)
  return (await res.json()) as T
}

// Raw payloads: only the fields we read.
type DiscogsArtist = { name: string; anv?: string }
type DiscogsCreditRaw = DiscogsArtist & { role?: string; tracks?: string }
type DiscogsLabel = { name: string; catno?: string }
type DiscogsFormat = {
  name: string
  qty?: string
  descriptions?: Array<string>
  text?: string
}
type DiscogsImage = { type: string; uri: string; uri150?: string }
type DiscogsSearchResult = {
  id: number
  title: string
  year?: string
  country?: string
  catno?: string
  label?: Array<string>
  format?: Array<string>
  formats?: Array<DiscogsFormat>
  cover_image?: string
  thumb?: string
}
type DiscogsTrack = {
  position: string
  title: string
  duration?: string
  type_?: string
  artists?: Array<DiscogsArtist>
  extraartists?: Array<DiscogsCreditRaw>
  sub_tracks?: Array<{ position: string; title: string; duration?: string }>
}
type DiscogsRelease = {
  id: number
  master_id?: number
  title: string
  artists?: Array<DiscogsArtist>
  extraartists?: Array<DiscogsCreditRaw>
  year?: number
  released?: string
  country?: string
  notes?: string
  labels?: Array<DiscogsLabel>
  series?: Array<{ name: string; catno?: string }>
  companies?: Array<{ name: string; entity_type_name?: string; catno?: string }>
  identifiers?: Array<{ type: string; value: string; description?: string }>
  formats?: Array<DiscogsFormat>
  genres?: Array<string>
  styles?: Array<string>
  tracklist?: Array<DiscogsTrack>
  videos?: Array<{ uri: string; title?: string }>
  images?: Array<DiscogsImage>
  community?: {
    have?: number
    want?: number
    rating?: { average: number; count: number }
  }
  num_for_sale?: number
  lowest_price?: number | null
  uri?: string
}
type DiscogsCollectionRelease = {
  id: number
  instance_id: number
  date_added: string
  rating: number
  folder_id: number
  notes?: Array<{ field_id: number; value: string }>
  basic_information: {
    id: number
    title: string
    year?: number
    artists?: Array<DiscogsArtist>
    labels?: Array<DiscogsLabel>
    formats?: Array<DiscogsFormat>
    genres?: Array<string>
    styles?: Array<string>
    cover_image?: string
  }
}

/** Discogs disambiguates names as "Name (2)"; drop that suffix. */
const cleanName = (name: string) => name.replace(/\s\(\d+\)$/, "")
const displayName = (a: DiscogsArtist) => cleanName(a.anv || a.name)
const artistLine = (artists: Array<DiscogsArtist> = []) =>
  artists.map(displayName).join(", ")

/** Discogs serves a 1×1 spacer gif when there's no image. */
const image = (url?: string): ImageRef | undefined =>
  url && !url.endsWith("spacer.gif")
    ? { provider: "discogs", path: url }
    : undefined

/** "Vinyl, LP, Album, Reissue, 180 Gram, Light Green" */
function formatLine(formats: Array<DiscogsFormat> = []) {
  return (
    formats
      .map((f) =>
        [
          f.qty && f.qty !== "1" ? `${f.qty}× ${f.name}` : f.name,
          ...(f.descriptions ?? []),
          f.text,
        ]
          .filter(Boolean)
          .join(", ")
      )
      .join(" + ") || undefined
  )
}

/** Group credits by role, keeping Discogs' order: "Producer – A, B". */
function groupCredits(raw: Array<DiscogsCreditRaw> = []): Array<Credit> {
  const groups = new Map<string, Credit>()
  for (const credit of raw) {
    // A credit can have several roles: "Written-By, Arranged By".
    for (const role of (credit.role ?? "").split(/,\s*(?![^[]*\])/)) {
      if (!role) continue
      const tracks = credit.tracks || undefined
      const key = `${role}|${tracks ?? ""}`
      const group = groups.get(key) ?? { role, names: [], tracks }
      const name = displayName(credit)
      if (!group.names.includes(name)) group.names.push(name)
      groups.set(key, group)
    }
  }
  return [...groups.values()]
}

/** Discogs video URIs are YouTube watch URLs; keep the video id. */
function youtubeKey(uri: string) {
  try {
    const url = new URL(uri)
    return url.hostname.includes("youtu.be")
      ? url.pathname.slice(1)
      : (url.searchParams.get("v") ?? undefined)
  } catch {
    return undefined
  }
}

/** Search results are titled "Artist - Title". */
function splitTitle(raw: string) {
  const index = raw.indexOf(" - ")
  return index === -1
    ? { artist: undefined, title: raw }
    : { artist: cleanName(raw.slice(0, index)), title: raw.slice(index + 3) }
}

/** Text and/or filters (artist, label, genre, style, year, country, format). */
export async function searchDiscogs(
  query: string | undefined,
  filters: SearchFilters = {}
): Promise<Array<MediaSummary>> {
  const format = filters.format === "all" ? undefined : (filters.format ?? "Vinyl")
  const params: Record<string, string | undefined> = {
    q: query,
    type: "release",
    format,
    artist: filters.artist,
    label: filters.label,
    genre: filters.genre,
    style: filters.style,
    country: filters.country,
    // Discogs filters one year; a range uses its start.
    year: filters.from ? String(filters.from) : undefined,
    per_page: "40",
  }
  const data = await discogs<{ results: Array<DiscogsSearchResult> }>(
    "/database/search",
    Object.fromEntries(
      Object.entries(params).filter((e): e is [string, string] => Boolean(e[1]))
    )
  )
  return data.results.map((r) => {
    const { artist, title } = splitTitle(r.title)
    // The format filter is shared by every result; show what differs.
    const descriptors = (r.format ?? []).filter((f) => f !== format)
    const variant = (r.formats ?? [])
      .map((f) => f.text)
      .filter(Boolean)
      .join(", ")
    return {
      type: "record",
      id: r.id,
      title,
      subtitle: artist,
      year: r.year ? Number(r.year) || undefined : undefined,
      poster: image(r.cover_image || r.thumb),
      pressing: {
        label: r.label?.[0] ? cleanName(r.label[0]) : undefined,
        catno: r.catno && r.catno !== "none" ? r.catno : undefined,
        country: r.country || undefined,
        format: [...new Set(descriptors)],
        variant: variant || undefined,
      },
    }
  })
}

export async function fetchRelease(id: number): Promise<Release> {
  const r = await discogs<DiscogsRelease>(`/releases/${id}`)
  const images = (r.images ?? []).flatMap((i) => image(i.uri) ?? [])
  const primary = r.images?.find((i) => i.type === "primary") ?? r.images?.[0]
  const rating = r.community?.rating
  return {
    type: "record",
    id: r.id,
    masterId: r.master_id || undefined,
    title: r.title,
    artists: (r.artists ?? []).map(displayName),
    year: r.year || undefined,
    released: r.released || undefined,
    country: r.country || undefined,
    labels: (r.labels ?? []).map((l) => ({
      name: cleanName(l.name),
      catno: l.catno && l.catno !== "none" ? l.catno : undefined,
    })),
    format: formatLine(r.formats),
    genres: r.genres ?? [],
    styles: r.styles ?? [],
    tracklist: (r.tracklist ?? []).map((t) => ({
      kind:
        t.type_ === "heading"
          ? ("heading" as const)
          : t.type_ === "index"
            ? ("index" as const)
            : ("track" as const),
      position: t.position,
      title: t.title,
      duration: t.duration || undefined,
      artists: (t.artists ?? []).map(displayName),
      credits: groupCredits(t.extraartists),
      subTracks: t.sub_tracks?.map((st) => ({
        position: st.position,
        title: st.title,
        duration: st.duration || undefined,
      })),
    })),
    credits: groupCredits(r.extraartists),
    companies: (r.companies ?? []).map((c) => ({
      role: c.entity_type_name ?? "Company",
      name: cleanName(c.name),
      catno: c.catno || undefined,
    })),
    identifiers: (r.identifiers ?? []).map((i) => ({
      type: i.type,
      description: i.description || undefined,
      value: i.value,
    })),
    notes: r.notes?.trim() || undefined,
    series: (r.series ?? []).map((s) =>
      s.catno ? `${cleanName(s.name)} – ${s.catno}` : cleanName(s.name)
    ),
    // Discogs sometimes lists the same video more than once.
    videos: [
      ...new Map(
        (r.videos ?? []).flatMap((v) => {
          const key = youtubeKey(v.uri)
          return key ? [[key, { key, name: v.title ?? "Video" }] as const] : []
        })
      ).values(),
    ],
    providerRating:
      rating && rating.count > 0
        ? { source: "discogs", value: rating.average, count: rating.count }
        : undefined,
    community:
      r.community?.have !== undefined && r.community.want !== undefined
        ? { have: r.community.have, want: r.community.want }
        : undefined,
    forSale: r.num_for_sale,
    lowestPrice: r.lowest_price ?? undefined,
    discogsUrl: r.uri,
    cover: image(primary?.uri),
    images,
  }
}

type DiscogsMaster = { id: number; year?: number; main_release?: number }
type DiscogsVersion = {
  id: number
  title: string
  format?: string
  label?: string
  catno?: string
  country?: string
  released?: string
  thumb?: string
  stats?: { community?: { in_collection?: number; in_wantlist?: number } }
}

/** The master's original year and its pressings, oldest first. */
export async function fetchMaster(id: number): Promise<MasterRelease> {
  const [master, versions] = await Promise.all([
    discogs<DiscogsMaster>(`/masters/${id}`),
    discogs<{ pagination: { items: number }; versions: Array<DiscogsVersion> }>(
      `/masters/${id}/versions`,
      { per_page: "100", sort: "released", sort_order: "asc" }
    ),
  ])
  return {
    id: master.id,
    year: master.year || undefined,
    mainReleaseId: master.main_release,
    totalVersions: versions.pagination.items,
    versions: versions.versions.map((v) => ({
      id: v.id,
      title: v.title,
      format: v.format || undefined,
      label: v.label ? cleanName(v.label) : undefined,
      catno: v.catno && v.catno !== "none" ? v.catno : undefined,
      country: v.country || undefined,
      year: v.released
        ? Number(v.released.slice(0, 4)) || undefined
        : undefined,
      thumb: image(v.thumb),
      have: v.stats?.community?.in_collection,
      want: v.stats?.community?.in_wantlist,
    })),
  }
}

async function fetchUsername() {
  const identity = await discogs<{ username: string }>("/oauth/identity")
  return identity.username
}

/** "Very Good Plus (VG+)" → "VG+"; "Near Mint (NM or M-)" → "NM". */
function parseGrade(value?: string): Grade | undefined {
  const code = value?.match(/\(([^)]+)\)/)?.[1]?.split(" ")[0]
  const grades: Array<Grade> = ["M", "NM", "VG+", "VG", "G+", "G", "F", "P"]
  return grades.find((g) => g === code)
}

/**
 * Your whole Discogs collection as drafts for the local archive. Discogs
 * custom fields are mapped by name (defaults: Media Condition, Sleeve
 * Condition, Notes), so renamed or extra fields end up in notes.
 */
export async function fetchDiscogsCollection(): Promise<{
  username: string
  items: Array<CollectionItemDraft>
}> {
  const username = await fetchUsername()
  const base = `/users/${encodeURIComponent(username)}/collection`

  const [{ fields }, { folders }] = await Promise.all([
    discogs<{ fields: Array<{ id: number; name: string }> }>(`${base}/fields`),
    discogs<{ folders: Array<{ id: number; name: string }> }>(
      `${base}/folders`
    ),
  ])
  const fieldName = new Map(fields.map((f) => [f.id, f.name.toLowerCase()]))
  const folderName = new Map(folders.map((f) => [f.id, f.name]))

  const releases: Array<DiscogsCollectionRelease> = []
  for (let page = 1; ; page++) {
    const data = await discogs<{
      pagination: { pages: number }
      releases: Array<DiscogsCollectionRelease>
    }>(`${base}/folders/0/releases`, {
      per_page: "100",
      page: String(page),
      sort: "added",
      sort_order: "desc",
    })
    releases.push(...data.releases)
    if (page >= data.pagination.pages) break
  }

  const items = releases.map((r): CollectionItemDraft => {
    const info = r.basic_information
    const notes = new Map<string, string>()
    for (const note of r.notes ?? []) {
      const name = fieldName.get(note.field_id)
      if (name && note.value) notes.set(name, note.value)
    }
    const extraNotes = [...notes.entries()]
      .filter(
        ([name]) =>
          !["media condition", "sleeve condition", "notes"].includes(name)
      )
      .map(([name, value]) => `${name}: ${value}`)
    const folder = folderName.get(r.folder_id)

    return {
      type: "record",
      releaseId: info.id,
      title: info.title,
      artist: artistLine(info.artists),
      year: info.year || undefined,
      format: formatLine(info.formats),
      label: info.labels?.[0] ? cleanName(info.labels[0].name) : undefined,
      catno: info.labels?.[0]?.catno,
      genres: info.genres ?? [],
      styles: info.styles ?? [],
      cover: image(info.cover_image),
      mediaCondition: parseGrade(notes.get("media condition")),
      sleeveCondition: parseGrade(notes.get("sleeve condition")),
      notes:
        [notes.get("notes"), ...extraNotes].filter(Boolean).join("\n") ||
        undefined,
      // Discogs rates 1–5 whole stars; we store 1–10.
      rating: r.rating > 0 ? r.rating * 2 : undefined,
      folder: folder && folder !== "Uncategorized" ? folder : undefined,
      discogsInstanceId: r.instance_id,
      addedAt: new Date(r.date_added).toISOString(),
    }
  })

  return { username, items }
}

/** Discogs' marketplace estimate for the whole collection, e.g. "$1,234.56". */
export async function fetchCollectionValue() {
  const username = await fetchUsername()
  const value = await discogs<{
    minimum: string
    median: string
    maximum: string
  }>(`/users/${encodeURIComponent(username)}/collection/value`)
  return value
}
