import { useTheme } from "next-themes"
import { useEffect } from "react"

const COLORS = { light: "#efece4", dark: "#15140f" }

/**
 * theme-color metas follow the OS scheme; when the user forces a theme
 * in Settings, pin the status bar color to it instead.
 */
export function ThemeColorSync() {
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    const metas = document.querySelectorAll<HTMLMetaElement>(
      'meta[name="theme-color"]'
    )
    metas.forEach((meta) => {
      const scheme = meta.media.includes("dark") ? "dark" : "light"
      const forced =
        theme !== "system" && resolvedTheme ? resolvedTheme : scheme
      meta.content = COLORS[forced === "dark" ? "dark" : "light"]
    })
  }, [theme, resolvedTheme])

  return null
}
