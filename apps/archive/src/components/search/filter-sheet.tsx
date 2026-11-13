import { useQueries, useQuery } from "@tanstack/react-query"
import type { MediaType } from "@workspace/schemas"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Slider } from "@workspace/ui/components/slider"
import { Switch } from "@workspace/ui/components/switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"
import { CheckIcon, MinusIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { formatCount } from "./search-view"
import { OptionPicker } from "@/components/option-picker"
import { ResponsiveSheet, useOpenSession } from "@/components/responsive-sheet"
import { SegmentedControl } from "@/components/segmented-control"
import { KINDS } from "@/lib/media-kinds"
import { FILTER_FIELDS, filtersFor, listOf, toList } from "@/lib/search-filters"
import type {
  FilterField,
  FilterKey,
  SearchFilters,
} from "@/lib/search-filters"
import {
  countQuery,
  peopleQuery,
  personQuery,
  watchProvidersQuery,
} from "@/queries/media"

const ANY = "__any"
const RATINGS = ["2", "3", "3.5", "4", "4.5"]
const FIRST_YEAR = 1900
const THIS_YEAR = new Date().getFullYear()
const DECADES = [1960, 1970, 1980, 1990, 2000, 2010, 2020]

/** What the sheet edits besides URL filters: this browser's view switches. */
export type ArchiveView = { hideHave: boolean; hideBacklog: boolean }

/**
 * Edits a draft of the filters; nothing changes until "Show". The button
 * counts the matches as you go, where the provider can (see countResults).
 */
export function FilterSheet({
  open,
  onOpenChange,
  type,
  query,
  filters,
  view,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: MediaType
  query: string
  filters: SearchFilters
  view: ArchiveView
  onApply: (filters: SearchFilters, view: ArchiveView) => void
}) {
  const session = useOpenSession(open)
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filters"
      description={
        query ? `Narrowing “${query}”` : "Filters alone find titles too"
      }
    >
      <FilterForm
        key={`${type}-${session}`}
        type={type}
        query={query}
        initial={filtersFor(type, filters)}
        initialView={view}
        onApply={(next, nextView) => {
          onApply(next, nextView)
          onOpenChange(false)
        }}
      />
    </ResponsiveSheet>
  )
}

function FilterForm({
  type,
  query,
  initial,
  initialView,
  onApply,
}: {
  type: MediaType
  query: string
  initial: SearchFilters
  initialView: ArchiveView
  onApply: (filters: SearchFilters, view: ArchiveView) => void
}) {
  const [draft, setDraft] = useState<SearchFilters>(initial)
  const [view, setView] = useState(initialView)
  const set = (key: FilterKey, value: string | number | undefined) =>
    setDraft((d) => ({ ...d, [key]: value === "" ? undefined : value }))
  const patch = (next: SearchFilters) => setDraft((d) => ({ ...d, ...next }))

  // Count the draft a beat after it stops changing.
  const [counted, setCounted] = useState(draft)
  useEffect(() => {
    const timeout = setTimeout(() => setCounted(draft), 400)
    return () => clearTimeout(timeout)
  }, [draft])
  const count = useQuery({
    ...countQuery(type, query, counted),
    placeholderData: (previous) => previous,
  })
  const plural = KINDS[type].plural.toLowerCase()
  const showLabel =
    typeof count.data === "number"
      ? `Show ${formatCount(count.data)} ${count.data === 1 ? KINDS[type].label.toLowerCase() : plural}`
      : `Show ${plural}`

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        onApply(draft, view)
      }}
    >
      <div className="-mt-2 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setDraft({})}
        >
          Reset filters
        </Button>
      </div>
      <FieldGroup>
        <YourArchive type={type} view={view} onView={setView} />
        <FieldSeparator />
        {FILTER_FIELDS[type].map((field) => (
          <FilterControl
            key={field.key}
            field={field}
            type={type}
            draft={draft}
            set={set}
            patch={patch}
            hasQuery={Boolean(query)}
          />
        ))}
      </FieldGroup>

      {/* Sticky so the count stays in view while scrolling the sheet. */}
      <div className="sticky -bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] -mx-4 border-t bg-popover px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <Button
          type="submit"
          size="lg"
          className="h-11 w-full text-base tabular-nums"
        >
          {showLabel}
        </Button>
      </div>
    </form>
  )
}

