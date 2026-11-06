import {
  GameLogInput,
  MovieLogInput,
  BookLogInput,
  SeasonLogInput,
  ShowLogInput,
} from "@workspace/schemas"
import type {
  BookLog,
  GameLog,
  LogInput,
  MovieLog,
  SeasonLog,
  ShowLog,
} from "@workspace/schemas"
import { FieldGroup } from "@workspace/ui/components/field"
import type { z } from "zod"
import { useAppForm } from "@/components/form/form-hook"
import { today } from "@/lib/format"
import { BOOK_FORMAT_OPTIONS, BOOK_STATUS_OPTIONS } from "@/lib/book-status"
import { GAME_STATUS_OPTIONS } from "@/lib/game-status"
import { SHOW_STATUS_OPTIONS } from "@/lib/show-status"

/*
 * One form per log kind. Fields are placeholders until the per-type
 * column spec lands; schemas live in @workspace/schemas.
 */

type FormProps<TLog extends { mediaId: unknown }> = {
  /** Provider id: a number, or a Google Books volume id for books. */
  mediaId: TLog["mediaId"]
  initial?: TLog
  onSubmit: (input: LogInput) => void
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
    // Editing an undated log keeps it undated; new logs default to today.
    watchedAt: initial ? initial.watchedAt : today(),
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
        {(f) => (
          <f.DateField
            label="Watched on"
            optional
            max={today()}
            description="Leave empty if you don't remember"
          />
        )}
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
    status: initial?.status ?? "finished",
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
      <form.AppField
        name="status"
        listeners={{
          // Watching hasn't finished yet; finishing gets today if empty.
          onChange: ({ value }) => {
            if (value === "watching") {
              form.setFieldValue("finishedAt", undefined)
              if (!form.getFieldValue("startedAt"))
                form.setFieldValue("startedAt", today())
            } else if (
              value === "finished" &&
              !form.getFieldValue("finishedAt")
            )
              form.setFieldValue("finishedAt", today())
          },
        }}
      >
        {(f) => (
          <f.SegmentedField label="Status" options={SHOW_STATUS_OPTIONS} />
        )}
      </form.AppField>
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

/** The whole show in one log, for shows you don't track per season. */
export function ShowLogForm({
  mediaId,
  initial,
  onSubmit,
  submitLabel,
}: FormProps<ShowLog>) {
  const defaultValues: z.input<typeof ShowLogInput> = {
    kind: "show",
    mediaId,
    status: initial?.status ?? "finished",
    startedAt: initial?.startedAt,
    finishedAt: initial ? initial.finishedAt : today(),
    rating: initial?.rating,
    rewatch: initial?.rewatch ?? false,
    notes: initial?.notes,
  }
  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: ShowLogInput },
    onSubmit: ({ value }) => onSubmit(ShowLogInput.parse(value)),
  })

  return (
    <FormShell onSubmit={form.handleSubmit}>
      <form.AppField
        name="status"
        listeners={{
          // Watching hasn't finished yet; finishing gets today if empty.
          onChange: ({ value }) => {
            if (value === "watching") {
              form.setFieldValue("finishedAt", undefined)
              if (!form.getFieldValue("startedAt"))
                form.setFieldValue("startedAt", today())
            } else if (
              value === "finished" &&
              !form.getFieldValue("finishedAt")
            )
              form.setFieldValue("finishedAt", today())
          },
        }}
      >
        {(f) => (
          <f.SegmentedField label="Status" options={SHOW_STATUS_OPTIONS} />
        )}
      </form.AppField>
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
            description="I've seen this show before"
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

export function BookLogForm({
  mediaId,
  initial,
  onSubmit,
  submitLabel,
}: FormProps<BookLog>) {
  const defaultValues: z.input<typeof BookLogInput> = {
    kind: "book",
    mediaId,
    status: initial?.status ?? "reading",
    format: initial?.format,
    startedAt: initial ? initial.startedAt : today(),
    finishedAt: initial?.finishedAt,
    rating: initial?.rating,
    reread: initial?.reread ?? false,
    notes: initial?.notes,
  }
  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: BookLogInput },
    onSubmit: ({ value }) => onSubmit(BookLogInput.parse(value)),
  })

  return (
    <FormShell onSubmit={form.handleSubmit}>
      <form.AppField name="status">
        {(f) => (
          <f.SegmentedField label="Status" options={BOOK_STATUS_OPTIONS} />
        )}
      </form.AppField>
      <form.AppField name="format">
        {(f) => (
          <f.SelectField
            label="Format"
            options={BOOK_FORMAT_OPTIONS}
            placeholder="Physical, e-book…"
          />
        )}
      </form.AppField>
      <div className="grid grid-cols-2 gap-3">
        <form.AppField name="startedAt">
          {(f) => <f.DateField label="Started" optional max={today()} />}
        </form.AppField>
        <form.AppField name="finishedAt">
          {(f) => <f.DateField label="Finished" optional max={today()} />}
        </form.AppField>
      </div>
      <form.AppField name="rating">{(f) => <f.RatingField />}</form.AppField>
      <form.AppField name="reread">
        {(f) => (
          <f.SwitchField label="Re-read" description="I've read this before" />
        )}
      </form.AppField>
      <form.AppField name="notes">
        {(f) => (
          <f.TextareaField label="Notes" placeholder="Thoughts, quotes…" />
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
