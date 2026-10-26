/**
 * Tiny in-memory TTL cache for provider data that's the same for every
 * request (trending lists, browse results, counts). Per server instance; good enough for one user.
 * Failed loads and empty lists aren't kept, so a provider hiccup (an error,
 * or a 200 with no results) is retried on the next request.
 */
const entries = new Map<
  string,
  { expiresAt: number; value: Promise<unknown> }
>()

const MAX_ENTRIES = 500

export function cached<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>
): Promise<T> {
  const hit = entries.get(key)
  if (hit && hit.expiresAt > Date.now()) return hit.value as Promise<T>

  const value = load()
  entries.set(key, { expiresAt: Date.now() + ttlMs, value })
  // Browse results are keyed by filters: keep the map from growing forever
  // (Map keeps insertion order, so the first key is the oldest).
  if (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next().value
    if (oldest !== undefined) entries.delete(oldest)
  }
  value.then(
    (result) => {
      if (Array.isArray(result) && result.length === 0) entries.delete(key)
    },
    () => entries.delete(key)
  )
  return value
}
