import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import type { Flight } from "@workspace/schemas"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { PlaneTakeoffIcon, PlusIcon, RouteIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { BoardingPass } from "@/components/flights/boarding-pass"
import { FlightMap, routeKey } from "@/components/flights/flight-map"
import { FlightSheet, useFlightSheet } from "@/components/flights/flight-sheet"
import { LibraryNav } from "@/components/library/library-nav"
import { PageBody, PageHeader } from "@/components/page-header"
import { aircraftName, useAircraftTypes } from "@/lib/aircraft-types"
import { airportsQuery, countryName } from "@/lib/airports"
import {
  EARTH_CIRCUMFERENCE_KM,
  MOON_DISTANCE_KM,
  formatDuration,
  formatKm,
} from "@/lib/flight-math"
import { computeFlightStats } from "@/lib/flight-stats"
import { groundMinutes, groupTrips } from "@/lib/flight-trips"
import type { Trip } from "@/lib/flight-trips"
import type { FlightStats } from "@/lib/flight-stats"
import { flightsQuery } from "@/queries/archive"

export const Route = createFileRoute("/flights/")({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(flightsQuery())
    // A static file fetched by the browser (relative URL), not on the server.
    if (typeof window !== "undefined")
      void context.queryClient.prefetchQuery(airportsQuery())
  },
  head: () => ({ meta: [{ title: "Flights · Archive" }] }),
  component: FlightsPage,
})

function FlightsPage() {
  const { data: flights, isPending } = useQuery(flightsQuery())
  const { data: airports } = useQuery(airportsQuery())
  const sheet = useFlightSheet()
  // Hovering a trip isolates its legs on the map (desktop).
  const [highlight, setHighlight] = useState<ReadonlySet<string>>()
  const stats = useMemo(
    () => computeFlightStats(flights ?? [], airports),
    [flights, airports]
  )

  return (
    <>
      <PageHeader
        title="Flights"
        actions={
          <Button size="lg" onClick={sheet.openNew}>
            <PlusIcon />
            <span className="max-sm:sr-only">Add flight</span>
          </Button>
        }
      />
      <PageBody className="space-y-6">
        <LibraryNav />
        {isPending ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : !flights?.length ? (
          <Empty className="min-h-[50dvh]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PlaneTakeoffIcon />
              </EmptyMedia>
              <EmptyTitle>No flights yet</EmptyTitle>
              <EmptyDescription>
                Log a flight with its airports and local times; distance and
                duration are worked out for you.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="lg" onClick={sheet.openNew}>
                <PlusIcon />
                Add flight
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <Totals stats={stats} />
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <div className="space-y-6 lg:sticky lg:top-6 lg:order-2">
                <FlightMap routes={stats.routes} highlight={highlight} />
                <Highlights stats={stats} />
              </div>
              <FlightList
                stats={stats}
                onAddConnection={sheet.openConnection}
                onHighlight={setHighlight}
              />
            </div>
          </>
        )}
      </PageBody>
      <FlightSheet {...sheet.sheetProps} />
    </>
  )
}

