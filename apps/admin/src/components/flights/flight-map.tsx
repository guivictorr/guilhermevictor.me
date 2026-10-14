import { useQuery } from "@tanstack/react-query"
import { cn } from "@workspace/ui/lib/utils"
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo"
import type { GeoPermissibleObjects } from "d3-geo"
import { feature } from "topojson-client"
import type { Topology } from "topojson-specification"
import { useMemo } from "react"
import type { Airport } from "@/lib/airports"

export type Route = { from: Airport; to: Airport; count: number }

const WIDTH = 800
const HEIGHT = 440

/** World land shapes, loaded with the map instead of the main bundle. */
const landQuery = {
  queryKey: ["static", "land-110m"],
  queryFn: async () => {
    const topo = (await import("world-atlas/land-110m.json"))
      .default as unknown as Topology
    return feature(topo, topo.objects.land!) as GeoPermissibleObjects
  },
  staleTime: Infinity,
  gcTime: Infinity,
}

/**
 * Great-circle routes on a world map, zoomed to where you've flown.
 * Thicker arcs = routes flown more often.
 */
export function FlightMap({
  routes,
  className,
  labels = true,
}: {
  routes: Array<Route>
  className?: string
  labels?: boolean
}) {
  const { data: land } = useQuery(landQuery)

  const scene = useMemo(() => {
    const airports = new Map<string, Airport>()
    for (const r of routes) {
      airports.set(r.from.iata, r.from)
      airports.set(r.to.iata, r.to)
    }
    const lines = routes.map((r) => ({
      type: "LineString" as const,
      coordinates: [
        [r.from.lon, r.from.lat],
        [r.to.lon, r.to.lat],
      ],
    }))

    // Fit to the routes with breathing room; a single short hop would
    // otherwise zoom in to street level.
    const projection = geoNaturalEarth1()
    if (lines.length) {
      projection.fitExtent(
        [
          [60, 50],
          [WIDTH - 60, HEIGHT - 50],
        ],
        { type: "GeometryCollection", geometries: lines }
      )
      const minScale = 420
      if (projection.scale() > minScale * 4) projection.scale(minScale * 4)
    } else {
      projection.fitSize([WIDTH, HEIGHT], { type: "Sphere" })
    }
    const path = geoPath(projection)
    const maxCount = Math.max(1, ...routes.map((r) => r.count))

    // Label airports greedily, busiest first, skipping labels that would
    // collide with one already placed.
    const visits = new Map<string, number>()
    for (const r of routes) {
      visits.set(r.from.iata, (visits.get(r.from.iata) ?? 0) + r.count)
      visits.set(r.to.iata, (visits.get(r.to.iata) ?? 0) + r.count)
    }
    const placed: Array<[number, number]> = []
    const labeled = new Set<string>()
    for (const a of [...airports.values()].sort(
      (x, y) => (visits.get(y.iata) ?? 0) - (visits.get(x.iata) ?? 0)
    )) {
      const p = projection([a.lon, a.lat])
      if (!p) continue
      if (
        placed.every(
          ([x, y]) => Math.abs(x - p[0]) > 34 || Math.abs(y - p[1]) > 16
        )
      ) {
        placed.push(p)
        labeled.add(a.iata)
      }
    }

    return {
      path,
      projection,
      airports: [...airports.values()],
      labeled,
      arcs: routes.map((r, i) => ({
        key: `${r.from.iata}-${r.to.iata}`,
        d: path(lines[i]!) ?? "",
        width: 1.5 + (r.count / maxCount) * 2.5,
        count: r.count,
      })),
    }
  }, [routes])

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Map of ${routes.length} routes`}
      className={cn("w-full rounded-xl border bg-card", className)}
    >
      <path
        d={scene.path(geoGraticule10()) ?? ""}
        className="fill-none stroke-foreground/5"
      />
      {land ? (
        <path
          d={scene.path(land) ?? ""}
          className="fill-muted stroke-foreground/10"
          strokeWidth={0.5}
        />
      ) : null}
      {scene.arcs.map((arc) => (
        <path
          key={arc.key}
          d={arc.d}
          className="fill-none stroke-sky-500 dark:stroke-sky-400"
          strokeWidth={arc.width}
          strokeLinecap="round"
          opacity={0.85}
        >
          <title>
            {arc.key.replace("-", " → ")}: {arc.count} flight
            {arc.count === 1 ? "" : "s"}
          </title>
        </path>
      ))}
      {scene.airports.map((a) => {
        const point = scene.projection([a.lon, a.lat])
        if (!point) return null
        return (
          <g key={a.iata} transform={`translate(${point[0]} ${point[1]})`}>
            {/* Surface ring keeps dots legible where arcs overlap. */}
            <circle r={5} className="fill-background" />
            <circle r={3.5} className="fill-foreground" />
            {labels && scene.labeled.has(a.iata) ? (
              <text
                y={-9}
                textAnchor="middle"
                className="fill-foreground text-[13px] font-semibold"
                style={{
                  paintOrder: "stroke",
                  stroke: "var(--card)",
                  strokeWidth: 4,
                }}
              >
                {a.iata}
              </text>
            ) : null}
            {/* Unlabeled dots still name themselves on hover. */}
            {labels && !scene.labeled.has(a.iata) ? (
              <title>{a.iata}</title>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}
