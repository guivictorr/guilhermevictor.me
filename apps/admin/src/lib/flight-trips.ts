import type { Flight, FlightInput } from "@workspace/schemas"
import { airlineCode } from "./flight-math"
import type { FlightWithFacts } from "./flight-stats"

/** Flights booked together (same booking code), legs in the order flown. */
export type Trip = {
  key: string
  reservation?: string
  legs: Array<FlightWithFacts>
}

/** Groups by booking code; newest trip first, legs oldest first. */
export function groupTrips(rows: Array<FlightWithFacts>): Array<Trip> {
  const trips = new Map<string, Trip>()
  for (const row of rows) {
    const reservation = row.flight.reservation?.trim().toUpperCase()
    const key = reservation ? `pnr:${reservation}` : `flight:${row.flight.id}`
    const trip = trips.get(key) ?? { key, reservation, legs: [] }
    trip.legs.push(row)
    trips.set(key, trip)
  }
  for (const trip of trips.values())
    trip.legs.sort((a, b) =>
      a.flight.departure.localeCompare(b.flight.departure)
    )
  return [...trips.values()].sort((a, b) =>
    lastDeparture(b).localeCompare(lastDeparture(a))
  )
}

const lastDeparture = (trip: Trip) => trip.legs.at(-1)?.flight.departure ?? ""

/**
 * Time on the ground between two legs at the same airport. Both times are
 * local to that airport, so a plain difference is right.
 */
export function groundMinutes(previous: Flight, next: Flight) {
  if (!previous.arrival || previous.to !== next.from) return undefined
  const minutes =
    (Date.parse(`${next.departure}Z`) - Date.parse(`${previous.arrival}Z`)) /
    60_000
  return minutes > 0 ? Math.round(minutes) : undefined
}

/**
 * A new flight continuing from `flight`: leaves where it landed, when it
 * landed, same booking, airline and class. You fill in the rest.
 */
export function connectionTemplate(
  flight: Pick<
    FlightInput,
    | "to"
    | "departure"
    | "arrival"
    | "flightNumber"
    | "airline"
    | "cabin"
    | "reservation"
  >
): Partial<FlightInput> {
  return {
    from: flight.to,
    departure: flight.arrival ?? flight.departure,
    flightNumber: airlineCode(flight.flightNumber),
    airline: flight.airline,
    cabin: flight.cabin,
    reservation: flight.reservation,
  }
}
