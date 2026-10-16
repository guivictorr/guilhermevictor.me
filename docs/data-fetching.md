# Data fetching

How screens load and write data with TanStack Query (v5) and TanStack Router. The
goal: nothing pops in, nothing waits on something it didn't need, and writes feel
instant. Based on the TanStack Query guides we adopted (linked per section).

Code: `apps/admin/src/router.tsx` (defaults), `src/queries/*` (query options and
mutations), `src/components/loaders.tsx` (Suspense helpers, skeletons, image reveal).

## Defaults and caching

[Important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
· [Caching](https://tanstack.com/query/latest/docs/framework/react/guides/caching)

- `staleTime` 5 min for archive data: only this app writes it, and every write
  invalidates what it touched. Provider queries set their own (1 h; trending 6 h;
  airports and aircraft `Infinity`).
- `gcTime` 30 min: a screen you come back to (switching tabs) renders straight from
  cache, with no skeleton.
- `refetchOnWindowFocus: false` (a PWA regains focus constantly).
- Same data, same key: always build options with the `*Query()` helpers, never
  inline keys.

## Loading a screen: render-as-you-fetch

[Prefetching & Router integration](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching)
· [Request waterfalls](https://tanstack.com/query/latest/docs/framework/react/guides/request-waterfalls)
· [Suspense](https://tanstack.com/query/latest/docs/framework/react/guides/suspense)

1. **The route loader starts everything the screen needs**, in parallel:
   - data the page can't render without (a detail page's provider details):
     `await context.queryClient.ensureQueryData(opts)`. Errors reach the route's
     error component; `pendingComponent` shows meanwhile.
   - everything else: `void context.queryClient.prefetchQuery(opts)`, not awaited, so
     navigation is instant.
   - **dependent data** (the Home cards' details, which depend on which works are in
     progress) is chained in the loader (`ensureQueryData(list).then(prefetch…)`), not
     discovered by a component after it renders.
   - browser-only data (`/data/airports.json`, a relative URL) is prefetched only when
     `typeof window !== "undefined"`.
2. **Components read with `useSuspenseQuery`** (data is always defined) inside a
   `<SuspenseSection fallback={…}>` per section. Several queries in one component use
   `useSuspenseQueries`: separate `useSuspenseQuery` calls run one after another.
3. **Fallbacks have the section's real size** (`CardRowSkeleton`, `ListSkeleton`,
   `FactsSkeleton`, `MediaGridSkeleton`, `DetailSkeleton`), so nothing shifts when data
   lands. Content that waited fades in once (`animate-reveal`); content already in the
   cache renders with no fallback and no animation.
4. **Client-only sections** (the facts deck, the next-flight countdown: browser clock,
   localStorage, airports file) render inside `<ClientOnly fallback={skeleton}>`.
5. Router: `defaultPendingMs: 150`, `defaultPendingMinMs: 300`. Fast loads never show
   a skeleton, and a skeleton that does show never flashes.
6. On a key change inside a mounted screen (filters, search kind), keep the old UI with
   `useTransition` / `placeholderData: (prev) => prev` instead of falling back to a
   skeleton.

## Placeholders from lists

[Placeholder query data](https://tanstack.com/query/latest/docs/framework/react/guides/placeholder-query-data)

- A detail page's `DetailSkeleton` looks the work up in whatever list is already cached
  (`findCachedItem`: library, backlog, recent, search, trending) and draws the real
  cover, title and year; only the rest is skeleton.
- Feature cards and swipe slides render from the list item (title, cover, year) and
  fill in provider facts when their details query settles. A background image is picked
  only once details settle (`details.ready`), so it never swaps cover → backdrop.

## Prefetch on intent

- Links prefetch their route on hover/touch (`defaultPreload: "intent"`), which runs
  the loader above.
- The swipe deck warms the next two cards and the previous one: details, logs and the
  decoded cover image.
- A long press or right-click on a cover warms what the log sheet needs (platforms,
  copies, seasons) before the sheet opens.

## Writes: optimistic, precise

[Optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
· [Invalidation from mutations](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)

**Via the cache** when the result shows in several places (rating, logs, backlog, copies,
flights). Every mutation in `queries/archive.ts` follows the same shape:

```ts
onMutate: async (vars) => ({
  // cancelQueries → snapshot → setQueriesData, for each affected key
  rollback: await applyOptimistic(queryClient, [patch(key, (old) => next)]),
}),
onError: (_e, _v, context) => context?.rollback?.(),
// Returned, so the mutation stays pending until the refetch is done.
onSettled: () => invalidateKinds(queryClient, [type]),
```

- `cancelQueries` first, so an in-flight refetch can't overwrite the optimistic value.
- New rows get a temporary uuid and timestamps (`pendingLog`) until the refetch brings
  the real one.
- Callers keep their own `toast` for success/error and Undo.

**Via the UI** (`variables` / `isPending`) when it shows in one place only: Steam sync,
imports, Discogs sync.

**Invalidate only what changed**, in parallel, and return the promise:

| Write                          | Refetches                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| Log add / edit / move / delete | that kind's logs and library, recent, index, stats, facts, backlog (+ copies for records) |
| Backlog add / remove           | backlog, index, facts, that kind's library                                                |
| Copies                         | as a record log write                                                                     |
| Flights                        | flights, facts                                                                            |
| Import / clear archive         | everything under `["archive"]`                                                            |

## Scroll restoration

[Scroll restoration](https://tanstack.com/query/latest/docs/framework/react/guides/scroll-restoration)

The router restores scroll (`scrollRestoration: true`). It works because a screen you
return to renders synchronously from the cache (30 min `gcTime`), so the page has its
full height before the position is restored. Don't break this by gating a list on an
effect or by refetching into a skeleton.
