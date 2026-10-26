import { useQuery } from "@tanstack/react-query"
import type { LogInput } from "@workspace/schemas"
import type { LibraryItemInput } from "@/lib/repo"
import {
  collectionQuery,
  logsQuery,
  useAddLog,
  useUpdateLog,
} from "@/queries/archive"

/** An undated log carrying just a rating ("Date unknown"). */
function ratedLog(
  item: LibraryItemInput,
  rating: number,
  copyId: string | undefined
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
      return copyId
        ? { kind: "record", mediaId: Number(item.id), copyId, rating }
        : undefined
  }
}

/**
 * Stars in the swipe view: they rate your latest log, or create an undated
 * one when you haven't logged it.
 */
export function useRateLatest(item: LibraryItemInput) {
  const { data: logs } = useQuery(logsQuery({ type: item.type, id: item.id }))
  const { data: collection } = useQuery({
    ...collectionQuery(),
    enabled: item.type === "record",
  })
  const addLog = useAddLog()
  const updateLog = useUpdateLog()

  const latest = logs?.[0]
  const copyId = collection?.find((c) => c.releaseId === item.id)?.id
  // Plays need a copy you own, so an unowned record can't be rated here.
  const canRate = item.type !== "record" || Boolean(latest ?? copyId)

  // Optimistic: the stars already show the change; failures toast with Retry.
  function rate(rating: number | undefined) {
    if (latest) {
      const { id, createdAt: _c, updatedAt: _u, ...input } = latest
      updateLog.mutate({ id, input: { ...input, rating } })
      return
    }
    if (rating === undefined) return
    const input = ratedLog(item, rating, copyId)
    if (input) addLog.mutate({ input, item })
  }

  return {
    value: latest?.rating,
    logCount: logs?.length ?? 0,
    canRate,
    rate,
  }
}
