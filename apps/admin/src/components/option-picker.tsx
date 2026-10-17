import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { useMemo, useState } from "react"

/** Past this many options a list is searched, not scrolled. */
const SELECT_MAX = 8

type Option = { value: string; label: string }

/**
 * One choice from a list: a select while the list is short, a searchable
 * combobox once it's long (platforms, streaming services, genres). Same
 * props either way, so callers don't decide.
 */
export function OptionPicker({
  id,
  options,
  value,
  onChange,
  placeholder = "Select…",
  invalid,
  onBlur,
}: {
  id?: string
  options: ReadonlyArray<Option>
  value: string | undefined
  onChange: (value: string | undefined) => void
  placeholder?: string
  invalid?: boolean
  onBlur?: () => void
}) {
  if (options.length <= SELECT_MAX)
    return (
      <Select
        items={options}
        value={value ?? null}
        onValueChange={(next) => onChange(next ?? undefined)}
      >
        <SelectTrigger
          id={id}
          aria-invalid={invalid || undefined}
          onBlur={onBlur}
          className="w-full"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  return (
    <SearchablePicker
      id={id}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      invalid={invalid}
      onBlur={onBlur}
    />
  )
}

function SearchablePicker({
  id,
  options,
  value,
  onChange,
  placeholder,
  invalid,
  onBlur,
}: {
  id?: string
  options: ReadonlyArray<Option>
  value: string | undefined
  onChange: (value: string | undefined) => void
  placeholder: string
  invalid?: boolean
  onBlur?: () => void
}) {
  const labels = useMemo(
    () => new Map(options.map((o) => [o.value, o.label])),
    [options]
  )
  // What's typed while searching; the chosen label otherwise.
  const [typed, setTyped] = useState<string>()
  const results = useMemo(() => {
    const needle = typed?.trim().toLocaleLowerCase()
    return needle
      ? options.filter((o) => o.label.toLocaleLowerCase().includes(needle))
      : options
  }, [options, typed])
  const toLabel = (v: string | null) => (v ? (labels.get(v) ?? v) : "")

  return (
    <Combobox
      items={results.map((o) => o.value)}
      filter={null}
      value={value ?? null}
      onValueChange={(next) => {
        onChange(next ?? undefined)
        setTyped(undefined)
      }}
      inputValue={typed ?? toLabel(value ?? null)}
      onInputValueChange={setTyped}
      itemToStringLabel={toLabel}
      onOpenChange={(open) => {
        // Closing without picking restores the chosen label.
        if (!open) setTyped(undefined)
      }}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        onBlur={onBlur}
        autoCorrect="off"
        className="w-full"
      />
      <ComboboxContent>
        <ComboboxEmpty>No matches</ComboboxEmpty>
        <ComboboxList>
          {results.map((option) => (
            <ComboboxItem key={option.value} value={option.value}>
              {option.label}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
