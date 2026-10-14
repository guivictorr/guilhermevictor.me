import { Link, useRouterState } from "@tanstack/react-router"
import { cn } from "@workspace/ui/lib/utils"
import { ArchiveIcon, SettingsIcon } from "lucide-react"
import { SIDEBAR_SECTIONS, TAB_ITEMS, isUnder } from "./nav-items"

/**
 * Mobile: content + fixed bottom tab bar (like a native app).
 * Desktop (md+): persistent sidebar.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="pb-tab-bar min-w-0 flex-1 md:pb-12">{children}</main>
      <TabBar />
    </div>
  )
}

const sidebarLink =
  "flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:font-medium data-[status=active]:text-sidebar-accent-foreground"

function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-sidebar px-3 py-5 text-sidebar-foreground md:flex">
      <Link
        to="/"
        className="mb-6 flex items-center gap-2 px-2 font-heading text-base font-semibold"
      >
        <ArchiveIcon className="size-5" />
        Archive
      </Link>
      <nav className="flex flex-col gap-4">
        {SIDEBAR_SECTIONS.map((section, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {"title" in section ? (
              <span className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                {section.title}
              </span>
            ) : null}
            {section.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className={sidebarLink}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <Link to="/settings" className={cn(sidebarLink, "mt-auto")}>
        <SettingsIcon className="size-4" />
        Settings
      </Link>
    </aside>
  )
}

function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <nav
      aria-label="Primary"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-background/80 backdrop-blur-xl backdrop-saturate-150 md:hidden"
    >
      <ul className="mx-auto grid h-(--tab-bar-height) max-w-lg grid-cols-5">
        {TAB_ITEMS.map((item) => {
          const active = item.match.some((base) => isUnder(pathname, base))
          return (
            <li key={item.label} className="flex">
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pressable flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon
                  className="size-[1.375rem]"
                  strokeWidth={active ? 2.25 : 1.75}
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
