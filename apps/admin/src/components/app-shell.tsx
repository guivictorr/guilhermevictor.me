import { Link, useRouterState } from "@tanstack/react-router"
import { createIsomorphicFn } from "@tanstack/react-start"
import { getCookie } from "@tanstack/react-start/server"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { cn } from "@workspace/ui/lib/utils"
import { ArchiveIcon, SettingsIcon } from "lucide-react"
import { SIDEBAR_SECTIONS, TAB_ITEMS, isUnder } from "./nav-items"

/** shadcn's sidebar remembers its state in this cookie. */
const SIDEBAR_COOKIE = "sidebar_state"

/** Read on the server too, so a collapsed sidebar doesn't flash open on load. */
export const readSidebarOpen = createIsomorphicFn()
  .server(() => getCookie(SIDEBAR_COOKIE) !== "false")
  .client(() => !document.cookie.includes(`${SIDEBAR_COOKIE}=false`))

/**
 * Phones: content + a floating glass tab bar. Desktop (md+): a collapsible
 * sidebar (⌘B), icon-only when collapsed.
 */
export function AppShell({
  children,
  sidebarOpen,
}: {
  children: React.ReactNode
  sidebarOpen: boolean
}) {
  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar />
      <SidebarInset className="pb-tab-bar min-w-0 md:pb-12">
        {children}
      </SidebarInset>
      <TabBar />
    </SidebarProvider>
  )
}

/**
 * Aligned to the menu below: the 24px mark is centered on the icon column
 * (24px from the edge) and the word starts where item labels start (40px).
 */
function Wordmark() {
  return (
    <Link
      to="/"
      className="flex min-w-0 items-center gap-1 rounded-lg py-1 pl-1 outline-none group-data-[collapsible=icon]:hidden focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-primary text-primary-foreground">
        <ArchiveIcon className="size-3.5" strokeWidth={2.5} />
      </span>
      <span className="truncate text-[0.9375rem] leading-none font-black tracking-[-0.01em] uppercase [font-stretch:125%]">
        Archive
      </span>
    </Link>
  )
}

function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : isUnder(pathname, to)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex-row items-center pt-3 group-data-[collapsible=icon]:justify-center">
        <Wordmark />
        {/* Collapsed, the header is just this button. */}
        <SidebarTrigger className="ml-auto size-8 text-muted-foreground group-data-[collapsible=icon]:ml-0" />
      </SidebarHeader>
      <SidebarContent>
        {SIDEBAR_SECTIONS.map((section, i) => (
          <SidebarGroup key={i}>
            {"title" in section ? (
              <SidebarGroupLabel className="type-overline text-subtle">
                {section.title}
              </SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      render={<Link to={item.to} viewTransition={false} />}
                      isActive={isActive(item.to, item.exact)}
                      tooltip={item.label}
                      className="data-active:[&_svg]:text-primary"
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to="/settings" viewTransition={false} />}
              isActive={isActive("/settings", false)}
              tooltip="Settings"
              className="data-active:[&_svg]:text-primary"
            >
              <SettingsIcon />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

/** Floating glass pill above the home indicator; the active tab is orange. */
function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] md:hidden"
    >
      <ul className="glass edge-highlight mx-auto grid h-(--tab-bar-height) max-w-md grid-cols-4 rounded-full border border-border px-1 shadow-[0_8px_32px_rgb(0_0_0/0.35)]">
        {TAB_ITEMS.map((item) => {
          const active = item.match.some((base) => isUnder(pathname, base))
          return (
            <li key={item.label} className="flex">
              <Link
                to={item.to}
                // Switching tabs is instant: it happens all the time (no
                // animation budget), and a view-transition snapshot drops the
                // tab bar's backdrop blur for a frame, which read as a blink.
                viewTransition={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pressable flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[0.6875rem] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon
                  className="size-[1.375rem]"
                  strokeWidth={active ? 2.25 : 1.75}
                  // A soft fill stands in for iOS-style filled active icons.
                  fill={active ? "currentColor" : "none"}
                  fillOpacity={active ? 0.2 : 0}
                />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
