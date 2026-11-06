import {
  BookmarkIcon,
  HouseIcon,
  LibraryIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-react"
import { LIBRARY_SECTIONS } from "@/lib/media-kinds"

/** Phone tab bar. "Library" covers every kind; pages switch kinds with chips. */
export const TAB_ITEMS = [
  { to: "/", label: "Home", icon: HouseIcon, match: ["/"] },
  {
    to: "/movies",
    label: "Library",
    icon: LibraryIcon,
    match: LIBRARY_SECTIONS.map((section) => section.to),
  },
  { to: "/backlog", label: "Backlog", icon: BookmarkIcon, match: ["/backlog"] },
  { to: "/search", label: "Search", icon: SearchIcon, match: ["/search"] },
] as const

/**
 * Desktop dock: one pill per group, with a gap between groups. `exact`
 * items only light up on their own path ("/" would match everything).
 */
export const DOCK_GROUPS = [
  {
    label: "Main",
    items: [
      { to: "/", label: "Home", icon: HouseIcon, exact: true },
      { to: "/search", label: "Search", icon: SearchIcon, exact: false },
    ],
  },
  {
    label: "Library",
    items: LIBRARY_SECTIONS.map((section) => ({
      to: section.to,
      label: section.plural,
      icon: section.icon,
      exact: false,
    })),
  },
  {
    label: "Lists",
    items: [
      { to: "/backlog", label: "Backlog", icon: BookmarkIcon, exact: false },
    ],
  },
  {
    label: "App",
    items: [
      { to: "/settings", label: "Settings", icon: SettingsIcon, exact: false },
    ],
  },
] as const

/** True when `pathname` is `base` or nested under it ("/" only matches itself). */
export const isUnder = (pathname: string, base: string) =>
  base === "/"
    ? pathname === "/"
    : pathname === base || pathname.startsWith(`${base}/`)
