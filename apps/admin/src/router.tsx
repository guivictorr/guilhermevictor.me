import { QueryClient } from "@tanstack/react-query"
import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import { DefaultCatchBoundary } from "@/components/default-catch-boundary"
import { NotFound } from "@/components/not-found"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, refetchOnWindowFocus: false },
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
