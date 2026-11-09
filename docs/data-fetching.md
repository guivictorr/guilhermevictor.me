# Data fetching

How screens load and write data with TanStack Query (v5) and TanStack Router. The
goal: nothing pops in, nothing waits on something it didn't need, and writes feel
instant. Based on the TanStack Query guides we adopted (linked per section).

Code: `apps/archive/src/router.tsx` (defaults), `src/queries/*` (query options and
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
   - **A tap never waits on a list screen.** Only detail routes (which have a
     `pendingComponent`) await in the browser. A loader that should await for the server
     render (Search's trending, so it's in the first HTML) returns its promise only when
     `typeof window === "undefined"` and `void`s it otherwise. Otherwise the tab bar
     highlights the new tab (it reads `location`, which changes when navigation starts)
     while the old page stays up until the data lands.
   - The root guard reads the viewer with `ensureQueryData({ ...viewerQuery(),
revalidateIfStale: true })`, and `viewerQuery` has `gcTime: Infinity`, so after the
     first load no navigation waits on the session check.
2. **Components read with `useSuspenseQuery`** (data is always defined) inside a
   `<SuspenseSection fallback={…}>` per section. Several queries in one component use
   `useSuspenseQueries`: separate `useSuspenseQuery` calls run one after another.
3. **Fallbacks have the section's real size** (`CardRowSkeleton`, `ListSkeleton`,
   `MediaGridSkeleton`, `DetailSkeleton`), so nothing shifts when data
   lands. Content that waited fades in once (`animate-reveal`); content already in the
   cache renders with no fallback and no animation.
4. **Client-only sections** (the next-flight countdown: browser clock and
   airports file) render inside `<ClientOnly fallback={skeleton}>`.
5. Router: `defaultPendingMs: 0`, `defaultPendingMinMs: 300`. A detail page that has to
   fetch shows its skeleton at once (never the old page); cached or preloaded data
   settles before the timer, so it shows no skeleton; a skeleton that does show never
   flashes.
6. On a key change inside a mounted screen (filters, search kind), keep the old UI with
   `useTransition` / `placeholderData: (prev) => prev` instead of falling back to a
   skeleton.

## Paged lists

Library lists (movies, shows, games, books) never ship whole. `listLibraryPageFn`
derives the library, filters by title, sorts and returns one page
(`lib/repo/library-page.ts`): 15 entries on phones, 30 on desktop. The browser sends
its size; the server render (no screen yet) picks it from the user agent, so the first
HTML has the right count. The client reads them with `useSuspenseInfiniteQuery`
(`libraryPagesQuery`, keyed under `library(type)` so writes refresh loaded pages) and
loads the next page with the shared `<LoadMore>` sentinel, the same one search uses.
Sort and filter changes go through `useDeferredValue`: the current list stays (dimmed)
until the new first page arrives. Swipe decks keep paging through `onNearEnd`.

Never fetch per item of a list: one query for the list, prefetch on intent, or mount
per-item data lazily (a menu's queries load when it opens).

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
  cover image (fetched into the HTTP cache, not kept decoded: phones reload the page
  when memory runs out).
- A long press or right-click on a cover warms what the log sheet needs (logs, platforms,
  copies, seasons) before the sheet opens.

## Writes: optimistic, precise

[Optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
· [Concurrent optimistic updates](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)

**The screen never waits for the server.** Callers fire `mutate` and move on (a sheet
closes right away); there is no success toast, since the cache already shows the
change. Never `await mutateAsync` or disable a button on `isPending` for these writes.

Every write in `queries/archive.ts` (logs, backlog, copies, flights) goes through
`useArchiveWrite`:

- `onMutate`: `cancelQueries` → snapshot → `setQueriesData` for each affected key
  (`applyOptimistic`), returning the rollback.
- `onError`: rollback, then `toast.error` with **Retry**, which replays the same
  variables.
- **One queue** (`scope`): the server applies writes in the order they were made, so
  editing or deleting a log that is still being created just waits for it. Only
  `mutationFn` is queued; `onMutate` runs at once.
- **New rows get their id on the client** (`useAddLog`, `useAddCollectionItem`,
  `useSaveFlight` pick a uuid), and the server inserts with it (upsert, so a retry of a
  write that did land isn't duplicated). The optimistic row is the real one, so it can
  be edited or deleted immediately; Undo after a delete restores the same id.
- **Refetch after the queue drains** (`refreshAfterWrites`): keys are collected per
  write and invalidated (not awaited) once no other write is in flight, so a refetch
  can't wipe a later write's optimistic patch.

Toasts with **Undo** stay, shown at once, only where a write takes something away
(delete a log/flight, move a log, remove from backlog). Bulk writes (import, Steam and
Discogs sync) are not optimistic: they show progress through `isPending`.

**Invalidate only what changed**, in parallel, and return the promise:

| Write                          | Refetches                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| Log add / edit / move / delete | that kind's logs and library, recent, index, stats, backlog (+ copies for records) |
| Backlog add / remove           | backlog, index, that kind's library                                                |
| Copies                         | as a record log write                                                              |
| Flights                        | flights                                                                            |
| Import / clear archive         | everything under `["archive"]`                                                     |

## Scroll restoration

[Scroll restoration](https://tanstack.com/query/latest/docs/framework/react/guides/scroll-restoration)

The router restores scroll (`scrollRestoration: true`). It works because a screen you
return to renders synchronously from the cache (30 min `gcTime`), so the page has its
full height before the position is restored. Don't break this by gating a list on an
effect or by refetching into a skeleton.
