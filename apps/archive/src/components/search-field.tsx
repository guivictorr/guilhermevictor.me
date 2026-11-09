import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { SearchIcon, ShuffleIcon, XIcon } from "lucide-react"

/**
 * The big search/filter field at the top of Search and the library pages,
 * with its own clear button (the browser's is hidden).
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  label = "Search",
  icon = <SearchIcon />,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label?: string
  /** Replaces the magnifier, e.g. a spinner while results load. */
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <InputGroup className={cn("h-12 flex-1 rounded-xl", className)}>
      <InputGroupAddon className="ps-3.5">{icon}</InputGroupAddon>
      <InputGroupInput
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-base [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label="Clear"
            onClick={() => onChange("")}
          >
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}

/** The round button next to the field: open something at random. */
export function SurpriseButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="secondary"
      size="icon"
      aria-label="Surprise me"
      title="Surprise me"
      className="size-12 shrink-0 rounded-full"
      onClick={onClick}
    >
      <ShuffleIcon className="size-5" />
    </Button>
  )
}
