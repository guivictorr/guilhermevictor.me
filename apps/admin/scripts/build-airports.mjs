/**
 * Builds public/data/airports.json from mwgg/Airports (MIT license):
 * every airport with an IATA code, as compact rows
 * [iata, name, city, countryCode, lat, lon, timezone].
 * Run: pnpm --filter admin build-airports
 */
import { writeFile } from "node:fs/promises"

const SOURCE =
  "https://raw.githubusercontent.com/mwgg/Airports/master/airports.json"

const res = await fetch(SOURCE)
if (!res.ok) throw new Error(`Download failed: ${res.status}`)
const airports = Object.values(await res.json())

const round = (n) => Math.round(n * 1e4) / 1e4
const rows = airports
  .filter((a) => /^[A-Z]{3}$/.test(a.iata ?? "") && a.tz)
  .map((a) => [
    a.iata,
    a.name,
    a.city,
    a.country,
    round(a.lat),
    round(a.lon),
    a.tz,
  ])
  .sort((a, b) => a[0].localeCompare(b[0]))

const out = new URL("../public/data/airports.json", import.meta.url)
await writeFile(out, JSON.stringify({ source: SOURCE, license: "MIT", rows }))
console.log(`Wrote ${rows.length} airports`)
