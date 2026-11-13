import { useSuspenseQuery } from "@tanstack/react-query"
import { ClientOnly, Link } from "@tanstack/react-router"
import type { Flight } from "@workspace/schemas"
import { PlaneIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { AirlineMark } from "@/components/flights/boarding-pass"
import { airportsQuery } from "@/lib/airports"
import type { AirportIndex } from "@/lib/airports"
import { localDate, localTime, localToUtc } from "@/lib/flight-math"
import { joinDefined } from "@/lib/format"
import { flightsQuery } from "@/queries/archive"

/** Real instants for a flight's local times, from its airports' timezones. */
function instants(flight: Flight, airports: AirportIndex) {
  const fromTz = airports.byCode.get(flight.from)?.tz
  const toTz = airports.byCode.get(flight.to)?.tz
  if (!fromTz) return undefined
  return {
    departs: localToUtc(flight.departure, fromTz),
    lands:
      flight.arrival && toTz ? localToUtc(flight.arrival, toTz) : undefined,
  }
}

/** The clock, once a second (a countdown is the point of this card). */
function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
})

/**
 * Your next flight as a departure board: codes, cities, the local time and
 * a live countdown (or, once airborne, the time left to landing). Hidden
 * when nothing is coming up.
 */
export function NextFlightCard() {
  // Client only: the countdown is the browser's clock, and airports come
  // from a static file the browser fetches.
  return (
    <ClientOnly>
      <NextFlight />
    </ClientOnly>
  )
}

function NextFlight() {
  const { data: flights } = useSuspenseQuery(flightsQuery())
  const { data: airports } = useSuspenseQuery(airportsQuery())
  const now = useNow()

  const next = useMemo(() => {
    let best: { flight: Flight; departs: Date; lands?: Date } | undefined
    for (const flight of flights) {
      const t = instants(flight, airports)
      if (!t) continue
      // Still relevant until it lands (or, without an arrival, departs).
      const end = (t.lands ?? t.departs).getTime()
      if (end < now) continue
      if (!best || t.departs < best.departs) best = { flight, ...t }
    }
    return best
  }, [flights, airports, now])

  if (!next) return null
  const { flight, departs, lands } = next
  const from = airports.byCode.get(flight.from)
  const to = airports.byCode.get(flight.to)
  const airborne = departs.getTime() <= now
  const target = airborne && lands ? lands.getTime() : departs.getTime()
  const left = Math.max(0, Math.floor((target - now) / 1000))
  const parts = [
    ["Days", Math.floor(left / 86400)],
    ["Hrs", Math.floor((left % 86400) / 3600)],
    ["Min", Math.floor((left % 3600) / 60)],
    ["Sec", left % 60],
  ] as const
  const legsAfter = flight.reservation
    ? flights.filter(
        (f) =>
          f.reservation === flight.reservation && f.departure > flight.departure
      ).length
    : 0

  return (
    <Link
      to="/flights/$id"
      params={{ id: flight.id }}
      aria-label={`Next flight ${from?.city ?? flight.from} to ${to?.city ?? flight.to}`}
      className="pressable led-panel block rounded-2xl p-4 md:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="led-label">
          {airborne ? "In the air" : "Next departure"}
        </p>
        <span className="opacity-80 [&_img]:brightness-0 [&_img]:invert">
          <AirlineMark flight={flight} />
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3">
        <div className="min-w-0">
          <p className="led-glow font-dots text-[clamp(2.5rem,9vw,3.25rem)] leading-none font-extrabold">
            {flight.from}
          </p>
          <p className="led-label mt-1.5 truncate tracking-normal normal-case">
            {from?.city || from?.name}
          </p>
        </div>
        <PlaneIcon className="mb-6 size-5 rotate-45 text-[#8f8170]" />
        <div className="min-w-0 text-right">
          <p className="led-glow font-dots text-[clamp(2.5rem,9vw,3.25rem)] leading-none font-extrabold">
            {flight.to}
          </p>
          <p className="led-label mt-1.5 truncate tracking-normal normal-case">
            {to?.city || to?.name}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-[rgb(255_157_46/0.14)] pt-3">
        {[
          ["Flight", flight.flightNumber ?? "—"],
          ["Departs", localTime(flight.departure)],
          ["Seat", flight.seat ?? "—"],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="led-label">{label}</dt>
            <dd className="led-glow mt-1.5 truncate font-dots text-[1.375rem] leading-none font-extrabold">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div
        className="mt-4 flex items-end justify-between gap-3 border-t border-[rgb(255_157_46/0.14)] pt-3"
        role="timer"
        aria-label={airborne ? "Time until landing" : "Time until departure"}
      >
        <p className="led-label">{airborne ? "Lands in" : "Departs in"}</p>
        <p className="led-glow font-dots text-[1.75rem] leading-none font-extrabold tabular-nums">
          {parts
            .filter(([label, value]) => label !== "Days" || value > 0)
            .map(([, value]) => String(value).padStart(2, "0"))
            .join(":")}
        </p>
      </div>

      <p className="led-label mt-3 truncate tracking-normal normal-case tabular-nums">
        {joinDefined([
          dayFormat.format(
            new Date(`${localDate(flight.departure)}T00:00:00Z`)
          ),
          legsAfter
            ? `+${legsAfter} connection${legsAfter === 1 ? "" : "s"}`
            : undefined,
        ])}
      </p>
    </Link>
  )
}
