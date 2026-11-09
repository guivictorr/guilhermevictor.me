import { useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect } from "react"
import { z } from "zod"
import { swipeSearch } from "@/components/swipe/swipe-search"

/**
 * Detail pages accept `?log=new` (cards' "Log with details…") and
 * `?swipe=` (their rails' swipe view).
 */
export const logSearch = z
  .object({ log: z.literal("new").optional().catch(undefined) })
  .extend(swipeSearch.shape)

/** Opens the log sheet once when the page was linked with `?log=new`. */
export function useOpenLogFromSearch(openNew: () => void) {
  const { log } = useSearch({ strict: false })
  const navigate = useNavigate()
  useEffect(() => {
    if (log !== "new") return
    openNew()
    // Drop the param so reloading or going back doesn't reopen the sheet.
    void navigate({
      to: ".",
      search: (prev) => ({ ...prev, log: undefined }),
      replace: true,
      // Don't cut short the transition into the page that's still running.
      viewTransition: false,
    })
  }, [log, openNew, navigate])
}
