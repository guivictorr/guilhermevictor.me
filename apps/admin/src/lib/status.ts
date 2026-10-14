import type { BookStatus, GameStatus } from "@workspace/schemas"
import { BOOK_STATUS_OPTIONS } from "./book-status"
import { GAME_STATUS_OPTIONS } from "./game-status"

/** Progress status of the latest log, for kinds that have one. */
export type ProgressStatus = GameStatus | BookStatus

export function statusLabel(status: ProgressStatus | undefined) {
  if (!status) return undefined
  return (
    GAME_STATUS_OPTIONS.find((o) => o.value === status)?.label ??
    BOOK_STATUS_OPTIONS.find((o) => o.value === status)?.label
  )
}
