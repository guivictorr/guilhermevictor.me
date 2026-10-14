import type { LogEntry } from "@workspace/schemas"
import { useState } from "react"

/**
 * Sheet state for "new log" vs "edit log". `editing` is only replaced on
 * open so the form doesn't swap content while the sheet animates closed.
 */
export function useLogSheet() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LogEntry | undefined>()

  return {
    open,
    editing,
    onOpenChange: setOpen,
    openNew: () => {
      setEditing(undefined)
      setOpen(true)
    },
    openEdit: (log: LogEntry) => {
      setEditing(log)
      setOpen(true)
    },
  }
}
