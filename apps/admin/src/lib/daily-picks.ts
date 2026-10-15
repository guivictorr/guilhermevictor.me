import type { BacklogItem } from "@workspace/schemas"
import { KIND_ORDER } from "./media-kinds"

/** Small seeded PRNG (FNV-1a hash → mulberry32), so a day's picks are stable. */
function seeded(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++)
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), h | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A copy of `items` in a random order that's the same for the same seed. */
export function shuffle<T>(items: ReadonlyArray<T>, seed: string): Array<T> {
  const random = seeded(seed)
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

/**
 * Today's suggestions from the backlog: shuffled with the date as seed (same
 * all day, new tomorrow) and interleaved across kinds so it's a mix.
 */
export function dailyPicks(
  backlog: Array<BacklogItem>,
  day: string,
  count = 10
): Array<BacklogItem> {
  const random = seeded(day)
  const queues = KIND_ORDER.map((type) => {
    const items = backlog.filter((b) => b.type === type)
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[items[i], items[j]] = [items[j]!, items[i]!]
    }
    return items
  })
  const picks: Array<BacklogItem> = []
  while (picks.length < count && queues.some((q) => q.length)) {
    for (const queue of queues) {
      const next = queue.shift()
      if (next && picks.length < count) picks.push(next)
    }
  }
  return picks
}
