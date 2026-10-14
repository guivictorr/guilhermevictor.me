import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import type { Flight } from "@workspace/schemas"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { PencilIcon, PlusIcon, RouteIcon } from "lucide-react"
import { useState } from "react"
import { BackButton, FactList, SideCard } from "@/components/detail-layout"
import { BoardingPass } from "@/components/flights/boarding-pass"
import { FlightMap, routeKey } from "@/components/flights/flight-map"
import { FlightSheet, useFlightSheet } from "@/components/flights/flight-sheet"
import { NotFound } from "@/components/not-found"
import { airportsQuery, countryName } from "@/lib/airports"
import type { Airport, AirportIndex } from "@/lib/airports"
import { aircraftImageCandidates } from "@/lib/aircraft"
import { groundMinutes } from "@/lib/flight-trips"
import { formatDate } from "@/lib/format"
import {
  flightFacts,
  formatDuration,
  formatKm,
  localDate,
  localTime,
} from "@/lib/flight-math"
import { flightsQuery } from "@/queries/archive"

export const Route = createFileRoute("/flights/$id")({
  head: () => ({ meta: [{ title: "Flight · Archive" }] }),
  component: FlightPage,
})

function FlightPage() {
  const { id } = Route.useParams()
  const { data: flights, isPending } = useQuery(flightsQuery())
  const { data: airports } = useQuery(airportsQuery())
  const sheet = useFlightSheet()

  if (isPending)
    return (
      <div className="pt-safe px-safe md:px-8">
        <Skeleton className="mt-6 h-56 rounded-2xl" />
      </div>
    )
  const flight = flights?.find((f) => f.id === id)
  if (!flight) return <NotFound />

  const facts = flightFacts(flight, airports)
  const shift = facts.tzShiftHours
  // Other legs of the same booking, in the order flown.
  const reservation = flight.reservation?.trim().toUpperCase()
  const trip = reservation
    ? (flights ?? [])
        .filter((f) => f.reservation?.trim().toUpperCase() === reservation)
        .sort((a, b) => a.departure.localeCompare(b.departure))
    : [flight]
  const tripRoutes = trip.flatMap((f) => {
    const leg = flightFacts(f, airports)
    return leg.from && leg.to ? [{ from: leg.from, to: leg.to, count: 1 }] : []
  })
  const sameRouteCount =
    flights?.filter(
      (f) =>
        (f.from === flight.from && f.to === flight.to) ||
        (f.from === flight.to && f.to === flight.from)
    ).length ?? 0

  return (
    <article className="pt-safe px-safe pb-8 md:px-8">
      <div className="flex items-center justify-between pt-3 md:pt-6">
        <BackButton fallback="/flights" />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => sheet.openConnection(flight)}
          >
            <PlusIcon />
            Add connection
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => sheet.openEdit(flight)}
          >
            <PencilIcon />
            Edit
          </Button>
        </div>
      </div>

      <p className="type-overline mt-5 text-signal-text">
        Flight{flight.flightNumber ? ` ${flight.flightNumber}` : ""}
      </p>
      <h1 className="type-title mt-2 text-[1.75rem] md:text-[2.5rem]">
        {facts.from?.city ?? flight.from} → {facts.to?.city ?? flight.to}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatDate(localDate(flight.departure))}
        {flight.airline ? ` · ${flight.airline}` : ""}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <BoardingPass flight={flight} facts={facts} />
          {tripRoutes.length ? (
            <FlightMap
              routes={tripRoutes}
              highlight={
                trip.length > 1
                  ? new Set([routeKey(flight.from, flight.to)])
                  : undefined
              }
            />
          ) : null}
          {trip.length > 1 ? (
            <TripLegs trip={trip} currentId={flight.id} airports={airports} />
          ) : null}
          {flight.notes ? (
            <section>
              <h2 className="mb-2 font-heading text-lg font-semibold">Notes</h2>
              <p className="rounded-xl border bg-card px-4 py-3 text-sm whitespace-pre-line">
                {flight.notes}
              </p>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <AircraftCard key={flight.id} aircraft={flight.aircraft} />
          <SideCard title="Flight">
            <FactList
              facts={[
                [
                  "Distance",
                  facts.distanceKm !== undefined
                    ? formatKm(facts.distanceKm)
                    : undefined,
                ],
                ["Duration", formatDuration(facts.durationMin)],
                [
                  "Clock change",
                  shift
                    ? `${shift > 0 ? "+" : ""}${shift}h`
                    : shift === 0
                      ? "None"
                      : undefined,
                ],
                ["Departure", `${localTime(flight.departure)} local`],
                [
                  "Arrival",
                  flight.arrival
                    ? `${localTime(flight.arrival)} local`
                    : undefined,
                ],
                [
                  "This route",
                  sameRouteCount > 1 ? `${sameRouteCount} flights` : undefined,
                ],
              ]}
            />
          </SideCard>
          {facts.from ? (
            <AirportCard title="From" airport={facts.from} />
          ) : null}
          {facts.to ? <AirportCard title="To" airport={facts.to} /> : null}
        </aside>
      </div>

      <FlightSheet {...sheet.sheetProps} />
    </article>
  )
}

