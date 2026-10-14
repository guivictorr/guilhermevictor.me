/**
 * Tiny in-memory TTL cache for provider data that's the same for every
 * request (trending lists). Per server instance; good enough for one user.
 * Failed loads aren't cached, so a provider hiccup is retried next time.
 */
const entries = new Map<
  string,
  { expiresAt: number; value: Promise<unknown> }
>()

export function cached<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>
): Promise<T> {
  const hit = entries.get(key)
  if (hit && hit.expiresAt > Date.now()) return hit.value as Promise<T>

  const value = load()
  entries.set(key, { expiresAt: Date.now() + ttlMs, value })
  value.catch(() => entries.delete(key))
  return value
}
