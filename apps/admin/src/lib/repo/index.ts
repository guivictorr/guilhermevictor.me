import { localRepository } from "./local-repository"
import type { ArchiveRepository } from "./types"

/** Swap this for the API-backed repository once the backend exists. */
export const repo: ArchiveRepository = localRepository

export * from "./types"
export * from "./log-utils"
