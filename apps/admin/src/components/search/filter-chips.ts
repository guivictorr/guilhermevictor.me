import { useQueries, useQuery } from "@tanstack/react-query"
import type { MediaType } from "@workspace/schemas"
import { FILTER_FIELDS, fieldKeys, listOf } from "@/lib/search-filters"
import type {
  FilterField,
  FilterKey,
  SearchFilters,
} from "@/lib/search-filters"
import { personQuery, watchProvidersQuery } from "@/queries/media"

export type FilterChip = { key: FilterKey; label: string }

/**
 * Active filters as short labels ("Science Fiction, not Horror", "1970–1989"), one per field. Sort isn't a chip: the results toolbar
 * shows it.
 */
export function useFilterChips(
  type: MediaType,
  filters: SearchFilters
): Array<FilterChip> {
  const tmdb = type === "movie" || type === "show"
  const { data: providers } = useQuery({
    ...watchProvidersQuery(type === "show" ? "show" : "movie"),
    enabled: tmdb && filters.provider !== undefined,
  })
  const people = useQueries({
    queries: listOf(filters.people).map((id) => personQuery(Number(id))),
  })
  const names = new Map(
    people.flatMap((p) => (p.data ? [[String(p.data.id), p.data.name]] : []))
  )

  return FILTER_FIELDS[type].flatMap((field) => {
    if (field.key === "sort") return []
    if (!fieldKeys(field).some((key) => filters[key] !== undefined)) return []
    const label = chipLabel(field, filters, {
      providerName: (id) => providers?.find((p) => p.value === id)?.label,
      personName: (id) => names.get(id),
    })
    return label ? [{ key: field.key, label }] : []
  })
}

function chipLabel(
  field: FilterField,
  filters: SearchFilters,
  lookup: {
    providerName: (id: string) => string | undefined
    personName: (id: string) => string | undefined
  }
): string | undefined {
  const optionLabel = (options: Array<{ value: string; label: string }>) => {
    const value = filters[field.key]
    return options.find((o) => o.value === String(value))?.label ?? value
  }
  switch (field.control) {
    case "years": {
      const { from, to } = filters
      if (from === to) return String(from)
      return `${from ?? "…"}–${to ?? "…"}`
    }
    case "rating":
      return `${filters.rating}★+`
    case "toggle":
      return "With DLC & editions"
    case "providers": {
      const ids = listOf(filters.provider)
      return ids.length === 1
        ? (lookup.providerName(ids[0] ?? "") ?? "Streaming")
        : `On ${ids.length} services`
    }
    case "genres": {
      const name = (id: string) =>
        field.options.find((o) => o.value === id)?.label ?? id
      return [
        ...listOf(filters.genre).map(name),
        ...listOf(filters.xgenre).map((id) => `not ${name(id)}`),
      ].join(", ")
    }
    case "people":
      return listOf(filters.people)
        .map((id) => lookup.personName(id) ?? "Someone")
        .join(", ")
    case "segments":
      return `${field.label} ${optionLabel(field.options)}`
    case "select":
      return `${field.label}: ${optionLabel(field.options)}`
    case "text":
      return `${field.label}: ${filters[field.key]}`
  }
}