/** The booking's legs as compact passes, with time on the ground between. */
function TripLegs({
  trip,
  currentId,
  airports,
}: {
  trip: Array<Flight>
  currentId: string
  airports?: AirportIndex
}) {
  return (
    <section>
      <h2 className="type-heading mb-3 text-lg">
        This trip{" "}
        <span className="font-normal text-muted-foreground tabular-nums">
          {trip.length} flights
        </span>
      </h2>
      <ol className="space-y-1">
        {trip.map((leg, i) => {
          const previous = trip[i - 1]
          const ground = previous ? groundMinutes(previous, leg) : undefined
          const current = leg.id === currentId
          return (
            <li key={leg.id}>
              {previous ? (
                <p className="flex items-center gap-1.5 px-3 py-1 text-xs text-muted-foreground">
                  <RouteIcon className="size-3.5" />
                  {ground === undefined
                    ? `Then from ${leg.from}`
                    : ground < 24 * 60
                      ? `${formatDuration(ground)} connection in ${leg.from}`
                      : `${Math.round(ground / (24 * 60))} days in ${leg.from}`}
                </p>
              ) : null}
              {current ? (
                <BoardingPass
                  flight={leg}
                  facts={flightFacts(leg, airports)}
                  compact
                  className="outline-2 outline-primary"
                />
              ) : (
                <Link
                  to="/flights/$id"
                  params={{ id: leg.id }}
                  className="pressable block rounded-[24px]"
                >
                  <BoardingPass
                    flight={leg}
                    facts={flightFacts(leg, airports)}
                    compact
                  />
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** Shows the owner's photo for this aircraft, if one is in public/aircraft. */
function AircraftCard({ aircraft }: { aircraft?: string }) {
  const candidates = aircraftImageCandidates(aircraft)
  const [index, setIndex] = useState(0)
  const src = candidates[index]
  if (!aircraft || !src) return null
  return (
    <SideCard title="Aircraft">
      <img
        src={src}
        alt={aircraft}
        loading="lazy"
        decoding="async"
        // Try the next, broader name; after the last one, hide the card.
        onError={() => setIndex((i) => i + 1)}
        className="aspect-[2/1] w-full object-contain"
      />
      <p className="mt-2 text-sm font-medium">{aircraft}</p>
    </SideCard>
  )
}

function AirportCard({ title, airport }: { title: string; airport: Airport }) {
  return (
    <SideCard title={title}>
      <p className="font-semibold">
        {airport.iata} · {airport.city}
      </p>
      <p className="text-sm text-muted-foreground">{airport.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {countryName(airport.country)} · {airport.tz.replace(/_/g, " ")}
      </p>
    </SideCard>
  )
}
