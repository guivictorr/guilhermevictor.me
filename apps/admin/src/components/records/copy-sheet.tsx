import { CollectionItemInput, Grade, IsoDate } from "@workspace/schemas"
import type { CollectionItem } from "@workspace/schemas"
import { Button } from "@workspace/ui/components/button"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { useAppForm } from "@/components/form/form-hook"
import { FormShell } from "@/components/log/log-forms"
import { ResponsiveSheet, useOpenSession } from "@/components/responsive-sheet"
import { today } from "@/lib/format"
import { GRADE_OPTIONS } from "@/lib/grades"
import type { CollectionSnapshot } from "@/lib/repo"
import {
  useAddCollectionItem,
  useDeleteCollectionItem,
  useUpdateCollectionItem,
} from "@/queries/archive"

const CURRENCIES = ["BRL", "USD", "EUR", "GBP", "JPY"].map((c) => ({
  value: c,
  label: c,
}))
const DEFAULT_CURRENCY = "BRL"

/** Flat form shape; price is split into two inputs and rebuilt on submit. */
const CopyForm = z.object({
  mediaCondition: Grade.optional(),
  sleeveCondition: Grade.optional(),
  variant: z.string().trim().max(500).optional(),
  acquiredAt: IsoDate.optional(),
  priceAmount: z.number().min(0).optional(),
  priceCurrency: z.string().length(3),
  store: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(5000).optional(),
})

function toInput(form: z.output<typeof CopyForm>): CollectionItemInput {
  const { priceAmount, priceCurrency, ...rest } = form
  return CollectionItemInput.parse({
    ...rest,
    price:
      priceAmount === undefined
        ? undefined
        : { amount: priceAmount, currency: priceCurrency },
  })
}

/** Add a copy you own, or edit/delete one. */
export function CopySheet({
  open,
  onOpenChange,
  snapshot,
  editing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  snapshot: CollectionSnapshot
  editing?: CollectionItem
}) {
  const session = useOpenSession(open)
  const add = useAddCollectionItem()
  const update = useUpdateCollectionItem()
  const remove = useDeleteCollectionItem()

  async function handleDelete() {
    if (!editing) return
    await remove.mutateAsync(editing.id)
    onOpenChange(false)
    toast("Copy removed from collection", { description: snapshot.title })
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit copy" : "Add to collection"}
      description={`${snapshot.artist} · ${snapshot.title}`}
    >
      <CopyFormBody
        key={`${editing?.id ?? "new"}-${session}`}
        editing={editing}
        submitLabel={editing ? "Save changes" : "Add to collection"}
        onSubmit={async (input) => {
          try {
            if (editing) {
              await update.mutateAsync({ id: editing.id, input })
              toast.success("Copy updated")
            } else {
              await add.mutateAsync({ snapshot, input })
              toast.success("Added to collection", {
                description: snapshot.title,
              })
            }
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
          Remove from collection
        </Button>
      ) : null}
    </ResponsiveSheet>
  )
}

function CopyFormBody({
  editing,
  submitLabel,
  onSubmit,
}: {
  editing?: CollectionItem
  submitLabel: string
  onSubmit: (input: CollectionItemInput) => Promise<void>
}) {
  const defaultValues: z.input<typeof CopyForm> = {
    mediaCondition: editing?.mediaCondition,
    sleeveCondition: editing?.sleeveCondition,
    variant: editing?.variant,
    acquiredAt: editing ? editing.acquiredAt : today(),
    priceAmount: editing?.price?.amount,
    priceCurrency: editing?.price?.currency ?? DEFAULT_CURRENCY,
    store: editing?.store,
    notes: editing?.notes,
  }
  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: CopyForm },
    onSubmit: ({ value }) => onSubmit(toInput(CopyForm.parse(value))),
  })

  return (
    <FormShell onSubmit={form.handleSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <form.AppField name="mediaCondition">
          {(f) => (
            <f.SelectField
              label="Media"
              options={GRADE_OPTIONS}
              placeholder="Grade"
            />
          )}
        </form.AppField>
        <form.AppField name="sleeveCondition">
          {(f) => (
            <f.SelectField
              label="Sleeve"
              options={GRADE_OPTIONS}
              placeholder="Grade"
            />
          )}
        </form.AppField>
      </div>
      <form.AppField name="variant">
        {(f) => (
          <f.TextField
            label="Variant"
            placeholder="e.g. Red marbled, #123/500"
          />
        )}
      </form.AppField>
      <form.AppField name="acquiredAt">
        {(f) => <f.DateField label="Acquired on" optional max={today()} />}
      </form.AppField>
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <form.AppField name="priceAmount">
          {(f) => <f.NumberField label="Price paid" step={0.01} />}
        </form.AppField>
        <form.AppField name="priceCurrency">
          {(f) => <f.SelectField label="Currency" options={CURRENCIES} />}
        </form.AppField>
      </div>
      <form.AppField name="store">
        {(f) => <f.TextField label="Where" placeholder="Store, fair, gift…" />}
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
