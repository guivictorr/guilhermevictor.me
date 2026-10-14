import type { ImageRef, MediaType, WorkId } from "@workspace/schemas"

/** One interesting number or title about your archive (Home's fact deck). */
export type Fact = {
  id: string
  kind: MediaType | "flight" | "all"
  /** What it is: "Most rewatched", "Hours played". */
  label: string
  /** The answer: a title, a name or a number. */
  value: string
  unit?: string
  detail?: string
  /** Numbers render in the dot-matrix face, like a departure board. */
  numeric?: boolean
  link?: { type: MediaType; id: WorkId }
  image?: ImageRef
}
