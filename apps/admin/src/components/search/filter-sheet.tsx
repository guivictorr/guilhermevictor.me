import { useQuery } from "@tanstack/react-query"
import type { MediaType } from "@workspace/schemas"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { useState } from "react"
import { OptionPicker } from "@/components/option-picker"
import { ResponsiveSheet, useOpenSession } from "@/components/responsive-sheet"
import { FILTER_FIELDS, filtersFor } from "@/lib/search-filters"
import type {
  FilterField,
  FilterKey,
  SearchFilters,
} from "@/lib/search-filters"
import { watchProvidersQuery } from "@/queries/media"

const ANY = "__any"
const RATINGS = ["2", "3", "3.5", "4", "4.5"]

/** Edits a draft of the filters; nothing changes until "Show results". */
export function FilterSheet({
  open,
  onOpenChange,
  type,
  filters,
  hasQuery,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: MediaType
  filters: SearchFilters
  hasQuery: boolean
  onApply: (filters: SearchFilters) => void
}) {
  const session = useOpenSession(open)
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filters"
      description={
        hasQuery
          ? "Narrowing your search"
          : "Browse without typing: filters alone find titles"
      }
    >
      <FilterForm
        key={`${type}-${session}`}
        type={type}
        initial={filtersFor(type, filters)}
        hasQuery={hasQuery}
        onApply={(next) => {
          onApply(next)
          onOpenChange(false)
        }}
      />
    </ResponsiveSheet>
  )
}

function FilterForm({
  type,
  initial,
  hasQuery,
  onApply,
}: {
  type: MediaType
  initial: SearchFilters
  hasQuery: boolean
  onApply: (filters: SearchFilters) => void
}) {
  const [draft, setDraft] = useState<SearchFilters>(initial)
  const set = (key: FilterKey, value: string | number | undefined) =>
    setDraft((d) => ({ ...d, [key]: value === "" ? undefined : value }))

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        onApply(draft)
      }}
    >
      <FieldGroup>
        {FILTER_FIELDS[type].map((field) => (
          <FilterControl
            key={field.key}
            field={field}
            type={type}
            draft={draft}
            set={set}
            hasQuery={hasQuery}
          />
        ))}
      </FieldGroup>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 flex-1"
          onClick={() => setDraft({})}
        >
          Reset
        </Button>
        <Button type="submit" size="lg" className="h-11 flex-1 text-base">
          Show results
        </Button>
      </div>
    </form>
  )
}

function FilterControl({
  field,
  type,
  draft,
  set,
  hasQuery,
}: {
  field: FilterField
  type: MediaType
  draft: SearchFilters
  set: (key: FilterKey, value: string | number | undefined) => void
  hasQuery: boolean
}) {
  const id = `filter-${field.key}`
  const hint =
    "browseOnly" in field && field.browseOnly && hasQuery ? (
      <FieldDescription>
        Applies when browsing without search text
      </FieldDescription>
    ) : null

  switch (field.control) {
    case "select":
      return (
        <Field>
          <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
          <OptionSelect
            id={id}
            value={draft[field.key]}
            options={field.options}
            onChange={(v) => set(field.key, v)}
          />
          {hint}
        </Field>
      )
    case "providers":
      return (
        <Field>
          <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
          <ProviderSelect
            id={id}
            type={type === "show" ? "show" : "movie"}
            value={draft.provider}
            onChange={(v) => set("provider", v)}
          />
          {hint}
        </Field>
      )
    case "text":
      return (
        <Field>
          <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
          <Input
            id={id}
            value={String(draft[field.key] ?? "")}
            placeholder={field.placeholder}
            autoComplete="off"
            onChange={(e) => set(field.key, e.target.value)}
          />
        </Field>
      )
    case "years":
      return (
        <Field>
          <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
          <div className="flex items-center gap-2">
            <Input
              id={id}
              inputMode="numeric"
              placeholder="From"
              aria-label="From year"
              value={draft.from ?? ""}
              onChange={(e) => set("from", yearValue(e.target.value))}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              inputMode="numeric"
              placeholder="To"
              aria-label="To year"
              value={draft.to ?? ""}
              onChange={(e) => set("to", yearValue(e.target.value))}
            />
          </div>
        </Field>
      )
    case "rating":
      return (
        <Field>
          <FieldLabel>{field.label}</FieldLabel>
          <ToggleGroup
            aria-label={field.label}
            variant="outline"
            spacing={2}
            value={[draft.rating === undefined ? ANY : String(draft.rating)]}
            onValueChange={(values) => {
              const next = values.at(-1)
              if (next) set("rating", next === ANY ? undefined : Number(next))
            }}
            className="flex w-full flex-wrap"
          >
            {[ANY, ...RATINGS].map((value) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className="h-9 rounded-full px-3.5 data-pressed:border-primary data-pressed:bg-primary data-pressed:text-primary-foreground"
              >
                {value === ANY ? "Any" : `${value}★+`}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      )
    case "toggle":
      return (
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
            <FieldDescription>{field.description}</FieldDescription>
          </FieldContent>
          <Switch
            id={id}
            checked={draft.extras === "1"}
            onCheckedChange={(checked) =>
              set("extras", checked ? "1" : undefined)
            }
          />
        </Field>
      )
  }
}

/** Keeps partial typing ("19") in the box but only stores real years. */
function yearValue(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4)
  return digits ? Number(digits) : undefined
}

function OptionSelect({
  id,
  value,
  options,
  onChange,
}: {
  id: string
  value: string | number | undefined
  options: Array<{ value: string; label: string }>
  onChange: (value: string | undefined) => void
}) {
  return (
    <OptionPicker
      id={id}
      options={[{ value: ANY, label: "Any" }, ...options]}
      value={value === undefined ? ANY : String(value)}
      onChange={(v) => onChange(!v || v === ANY ? undefined : v)}
    />
  )
}

function ProviderSelect({
  id,
  type,
  value,
  onChange,
}: {
  id: string
  type: "movie" | "show"
  value?: string
  onChange: (value: string | undefined) => void
}) {
  const { data, isPending } = useQuery(watchProvidersQuery(type))
  if (isPending)
    return <Input id={id} disabled placeholder="Loading services…" readOnly />
  return (
    <OptionSelect
      id={id}
      value={value}
      options={data ?? []}
      onChange={onChange}
    />
  )
}
