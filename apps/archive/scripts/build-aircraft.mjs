/**
 * Builds public/data/aircraft.json from OpenFlights planes.dat (ODbL):
 * every aircraft type with an ICAO designator, as rows [icao, name, iata].
 * Flights store the ICAO code ("B738"), so stats group by type however
 * the name was typed.
 * Run: pnpm --filter archive build-aircraft
 */
import { writeFile } from "node:fs/promises"

const SOURCE =
  "https://raw.githubusercontent.com/jpatokal/openflights/master/data/planes.dat"

const res = await fetch(SOURCE)
if (!res.ok) throw new Error(`Download failed: ${res.status}`)
const text = await res.text()

// "Boeing 737-800","738","B738" — \N marks a missing code.
const parse = (line) =>
  [...line.matchAll(/"([^"]*)"|\\N/g)].map((m) => m[1] ?? "")

const byCode = new Map()
for (const line of text.split("\n")) {
  if (!line.trim()) continue
  const [name, iata, icao] = parse(line)
  if (!name || !/^[A-Z0-9]{2,4}$/.test(icao ?? "")) continue
  if (!byCode.has(icao)) byCode.set(icao, [icao, name, iata ?? ""])
}

const rows = [...byCode.values()].sort((a, b) => a[1].localeCompare(b[1]))
const out = new URL("../public/data/aircraft.json", import.meta.url)
await writeFile(out, JSON.stringify({ source: SOURCE, license: "ODbL", rows }))
console.log(`Wrote ${rows.length} aircraft types`)
