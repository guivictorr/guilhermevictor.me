import { queryOptions, useQuery } from "@tanstack/react-query"

export type AircraftType = {
  /** ICAO type designator, e.g. "B738". What flights store. */
  icao: string
  /** e.g. "Boeing 737-800". */
  name: string
  /** IATA code, e.g. "738" (empty when there isn't one). */
  iata: string
}

type Row = [string, string, string]

export type AircraftIndex = {
  byCode: Map<string, AircraftType>
  list: Array<AircraftType>
}

/** Builds the index from aircraft.json rows (also used by node scripts). */
export function aircraftIndex(rows: Array<Row>): AircraftIndex {
  const list = rows.map(([icao, name, iata]) => ({ icao, name, iata }))
  return { byCode: new Map(list.map((a) => [a.icao, a])), list }
}

/**
 * ~230 types (public/data/aircraft.json, built by scripts/build-aircraft.mjs).
 * Loaded by flight screens and kept for the whole session.
 */
export const aircraftTypesQuery = () =>
  queryOptions({
    queryKey: ["static", "aircraft"],
    queryFn: async () => {
      const res = await fetch("/data/aircraft.json")
      if (!res.ok) throw new Error("Couldn't load aircraft data")
      const { rows } = (await res.json()) as { rows: Array<Row> }
      return aircraftIndex(rows)
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })

export const useAircraftTypes = () => useQuery(aircraftTypesQuery()).data

/** What to call a flight's aircraft: its type's name, else what was typed. */
export function aircraftName(
  flight: { aircraft?: string; aircraftType?: string },
  types?: AircraftIndex
) {
  if (flight.aircraftType)
    return types?.byCode.get(flight.aircraftType)?.name ?? flight.aircraftType
  return flight.aircraft
}

/** "Boeing 737-800 JET" → ["boeing", "737", "800", "jet"]; "E195-E2" → ["e", "195", "e", "2"]. */
const tokens = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .match(/[a-z]+|\d+/g) ?? []

/**
 * Ranked search for the flight form: code first, then names whose words
 * start with every word typed ("boeing 737 8" finds the 737-800 and the
 * 737 MAX 8). Types you've flown (`preferred`) float up.
 */
export function searchAircraft(
  index: AircraftIndex,
  query: string,
  preferred: Set<string> = new Set(),
  limit = 20
): Array<AircraftType> {
  const q = query.trim().toLowerCase()
  if (!q) return index.list.filter((a) => preferred.has(a.icao)).slice(0, limit)
  const words = tokens(q)
  const scored: Array<[number, AircraftType]> = []
  for (const type of index.list) {
    const codes = [type.icao.toLowerCase(), type.iata.toLowerCase()]
    const name = tokens(type.name)
    let score = codes.includes(q)
      ? 100
      : codes.some((c) => c && c.startsWith(q))
        ? 80
        : words.length && words.every((w) => name.some((n) => n.startsWith(w)))
          ? 50
          : 0
    if (!score) continue
    if (preferred.has(type.icao)) score += 10
    scored.push([score, type])
  }
  return scored
    .sort((a, b) => b[0] - a[0] || a[1].name.localeCompare(b[1].name))
    .slice(0, limit)
    .map(([, type]) => type)
}

/**
 * The type a free-text name means, or undefined when unsure. Every word
 * and number of the type's name must appear in the text (one-letter
 * tokens ignored); the most specific
 * type wins ("Airbus A320neo" over "Airbus A320", "BOEING 737-800 JET" →
 * Boeing 737-800). A bare code ("B738", "738") also works.
 */
export function matchAircraft(
  index: AircraftIndex,
  text: string | undefined
): AircraftType | undefined {
  const raw = text?.trim()
  if (!raw) return undefined
  const upper = raw.toUpperCase()
  const byCode =
    index.byCode.get(upper) ?? index.list.find((t) => t.iata === upper)
  if (byCode) return byCode
  // Single letters are noise here: "E195-E2" vs "195 E2", "A320" vs "320".
  const meaningful = (s: string) =>
    tokens(s).filter((w) => w.length > 1 || /\d/.test(w))
  const words = meaningful(raw)
  const count = (list: Array<string>) =>
    list.reduce(
      (m, w) => m.set(w, (m.get(w) ?? 0) + 1),
      new Map<string, number>()
    )
  const have = count(words)
  let best: AircraftType | undefined
  let bestSize = 0
  let tie = false
  for (const type of index.list) {
    const need = meaningful(type.name)
    const fits = [...count(need)].every(([w, n]) => (have.get(w) ?? 0) >= n)
    if (!fits) continue
    if (need.length > bestSize) {
      best = type
      bestSize = need.length
      tie = false
    } else if (need.length === bestSize) tie = true
  }
  return tie ? undefined : best
}
