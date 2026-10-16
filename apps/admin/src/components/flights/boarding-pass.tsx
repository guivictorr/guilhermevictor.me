import type { Flight } from "@workspace/schemas"
import { cn } from "@workspace/ui/lib/utils"
import { PlaneIcon } from "lucide-react"
import { useState } from "react"
import { aircraftName, useAircraftTypes } from "@/lib/aircraft-types"
import { formatDate } from "@/lib/format"
import {
  airlineCode,
  formatDuration,
  formatKm,
  localDate,
  localTime,
  seatPosition,
} from "@/lib/flight-math"
import type { FlightFacts } from "@/lib/flight-math"

const CABIN_LABEL = {
  economy: "Economy",
  premium: "Premium",
  business: "Business",
  first: "First",
} as const

/** Airline logos by IATA code; falls back to the code as text. */
export function AirlineMark({ flight }: { flight: Flight }) {
  const code = airlineCode(flight.flightNumber)
  const [failed, setFailed] = useState(false)
  if (code && !failed)
    return (
      <img
        src={`https://pics.avs.io/120/40/${code}.png`}
        alt={flight.airline ?? code}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-5 w-auto max-w-24 object-contain dark:brightness-0 dark:invert"
      />
    )
  return (
    <span className="text-sm font-semibold">
      {flight.airline ?? code ?? "Flight"}
    </span>
  )
}

/**
 * A flight as a boarding pass. `compact` is the list row; the full version
 * adds the stub with seat, aircraft, class and booking code.
 */
export function BoardingPass({
  flight,
  facts,
  compact = false,
  className,
}: {
  flight: Flight
  facts: FlightFacts
  compact?: boolean
  className?: string
}) {
  const position = seatPosition(flight.seat)
  const aircraftTypes = useAircraftTypes()
  const stub = [
    [
      "Seat",
      flight.seat
        ? `${flight.seat}${position ? ` · ${position}` : ""}`
        : undefined,
    ],
    ["Aircraft", aircraftName(flight, aircraftTypes)],
    ["Class", flight.cabin ? CABIN_LABEL[flight.cabin] : undefined],
    ["Booking", flight.reservation],
    ["Registration", flight.registration],
  ].filter((row): row is [string, string] => Boolean(row[1]))

  return (
    <div
      className={cn(
        "edge-highlight relative isolate overflow-hidden border bg-card",
        compact ? "rounded-[24px]" : "rounded-[28px]",
        className
      )}
    >
      {/* Paper grain, so it reads as a printed pass rather than a panel. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />
      <div className={cn("px-4", compact ? "py-3" : "py-4")}>
        <div className="flex min-w-0 items-center gap-2">
          <AirlineMark flight={flight} />
          {flight.flightNumber ? (
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {flight.flightNumber}
            </span>
          ) : null}
        </div>

        <div
          className={cn(
            "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3",
            compact ? "mt-2" : "mt-4"
          )}
        >
          <Endpoint
            code={flight.from}
            city={facts.from?.city || facts.from?.name}
            time={localTime(flight.departure)}
            date={formatDate(localDate(flight.departure))}
            compact={compact}
          />
          <div className="flex min-w-16 flex-col items-center gap-1 text-[0.6875rem] text-muted-foreground">
            <span className="tabular-nums">
              {formatDuration(facts.durationMin)}
            </span>
            <div className="flex w-full items-center gap-1">
              <span className="h-px flex-1 border-t border-dashed border-foreground/25" />
              <PlaneIcon className="size-4 shrink-0 rotate-45 text-foreground" />
              <span className="h-px flex-1 border-t border-dashed border-foreground/25" />
            </div>
            <span className="tabular-nums">
              {facts.distanceKm !== undefined
                ? formatKm(facts.distanceKm)
                : null}
            </span>
          </div>
          <Endpoint
            code={flight.to}
            city={facts.to?.city || facts.to?.name}
            time={flight.arrival ? localTime(flight.arrival) : undefined}
            // Each end shows its own local date: overnight arrivals land a day later.
            date={
              flight.arrival ? formatDate(localDate(flight.arrival)) : undefined
            }
            align="end"
            compact={compact}
          />
        </div>
      </div>

      {!compact && stub.length ? (
        <>
          {/* Perforation between the pass and its stub. */}
          <div className="relative h-0 border-t border-dashed">
            <span className="absolute -top-3 -left-3 size-6 rounded-full border bg-background" />
            <span className="absolute -top-3 -right-3 size-6 rounded-full border bg-background" />
          </div>
          <div className="flex items-end gap-4 px-4 pt-4 pb-4">
            <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              {stub.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="type-overline text-subtle">{label}</dt>
                  <dd className="mt-0.5 truncate text-sm font-medium capitalize">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      ) : null}
    </div>
  )
}

function Endpoint({
  code,
  city,
  time,
  date,
  align = "start",
  compact,
}: {
  code: string
  city?: string
  time?: string
  date?: string
  align?: "start" | "end"
  compact: boolean
}) {
  return (
    <div className={cn("min-w-0", align === "end" && "text-right")}>
      {/* Departure-board code (Doto); screen readers get the plain text. */}
      <div
        aria-hidden
        className={cn(
          "font-dots",
          compact ? "text-[1.75rem]" : "text-[2.75rem]"
        )}
      >
        {code}
      </div>
      <span className="sr-only">
        {city ? `${city}, ` : ""}
        {code}
        {time ? ` at ${time}` : ""}
        {date ? ` on ${date}` : ""}
      </span>
      {time ? (
        <div
          aria-hidden
          className={cn(
            compact
              ? "mt-1.5 text-sm font-semibold tabular-nums"
              : "mt-2 font-dots text-[1.25rem] text-signal-text"
          )}
        >
          {time}
        </div>
      ) : null}
      {date ? (
        <div
          aria-hidden
          className="mt-0.5 truncate text-xs font-medium tabular-nums"
        >
          {date}
        </div>
      ) : null}
      <div aria-hidden className="truncate text-xs text-muted-foreground">
        {city}
      </div>
    </div>
  )
}

/** Fractal noise as a data URI; tiles seamlessly at any size. */
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>'
)}")`
