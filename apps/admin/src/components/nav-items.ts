import {
  BarChart3Icon,
  BookmarkIcon,
  HouseIcon,
  LibraryIcon,
  SearchIcon,
} from "lucide-react"
import { KINDS, KIND_ORDER } from "@/lib/media-kinds"

/** Phone tab bar. "Library" covers every kind; pages switch kinds with chips. */
export const TAB_ITEMS = [
  { to: "/", label: "Home", icon: HouseIcon, match: ["/"] },
  {
    to: "/movies",
    label: "Library",
    icon: LibraryIcon,
    match: KIND_ORDER.map((type) => KINDS[type].to),
  },
  { to: "/backlog", label: "Backlog", icon: BookmarkIcon, match: ["/backlog"] },
  { to: "/stats", label: "Stats", icon: BarChart3Icon, match: ["/stats"] },
  { to: "/search", label: "Search", icon: SearchIcon, match: ["/search"] },
] as const

/** Desktop sidebar, in sections. */
export const SIDEBAR_SECTIONS = [
  {
    items: [
      { to: "/", label: "Home", icon: HouseIcon, exact: true },
      { to: "/search", label: "Search", icon: SearchIcon, exact: false },
    ],
  },
  {
    title: "Library",
    items: KIND_ORDER.map((type) => ({
      to: KINDS[type].to,
      label: KINDS[type].plural,
      icon: KINDS[type].icon,
      exact: false,
    })),
  },
  {
    items: [
      { to: "/backlog", label: "Backlog", icon: BookmarkIcon, exact: false },
      { to: "/stats", label: "Stats", icon: BarChart3Icon, exact: false },
    ],
  },
] as const

/** True when `pathname` is `base` or nested under it ("/" only matches itself). */
export const isUnder = (pathname: string, base: string) =>
  base === "/"
    ? pathname === "/"
    : pathname === base || pathname.startsWith(`${base}/`)
