import { useSuspenseQuery } from "@tanstack/react-query"
import { ClientOnly } from "@tanstack/react-router"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { useMemo, useState } from "react"
import { MediaLink } from "@/components/media-card"
import { ScrollRow } from "@/components/media/media-rail"
import { Poster } from "@/components/poster"
import { airportsQuery } from "@/lib/airports"
import type { Fact } from "@/lib/facts"
import { EARTH_CIRCUMFERENCE_KM, formatKm } from "@/lib/flight-math"
import { computeFlightStats } from "@/lib/flight-stats"
import { factsQuery, flightsQuery } from "@/queries/archive"

const KIND_LABEL: Record<Fact["kind"], string> = {
  movie: "Movies",
  show: "Shows",
  game: "Games",
  book: "Books",
  record: "Records",
  flight: "Flights",
  all: "Archive",
}

/** Flight facts need the airports file, so they're worked out here. */
function useFlightFacts(): Array<Fact> {
  const { data: flights } = useSuspenseQuery(flightsQuery())
  const { data: airports } = useSuspenseQuery(airportsQuery())
  return useMemo(() => {
    if (!flights.length) return []
    const stats = computeFlightStats(flights, airports)
    const facts: Array<Fact> = []
    if (stats.distanceKm > 0)
      facts.push({
        id: "flight-distance",
        kind: "flight",
        label: "Distance flown",
        value: Math.round(stats.distanceKm).toLocaleString("en-US"),
        unit: "km",
        detail: `${(stats.distanceKm / EARTH_CIRCUMFERENCE_KM).toFixed(1)}× around the Earth`,
        numeric: true,
      })
    if (stats.longest && flights.length >= 2) {
      const { flight, facts: f } = stats.longest
      facts.push({
        id: "flight-longest",
        kind: "flight",
        label: "Longest flight",
        value: `${flight.from}→${flight.to}`,
        detail: f.distanceKm ? formatKm(f.distanceKm) : undefined,
        numeric: true,
      })
    }
    const airport = stats.topAirports[0]
    if (airport && airport[1] >= 2)
      facts.push({
        id: "flight-airport",
        kind: "flight",
        label: "Your home airport",
        value: airport[0],
        detail: `${airport[1]} times through it`,
        numeric: true,
      })
    const airline = stats.topAirlines[0]
    if (airline && airline[1] >= 2)
      facts.push({
        id: "flight-airline",
        kind: "flight",
        label: "Airline you fly most",
        value: airline[0],
        detail: `${airline[1]} flights`,
      })
    return facts
  }, [flights, airports])
}

const VISIBLE = 3
const OFFSET_KEY = "archive:facts-offset"

/**
 * Where this visit starts in the fact list. Each visit moves on by three, so
 * the cards rotate through every fact. Kept in this browser only; without
 * storage it simply starts at the beginning.
 */
function useVisitOffset() {
  // Client only (see FactsDeck), so storage can be read during render and
  // the cards never pop in after an effect.
  const [offset] = useState(() => {
    try {
      const current = Number(localStorage.getItem(OFFSET_KEY)) || 0
      localStorage.setItem(OFFSET_KEY, String(current + VISIBLE))
      return current
    } catch {
      // Private mode or blocked storage: no rotation, still works.
      return 0
    }
  })
  return offset
}

/**
 * Three facts about the archive, different ones on every visit. Rendered
 * on the client only: flight facts need the airports file (fetched by the
 * browser) and the rotation lives in localStorage; the skeleton keeps its
 * place meanwhile.
 */
export function FactsDeck() {
  return (
    <ClientOnly fallback={<FactsSkeleton />}>
      <Facts />
    </ClientOnly>
  )
}

export function FactsSkeleton() {
  return (
    <section aria-hidden>
      <h2 className="type-heading mb-3 text-lg">By the numbers</h2>
      <ScrollRow className="md:*:flex-1">
        {Array.from({ length: VISIBLE }, (_, i) => (
          <Skeleton
            key={i}
            className={cn(CARD, "animate-pulse border-transparent bg-muted")}
          />
        ))}
      </ScrollRow>
    </section>
  )
}

function Facts() {
  const { data } = useSuspenseQuery(factsQuery())
  const flightFacts = useFlightFacts()
  const offset = useVisitOffset()
  // Interleave kinds so the first cards aren't all about one thing.
  const facts = useMemo(() => {
    const queues = [
      ...Map.groupBy([...data, ...flightFacts], (f) => f.kind).values(),
    ]
    const mixed: Array<Fact> = []
    while (queues.some((q) => q.length))
      for (const q of queues) {
        const next = q.shift()
        if (next) mixed.push(next)
      }
    return mixed
  }, [data, flightFacts])

  if (!facts.length) return null
  const shown =
    facts.length <= VISIBLE
      ? facts
      : Array.from(
          { length: VISIBLE },
          (_, i) => facts[(offset + i) % facts.length]!
        )
  return (
    <section>
      <h2 className="type-heading mb-3 text-lg">By the numbers</h2>
      {/* Scrolls on phones; three equal cards on wider screens. */}
      <ScrollRow className="md:*:flex-1">
        {shown.map((fact) => (
          <FactCard key={fact.id} fact={fact} />
        ))}
      </ScrollRow>
    </section>
  )
}

const CARD =
  "edge-highlight block h-40 w-64 shrink-0 snap-start rounded-[20px] border bg-card p-4"

function FactCard({ fact }: { fact: Fact }) {
  const body = (
    <div className="flex h-full gap-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="type-overline text-signal-text">
          {KIND_LABEL[fact.kind]}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{fact.label}</p>
        <div className="mt-auto pt-3">
          {fact.numeric ? (
            <p className="flex items-baseline gap-1.5">
              <span className="truncate font-dots text-[2rem]">
                {fact.value}
              </span>
              {fact.unit ? (
                <span className="text-sm text-muted-foreground">
                  {fact.unit}
                </span>
              ) : null}
            </p>
          ) : (
            <p className="type-heading line-clamp-2 text-lg text-balance">
              {fact.value}
            </p>
          )}
          {fact.detail ? (
            <p className="mt-1 truncate text-xs text-subtle">{fact.detail}</p>
          ) : null}
        </div>
      </div>
      {fact.image && fact.link ? (
        <Poster
          image={fact.image}
          type={fact.link.type}
          title={fact.value}
          size="thumb"
          // Concentric with the card: 20px corner − 16px inset.
          className="w-14 shrink-0 self-start rounded-[4px]"
        />
      ) : null}
    </div>
  )
  return fact.link ? (
    <MediaLink
      media={fact.link}
      className={cn(CARD, "pressable hover:bg-raised")}
    >
      {body}
    </MediaLink>
  ) : (
    <div className={CARD}>{body}</div>
  )
}
