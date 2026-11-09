import { Button } from "@workspace/ui/components/button"
import { Calendar } from "@workspace/ui/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"
import { formatDate, today } from "@/lib/format"

/** "2026-10-16" ↔ a local Date (midnight), so days never shift by timezone. */
const toDate = (iso?: string) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso.slice(0, 10))) return undefined
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return new Date(y!, m! - 1, d)
}
const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

/**
 * A calendar in a popover for `YYYY-MM-DD` values. Optional dates can be
 * cleared ("No date"), since many logs don't know when they happened.
 */
export function DatePicker({
  id,
  value,
  onChange,
  optional = false,
  max,
  invalid = false,
  onBlur,
  className,
}: {
  id?: string
  value?: string
  onChange: (value: string | undefined) => void
  optional?: boolean
  /** Latest selectable day, e.g. `today()`. */
  max?: string
  invalid?: boolean
  onBlur?: () => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = toDate(value)
  const latest = toDate(max)
  const label = formatDate(value)

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) onBlur?.()
      }}
    >
      <PopoverTrigger
        id={id}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-transparent bg-field px-2.5 text-left text-base outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive md:text-sm",
          className
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span
          className={cn(
            "min-w-0 truncate tabular-nums",
            !label && "text-muted-foreground"
          )}
        >
          {label ?? "No date"}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? latest}
          captionLayout="dropdown"
          startMonth={new Date(1950, 0)}
          endMonth={latest ?? new Date(new Date().getFullYear() + 5, 11)}
          disabled={latest ? { after: latest } : undefined}
          onSelect={(date) => {
            onChange(date ? toIso(date) : optional ? undefined : value)
            setOpen(false)
          }}
        />
        <div className="flex gap-2 border-t p-2">
          {!latest || today() <= toIso(latest) ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(today())
                setOpen(false)
              }}
            >
              Today
            </Button>
          ) : null}
          {optional && value ? (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => {
                onChange(undefined)
                setOpen(false)
              }}
            >
              Clear date
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
