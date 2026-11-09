import { useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"
import { useFillFromSteam } from "@/queries/archive"
import { fetchSteamLibrary } from "@/server/media.functions"

/**
 * Fills empty hours and platforms on your latest game logs from Steam
 * playtime. Never creates logs or overwrites what you entered.
 */
export function SteamSyncButton() {
  const library = useMutation({ mutationFn: () => fetchSteamLibrary() })
  const fill = useFillFromSteam()
  const pending = library.isPending || fill.isPending

  async function run() {
    try {
      const { played, matched } = await library.mutateAsync()
      const result = await fill.mutateAsync(matched)
      const unmatched = played - matched.length
      toast.success(
        result.filled
          ? `Filled ${result.filled} game${result.filled === 1 ? "" : "s"} from Steam`
          : "Nothing to fill",
        {
          description: [
            result.unchanged && `${result.unchanged} already complete`,
            result.notLogged && `${result.notLogged} not logged here`,
            unmatched && `${unmatched} not found on IGDB`,
          ]
            .filter(Boolean)
            .join(" · "),
        }
      )
    } catch (error) {
      toast.error("Steam sync failed", {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={run}
      disabled={pending}
      aria-label="Sync with Steam"
    >
      {pending ? <Spinner /> : <RefreshCwIcon />}
      <span className="max-sm:sr-only">Sync Steam</span>
    </Button>
  )
}
