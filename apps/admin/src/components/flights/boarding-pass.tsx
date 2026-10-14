import type { Flight } from "@workspace/schemas"
import { cn } from "@workspace/ui/lib/utils"
import { PlaneIcon } from "lucide-react"
import { useState } from "react"
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
function AirlineMark({ flight }: { flight: Flight }) {
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
  const stub = [
    [
      "Seat",
      flight.seat
        ? `${flight.seat}${position ? ` · ${position}` : ""}`
        : undefined,
    ],
    ["Aircraft", flight.aircraft],
    ["Class", flight.cabin ? CABIN_LABEL[flight.cabin] : undefined],
    ["Booking", flight.reservation],
    ["Registration", flight.registration],
  ].filter((row): row is [string, string] => Boolean(row[1]))

  return (
    <div
      className={cn("overflow-hidden rounded-2xl border bg-card", className)}
    >
      <div className={cn("px-4", compact ? "py-3" : "py-4")}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <AirlineMark flight={flight} />
            {flight.flightNumber ? (
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {flight.flightNumber}
              </span>
            ) : null}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDate(localDate(flight.departure))}
          </span>
        </div>

        <div
          className={cn(
            "grid grid-cols-[1fr_auto_1fr] items-center gap-3",
            compact ? "mt-2" : "mt-4"
          )}
        >
          <Endpoint
            code={flight.from}
            city={facts.from?.city}
            time={localTime(flight.departure)}
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
            city={facts.to?.city}
            time={flight.arrival ? localTime(flight.arrival) : undefined}
            align="end"
            compact={compact}
          />
        </div>
      </div>

      {!compact && stub.length ? (
        <>
          {/* Perforation between the pass and its stub. */}
          <div className="relative h-0 border-t border-dashed">
            <span className="absolute -top-2.5 -left-2.5 size-5 rounded-full border bg-background" />
            <span className="absolute -top-2.5 -right-2.5 size-5 rounded-full border bg-background" />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-4 sm:grid-cols-4">
            {stub.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
                  {label}
                </dt>
                <dd className="truncate text-sm font-medium capitalize">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}
    </div>
  )
}

function Endpoint({
  code,
  city,
  time,
  align = "start",
  compact,
}: {
  code: string
  city?: string
  time?: string
  align?: "start" | "end"
  compact: boolean
}) {
  return (
    <div className={cn("min-w-0", align === "end" && "text-right")}>
      <div
        className={cn(
          "font-heading leading-none font-bold tracking-tight tabular-nums",
          compact ? "text-2xl" : "text-4xl"
        )}
      >
        {code}
      </div>
      {time ? (
        <div className="mt-1.5 text-sm font-semibold tabular-nums">{time}</div>
      ) : null}
      <div className="truncate text-xs text-muted-foreground">{city}</div>
    </div>
  )
}
