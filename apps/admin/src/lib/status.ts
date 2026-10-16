import type { BookStatus, GameStatus, ShowStatus } from "@workspace/schemas"
import { BOOK_STATUS_OPTIONS } from "./book-status"
import { GAME_STATUS_OPTIONS } from "./game-status"
import { SHOW_STATUS_OPTIONS } from "./show-status"

/** Progress status of the latest log, for kinds that have one. */
export type ProgressStatus = GameStatus | BookStatus | ShowStatus

export function statusLabel(status: ProgressStatus | undefined) {
  if (!status) return undefined
  return (
    GAME_STATUS_OPTIONS.find((o) => o.value === status)?.label ??
    BOOK_STATUS_OPTIONS.find((o) => o.value === status)?.label ??
    SHOW_STATUS_OPTIONS.find((o) => o.value === status)?.label
  )
}
