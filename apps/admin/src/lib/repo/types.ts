import type {
  ArchiveExport,
  BacklogItem,
  BookStatus,
  CollectionItem,
  CollectionItemDraft,
  CollectionItemInput,
  Flight,
  FlightInput,
  GameStatus,
  LibraryItem,
  LogEntry,
  LogInput,
  MediaType,
} from "@workspace/schemas"
import type { ProgressStatus } from "@/lib/status"

/** Item snapshot passed when logging, so the library can render offline from providers. */
export type LibraryItemInput = Omit<LibraryItem, "addedAt">

export type LibraryEntry = LibraryItem & {
  logCount: number
  /** The most recent logical date (watched/finished/started), falling back to createdAt. */
  lastLoggedAt?: string
  /** Rating from the most recent rated log. */
  rating?: number
  /** Games and books: status of the most recent log. */
  status?: ProgressStatus
}

export type RecentLog = { log: LogEntry; item: LibraryItem }

export type LogTarget = { type: MediaType; id: number }

/** `type:id` keys of everything logged / backlogged, for ✓ and bookmark badges. */
export type ArchiveIndex = {
  logged: Array<string>
  backlog: Array<string>
  /** Records with at least one copy in the collection. */
  owned: Array<string>
}

/** Release fields copied onto a new collection item. */
export type CollectionSnapshot = Omit<
  CollectionItem,
  | keyof CollectionItemInput
  | "id"
  | "addedAt"
  | "updatedAt"
  | "discogsInstanceId"
  | "rating"
  | "folder"
>

export type TypeStats = {
  items: number
  logs: number
  /** Count of ratings per value, index 0 = rating 1 … index 9 = rating 10. */
  ratings: Array<number>
  averageRating?: number
  backlog: number
}

export type ArchiveStats = {
  byType: Record<MediaType, TypeStats>
  /** Physical record copies (a release can be owned twice). */
  copies: number
  /** Latest status per book. */
  bookStatuses: Record<BookStatus, number>
  /** Latest status per game. */
  gameStatuses: Record<GameStatus, number>
  hoursPlayed: number
  /** Logs per calendar year (by log date), oldest first. */
  logsByYear: Array<{ year: number } & Record<MediaType, number>>
}

/**
 * The only way the UI touches persisted archive data.
 * `localRepository` backs it today; an API client will implement it next.
 */
export interface ArchiveRepository {
  listLibrary: (type: MediaType) => Promise<Array<LibraryEntry>>
  listLogs: (target: LogTarget) => Promise<Array<LogEntry>>
  listRecent: (limit: number) => Promise<Array<RecentLog>>
  addLog: (input: LogInput, item: LibraryItemInput) => Promise<LogEntry>
  updateLog: (id: string, input: LogInput) => Promise<LogEntry>
  deleteLog: (id: string) => Promise<void>
  listBacklog: () => Promise<Array<BacklogItem>>
  addToBacklog: (item: LibraryItemInput) => Promise<void>
  removeFromBacklog: (target: LogTarget) => Promise<void>
  getIndex: () => Promise<ArchiveIndex>
  getStats: () => Promise<ArchiveStats>
  listCollection: () => Promise<Array<CollectionItem>>
  addCollectionItem: (
    snapshot: CollectionSnapshot,
    input: CollectionItemInput
  ) => Promise<CollectionItem>
  updateCollectionItem: (
    id: string,
    input: CollectionItemInput
  ) => Promise<CollectionItem>
  deleteCollectionItem: (id: string) => Promise<void>
  /** Idempotent: copies already imported (same Discogs instance) are skipped. */
  importCollection: (
    drafts: Array<CollectionItemDraft>
  ) => Promise<{ added: number; skipped: number }>
  listFlights: () => Promise<Array<Flight>>
  addFlight: (input: FlightInput) => Promise<Flight>
  updateFlight: (id: string, input: FlightInput) => Promise<Flight>
  deleteFlight: (id: string) => Promise<void>
  exportAll: () => Promise<ArchiveExport>
  importAll: (data: ArchiveExport) => Promise<void>
  clear: () => Promise<void>
}
