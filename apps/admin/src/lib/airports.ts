import { queryOptions, useQuery } from "@tanstack/react-query"

export type Airport = {
  iata: string
  name: string
  city: string
  /** ISO 3166-1 alpha-2, e.g. "BR". */
  country: string
  lat: number
  lon: number
  /** IANA timezone, e.g. "America/Fortaleza". */
  tz: string
}

type Row = [string, string, string, string, number, number, string]

export type AirportIndex = {
  byCode: Map<string, Airport>
  list: Array<Airport>
}

/**
 * ~8k airports (public/data/airports.json, built by scripts/build-airports.mjs).
 * Loaded on demand by flight screens and kept for the whole session.
 */
export const airportsQuery = () =>
  queryOptions({
    queryKey: ["static", "airports"],
    queryFn: async (): Promise<AirportIndex> => {
      const res = await fetch("/data/airports.json")
      if (!res.ok) throw new Error("Couldn't load airport data")
      const { rows } = (await res.json()) as { rows: Array<Row> }
      const list = rows.map(([iata, name, city, country, lat, lon, tz]) => ({
        iata,
        name,
        city,
        country,
        lat,
        lon,
        tz,
      }))
      return { byCode: new Map(list.map((a) => [a.iata, a])), list }
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })

export const useAirports = () => useQuery(airportsQuery()).data

const regionNames = new Intl.DisplayNames(["en"], { type: "region" })
export function countryName(code: string) {
  try {
    return regionNames.of(code) ?? code
  } catch {
    return code
  }
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()

/**
 * Ranked airport search: exact code first, then code prefix, then city,
 * then name. `preferred` (airports you've flown) float up on ties.
 */
export function searchAirports(
  index: AirportIndex,
  query: string,
  preferred: Set<string> = new Set(),
  limit = 20
): Array<Airport> {
  const q = normalize(query.trim())
  if (!q) return index.list.filter((a) => preferred.has(a.iata)).slice(0, limit)

  const scored: Array<[number, Airport]> = []
  for (const airport of index.list) {
    const code = airport.iata.toLowerCase()
    const city = normalize(airport.city)
    const name = normalize(airport.name)
    let score =
      code === q
        ? 100
        : code.startsWith(q)
          ? 80
          : city.startsWith(q)
            ? 60
            : city.includes(q)
              ? 40
              : name.includes(q)
                ? 20
                : 0
    if (!score) continue
    if (preferred.has(airport.iata)) score += 10
    scored.push([score, airport])
  }
  return scored
    .sort((a, b) => b[0] - a[0] || a[1].iata.localeCompare(b[1].iata))
    .slice(0, limit)
    .map(([, airport]) => airport)
}
