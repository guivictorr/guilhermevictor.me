import type { Flight } from "@workspace/schemas"
import type { Airport, AirportIndex } from "./airports"

export const EARTH_CIRCUMFERENCE_KM = 40_075
export const MOON_DISTANCE_KM = 384_400

/** Great-circle distance in km (haversine). */
export function distanceKm(
  a: Pick<Airport, "lat" | "lon">,
  b: Pick<Airport, "lat" | "lon">
) {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

/** Offset (minutes) of `timeZone` from UTC at a given instant. */
function offsetMinutes(timeZone: string, at: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at)
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  )
  return (asUtc - at.getTime()) / 60_000
}

/**
 * Converts a boarding-pass local time ("2024-06-13T08:07") at an airport's
 * timezone into a real instant. Two passes handle DST edges.
 */
export function localToUtc(local: string, timeZone: string) {
  const naive = new Date(`${local.length === 16 ? `${local}:00` : local}Z`)
  let utc = naive.getTime() - offsetMinutes(timeZone, naive) * 60_000
  utc = naive.getTime() - offsetMinutes(timeZone, new Date(utc)) * 60_000
  return new Date(utc)
}

export type FlightFacts = {
  from?: Airport
  to?: Airport
  distanceKm?: number
  /** Minutes in the air, from local times + timezones. */
  durationMin?: number
  /** Hours the clock moves between origin and destination. */
  tzShiftHours?: number
}

export function flightFacts(
  flight: Flight,
  airports?: AirportIndex
): FlightFacts {
  const from = airports?.byCode.get(flight.from)
  const to = airports?.byCode.get(flight.to)
  const facts: FlightFacts = { from, to }
  if (from && to) {
    facts.distanceKm = distanceKm(from, to)
    if (flight.arrival) {
      const dep = localToUtc(flight.departure, from.tz)
      const arr = localToUtc(flight.arrival, to.tz)
      const minutes = Math.round((arr.getTime() - dep.getTime()) / 60_000)
      // A negative duration means a typo in the times; don't show nonsense.
      if (minutes > 0 && minutes < 24 * 60) facts.durationMin = minutes
      facts.tzShiftHours =
        (offsetMinutes(to.tz, arr) - offsetMinutes(from.tz, dep)) / 60
    }
  }
  return facts
}

export function formatDuration(minutes: number | undefined) {
  if (minutes === undefined) return undefined
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`
}

export const formatKm = (km: number) => `${Math.round(km).toLocaleString()} km`

/** "08:07" from a local datetime string. */
export const localTime = (local: string) => local.slice(11, 16)
export const localDate = (local: string) => local.slice(0, 10)

/** Airline IATA code from a flight number ("G32054" → "G3"). */
export function airlineCode(flightNumber?: string) {
  const match = flightNumber?.match(/^([A-Z0-9]{2})(?=\d)/)
  return match?.[1]
}

/** Window/aisle from the seat letter on a typical narrow-body (3-3) layout. */
export function seatPosition(
  seat?: string
): "window" | "aisle" | "middle" | undefined {
  const letter = seat?.match(/[A-K]$/)?.[0]
  if (!letter) return undefined
  if (letter === "A" || letter === "F" || letter === "K") return "window"
  if (letter === "C" || letter === "D") return "aisle"
  return "middle"
}
