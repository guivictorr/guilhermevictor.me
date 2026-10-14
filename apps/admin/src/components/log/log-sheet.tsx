import type {
  BookLog,
  GameLog,
  LogEntry,
  LogInput,
  MovieLog,
  RecordLog,
  SeasonLog,
  ShowLog,
} from "@workspace/schemas"
import { Button } from "@workspace/ui/components/button"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import {
  BookLogForm,
  GameLogForm,
  MovieLogForm,
  RecordLogForm,
  SeasonLogForm,
  ShowLogForm,
} from "./log-forms"
import { ResponsiveSheet, useOpenSession } from "@/components/responsive-sheet"
import type { LibraryItemInput } from "@/lib/repo"
import { useAddLog, useDeleteLog, useUpdateLog } from "@/queries/archive"

export type LogTargetContext =
  | { kind: "movie"; item: LibraryItemInput }
  | {
      kind: "season"
      item: LibraryItemInput
      seasonNumber: number
      seasonName: string
    }
  | { kind: "game"; item: LibraryItemInput; platforms: Array<string> }
  | {
      kind: "record"
      item: LibraryItemInput
      /** Your copies of this release (plays are logged on one). */
      copies: Array<{ value: string; label: string }>
    }
  | { kind: "show"; item: LibraryItemInput }
  | { kind: "book"; item: LibraryItemInput }

/** Create/edit a log in a responsive sheet. */
export function LogSheet({
  open,
  onOpenChange,
  target,
  editing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: LogTargetContext
  editing?: LogEntry
}) {
  const addLog = useAddLog()
  const updateLog = useUpdateLog()
  const deleteLog = useDeleteLog()

  const subtitle =
    target.kind === "season"
      ? `${target.item.title} · ${target.seasonName}`
      : target.item.title

  async function handleSubmit(input: LogInput) {
    try {
      if (editing) {
        await updateLog.mutateAsync({ id: editing.id, input })
        toast.success("Log updated")
      } else {
        await addLog.mutateAsync({ input, item: target.item })
        toast.success("Logged", { description: subtitle })
      }
      onOpenChange(false)
    } catch (error) {
      toast.error("Couldn't save", {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  async function handleDelete() {
    if (!editing) return
    const { id: _id, createdAt: _c, updatedAt: _u, ...input } = editing
    await deleteLog.mutateAsync(editing.id)
    onOpenChange(false)
    toast("Log deleted", {
      action: {
        label: "Undo",
        onClick: () => addLog.mutate({ input, item: target.item }),
      },
    })
  }

  const session = useOpenSession(open)

  const submitLabel = editing ? "Save changes" : "Save log"
  const formKey = `${editing?.id ?? "new"}-${session}`

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit log" : "New log"}
      description={subtitle}
    >
      {target.kind === "movie" ? (
        <MovieLogForm
          key={formKey}
          mediaId={Number(target.item.id)}
          initial={editing as MovieLog | undefined}
          onSubmit={handleSubmit}
          submitLabel={submitLabel}
        />
      ) : target.kind === "season" ? (
        <SeasonLogForm
          key={formKey}
          mediaId={Number(target.item.id)}
          seasonNumber={target.seasonNumber}
          initial={editing as SeasonLog | undefined}
          onSubmit={handleSubmit}
          submitLabel={submitLabel}
        />
      ) : target.kind === "show" ? (
        <ShowLogForm
          key={formKey}
          mediaId={Number(target.item.id)}
          initial={editing as ShowLog | undefined}
          onSubmit={handleSubmit}
          submitLabel={submitLabel}
        />
      ) : target.kind === "book" ? (
        <BookLogForm
          key={formKey}
          mediaId={String(target.item.id)}
          initial={editing as BookLog | undefined}
          onSubmit={handleSubmit}
          submitLabel={submitLabel}
        />
      ) : target.kind === "record" ? (
        <RecordLogForm
          key={formKey}
          mediaId={Number(target.item.id)}
          copies={target.copies}
          initial={editing as RecordLog | undefined}
          onSubmit={handleSubmit}
          submitLabel={submitLabel}
        />
      ) : (
        <GameLogForm
          key={formKey}
          mediaId={Number(target.item.id)}
          platforms={target.platforms}
          initial={editing as GameLog | undefined}
          onSubmit={handleSubmit}
          submitLabel={submitLabel}
        />
      )}
      {editing ? (
        <Button
          variant="ghost"
          className="mt-3 h-11 w-full text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={deleteLog.isPending}
        >
          <Trash2Icon />
          Delete log
        </Button>
      ) : null}
    </ResponsiveSheet>
  )
}
