import type { Grade } from "@workspace/schemas"

/** Goldmine grades, best first. */
export const GRADE_OPTIONS: ReadonlyArray<{ value: Grade; label: string }> = [
  { value: "M", label: "M · Mint" },
  { value: "NM", label: "NM · Near Mint" },
  { value: "VG+", label: "VG+ · Very Good Plus" },
  { value: "VG", label: "VG · Very Good" },
  { value: "G+", label: "G+ · Good Plus" },
  { value: "G", label: "G · Good" },
  { value: "F", label: "F · Fair" },
  { value: "P", label: "P · Poor" },
]

export function formatMoney(price?: { amount: number; currency: string }) {
  if (!price) return undefined
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: price.currency,
  }).format(price.amount)
}
