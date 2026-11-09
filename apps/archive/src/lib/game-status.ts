import type { GameStatus } from "@workspace/schemas"

export const GAME_STATUS_OPTIONS: ReadonlyArray<{
  value: GameStatus
  label: string
}> = [
  { value: "playing", label: "Playing" },
  { value: "finished", label: "Finished" },
  { value: "completed", label: "100%" },
  { value: "played", label: "Played" },
  { value: "paused", label: "Paused" },
  { value: "abandoned", label: "Abandoned" },
]

export const gameStatusLabel = (status: GameStatus | undefined) =>
  GAME_STATUS_OPTIONS.find((o) => o.value === status)?.label
