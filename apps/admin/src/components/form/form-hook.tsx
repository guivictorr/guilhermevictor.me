import {
  createFormHook,
  createFormHookContexts,
  useStore,
} from "@tanstack/react-form"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Spinner } from "@workspace/ui/components/spinner"
import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { StarRatingInput } from "@/components/star-rating"

/*
 * App-wide TanStack Form setup: field components read their field from
 * context, so forms stay declarative (`<form.AppField>{f => <f.DateField/>}`).
 */

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

function useFieldErrors() {
  const field = useFieldContext<unknown>()
  const errors = useStore(field.store, (s) => s.meta.errors)
  const touched = useStore(field.store, (s) => s.meta.isTouched)
  const submitted = useStore(field.form.store, (s) => s.submissionAttempts > 0)
  // Only nag after the user has interacted with the field or tried to submit.
  const visible = touched || submitted ? errors : []
  return {
    field,
    errors: visible as Array<{ message?: string } | undefined>,
    invalid: visible.length > 0,
  }
}

function DateField({
  label,
  optional = false,
  max,
  description,
}: {
  label: string
  optional?: boolean
  max?: string
  description?: string
}) {
  const { errors, invalid } = useFieldErrors()
  const field = useFieldContext<string | undefined>()
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        type="date"
        max={max}
        value={field.state.value ?? ""}
        aria-invalid={invalid || undefined}
        onBlur={field.handleBlur}
        onChange={(e) =>
          field.handleChange(e.target.value || (optional ? undefined : ""))
        }
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError errors={errors} />
    </Field>
  )
}

function RatingField({ label = "Rating" }: { label?: string }) {
  const field = useFieldContext<number | undefined>()
  return (
    <Field>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <StarRatingInput
        id={field.name}
        value={field.state.value}
        onChange={field.handleChange}
      />
    </Field>
  )
}

function SwitchField({
  label,
  description,
}: {
  label: string
  description?: string
}) {
  const field = useFieldContext<boolean>()
  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
      </FieldContent>
      <Switch
        id={field.name}
        checked={field.state.value}
        onCheckedChange={field.handleChange}
      />
    </Field>
  )
}

function TextField({
  label,
  placeholder,
}: {
  label: string
  placeholder?: string
}) {
  const { errors, invalid } = useFieldErrors()
  const field = useFieldContext<string | undefined>()
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        placeholder={placeholder}
        value={field.state.value ?? ""}
        aria-invalid={invalid || undefined}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value || undefined)}
      />
      <FieldError errors={errors} />
    </Field>
  )
}

function TextareaField({
  label,
  placeholder,
}: {
  label: string
  placeholder?: string
}) {
  const { errors, invalid } = useFieldErrors()
  const field = useFieldContext<string | undefined>()
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Textarea
        id={field.name}
        rows={4}
        placeholder={placeholder}
        value={field.state.value ?? ""}
        aria-invalid={invalid || undefined}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value || undefined)}
        className="field-sizing-content min-h-24"
      />
      <FieldError errors={errors} />
    </Field>
  )
}

function NumberField({
  label,
  suffix,
  step = 1,
}: {
  label: string
  suffix?: string
  step?: number
}) {
  const { errors, invalid } = useFieldErrors()
  const field = useFieldContext<number | undefined>()
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {suffix ? (
          <span className="font-normal text-muted-foreground">({suffix})</span>
        ) : null}
      </FieldLabel>
      <Input
        id={field.name}
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={field.state.value ?? ""}
        aria-invalid={invalid || undefined}
        onBlur={field.handleBlur}
        onChange={(e) => {
          const next = e.target.valueAsNumber
          field.handleChange(Number.isNaN(next) ? undefined : next)
        }}
      />
      <FieldError errors={errors} />
    </Field>
  )
}

function SelectField({
  label,
  options,
  placeholder = "Select…",
}: {
  label: string
  options: ReadonlyArray<{ value: string; label: string }>
  placeholder?: string
}) {
  const field = useFieldContext<string | undefined>()
  return (
    <Field>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Select
        items={options}
        value={field.state.value ?? null}
        onValueChange={(value) => field.handleChange(value ?? undefined)}
      >
        <SelectTrigger id={field.name} className="w-full">
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
    </Field>
  )
}

/** Single-choice chips for small enums; wraps on narrow screens. */
function SegmentedField<T extends string>({
  label,
  options,
}: {
  label: string
  options: ReadonlyArray<{ value: T; label: string }>
}) {
  const field = useFieldContext<T>()
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <ToggleGroup
        aria-label={label}
        variant="outline"
        spacing={2}
        value={[field.state.value]}
        onValueChange={(values) => {
          const next = values.at(-1) as T | undefined
          if (next) field.handleChange(next)
        }}
        className="flex w-full flex-wrap"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className="h-9 rounded-full px-3.5 data-pressed:border-primary data-pressed:bg-primary data-pressed:text-primary-foreground"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  )
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const form = useFormContext()
  const isSubmitting = useStore(form.store, (s) => s.isSubmitting)
  return (
    <Button
      type="submit"
      size="lg"
      className="h-11 w-full text-base"
      disabled={isSubmitting}
    >
      {isSubmitting ? <Spinner /> : null}
      {children}
    </Button>
  )
}

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    DateField,
    RatingField,
    SwitchField,
    TextField,
    TextareaField,
    NumberField,
    SelectField,
    SegmentedField,
  },
  formComponents: { SubmitButton },
})
