import {
  useCanGoBack,
  useNavigate,
  useRouter,
  useSearch,
} from "@tanstack/react-router"
import { z } from "zod"

/**
 * List routes accept `?swipe=<list id>` (which list's swipe view is open),
 * so Back — the browser's or the phone's gesture — closes it.
 */
export const swipeSearch = z.object({
  swipe: z.coerce.string().optional().catch(undefined),
})

/** Open/close one list's swipe view; several lists can share a page. */
export function useSwipe(id: string) {
  const { swipe } = useSearch({ strict: false })
  const navigate = useNavigate()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  return {
    open: swipe === id,
    openDeck: () =>
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, swipe: id }),
        viewTransition: false,
        resetScroll: false,
      }),
    close: () => {
      // Opened in-app: going back also removes the history entry we pushed.
      if (canGoBack) router.history.back()
      else
        void navigate({
          to: ".",
          search: (prev) => ({ ...prev, swipe: undefined }),
          replace: true,
          viewTransition: false,
          resetScroll: false,
        })
    },
  }
}
