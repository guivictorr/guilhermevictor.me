import type { Flight } from "@workspace/schemas"
import type { Airport, AirportIndex } from "./airports"
import { flightFacts, seatPosition } from "./flight-math"
import type { FlightFacts } from "./flight-math"
import type { Route } from "@/components/flights/flight-map"

export type FlightWithFacts = { flight: Flight; facts: FlightFacts }

const countBy = <T>(items: Array<T>, key: (item: T) => string | undefined) => {
  const counts = new Map<string, number>()
  for (const item of items) {
    const k = key(item)
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

export function computeFlightStats(
  flights: Array<Flight>,
  airports?: AirportIndex
) {
  const rows: Array<FlightWithFacts> = flights.map((flight) => ({
    flight,
    facts: flightFacts(flight, airports),
  }))

  const distanceKm = rows.reduce((sum, r) => sum + (r.facts.distanceKm ?? 0), 0)
  const minutes = rows.reduce((sum, r) => sum + (r.facts.durationMin ?? 0), 0)

  const visited = new Map<string, Airport>()
  for (const r of rows) {
    if (r.facts.from) visited.set(r.facts.from.iata, r.facts.from)
    if (r.facts.to) visited.set(r.facts.to.iata, r.facts.to)
  }

  // The map keeps each direction (planes fly the way you did); "top route"
  // counts A⇄B together.
  const routes = new Map<string, Route>()
  const pairs = new Map<string, Route>()
  for (const r of rows) {
    const { from, to } = r.facts
    if (!from || !to) continue
    const directed = routes.get(`${from.iata}-${to.iata}`) ?? {
      from,
      to,
      count: 0,
    }
    directed.count++
    routes.set(`${from.iata}-${to.iata}`, directed)
    const [a, b] = [from, to].sort((x, y) => x.iata.localeCompare(y.iata))
    const pairKey = `${a!.iata}-${b!.iata}`
    const pair = pairs.get(pairKey) ?? { from: a!, to: b!, count: 0 }
    pair.count++
    pairs.set(pairKey, pair)
  }

  const withDistance = rows.filter((r) => r.facts.distanceKm !== undefined)
  const byDistance = [...withDistance].sort(
    (a, b) => b.facts.distanceKm! - a.facts.distanceKm!
  )
  const seats = countBy(rows, (r) => seatPosition(r.flight.seat))

  return {
    rows,
    count: flights.length,
    distanceKm,
    minutes,
    airports: [...visited.values()],
    countries: new Set([...visited.values()].map((a) => a.country)),
    routes: [...routes.values()],
    longest: byDistance.at(0),
    shortest: byDistance.at(-1),
    topRoutes: [...pairs.values()].sort((a, b) => b.count - a.count),
    topAirports: countBy(
      rows.flatMap((r) => [r.flight.from, r.flight.to]),
      (x) => x
    ),
    topAirlines: countBy(rows, (r) => r.flight.airline),
    // By ICAO type, so "BOEING 737-800 JET" and "Boeing 737-800" are one.
    topAircraft: countBy(
      rows,
      (r) => r.flight.aircraftType ?? r.flight.aircraft
    ),
    seats: Object.fromEntries(seats) as Partial<
      Record<"window" | "aisle" | "middle", number>
    >,
    byYear: countBy(rows, (r) => r.flight.departure.slice(0, 4)).sort((a, b) =>
      a[0].localeCompare(b[0])
    ),
  }
}

export type FlightStats = ReturnType<typeof computeFlightStats>
