import { useQuery } from "@tanstack/react-query"
import { useStore } from "@tanstack/react-form"
import { FlightInput } from "@workspace/schemas"
import type { Flight } from "@workspace/schemas"
import { Button } from "@workspace/ui/components/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Trash2Icon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import type { z } from "zod"
import { useAppForm, useFieldContext } from "@/components/form/form-hook"
import { FormShell } from "@/components/log/log-forms"
import { ResponsiveSheet, useOpenSession } from "@/components/responsive-sheet"
import { airportsQuery, searchAirports } from "@/lib/airports"
import { airlineCode } from "@/lib/flight-math"
import { connectionTemplate } from "@/lib/flight-trips"
import { flightsQuery, useDeleteFlight, useSaveFlight } from "@/queries/archive"

const CABIN_OPTIONS = [
  { value: "economy", label: "Economy" },
  { value: "premium", label: "Premium economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
] as const

function useFieldErrorsOf<T>() {
  const field = useFieldContext<T>()
  const errors = useStore(field.store, (s) => s.meta.errors)
  const submitted = useStore(field.form.store, (s) => s.submissionAttempts > 0)
  const touched = useStore(field.store, (s) => s.meta.isTouched)
  const visible = touched || submitted ? errors : []
  return {
    field,
    errors: visible as Array<{ message?: string } | undefined>,
    invalid: visible.length > 0,
  }
}

/** Searchable airport picker; airports you've flown come first. */
function AirportField({ label, flown }: { label: string; flown: Set<string> }) {
  const { field, errors, invalid } = useFieldErrorsOf<string | undefined>()
  const { data: airports } = useQuery(airportsQuery())
  // Undefined until the user types, so a pre-filled airport shows its label.
  const [typed, setTyped] = useState<string>()
  const query = typed ?? ""
  const results = useMemo(
    () => (airports ? searchAirports(airports, query, flown) : []),
    [airports, query, flown]
  )
  const toLabel = (code: string | null) => {
    if (!code) return ""
    const airport = airports?.byCode.get(code)
    return airport ? `${code} · ${airport.city}` : code
  }

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Combobox
        items={results.map((a) => a.iata)}
        filter={null}
        value={field.state.value ?? null}
        onValueChange={(code) => field.handleChange(code ?? undefined)}
        inputValue={typed ?? toLabel(field.state.value ?? null)}
        onInputValueChange={setTyped}
        itemToStringLabel={toLabel}
      >
        <ComboboxInput
          id={field.name}
          placeholder={airports ? "City or code" : "Loading airports…"}
          disabled={!airports}
          aria-invalid={invalid || undefined}
          onBlur={field.handleBlur}
          autoCapitalize="characters"
          autoCorrect="off"
          className="w-full"
        />
        <ComboboxContent>
          <ComboboxEmpty>No airports found</ComboboxEmpty>
          <ComboboxList>
            {results.map((a) => (
              <ComboboxItem key={a.iata} value={a.iata}>
                <span className="w-9 shrink-0 font-semibold tabular-nums">
                  {a.iata}
                </span>
                <span className="min-w-0 truncate">
                  {a.city}
                  <span className="text-muted-foreground"> · {a.name}</span>
                </span>
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <FieldError errors={errors} />
    </Field>
  )
}

/** Local date + time, as printed on the boarding pass. */
function DateTimeField({
  label,
  optional = false,
}: {
  label: string
  optional?: boolean
}) {
  const { field, errors, invalid } = useFieldErrorsOf<string | undefined>()
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        type="datetime-local"
        value={field.state.value ?? ""}
        aria-invalid={invalid || undefined}
        onBlur={field.handleBlur}
        onChange={(e) =>
          field.handleChange(e.target.value || (optional ? undefined : ""))
        }
      />
      <FieldError errors={errors} />
    </Field>
  )
}

type SheetState = {
  open: boolean
  editing?: Flight
  /** Pre-filled values for a new flight (e.g. a connection). */
  template?: Partial<FlightInput>
}

/** Open/close state for `FlightSheet`, including "add a connection" flows. */
export function useFlightSheet() {
  const [state, setState] = useState<SheetState>({ open: false })
  return {
    openNew: () => setState({ open: true }),
    openEdit: (flight: Flight) => setState({ open: true, editing: flight }),
    openConnection: (flight: Flight | FlightInput) =>
      setState({ open: true, template: connectionTemplate(flight) }),
    sheetProps: {
      ...state,
      onOpenChange: (open: boolean) => setState((s) => ({ ...s, open })),
      onAddConnection: (flight: FlightInput) =>
        setState({ open: true, template: connectionTemplate(flight) }),
    },
  }
}

export function FlightSheet({
  open,
  onOpenChange,
  editing,
  template,
  onAddConnection,
}: SheetState & {
  onOpenChange: (open: boolean) => void
  /** Offered after saving a new flight, to chain the next leg. */
  onAddConnection?: (flight: FlightInput) => void
}) {
  const session = useOpenSession(open)
  const save = useSaveFlight()
  const remove = useDeleteFlight()
  const { data: flights } = useQuery(flightsQuery())

  async function handleDelete() {
    if (!editing) return
    await remove.mutateAsync(editing.id)
    onOpenChange(false)
    toast(`Deleted ${editing.from} → ${editing.to}`, {
      action: {
        label: "Undo",
        onClick: () => {
          const { id: _id, createdAt: _c, updatedAt: _u, ...input } = editing
          save.mutate({ input })
        },
      },
    })
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit flight" : template ? "Connection" : "New flight"}
      description={
        editing
          ? `${editing.from} → ${editing.to}`
          : template?.from
            ? `Continuing from ${template.from} · times are local`
            : "Times are local to each airport"
      }
    >
      <FlightForm
        key={`${editing?.id ?? "new"}-${session}`}
        editing={editing}
        template={template}
        history={flights ?? []}
        onSubmit={async (input) => {
          try {
            await save.mutateAsync({ id: editing?.id, input })
            toast.success(editing ? "Flight updated" : "Flight logged", {
              description: `${input.from} → ${input.to}`,
              action:
                !editing && onAddConnection
                  ? {
                      label: "Add connection",
                      onClick: () => onAddConnection(input),
                    }
                  : undefined,
            })
            onOpenChange(false)
          } catch (error) {
            toast.error("Couldn't save", {
              description: error instanceof Error ? error.message : undefined,
            })
          }
        }}
      />
      {editing ? (
        <Button
          variant="ghost"
          className="mt-3 h-11 w-full text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={remove.isPending}
        >
          <Trash2Icon />
          Delete flight
        </Button>
      ) : null}
    </ResponsiveSheet>
  )
}

function FlightForm({
  editing,
  template,
  history,
  onSubmit,
}: {
  editing?: Flight
  template?: Partial<FlightInput>
  history: Array<Flight>
  onSubmit: (input: FlightInput) => Promise<void>
}) {
  const flown = useMemo(
    () => new Set(history.flatMap((f) => [f.from, f.to])),
    [history]
  )
  // Remember which airline goes with each flight-number prefix you've used.
  const airlineByCode = useMemo(() => {
    const map = new Map<string, string>()
    for (const f of history) {
      const code = airlineCode(f.flightNumber)
      if (code && f.airline && !map.has(code)) map.set(code, f.airline)
    }
    return map
  }, [history])

  const base = editing ?? template
  const defaultValues: z.input<typeof FlightInput> = {
    from: base?.from ?? "",
    to: base?.to ?? "",
    departure: base?.departure ?? "",
    arrival: base?.arrival,
    flightNumber: base?.flightNumber,
    airline: base?.airline,
    aircraft: base?.aircraft,
    registration: base?.registration,
    seat: base?.seat,
    cabin: base?.cabin,
    reservation: base?.reservation,
    notes: base?.notes,
  }
  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: FlightInput },
    onSubmit: ({ value }) => onSubmit(FlightInput.parse(value)),
  })

  return (
    <FormShell onSubmit={form.handleSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <form.AppField name="from">
          {() => <AirportField label="From" flown={flown} />}
        </form.AppField>
        <form.AppField name="to">
          {() => <AirportField label="To" flown={flown} />}
        </form.AppField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <form.AppField name="departure">
          {() => <DateTimeField label="Departure" />}
        </form.AppField>
        <form.AppField name="arrival">
          {() => <DateTimeField label="Arrival" optional />}
        </form.AppField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <form.AppField
          name="flightNumber"
          listeners={{
            onBlur: ({ value }) => {
              const airline = airlineByCode.get(airlineCode(value) ?? "")
              if (airline && !form.getFieldValue("airline"))
                form.setFieldValue("airline", airline)
            },
          }}
        >
          {(f) => <f.TextField label="Flight number" placeholder="G3 2054" />}
        </form.AppField>
        <form.AppField name="airline">
          {(f) => <f.TextField label="Airline" placeholder="Gol" />}
        </form.AppField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <form.AppField name="seat">
          {(f) => <f.TextField label="Seat" placeholder="7F" />}
        </form.AppField>
        <form.AppField name="cabin">
          {(f) => (
            <f.SelectField
              label="Class"
              options={CABIN_OPTIONS}
              placeholder="Economy…"
            />
          )}
        </form.AppField>
      </div>
      <form.AppField name="aircraft">
        {(f) => <f.TextField label="Aircraft" placeholder="Boeing 737 MAX 8" />}
      </form.AppField>
      <div className="grid grid-cols-2 gap-3">
        <form.AppField name="registration">
          {(f) => <f.TextField label="Registration" placeholder="PR-GXA" />}
        </form.AppField>
        <form.AppField name="reservation">
          {(f) => <f.TextField label="Booking code" placeholder="LLMIVR" />}
        </form.AppField>
      </div>
      <form.AppField name="notes">
        {(f) => <f.TextareaField label="Notes" />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton>
          {editing ? "Save changes" : "Save flight"}
        </form.SubmitButton>
      </form.AppForm>
    </FormShell>
  )
}
