import { useQuery } from "@tanstack/react-query"
import { cn } from "@workspace/ui/lib/utils"
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo"
import type { GeoPermissibleObjects } from "d3-geo"
import { feature } from "topojson-client"
import type { Topology } from "topojson-specification"
import { useEffect, useMemo, useRef } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
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

export const routeKey = (from: string, to: string) => `${from}-${to}`

/** Most planes in the air at once; more turns the map into noise. */
const MAX_PLANES = 12

/**
 * Great-circle routes on a world map, zoomed to where you've flown.
 * Thicker arcs = routes flown more often. `highlight` isolates some routes
 * (hovered trip, current flight) and dims the rest. Small planes fly the
 * routes unless the user prefers reduced motion; they pause off-screen.
 */
export function FlightMap({
  routes,
  className,
  labels = true,
  highlight,
  planes = true,
}: {
  routes: Array<Route>
  className?: string
  labels?: boolean
  /** Route keys (`routeKey(from, to)`) to emphasize; others are dimmed. */
  highlight?: ReadonlySet<string>
  planes?: boolean
}) {
  const { data: land } = useQuery(landQuery)
  const svgRef = useRef<SVGSVGElement>(null)
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const focused = highlight && highlight.size > 0

  // SMIL animations keep running off-screen; pause them when not visible.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !planes) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) svg.unpauseAnimations()
      else svg.pauseAnimations()
    })
    observer.observe(svg)
    return () => observer.disconnect()
  }, [planes])

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
        key: routeKey(r.from.iata, r.to.iata),
        d: path(lines[i]!) ?? "",
        width: 1.5 + (r.count / maxCount) * 2.5,
        count: r.count,
      })),
    }
  }, [routes])

  const isLit = (key: string) => !focused || highlight.has(key)
  const litAirports = new Set(
    scene.arcs.filter((a) => isLit(a.key)).flatMap((a) => a.key.split("-"))
  )
  const flying =
    planes && !reduceMotion
      ? scene.arcs.filter((a) => isLit(a.key)).slice(0, MAX_PLANES)
      : []

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Map of ${routes.length} routes`}
      className={cn("w-full rounded-[20px] border bg-card", className)}
    >
      <path
        d={scene.path(geoGraticule10()) ?? ""}
        className="fill-none stroke-foreground/5"
      />
      {land ? (
        <path
          d={scene.path(land) ?? ""}
          className="fill-field stroke-foreground/10"
          strokeWidth={0.5}
        />
      ) : null}
      {scene.arcs.map((arc) => (
        <path
          key={arc.key}
          id={`route-${arc.key}`}
          d={arc.d}
          className="fill-none stroke-primary transition-opacity duration-200 ease-(--ease-out)"
          strokeWidth={focused && isLit(arc.key) ? arc.width + 1 : arc.width}
          strokeLinecap="round"
          opacity={isLit(arc.key) ? 0.9 : 0.12}
        >
          <title>
            {arc.key.replace("-", " → ")}: {arc.count} flight
            {arc.count === 1 ? "" : "s"}
          </title>
        </path>
      ))}
      {flying.map((arc, i) => (
        // A plane following the route, staggered so they don't move in step.
        <g key={`plane-${arc.key}`} aria-hidden className="pointer-events-none">
          <path
            d="M7 0 L-4 -4.5 L-2.2 0 L-4 4.5 Z"
            className="fill-foreground stroke-background"
            strokeWidth={1}
          >
            <animateMotion
              dur={`${6 + (i % 4) * 1.5}s`}
              begin={`${(i * 0.9) % 5}s`}
              repeatCount="indefinite"
              rotate="auto"
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="linear"
            >
              <mpath href={`#route-${arc.key}`} />
            </animateMotion>
          </path>
        </g>
      ))}
      {scene.airports.map((a) => {
        const point = scene.projection([a.lon, a.lat])
        if (!point) return null
        const lit = !focused || litAirports.has(a.iata)
        return (
          <g
            key={a.iata}
            transform={`translate(${point[0]} ${point[1]})`}
            opacity={lit ? 1 : 0.25}
            className="transition-opacity duration-200"
          >
            {/* Surface ring keeps dots legible where arcs overlap. */}
            <circle r={5} className="fill-card" />
            <circle r={3.5} className="fill-foreground" />
            {labels && (scene.labeled.has(a.iata) || (focused && lit)) ? (
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
