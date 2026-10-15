import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import type { Flight } from "@workspace/schemas"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { PencilIcon, PlusIcon, RouteIcon } from "lucide-react"
import { useState } from "react"
import { BackButton } from "@/components/detail-layout"
import { BoardingPass } from "@/components/flights/boarding-pass"
import { FlightMap, routeKey } from "@/components/flights/flight-map"
import { FlightSheet, useFlightSheet } from "@/components/flights/flight-sheet"
import { NotFound } from "@/components/not-found"
import { airportsQuery } from "@/lib/airports"
import type { AirportIndex } from "@/lib/airports"
import { aircraftImageCandidates } from "@/lib/aircraft"
import { groundMinutes } from "@/lib/flight-trips"
import { formatDate } from "@/lib/format"
import { flightFacts, formatDuration, localDate } from "@/lib/flight-math"
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

      <div className="mt-6 space-y-6">
        <BoardingPass flight={flight} facts={facts} />
        {/* The booking's legs beside the map of the whole trip. */}
        <div
          className={cn(
            "grid items-start gap-6",
            trip.length > 1 && "lg:grid-cols-2"
          )}
        >
          {trip.length > 1 ? (
            <TripLegs trip={trip} currentId={flight.id} airports={airports} />
          ) : null}
          {tripRoutes.length ? (
            <FlightMap
              routes={tripRoutes}
              highlight={
                trip.length > 1
                  ? new Set([routeKey(flight.from, flight.to)])
                  : undefined
              }
              className={trip.length > 1 ? "lg:sticky lg:top-6" : undefined}
            />
          ) : null}
        </div>
        <AircraftPhoto key={flight.id} aircraft={flight.aircraft} />
        {flight.notes ? (
          <section>
            <h2 className="type-heading mb-2 text-lg">Notes</h2>
            <p className="rounded-[20px] border bg-card px-4 py-3 text-sm whitespace-pre-line">
              {flight.notes}
            </p>
          </section>
        ) : null}
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

/** The owner's photo of this aircraft, if one is in public/aircraft. */
function AircraftPhoto({ aircraft }: { aircraft?: string }) {
  const candidates = aircraftImageCandidates(aircraft)
  const [index, setIndex] = useState(0)
  const src = candidates[index]
  if (!aircraft || !src) return null
  return (
    <figure>
      <img
        src={src}
        alt={aircraft}
        loading="lazy"
        decoding="async"
        // Try the next, broader name; after the last one, nothing shows.
        onError={() => setIndex((i) => i + 1)}
        className="mx-auto aspect-[2/1] w-full max-w-2xl object-contain"
      />
      <figcaption className="mt-2 text-center text-sm text-muted-foreground">
        {aircraft}
      </figcaption>
    </figure>
  )
}
