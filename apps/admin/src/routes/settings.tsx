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
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { BackButton } from "@/components/detail-layout"
import { PageBody, PageHeader } from "@/components/page-header"
import { SegmentedControl } from "@/components/segmented-control"
import { AccountSettings } from "@/components/settings/account-settings"
import { repo } from "@/lib/repo"
import {
  clearLegacyLocalData,
  readLegacyLocalData,
} from "@/lib/repo/legacy-local"
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
    download(data)
    toast.success("Export ready", {
      description: `${data.logs.length} logs, ${data.items.length} items`,
    })
  }

  function download(data: ArchiveExport, name = "archive") {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${name}-${data.exportedAt.slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
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
        "Delete EVERYTHING in the archive (logs, backlog, collection, flights)? This can't be undone. Export first."
      )
    )
      return
    await clearArchive.mutateAsync()
    toast("Archive cleared")
  }

  // Data from before the server existed, still in this browser.
  const [legacy, setLegacy] = useState<ArchiveExport>()
  useEffect(() => setLegacy(readLegacyLocalData()), [])

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

          <AccountSettings />

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
                Restore from an export. Replaces everything in the archive.
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
              <FieldLabel>Delete everything</FieldLabel>
              <FieldDescription>
                Empties the archive on the server. Your account and API keys
                stay.
              </FieldDescription>
            </FieldContent>
            <Button
              variant="destructive"
              size="lg"
              onClick={handleClear}
              disabled={clearArchive.isPending}
            >
              <Trash2Icon />
              Delete
            </Button>
          </Field>

          {legacy ? (
            <>
              <FieldSeparator />
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel>Data in this browser</FieldLabel>
                  <FieldDescription>
                    {legacy.logs.length} logs saved here before the server
                    existed. Download them, then import the file above if you
                    want them back.
                  </FieldDescription>
                </FieldContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => download(legacy, "archive-browser")}
                  >
                    <DownloadIcon />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Delete browser data"
                    onClick={() => {
                      if (!window.confirm("Delete the copy in this browser?"))
                        return
                      clearLegacyLocalData()
                      setLegacy(undefined)
                    }}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </Field>
            </>
          ) : null}
        </FieldGroup>
      </PageBody>
    </>
  )
}
