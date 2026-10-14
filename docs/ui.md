# UI

Goal: the PWA should feel like a **native app** on a phone. Project skills in
`.claude/skills` (Emil Kowalski): use `mobile-native`, `emil-design-eng`, `animate`,
`break-ui`, `review-animations` when touching UI.

## Native-feel rules (already applied — keep them)

- Viewport `viewport-fit=cover`; safe areas via `pt-safe`, `pb-safe`, `px-safe`,
  `pb-tab-bar` (in `src/styles/app.css`).
- No tap highlight; `overscroll-behavior: none` on the page, `contain` in sheets.
- Inputs ≥16px on touch (prevents iOS zoom); never disable zoom.
- Hover styles only for `(hover: hover)` (Tailwind v4 `hover:` already does this).
- Press feedback: `pressable` utility (scale 0.97, 160ms ease-out) on tappables.
- Motion tokens: `--ease-out`, `--ease-in-out`, `--ease-drawer`; UI motion ≤300ms;
  view transitions are a 180ms crossfade; reduced motion respected.
- `theme-color` per scheme, synced when the user forces a theme.

## Shared building blocks

| Component                                                                                             | Use                                                                                                                    |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `ResponsiveSheet` (+ `useOpenSession`)                                                                | Bottom sheet on phones (swipe down), side sheet on desktop — for every form                                            |
| `DetailHero`, `DetailBody` (tabs + sidebar), `DetailSection`, `SideCard`, `DetailsCard`, `RatingsRow` | All detail pages                                                                                                       |
| `LogSheet`, `LogHistory`, `use-log-sheet`                                                             | Logging any kind                                                                                                       |
| `MediaCard` / `MediaGrid` / `MediaRail` / `ScrollRow`                                                 | Cards, grids, horizontal snap rows                                                                                     |
| `BacklogButton`, `CardBacklogBadge`                                                                   | Backlog toggle (detail) and poster-corner toggle/✓                                                                     |
| `Poster`                                                                                              | Cover with kind-shaped aspect and typed fallback                                                                       |
| `LibraryView`                                                                                         | Library grid + TanStack Table v9 (sort, filter, grid/table)                                                            |
| `LibraryNav`                                                                                          | Kind chips at the top of library pages                                                                                 |
| `BarChart`                                                                                            | Single-series bars with focusable tooltips (dataviz rules: one hue, no legend)                                         |
| `YouTubeVideo`                                                                                        | Thumbnail until tapped (no iframe cost)                                                                                |
| `BoardingPass`, `FlightMap`                                                                           | Flights                                                                                                                |
| `form/form-hook.tsx`                                                                                  | TanStack Form `createFormHook` with field components (Date, Rating, Switch, Text, Textarea, Number, Select, Segmented) |

## Design references

The owner liked yourmovieprofile.com / yourgamerprofile.com detail pages (copied
minus social features) and the discogs.com release page (tracklist → companies →
credits → notes → identifiers → other versions → videos). They consider **Home,
Search and Stats still too simple** and are collecting reference designs for them.
