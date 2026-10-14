import { remoteRepository } from "./remote-repository"
import type { ArchiveRepository } from "./types"

export const repo: ArchiveRepository = remoteRepository

export * from "./types"
export * from "./log-utils"
