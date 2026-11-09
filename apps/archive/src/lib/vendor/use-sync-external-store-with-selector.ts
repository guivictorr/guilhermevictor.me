/*
 * ES-module port of `use-sync-external-store/shim/with-selector` (React,
 * MIT). Aliased in vite.config.ts for the same reason as the shim next to
 * it: the original CommonJS file `require("react")`s at runtime, which the
 * Vercel function can't resolve. Logic follows React's implementation.
 */
import {
  useDebugValue,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react"

type Instance<TSelection> = { hasValue: boolean; value: TSelection | undefined }

export function useSyncExternalStoreWithSelector<TSnapshot, TSelection>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => TSnapshot,
  getServerSnapshot: undefined | null | (() => TSnapshot),
  selector: (snapshot: TSnapshot) => TSelection,
  isEqual?: (a: TSelection, b: TSelection) => boolean
): TSelection {
  // The last rendered selection, so equal selections keep their identity.
  const instRef = useRef<Instance<TSelection> | null>(null)
  instRef.current ??= { hasValue: false, value: undefined }
  const inst = instRef.current

  const [getSelection, getServerSelection] = useMemo(() => {
    let hasMemo = false
    let memoizedSnapshot: TSnapshot
    let memoizedSelection: TSelection
    const memoizedSelector = (nextSnapshot: TSnapshot): TSelection => {
      if (!hasMemo) {
        hasMemo = true
        memoizedSnapshot = nextSnapshot
        const nextSelection = selector(nextSnapshot)
        if (isEqual !== undefined && inst.hasValue) {
          const current = inst.value as TSelection
          if (isEqual(current, nextSelection)) {
            memoizedSelection = current
            return current
          }
        }
        memoizedSelection = nextSelection
        return nextSelection
      }
      const prevSelection = memoizedSelection
      if (Object.is(memoizedSnapshot, nextSnapshot)) return prevSelection
      const nextSelection = selector(nextSnapshot)
      if (isEqual !== undefined && isEqual(prevSelection, nextSelection)) {
        memoizedSnapshot = nextSnapshot
        return prevSelection
      }
      memoizedSnapshot = nextSnapshot
      memoizedSelection = nextSelection
      return nextSelection
    }
    const serverSnapshot = getServerSnapshot ?? undefined
    return [
      () => memoizedSelector(getSnapshot()),
      serverSnapshot === undefined
        ? undefined
        : () => memoizedSelector(serverSnapshot()),
    ] as const
  }, [getSnapshot, getServerSnapshot, selector, isEqual, inst])

  const value = useSyncExternalStore(
    subscribe,
    getSelection,
    getServerSelection
  )
  useEffect(() => {
    inst.hasValue = true
    inst.value = value
  }, [inst, value])
  useDebugValue(value)
  return value
}
