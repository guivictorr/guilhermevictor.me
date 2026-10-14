import { useSyncExternalStore } from "react"

/** Subscribes to a media query; returns `serverValue` during SSR and hydration. */
export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => serverValue
  )
}

export const useIsDesktop = () => useMediaQuery("(min-width: 48rem)")
