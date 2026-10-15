import type { LogEntry } from "@workspace/schemas"
import { useCallback, useState } from "react"

/**
 * Sheet state for "new log" vs "edit log". `editing` is only replaced on
 * open so the form doesn't swap content while the sheet animates closed.
 */
export function useLogSheet() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LogEntry | undefined>()

  // Stable, so effects can depend on them (e.g. opening from `?log=new`).
  const openNew = useCallback(() => {
    setEditing(undefined)
    setOpen(true)
  }, [])
  const openEdit = useCallback((log: LogEntry) => {
    setEditing(log)
    setOpen(true)
  }, [])

  return { open, editing, onOpenChange: setOpen, openNew, openEdit }
}
