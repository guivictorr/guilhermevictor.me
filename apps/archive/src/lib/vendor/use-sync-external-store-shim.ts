/*
 * Stand-in for `use-sync-external-store/shim` (aliased in vite.config.ts).
 * The shim is CommonJS and `require("react")`s at runtime; in the Vercel
 * function bundle that require isn't resolvable, so every SSR request
 * crashed. React 18+ ships the hook itself, so re-export it instead.
 */
export { useSyncExternalStore } from "react"
