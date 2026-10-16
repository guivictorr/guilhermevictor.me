import type { QueryClient } from "@tanstack/react-query"
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  redirect,
  useRouterState,
} from "@tanstack/react-router"
import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { ThemeProvider } from "next-themes"
import { AppShell, readSidebarOpen } from "@/components/app-shell"
import { LogHost } from "@/components/log/log-host"
import { PwaRegister } from "@/components/pwa-register"
import { ThemeColorSync } from "@/components/theme-color-sync"
import { viewerQuery } from "@/queries/auth"
import appCss from "@/styles/app.css?url"

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    // UX only: every server function checks the session itself.
    beforeLoad: async ({ context, location }) => {
      if (location.pathname === "/login") return
      let viewer
      try {
        viewer = await context.queryClient.ensureQueryData(viewerQuery())
      } catch {
        // Offline (PWA): let the cached shell render instead of bouncing.
        return
      }
      if (!viewer)
        throw redirect({ to: "/login", search: { redirect: location.href } })
    },
    loader: () => ({ sidebarOpen: readSidebarOpen() }),
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content:
            "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
        },
        { title: "Archive" },
        {
          name: "description",
          content: "My personal archive of movies, shows and games.",
        },
        {
          name: "theme-color",
          media: "(prefers-color-scheme: light)",
          content: "#f5f2eb",
        },
        {
          name: "theme-color",
          media: "(prefers-color-scheme: dark)",
          content: "#0b0b0c",
        },
        { name: "color-scheme", content: "light dark" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        { name: "apple-mobile-web-app-title", content: "Archive" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
        { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon-180x180.png" },
        { rel: "preconnect", href: "https://image.tmdb.org" },
        { rel: "preconnect", href: "https://images.igdb.com" },
      ],
    }),
    shellComponent: RootDocument,
    component: RootComponent,
  }
)

function RootComponent() {
  const bare = useRouterState({
    select: (s) => s.location.pathname === "/login",
  })
  const { sidebarOpen } = Route.useLoaderData()
  if (bare) return <Outlet />
  return (
    <AppShell sidebarOpen={sidebarOpen}>
      <Outlet />
    </AppShell>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    // next-themes sets the theme class before hydration.
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Toaster
              position="top-center"
              mobileOffset={{
                top: "calc(env(safe-area-inset-top, 0px) + 0.5rem)",
              }}
            />
            <LogHost />
            <ThemeColorSync />
            <PwaRegister />
          </TooltipProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