/** Filters only your archive knows: hide what you already have. */
function YourArchive({
  type,
  view,
  onView,
}: {
  type: MediaType
  view: ArchiveView
  onView: (view: ArchiveView) => void
}) {
  return (
    <>
      <p className="type-overline text-muted-foreground">Your archive</p>
      <SwitchRow
        id="hide-have"
        label={type === "record" ? "Hide what I own" : "Hide what I’ve logged"}
        description={
          type === "record"
            ? "Releases with a copy in your collection"
            : `${KINDS[type].plural} you already logged`
        }
        checked={view.hideHave}
        onChange={(hideHave) => onView({ ...view, hideHave })}
      />
      <SwitchRow
        id="hide-backlog"
        label="Hide my backlog"
        description="Things already saved for later"
        checked={view.hideBacklog}
        onChange={(hideBacklog) => onView({ ...view, hideBacklog })}
      />
    </>
  )
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <FieldDescription className="line-clamp-2">
          {description}
        </FieldDescription>
      </FieldContent>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </Field>
  )
}

function FilterControl({
  field,
  type,
  draft,
  set,
  patch,
  hasQuery,
}: {
  field: FilterField
  type: MediaType
  draft: SearchFilters
  set: (key: FilterKey, value: string | number | undefined) => void
  patch: (next: SearchFilters) => void
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
    case "genres":
      return (
        <Field>
          <div className="flex items-baseline justify-between gap-3">
            <FieldLabel>{field.label}</FieldLabel>
            <span className="text-xs text-muted-foreground">
              Tap to include, again to exclude
            </span>
          </div>
          <GenreChips
            options={field.options}
            include={listOf(draft.genre)}
            exclude={listOf(draft.xgenre)}
            onChange={(include, exclude) =>
              patch({ genre: toList(include), xgenre: toList(exclude) })
            }
          />
        </Field>
      )
    case "years":
      return type === "record" ? (
        // Discogs filters a single year.
        <Field>
          <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
          <Input
            id={id}
            inputMode="numeric"
            placeholder="Any year"
            value={draft.from ?? ""}
            onChange={(e) => set("from", yearValue(e.target.value))}
          />
        </Field>
      ) : (
        <YearRange draft={draft} patch={patch} label={field.label} />
      )
    case "segments":
      return (
        <Field>
          <FieldLabel>{field.label}</FieldLabel>
          <SegmentedControl
            label={field.label}
            value={
              draft[field.key] === undefined ? ANY : String(draft[field.key])
            }
            options={[{ value: ANY, label: "Any" }, ...field.options]}
            onValueChange={(v) => set(field.key, v === ANY ? undefined : v)}
          />
          {hint}
        </Field>
      )
    case "people":
      return (
        <Field>
          <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
          <PeoplePicker
            id={id}
            ids={listOf(draft.people)}
            onChange={(ids) => set("people", toList(ids))}
          />
          {hint}
        </Field>
      )
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
            // Several (your services) aren't one option of this list.
            value={
              listOf(draft.provider).length === 1 ? draft.provider : undefined
            }
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
                className="h-9 rounded-md px-3.5 data-pressed:border-foreground data-pressed:bg-foreground data-pressed:text-background"
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

/** Include → exclude → neither, per genre. */
function GenreChips({
  options,
  include,
  exclude,
  onChange,
}: {
  options: Array<{ value: string; label: string }>
  include: Array<string>
  exclude: Array<string>
  onChange: (include: Array<string>, exclude: Array<string>) => void
}) {
  const cycle = (value: string) => {
    const rest = (list: Array<string>) => list.filter((v) => v !== value)
    if (include.includes(value)) onChange(rest(include), [...exclude, value])
    else if (exclude.includes(value)) onChange(include, rest(exclude))
    else onChange([...include, value], exclude)
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {options.map((option) => {
        const state = include.includes(option.value)
          ? "include"
          : exclude.includes(option.value)
            ? "exclude"
            : undefined
        return (
          <li key={option.value}>
            <button
              type="button"
              onClick={() => cycle(option.value)}
              aria-label={`${option.label}${state === "include" ? ", included" : state === "exclude" ? ", excluded" : ""}`}
              className={cn(
                "pressable inline-flex h-9 items-center gap-1.5 rounded-md border px-3.5 text-sm font-medium",
                state === "include" &&
                  "border-foreground bg-foreground ps-3 text-background",
                state === "exclude" &&
                  "border-destructive/60 ps-3 text-destructive line-through",
                !state && "border-transparent bg-muted"
              )}
            >
              {state === "include" ? <CheckIcon className="size-4" /> : null}
              {state === "exclude" ? <MinusIcon className="size-4" /> : null}
              {option.label}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function YearRange({
  draft,
  patch,
  label,
}: {
  draft: SearchFilters
  patch: (next: SearchFilters) => void
  label: string
}) {
  const from = draft.from ?? FIRST_YEAR
  const to = draft.to ?? THIS_YEAR
  const any = draft.from === undefined && draft.to === undefined
  const setRange = (start: number, end: number) =>
    patch({
      from: start <= FIRST_YEAR ? undefined : start,
      to: end >= THIS_YEAR ? undefined : end,
    })
  return (
    <Field>
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel>{label}</FieldLabel>
        <span className="text-sm font-medium tabular-nums">
          {any ? "Any year" : `${from} – ${to}`}
        </span>
      </div>
      <Slider
        aria-label={label}
        min={FIRST_YEAR}
        max={THIS_YEAR}
        step={1}
        minStepsBetweenValues={0}
        value={[from, to]}
        onValueChange={(value) => {
          const [start = FIRST_YEAR, end = THIS_YEAR] = value as Array<number>
          setRange(start, end)
        }}
        className="py-3"
      />
      <ul className="fade-x -mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4">
        {DECADES.map((decade) => {
          const end = Math.min(decade + 9, THIS_YEAR)
          const on = draft.from === decade && draft.to === end
          return (
            <li key={decade}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() =>
                  on
                    ? patch({ from: undefined, to: undefined })
                    : patch({ from: decade, to: end })
                }
                className={cn(
                  "pressable h-8 shrink-0 rounded-md px-3 text-sm font-medium tabular-nums",
                  on ? "bg-foreground text-background" : "bg-muted"
                )}
              >
                {decade}s
              </button>
            </li>
          )
        })}
      </ul>
    </Field>
  )
}

/** Directors, actors, writers (TMDB); a match needs all of them. */
function PeoplePicker({
  id,
  ids,
  onChange,
}: {
  id: string
  ids: Array<string>
  onChange: (ids: Array<string>) => void
}) {
  const [text, setText] = useState("")
  const [query, setQuery] = useState("")
  useEffect(() => {
    const timeout = setTimeout(() => setQuery(text.trim()), 300)
    return () => clearTimeout(timeout)
  }, [text])
  const results = useQuery(peopleQuery(query))
  const people = useQueries({
    queries: ids.map((pid) => personQuery(Number(pid))),
  })

  return (
    <div className="space-y-2">
      {ids.length ? (
        <ul className="flex flex-wrap gap-2" aria-label="Selected people">
          {ids.map((pid, i) => (
            <li key={pid}>
              <button
                type="button"
                onClick={() => onChange(ids.filter((x) => x !== pid))}
                aria-label={`Remove ${people[i]?.data?.name ?? "person"}`}
                className="pressable inline-flex h-8 items-center gap-1 rounded-md bg-foreground ps-3 pe-2 text-sm font-medium text-background"
              >
                {people[i]?.data?.name ?? "…"}
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Input
        id={id}
        value={text}
        placeholder="Director, actor, writer…"
        autoComplete="off"
        onChange={(e) => setText(e.target.value)}
      />
      {query.length > 1 && results.data?.length ? (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {results.data
            .filter((p) => !ids.includes(String(p.id)))
            .map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange([...ids, String(person.id)])
                    setText("")
                  }}
                  className="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left text-sm hover:bg-muted/50 active:bg-muted"
                >
                  <span className="font-medium">{person.name}</span>
                  {person.department ? (
                    <span className="text-xs text-muted-foreground">
                      {person.department}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  )
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
