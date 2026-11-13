import { Link, useRouterState } from "@tanstack/react-router"
import type { LinkProps } from "@tanstack/react-router"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import type { LucideIcon } from "lucide-react"
import { DOCK_GROUPS, TAB_ITEMS, isUnder } from "./nav-items"

/**
 * Content plus floating navigation at the bottom: a glass tab bar on phones,
 * a dock of glass pills (one per group) on desktop. Both float over the
 * page, so it pads its bottom to clear them.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="pb-tab-bar relative flex min-h-svh w-full min-w-0 flex-col bg-background">
        {children}
      </main>
      <TabBar />
      <Dock />
    </>
  )
}

/** Shared by both bars: a sheet of vellum around a group of items. */
const PILL = "glass shadow-float flex rounded-xl border border-border"

/** Floating vellum bar above the home indicator; the active tab is "you". */
function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] md:hidden"
    >
      <ul
        className={cn(
          PILL,
          "edge-highlight mx-auto grid h-(--tab-bar-height) max-w-md grid-cols-4 px-1"
        )}
      >
        {TAB_ITEMS.map((item) => (
          <li key={item.label} className="flex">
            <NavItem
              to={item.to}
              label={item.label}
              icon={item.icon}
              active={item.match.some((base) => isUnder(pathname, base))}
              className="flex-1"
            />
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * Desktop: every destination at once, in separate pills per group (main,
 * library, lists, app) centered at the bottom. Icons only, each a circle
 * named by its tooltip, so a one-item pill is a circle too. Only the pills
 * take clicks, so the page between and around them stays usable.
 */
function Dock() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden justify-center px-8 pb-4 md:flex"
    >
      <div className="flex gap-2">
        {DOCK_GROUPS.map((group) => (
          <ul
            key={group.label}
            aria-label={group.label}
            // No edge-highlight: its inset top line becomes a crescent on a
            // circle, which makes the ring look heavier on top and the
            // hovered circle look off-center.
            className={cn(PILL, "pointer-events-auto p-1")}
          >
            {group.items.map((item) => (
              <li key={item.to} className="flex">
                <NavItem
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  active={
                    item.exact
                      ? pathname === item.to
                      : isUnder(pathname, item.to)
                  }
                  iconOnly
                  // 56px circles, 4px inset: the pill sizes to them, so a
                  // one-item pill is a circle and the corners stay concentric.
                  className="size-14 hover:bg-foreground/6"
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </nav>
  )
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
  iconOnly = false,
  className,
}: {
  to: LinkProps["to"]
  label: string
  icon: LucideIcon
  active: boolean
  /** Desktop dock: no label under the icon; the tooltip names it instead. */
  iconOnly?: boolean
  className?: string
}) {
  const link = (
    <Link
      to={to}
      // Switching tabs is instant: it happens all the time (no animation
      // budget), and a view-transition snapshot drops the bar's backdrop
      // blur for a frame, which read as a blink.
      viewTransition={false}
      aria-current={active ? "page" : undefined}
      aria-label={iconOnly ? label : undefined}
      className={cn(
        // Hover switches instantly (no transition): it's frequent.
        "pressable flex flex-col items-center justify-center gap-0.5 rounded-lg text-[0.6875rem] font-medium",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <Icon
        className="size-[1.375rem]"
        strokeWidth={active ? 2.25 : 1.75}
        // A soft fill stands in for iOS-style filled active icons.
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.2 : 0}
      />
      {iconOnly ? null : label}
    </Link>
  )
  if (!iconOnly) return link
  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      {/* Clears the pill's 4px inset plus a gap. */}
      <TooltipContent sideOffset={12}>{label}</TooltipContent>
    </Tooltip>
  )
}
