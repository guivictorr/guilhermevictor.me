import { useQuery } from "@tanstack/react-query"
import type { MediaSummary } from "@workspace/schemas"
import { useEffect, useState } from "react"
import { indexQuery, mediaKey } from "@/queries/archive"

/*
 * View choices for Search that belong to this browser (not URL filters,
 * not archive data): hide what you have, grid or list.
 */

function useStored<T extends string>(
  key: string,
  fallback: T,
  allowed: ReadonlyArray<T>
) {
  const [value, setValue] = useState<T>(fallback)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key) as T | null
      if (saved && allowed.includes(saved)) setValue(saved)
    } catch {
      // Blocked storage: keep the default.
    }
    // `allowed` is a constant per call site, so only `key` matters.
  }, [key])
  const update = (next: T) => {
    setValue(next)
    try {
      localStorage.setItem(key, next)
    } catch {
      // Not remembered, still applied.
    }
  }
  return [value, update] as const
}

const ON_OFF = ["on", "off"] as const

/** A switch, on by default; remembered in this browser only. */
function useStoredSwitch(key: string) {
  const [value, setValue] = useStored(key, "on", ON_OFF)
  return [value === "on", (on: boolean) => setValue(on ? "on" : "off")] as const
}

export type ResultsLayout = "grid" | "list"

export function useSearchView() {
  const [hideHave, setHideHave] = useStoredSwitch("archive:search-hide-have")
  const [hideBacklog, setHideBacklog] = useStoredSwitch(
    "archive:search-hide-backlog"
  )
  const [layout, setLayout] = useStored<ResultsLayout>(
    "archive:search-layout",
    "grid",
    ["grid", "list"]
  )
  return {
    hideHave,
    setHideHave,
    hideBacklog,
    setHideBacklog,
    layout,
    setLayout,
  }
}

/** Logged works, and records you own; and what's in your backlog. */
export function useArchiveMarks() {
  const { data: index, isPending } = useQuery(indexQuery())
  return {
    /** The index hasn't loaded yet: marks would all read false. */
    isPending,
    have: (media: Pick<MediaSummary, "type" | "id">) =>
      media.type === "record"
        ? (index?.owned.has(mediaKey(media)) ?? false)
        : (index?.logged.has(mediaKey(media)) ?? false),
    inBacklog: (media: Pick<MediaSummary, "type" | "id">) =>
      index?.backlog.has(mediaKey(media)) ?? false,
  }
}

/** TMDB stops counting at 20,001 results: past that, "20,000+". */
export const formatCount = (n: number) =>
  n > 20000 ? "20,000+" : n.toLocaleString("en-US")
