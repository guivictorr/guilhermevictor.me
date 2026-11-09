import { LegacyArchiveExport } from "@workspace/schemas"
import { migrateExport } from "./derive"

/*
 * Before the server existed, the archive lived in this browser under
 * `archive:v1`. Settings offers it as a download so nothing is lost.
 */

const STORAGE_KEY = "archive:v1"

export function readLegacyLocalData(): LegacyArchiveExport | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed = LegacyArchiveExport.safeParse(
      migrateExport({
        version: 1,
        exportedAt: new Date().toISOString(),
        ...(JSON.parse(raw) as object),
      })
    )
    return parsed.success ? parsed.data : undefined
  } catch {
    return undefined
  }
}

export function clearLegacyLocalData() {
  window.localStorage.removeItem(STORAGE_KEY)
}
