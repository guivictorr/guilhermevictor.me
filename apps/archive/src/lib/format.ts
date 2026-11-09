const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

/** Formats an ISO calendar date ("2026-10-13") without timezone drift. */
export function formatDate(date: string | undefined) {
  if (!date) return undefined
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00Z`)
  // Partial dates ("1997", "1997-06-00") aren't valid; let callers fall back.
  return Number.isNaN(parsed.getTime())
    ? undefined
    : dateFormatter.format(parsed)
}

export function formatRuntime(minutes: number | undefined) {
  if (!minutes) return undefined
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

/** Today as an ISO calendar date in the user's local timezone. */
export function today() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export function joinDefined(
  parts: Array<string | number | undefined>,
  separator = " · "
) {
  return parts.filter((p) => p !== undefined && p !== "").join(separator)
}
