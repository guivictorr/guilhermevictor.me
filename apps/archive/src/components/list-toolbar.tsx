import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import { GalleryVerticalEndIcon } from "lucide-react"

/*
 * The row above a list of covers (Search results, library pages): how many,
 * the order under it, and how to look at them on the right.
 */

type Option = { value: string; label: string }

export function ListToolbar({
  count,
  sort,
  view,
  className,
}: {
  /** "312 movies". */
  count: React.ReactNode
  sort?: {
    items: Array<Option>
    value: string
    onChange: (value: string) => void
  }
  view?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="min-w-0">
        <p className="text-lg font-semibold tabular-nums">{count}</p>
        {sort?.items.length ? (
          <Select
            items={sort.items}
            value={sort.value}
            onValueChange={(v) => {
              if (v !== null) sort.onChange(String(v))
            }}
          >
            <SelectTrigger
              aria-label="Sort by"
              className="-ms-2 h-8 gap-1 border-0 bg-transparent px-2 text-sm text-muted-foreground shadow-none hover:text-foreground dark:bg-transparent"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="w-auto">
              {sort.items.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
      {view}
    </div>
  )
}

/**
 * Grid / list (or table) / swipe as one segmented group. Swipe opens a
 * full-screen view, so it's an action rather than a pressed choice.
 */
export function ViewSwitch<T extends string>({
  options,
  value,
  onChange,
  onSwipe,
}: {
  options: Array<{ value: T; label: string; icon: React.ReactNode }>
  value?: T
  onChange?: (value: T) => void
  /** Left out when there's nothing to swipe. */
  onSwipe?: () => void
}) {
  if (!options.length && !onSwipe) return null
  return (
    <div
      role="group"
      aria-label="View"
      className="flex shrink-0 rounded-md bg-muted p-[3px]"
    >
      {options.map((option) => (
        <ViewButton
          key={option.value}
          label={option.label}
          on={value === option.value}
          onClick={() => onChange?.(option.value)}
        >
          {option.icon}
        </ViewButton>
      ))}
      {onSwipe ? (
        <ViewButton label="Swipe view" onClick={onSwipe}>
          <GalleryVerticalEndIcon className="size-4" />
        </ViewButton>
      ) : null}
    </div>
  )
}

function ViewButton({
  label,
  on,
  onClick,
  children,
}: {
  label: string
  /** Undefined for an action (swipe) rather than a choice. */
  on?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "pressable flex size-[38px] items-center justify-center rounded-[calc(var(--radius-md)-3px)]",
        on
          ? "edge-highlight bg-popover text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}