function Totals({ stats }: { stats: FlightStats }) {
  const hours = Math.round(stats.minutes / 60)
  const laps = stats.distanceKm / EARTH_CIRCUMFERENCE_KM
  const tiles = [
    { label: "Flights", value: stats.count.toLocaleString() },
    {
      label: "Distance",
      value: formatKm(stats.distanceKm),
      sub:
        laps >= 0.1
          ? `${laps.toFixed(1)}× around the Earth`
          : `${Math.round((stats.distanceKm / MOON_DISTANCE_KM) * 100)}% to the Moon`,
    },
    {
      label: "In the air",
      value: `${hours.toLocaleString()}h`,
      sub: hours >= 24 ? `${(hours / 24).toFixed(1)} days` : undefined,
    },
    { label: "Airports", value: stats.airports.length.toLocaleString() },
    {
      label: "Countries",
      value: stats.countries.size.toLocaleString(),
      sub: [...stats.countries].map(countryName).slice(0, 3).join(", "),
    },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="edge-highlight min-w-0 rounded-[20px] border bg-card p-4"
        >
          <div className="text-xs text-muted-foreground">{tile.label}</div>
          {/* Departure-board digits (Doto, ≥20px per design.md §4). */}
          <div className="mt-1 truncate font-dots text-[1.75rem]">
            {tile.value}
          </div>
          {tile.sub ? (
            <div className="truncate text-xs text-muted-foreground">
              {tile.sub}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function Highlights({ stats }: { stats: FlightStats }) {
  const aircraftTypes = useAircraftTypes()
  const top = (list: Array<[string, number]>) =>
    list[0] ? `${list[0][0]} · ${list[0][1]}×` : undefined
  const seats = stats.seats
  const seatTotal =
    (seats.window ?? 0) + (seats.aisle ?? 0) + (seats.middle ?? 0)
  const items = [
    [
      "Longest",
      stats.longest
        ? `${stats.longest.flight.from} → ${stats.longest.flight.to} · ${formatKm(stats.longest.facts.distanceKm!)}`
        : undefined,
    ],
    [
      "Shortest",
      stats.shortest && stats.shortest !== stats.longest
        ? `${stats.shortest.flight.from} → ${stats.shortest.flight.to} · ${formatKm(stats.shortest.facts.distanceKm!)}`
        : undefined,
    ],
    [
      "Top route",
      stats.topRoutes[0]
        ? `${stats.topRoutes[0].from.iata} ⇄ ${stats.topRoutes[0].to.iata} · ${stats.topRoutes[0].count}×`
        : undefined,
    ],
    ["Top airport", top(stats.topAirports)],
    ["Top airline", top(stats.topAirlines)],
    [
      "Top aircraft",
      top(
        stats.topAircraft.map(([key, n]) => [
          aircraftName({ aircraftType: key }, aircraftTypes) ?? key,
          n,
        ])
      ),
    ],
    [
      "Seat",
      seatTotal
        ? `${Math.round(((seats.window ?? 0) / seatTotal) * 100)}% window · ${Math.round(((seats.aisle ?? 0) / seatTotal) * 100)}% aisle`
        : undefined,
    ],
  ].filter((row): row is [string, string] => Boolean(row[1]))

  return (
    <section className="edge-highlight rounded-[20px] border bg-card p-4">
      <h2 className="mb-3 font-heading font-semibold">Highlights</h2>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 truncate text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function FlightList({
  stats,
  onAddConnection,
  onHighlight,
}: {
  stats: FlightStats
  onAddConnection: (flight: Flight) => void
  onHighlight: (keys: ReadonlySet<string> | undefined) => void
}) {
  // A trip belongs to the year of its first leg.
  const byYear = new Map<string, Array<Trip>>()
  for (const trip of groupTrips(stats.rows)) {
    const year = trip.legs[0]?.flight.departure.slice(0, 4) ?? ""
    byYear.set(year, [...(byYear.get(year) ?? []), trip])
  }
  return (
    <div className="space-y-6">
      {[...byYear.entries()].map(([year, trips]) => (
        <section key={year}>
          <h2 className="mb-3 font-heading text-lg font-semibold">
            {year}{" "}
            <span className="font-normal text-muted-foreground tabular-nums">
              {trips.reduce((n, t) => n + t.legs.length, 0)}
            </span>
          </h2>
          <ul className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 lg:grid-cols-1">
            {trips.map((trip) => {
              const keys = new Set(
                trip.legs.map((l) => routeKey(l.flight.from, l.flight.to))
              )
              return (
                <li
                  key={trip.key}
                  // Mouse only: on touch, hover would stick after a tap.
                  onPointerEnter={(e) =>
                    e.pointerType === "mouse" && onHighlight(keys)
                  }
                  onPointerLeave={() => onHighlight(undefined)}
                  onFocus={() => onHighlight(keys)}
                  onBlur={() => onHighlight(undefined)}
                >
                  <TripCard trip={trip} onAddConnection={onAddConnection} />
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** One flight, or every leg of a booking with the time on the ground between. */
function TripCard({
  trip,
  onAddConnection,
}: {
  trip: Trip
  onAddConnection: (flight: Flight) => void
}) {
  const last = trip.legs.at(-1)
  if (!last) return null
  const pass = ({ flight, facts }: (typeof trip.legs)[number]) => (
    <Link
      to="/flights/$id"
      params={{ id: flight.id }}
      className="pressable block rounded-2xl"
    >
      <BoardingPass flight={flight} facts={facts} compact />
    </Link>
  )
  if (trip.legs.length === 1) return pass(last)

  const route = [
    trip.legs[0]?.flight.from,
    ...trip.legs.map((leg) => leg.flight.to),
  ].join(" → ")
  return (
    <div className="rounded-3xl border bg-muted/40 p-2">
      <div className="flex items-center justify-between gap-2 px-2 pt-1 pb-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{route}</p>
          <p className="text-xs text-muted-foreground">
            Booking {trip.reservation} · {trip.legs.length} flights
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddConnection(last.flight)}
        >
          <PlusIcon />
          Connection
        </Button>
      </div>
      <ol className="space-y-1">
        {trip.legs.map((leg, i) => {
          const previous = trip.legs[i - 1]
          const ground = previous
            ? groundMinutes(previous.flight, leg.flight)
            : undefined
          return (
            <li key={leg.flight.id}>
              {previous ? (
                <p className="flex items-center gap-1.5 px-3 py-1 text-xs text-muted-foreground">
                  <RouteIcon className="size-3.5" />
                  {ground === undefined
                    ? `Then from ${leg.flight.from}`
                    : ground < 24 * 60
                      ? `${formatDuration(ground)} connection in ${leg.flight.from}`
                      : `${Math.round(ground / (24 * 60))} days in ${leg.facts.from?.city ?? leg.flight.from}`}
                </p>
              ) : null}
              {pass(leg)}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
