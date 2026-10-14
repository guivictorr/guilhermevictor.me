import {
  GameLogInput,
  MovieLogInput,
  RecordLogInput,
  SeasonLogInput,
} from "@workspace/schemas"
import type {
  GameLog,
  LogInput,
  MovieLog,
  RecordLog,
  SeasonLog,
} from "@workspace/schemas"
import { FieldGroup } from "@workspace/ui/components/field"
import type { z } from "zod"
import { useAppForm } from "@/components/form/form-hook"
import { today } from "@/lib/format"
import { GAME_STATUS_OPTIONS } from "@/lib/game-status"

/*
 * One form per log kind. Fields are placeholders until the per-type
 * column spec lands; schemas live in @workspace/schemas.
 */

type FormProps<TLog> = {
  mediaId: number
  initial?: TLog
  onSubmit: (input: LogInput) => Promise<void>
  submitLabel: string
}

export function MovieLogForm({
  mediaId,
  initial,
  onSubmit,
  submitLabel,
}: FormProps<MovieLog>) {
  const defaultValues: z.input<typeof MovieLogInput> = {
    kind: "movie",
    mediaId,
    watchedAt: initial?.watchedAt ?? today(),
    rating: initial?.rating,
    rewatch: initial?.rewatch ?? false,
    notes: initial?.notes,
  }
  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: MovieLogInput },
    onSubmit: ({ value }) => onSubmit(MovieLogInput.parse(value)),
  })

  return (
    <FormShell onSubmit={form.handleSubmit}>
      <form.AppField name="watchedAt">
        {(f) => <f.DateField label="Watched on" max={today()} />}
      </form.AppField>
      <form.AppField name="rating">{(f) => <f.RatingField />}</form.AppField>
      <form.AppField name="rewatch">
        {(f) => (
          <f.SwitchField label="Rewatch" description="I've seen this before" />
        )}
      </form.AppField>
      <form.AppField name="notes">
        {(f) => (
          <f.TextareaField
            label="Notes"
            placeholder="Thoughts, where you watched it…"
          />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton>{submitLabel}</form.SubmitButton>
      </form.AppForm>
    </FormShell>
  )
}

export function SeasonLogForm({
  mediaId,
  seasonNumber,
  initial,
  onSubmit,
  submitLabel,
}: FormProps<SeasonLog> & { seasonNumber: number }) {
  const defaultValues: z.input<typeof SeasonLogInput> = {
    kind: "season",
    mediaId,
    seasonNumber,
    startedAt: initial?.startedAt,
    finishedAt: initial ? initial.finishedAt : today(),
    rating: initial?.rating,
    rewatch: initial?.rewatch ?? false,
    notes: initial?.notes,
  }
  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: SeasonLogInput },
    onSubmit: ({ value }) => onSubmit(SeasonLogInput.parse(value)),
  })

  return (
    <FormShell onSubmit={form.handleSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <form.AppField name="startedAt">
          {(f) => <f.DateField label="Started" optional max={today()} />}
        </form.AppField>
        <form.AppField name="finishedAt">
          {(f) => <f.DateField label="Finished" optional max={today()} />}
        </form.AppField>
      </div>
      <form.AppField name="rating">{(f) => <f.RatingField />}</form.AppField>
      <form.AppField name="rewatch">
        {(f) => (
          <f.SwitchField
            label="Rewatch"
            description="I've seen this season before"
          />
        )}
      </form.AppField>
      <form.AppField name="notes">
        {(f) => <f.TextareaField label="Notes" />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton>{submitLabel}</form.SubmitButton>
      </form.AppForm>
    </FormShell>
  )
}

export function GameLogForm({
  mediaId,
  platforms,
  initial,
  onSubmit,
  submitLabel,
}: FormProps<GameLog> & { platforms: Array<string> }) {
  const defaultValues: z.input<typeof GameLogInput> = {
    kind: "game",
    mediaId,
    status: initial?.status ?? "playing",
    platform:
      initial?.platform ?? (platforms.length === 1 ? platforms[0] : undefined),
    startedAt: initial ? initial.startedAt : today(),
    finishedAt: initial?.finishedAt,
    hoursPlayed: initial?.hoursPlayed,
    rating: initial?.rating,
    notes: initial?.notes,
  }
  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: GameLogInput },
    onSubmit: ({ value }) => onSubmit(GameLogInput.parse(value)),
  })

  // Keep a previously saved platform selectable even if IGDB no longer lists it.
  const platformOptions = [
    ...new Set([
      ...platforms,
      ...(initial?.platform ? [initial.platform] : []),
    ]),
  ].map((p) => ({ value: p, label: p }))

  return (
    <FormShell onSubmit={form.handleSubmit}>
      <form.AppField name="status">
        {(f) => (
          <f.SegmentedField label="Status" options={GAME_STATUS_OPTIONS} />
        )}
      </form.AppField>
      {platformOptions.length > 0 ? (
        <form.AppField name="platform">
          {(f) => <f.SelectField label="Platform" options={platformOptions} />}
        </form.AppField>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <form.AppField name="startedAt">
          {(f) => <f.DateField label="Started" optional max={today()} />}
        </form.AppField>
        <form.AppField name="finishedAt">
          {(f) => <f.DateField label="Finished" optional max={today()} />}
        </form.AppField>
      </div>
      <form.AppField name="hoursPlayed">
        {(f) => <f.NumberField label="Time played" suffix="hours" step={0.5} />}
      </form.AppField>
      <form.AppField name="rating">{(f) => <f.RatingField />}</form.AppField>
      <form.AppField name="notes">
        {(f) => <f.TextareaField label="Notes" />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton>{submitLabel}</form.SubmitButton>
      </form.AppForm>
    </FormShell>
  )
}

export function RecordLogForm({
  mediaId,
  initial,
  onSubmit,
  submitLabel,
}: FormProps<RecordLog>) {
  const defaultValues: z.input<typeof RecordLogInput> = {
    kind: "record",
    mediaId,
    playedAt: initial?.playedAt ?? today(),
    rating: initial?.rating,
    notes: initial?.notes,
  }
  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: RecordLogInput },
    onSubmit: ({ value }) => onSubmit(RecordLogInput.parse(value)),
  })

  return (
    <FormShell onSubmit={form.handleSubmit}>
      <form.AppField name="playedAt">
        {(f) => <f.DateField label="Listened on" max={today()} />}
      </form.AppField>
      <form.AppField name="rating">{(f) => <f.RatingField />}</form.AppField>
      <form.AppField name="notes">
        {(f) => (
          <f.TextareaField
            label="Notes"
            placeholder="Which side, how it sounded…"
          />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton>{submitLabel}</form.SubmitButton>
      </form.AppForm>
    </FormShell>
  )
}

export function FormShell({
  onSubmit,
  children,
}: {
  onSubmit: () => Promise<void>
  children: React.ReactNode
}) {
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void onSubmit()
      }}
    >
      <FieldGroup className="gap-5">{children}</FieldGroup>
    </form>
  )
}
