import { useEffect } from "react"

/** Registers the generated service worker in production builds only. */
export function PwaRegister() {
  useEffect(() => {
    if (import.meta.env.DEV || !("serviceWorker" in navigator)) return
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((error: unknown) => {
        console.error("Service worker registration failed", error)
      })
  }, [])

  return null
}
