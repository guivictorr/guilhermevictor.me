import type { ShowStatus } from "@workspace/schemas"

export const SHOW_STATUS_OPTIONS: ReadonlyArray<{
  value: ShowStatus
  label: string
}> = [
  { value: "watching", label: "Watching" },
  { value: "finished", label: "Finished" },
  { value: "abandoned", label: "Abandoned" },
]
