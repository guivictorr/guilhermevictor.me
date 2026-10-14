import { notFound } from "@tanstack/react-router"

/** Route params arrive as strings; reject anything that isn't a positive integer id. */
export function parseId(value: string, { allowZero = false } = {}) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < (allowZero ? 0 : 1)) throw notFound()
  return id
}
