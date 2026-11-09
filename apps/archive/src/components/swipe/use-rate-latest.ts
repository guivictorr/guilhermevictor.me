import { useQuery } from "@tanstack/react-query"
import type { LogInput } from "@workspace/schemas"
import type { LibraryItemInput } from "@/lib/repo"
import { logsQuery, useAddLog, useUpdateLog } from "@/queries/archive"

/** An undated log carrying just a rating ("Date unknown"). */
function ratedLog(
  item: LibraryItemInput,
  rating: number
): LogInput | undefined {
  switch (item.type) {
    case "movie":
      return { kind: "movie", mediaId: Number(item.id), rating, rewatch: false }
    case "show":
      // Rated per season; the swipe view shows no stars for shows.
      return undefined
    case "game":
      return {
        kind: "game",
        mediaId: Number(item.id),
        status: "finished",
        rating,
      }
    case "book":
      return {
        kind: "book",
        mediaId: String(item.id),
        status: "finished",
        rating,
        reread: false,
      }
    case "record":
      // Records have copies, not logs; the swipe view shows no stars.
      return undefined
  }
}

/**
 * Stars in the swipe view: they rate your latest log, or create an undated
 * one when you haven't logged it.
 */
export function useRateLatest(item: LibraryItemInput) {
  const { data: logs } = useQuery(logsQuery({ type: item.type, id: item.id }))
  const addLog = useAddLog()
  const updateLog = useUpdateLog()

  const latest = logs?.[0]

  // Optimistic: the stars already show the change; failures toast with Retry.
  function rate(rating: number | undefined) {
    if (latest) {
      const { id, createdAt: _c, updatedAt: _u, ...input } = latest
      updateLog.mutate({ id, input: { ...input, rating } })
      return
    }
    if (rating === undefined) return
    const input = ratedLog(item, rating)
    if (input) addLog.mutate({ input, item })
  }

  return {
    value: latest?.rating,
    logCount: logs?.length ?? 0,
    rate,
  }
}
