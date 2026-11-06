import { QueryClient } from "@tanstack/react-query"
import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import { DefaultCatchBoundary } from "@/components/default-catch-boundary"
import { NotFound } from "@/components/not-found"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Only this app writes the archive and every write invalidates what
        // it touched, so data stays fresh for minutes; provider queries set
        // longer times. Kept 30 min after a screen unmounts, so coming back
        // to a tab renders from cache with no skeleton.
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        refetchOnWindowFocus: false,
      },
    },
  })

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Horizontal decks start at their first item on a new page (the router
    // would otherwise carry the old position over); reloads still restore.
    scrollToTopSelectors: ["[data-scroll-deck]"],
    defaultPreload: "intent",
    // Query owns caching; the router should always ask it.
    defaultPreloadStaleTime: 0,
    defaultViewTransition: true,
    // A route waiting on its loader (detail pages) shows its skeleton at
    // once instead of leaving the old page up, and keeps it at least 300ms
    // (never a flash). Cached or preloaded data settles before the timer, so
    // it renders with no skeleton.
    defaultPendingMs: 0,
    defaultPendingMinMs: 300,
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: NotFound,
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
