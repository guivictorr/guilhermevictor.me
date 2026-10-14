import type { BookFormat, BookStatus } from "@workspace/schemas"

export const BOOK_STATUS_OPTIONS: ReadonlyArray<{
  value: BookStatus
  label: string
}> = [
  { value: "reading", label: "Reading" },
  { value: "finished", label: "Finished" },
  { value: "abandoned", label: "Abandoned" },
]

export const BOOK_FORMAT_OPTIONS: ReadonlyArray<{
  value: BookFormat
  label: string
}> = [
  { value: "physical", label: "Physical" },
  { value: "ebook", label: "E-book" },
  { value: "audiobook", label: "Audiobook" },
]
