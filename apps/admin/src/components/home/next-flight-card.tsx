import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
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
  const { data: flights } = useQuery(flightsQuery())
  const { data: airports } = useQuery(airportsQuery())
  const now = useNow()

  const next = useMemo(() => {
    if (!flights || !airports) return undefined
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

  if (!next || !airports) return null
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
    ? (flights ?? []).filter(
        (f) =>
          f.reservation === flight.reservation && f.departure > flight.departure
      ).length
    : 0

  return (
    <Link
      to="/flights/$id"
      params={{ id: flight.id }}
      aria-label={`Next flight ${from?.city ?? flight.from} to ${to?.city ?? flight.to}`}
      className="pressable relative isolate block overflow-hidden rounded-[24px] border border-white/10 bg-[#0d0d0f] p-4 text-[#f4f1ea] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
    >
      {/* A faint runway grid, like a departures screen. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.04)_1px,transparent_1px)] [background-size:16px_16px] opacity-40"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="type-overline text-[#ffb547]">
          {airborne ? "In the air" : "Next flight"}
        </p>
        <span className="opacity-90 [&_img]:brightness-0 [&_img]:invert">
          <AirlineMark flight={flight} />
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="min-w-0">
          <p className="font-dots text-[2.25rem] leading-none">{flight.from}</p>
          <p className="mt-1 truncate text-xs text-white/60">
            {from?.city || from?.name}
          </p>
        </div>
        <PlaneIcon className="size-5 rotate-45 text-white/70" />
        <div className="min-w-0 text-right">
          <p className="font-dots text-[2.25rem] leading-none">{flight.to}</p>
          <p className="mt-1 truncate text-xs text-white/60">
            {to?.city || to?.name}
          </p>
        </div>
      </div>

      <div
        className="mt-4 grid grid-cols-4 gap-2"
        role="timer"
        aria-label={airborne ? "Time until landing" : "Time until departure"}
      >
        {parts.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl bg-white/[0.04] px-2 py-2 text-center ring-1 ring-white/10"
          >
            <p className="font-dots text-[1.75rem] leading-none text-[#ffb547] tabular-nums">
              {String(value).padStart(2, "0")}
            </p>
            <p className="mt-1 text-[0.625rem] tracking-[0.12em] text-white/50 uppercase">
              {label}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 truncate text-xs text-white/60 tabular-nums">
        {joinDefined([
          `${dayFormat.format(new Date(`${localDate(flight.departure)}T00:00:00Z`))} · ${localTime(flight.departure)}`,
          flight.flightNumber,
          flight.seat ? `Seat ${flight.seat}` : undefined,
          legsAfter
            ? `+${legsAfter} connection${legsAfter === 1 ? "" : "s"}`
            : undefined,
        ])}
      </p>
    </Link>
  )
}
