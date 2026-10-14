import { createFileRoute } from "@tanstack/react-router"
import { ArchiveExport } from "@workspace/schemas"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@workspace/ui/components/field"
import { DownloadIcon, Trash2Icon, UploadIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useRef } from "react"
import { toast } from "sonner"
import { BackButton } from "@/components/detail-layout"
import { PageBody, PageHeader } from "@/components/page-header"
import { SegmentedControl } from "@/components/segmented-control"
import { repo } from "@/lib/repo"
import { useClearArchive, useImportArchive } from "@/queries/archive"

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Archive" }] }),
  component: SettingsPage,
})

const THEME_OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const

function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const importArchive = useImportArchive()
  const clearArchive = useClearArchive()
  const fileInput = useRef<HTMLInputElement>(null)

  async function handleExport() {
    const data = await repo.exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `archive-${data.exportedAt.slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Export ready", {
      description: `${data.logs.length} logs, ${data.items.length} items`,
    })
  }

  async function handleImport(file: File) {
    try {
      const data = ArchiveExport.parse(JSON.parse(await file.text()))
      await importArchive.mutateAsync(data)
      toast.success("Archive imported", {
        description: `${data.logs.length} logs`,
      })
    } catch (error) {
      toast.error("Import failed", {
        description: error instanceof Error ? error.message : "Invalid file",
      })
    }
  }

  async function handleClear() {
    if (
      !window.confirm(
        "Delete all logs stored in this browser? Export first if you want a copy."
      )
    )
      return
    await clearArchive.mutateAsync()
    toast("Archive cleared")
  }

  return (
    <>
      <div className="pt-safe px-safe pt-3 md:hidden">
        <BackButton fallback="/" />
      </div>
      <PageHeader
        title="Settings"
        className="md:pt-0 [&>div]:pt-2 md:[&>div]:pt-10"
      />
      <PageBody className="max-w-xl">
        <FieldGroup>
          <Field>
            <FieldLabel>Appearance</FieldLabel>
            <SegmentedControl
              label="Theme"
              value={
                (theme ?? "system") as (typeof THEME_OPTIONS)[number]["value"]
              }
              options={THEME_OPTIONS}
              onValueChange={setTheme}
            />
          </Field>

          <FieldSeparator />

          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel>Export data</FieldLabel>
              <FieldDescription>
                Download every log as JSON. Your data, portable anywhere.
              </FieldDescription>
            </FieldContent>
            <Button variant="outline" size="lg" onClick={handleExport}>
              <DownloadIcon />
              Export
            </Button>
          </Field>

          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel>Import data</FieldLabel>
              <FieldDescription>
                Restore from an export. Replaces what's stored here.
              </FieldDescription>
            </FieldContent>
            <Button
              variant="outline"
              size="lg"
              onClick={() => fileInput.current?.click()}
              disabled={importArchive.isPending}
            >
              <UploadIcon />
              Import
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleImport(file)
                e.target.value = ""
              }}
            />
          </Field>

          <FieldSeparator />

          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel>Clear local data</FieldLabel>
              <FieldDescription>
                Logs are stored in this browser until the API exists. This
                deletes them.
              </FieldDescription>
            </FieldContent>
            <Button variant="destructive" size="lg" onClick={handleClear}>
              <Trash2Icon />
              Clear
            </Button>
          </Field>
        </FieldGroup>
      </PageBody>
    </>
  )
}
