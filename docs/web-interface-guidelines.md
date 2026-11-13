# Web interface guidelines

The baseline every app in this monorepo follows (site, archive, future apps). Based on
Rauno Freiberg's [Web Interface Guidelines](https://interfaces.rauno.me/), with notes on
how each rule maps to our stack (Base UI, Tailwind v4, `packages/ui`). App-specific
identity (color, type, motion values) lives in `design.md`; when a rule here and an app's
design doc disagree, the stricter one wins.

WAI-ARIA is not repeated here. Base UI handles roles, focus management and keyboard
behavior; don't re-implement them.

## Interactivity

- Clicking a label focuses its field (`<label htmlFor>` or Base UI `Field.Label`).
- Inputs live inside a `<form>` so Enter submits.
- Inputs use the right `type` (`email`, `password`, `search`, `tel`, `url`, `number`)
  and `inputMode` / `enterKeyHint` where it helps the phone keyboard.
- Turn off `spellCheck` and `autoComplete` unless the field benefits from them (names,
  addresses, passwords keep their proper `autocomplete` tokens).
- Use native validation (`required`, `min`, `pattern`) first; Base UI `Field` /
  `Form` surface it.
- Input prefix and suffix decorations (icons, units, clear buttons) are positioned over
  the input with padding, not beside it, and clicking them focuses the input
  (`InputGroup` in `packages/ui`).
- Toggles apply immediately. No confirm step.
- Buttons disable after submit to avoid duplicate requests.
- Interactive elements set `user-select: none` on their inner content.
- Decorative elements (glows, gradients, noise) set `pointer-events: none`.
- Items in a list have no dead space between them; grow the padding instead of adding
  a gap.

## Typography

- `-webkit-font-smoothing: antialiased` and `text-rendering: optimizeLegibility` on the
  body.
- Subset fonts to the languages we ship (the site ships `en` and `pt`: Latin +
  Latin Extended).
- Font weight never changes on hover or selection (layout shift).
- No weights below 400.
- Medium headings look best at 500–600.
- Fluid sizes with `clamp()`, e.g. `clamp(48px, 5vw, 72px)` for a heading.
- `font-variant-numeric: tabular-nums` (`tabular-nums`) wherever numbers are compared
  or change: tables, timers, prices, counters.
- `-webkit-text-size-adjust: 100%` so iOS doesn't resize text in landscape.

## Motion

- Switching themes never triggers transitions (`next-themes` `disableTransitionOnChange`).
- Interaction animations stay at or under 200ms so they feel immediate.
- Values are proportional to the trigger: dialogs fade in from ~0.95 scale, never from
  0; buttons press to ~0.97, never 0.8.
- Frequent, low-novelty actions don't animate: context menus, adding or deleting list
  items, hovering trivial buttons.
- Looping animations pause when off-screen (`IntersectionObserver`, or
  `animation-play-state` toggled by visibility).
- In-page anchors use `scroll-behavior: smooth` with `scroll-margin-top` for sticky
  headers (and never under `prefers-reduced-motion`).

## Touch

- Hover styles only under `@media (hover: hover)` (Tailwind v4's `hover:` already does
  this).
- Inputs are at least 16px on touch so iOS doesn't zoom.
- No `autoFocus` on touch devices: it opens the keyboard over the screen.
- Autoplaying `<video>` needs `muted` and `playsInline`.
- Custom pan/zoom/drag components set `touch-action` so native scroll and zoom don't
  fight them.
- Remove the iOS tap highlight (`-webkit-tap-highlight-color: transparent`) only when
  something replaces it (press scale, background change).

## Performance

- Large `blur()` values in `filter` and `backdrop-filter` are slow; keep them small and
  few.
- Scaled or blurred solid rectangles band; use radial gradients for glows.
- `transform: translateZ(0)` only for a specific animation that measurably stutters.
- `will-change` is toggled on for the duration of an expensive animation, never left on
  preemptively.
- Autoplaying many videos on iOS chokes the device; pause or unmount off-screen videos.
- Real-time values (pointer position, scroll, wheel deltas) go straight to the DOM through
  refs or CSS variables, not through React state on every event.
- Adapt to the device: `prefers-reduced-data`, `navigator.connection.saveData`,
  `deviceMemory`, and lighter fallbacks for shaders and WebGL backgrounds.

## Accessibility

- Disabled buttons have no tooltip: they aren't focusable, so keyboard and screen reader
  users never get it. Explain the reason in text instead.
- Focus rings use `box-shadow` so they follow the border radius.
- Items in a sequential list move with ↑ ↓ (Base UI menus, listboxes and toolbars do
  this; custom lists need a roving tabindex).
- Items in a sequential list delete with ⌘ Backspace where deleting is possible.
- Dropdown menus open on `pointerdown`, not `click` (Base UI `Menu` default).
- Favicon is an SVG with an embedded `<style>` that follows `prefers-color-scheme`.
- Icon-only controls have an explicit `aria-label`.
- Hover tooltips never contain interactive content; use a `Popover` or `PreviewCard`.
- Images render as `<img>` (screen readers, right-click copy); decorative ones get
  `alt=""`.
- Illustrations built from HTML/SVG get one `aria-label` (`role="img"`) instead of
  exposing their DOM tree.
- Gradient text unsets the gradient in `::selection`.
- Nested menus use a prediction cone so moving the pointer diagonally doesn't close them
  (Base UI submenus handle this).

## Design

- Optimistic updates: change locally, roll back on error with feedback.
- Auth redirects happen on the server before the client loads (route `beforeLoad` /
  middleware), never as a client URL jump.
- Style `::selection`.
- Feedback appears next to its trigger: an inline check after copying, not a toast; the
  failing input highlighted on a form error, not only a banner.
- Empty states prompt creating the first item, with optional templates.
