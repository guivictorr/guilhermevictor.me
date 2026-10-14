import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { PencilIcon } from "lucide-react"
import { useState } from "react"
import { BackButton, FactList, SideCard } from "@/components/detail-layout"
import { BoardingPass } from "@/components/flights/boarding-pass"
import { FlightMap } from "@/components/flights/flight-map"
import { FlightSheet } from "@/components/flights/flight-sheet"
import { NotFound } from "@/components/not-found"
import { airportsQuery, countryName } from "@/lib/airports"
import type { Airport } from "@/lib/airports"
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
  const [editing, setEditing] = useState(false)

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
        <Button variant="outline" size="lg" onClick={() => setEditing(true)}>
          <PencilIcon />
          Edit
        </Button>
      </div>

      <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight md:text-3xl">
        {facts.from?.city ?? flight.from} → {facts.to?.city ?? flight.to}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatDate(localDate(flight.departure))}
        {flight.airline ? ` · ${flight.airline}` : ""}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <BoardingPass flight={flight} facts={facts} />
          {facts.from && facts.to ? (
            <FlightMap
              routes={[{ from: facts.from, to: facts.to, count: 1 }]}
            />
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

      <FlightSheet open={editing} onOpenChange={setEditing} editing={flight} />
    </article>
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
