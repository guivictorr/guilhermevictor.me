# Design

Archive's visual identity and the rules every screen follows. `ui.md` covers the
implementation side (components, native-feel utilities); this file covers how things
should look, move and read. When the two disagree, this file wins, and `ui.md` should
be updated to match.

> **Status (2026-10-14):** these rules are decided but not applied yet. The app still
> runs stock shadcn styles (Geist, neutral grays). See "Applying this" at the end.

## 0. Before you build UI

Read the relevant guide first. They are the source of most rules below.

| Read                                                                              | When                                                            |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `.claude/skills/emil-design-eng`                                                  | Any UI work: philosophy, component details, animation decisions |
| `.claude/skills/apple-design`                                                     | Gestures, sheets, springs, materials, typography                |
| `.claude/skills/animate` / `review-animations`                                    | Before adding or reviewing any motion                           |
| `.claude/skills/mobile-native`                                                    | Anything touch: tap, scroll, inputs, safe areas                 |
| `.claude/skills/break-ui`                                                         | New list, card or detail view: try the worst-case data          |
| `.claude/skills/pick-ui-library`                                                  | Before adding a UI dependency                                   |
| [You don't need animations](https://emilkowal.ski/ui/you-dont-need-animations)    | Deciding whether something should animate at all                |
| [7 practical animation tips](https://emilkowal.ski/ui/7-practical-animation-tips) | Concrete values for press, easing, origin, speed                |
| [Web Interface Guidelines](https://interfaces.rauno.me/)                          | Forms, typography, touch, accessibility details                 |

## 1. Brand

**Idea: a personal museum of what you lived.** Every movie, show, game, book, record and
flight is an object you collected: a poster, a game case, a book with a spine, a record
sleeve, a boarding pass. The app's chrome is the instrument panel around them: precise,
quiet, and dark.

**Personality:** collected · precise · warm · confident and quiet. It is not
playful-bouncy, and it is not neon-techy.

**Voice:** short and specific labels. Write "Log watch", "Owned ×2", "Date unknown",
"1h 50m connection in LIS". No exclamation marks, no jargon, no cute copy. Name things
for what they contain ("Backlog", "Plays"), not with vague umbrella words.

**References (mood, not to copy):** dark flight trackers (departure-board codes, bento
fact tiles, boarding passes), a VHS-spine film archive (objects on a shelf, editorial
calm), a game tracker (expanded uppercase titles, status chips with counts). Layout
references the owner liked: yourmovieprofile.com / yourgamerprofile.com detail pages
(minus social features) and the discogs.com release page. Home and Search are still
considered too simple, and Stats is to be rebuilt.

## 2. Principles

1. **Content is the color.** Posters, covers and sleeves bring all the color. The
   chrome stays ink, so the collection is what you see.
2. **One signal.** Orange marks the single primary action, or "you" (your rating,
   your active tab). Never more than one orange call to action per view.
3. **Objects, not rows.** Each kind has a physical form (§8). Prefer showing the object
   over a text row whenever there's room.
4. **Instrument precision.** Numbers line up (tabular), data aligns to a grid, and
   flight codes and times use the dot-matrix face like a departure board.
5. **Native feel first.** It should feel like an installed app on a phone. The
   mobile-native rules in `ui.md` are not optional.
6. **Motion needs a reason.** Every animation passes the frequency and purpose gate
   (§10). When in doubt, leave it out.
7. **Simplicity, not minimalism.** Show the common path first and put advanced options
   one level down (filters live in a sheet, not on the page).

## 3. Color

Dark is the hero theme and is tuned first. Light uses the same roles with its own
values. Tokens are semantic: use the role name, never a raw hex value in components.

Contrast ratios below were computed with the WCAG 2 formula.

| Token         | Dark        | Light              | Role and contrast                                                                                     |
| ------------- | ----------- | ------------------ | ----------------------------------------------------------------------------------------------------- |
| `ink`         | `#0B0B0C`   | `#F5F2EB` (paper)  | Page background                                                                                       |
| `surface`     | `#151517`   | `#FFFFFF`          | Cards, lists                                                                                          |
| `raised`      | `#1D1D20`   | `#FFFFFF` + shadow | Sheets, popovers, menus                                                                               |
| `field`       | `#26262A`   | `#ECE8DF`          | Inputs, chips, segmented tracks                                                                       |
| `line`        | white at 8% | black at 10%       | Hairlines and dividers                                                                                |
| `text`        | `#F4F1EA`   | `#121212`          | Primary text: 13–19:1 on every surface                                                                |
| `muted`       | `#ADA79C`   | `#5C5850`          | Secondary text: at least 5.8:1 on every surface                                                       |
| `subtle`      | `#837E75`   | `#6B665E`          | Metadata, **only on `ink`/`surface`** (dark 4.5–4.9:1, light 5.1–5.7:1). Never on `raised` or `field` |
| `accent`      | `#FF6A1F`   | `#FF6A1F` (fill)   | Primary action, active state, stars                                                                   |
| `accent-text` | `#FF7E3D`   | `#B8410A`          | Orange text and focus rings (dark 6.0–7.8:1, light 4.5–5.5:1)                                         |
| `on-accent`   | `#0B0B0C`   | `#121212`          | Text on orange: 6.5–6.9:1                                                                             |
| `success`     | `#3FD27F`   | `#187040`          | Finished, on time (≥5:1 on every surface)                                                             |
| `danger`      | `#FF5C7A`   | `#C8243F`          | Destructive (≥4.5:1 on every surface)                                                                 |
| `info`        | `#5AA9FF`   | `#1F66C9`          | Links in prose, neutral info                                                                          |

Rules:

- **Never put white text on orange.** It fails at 2.9:1. Orange fills always take
  `on-accent` text.
- **In the light theme, orange is a fill, not a line.** The orange fill reaches only
  2.6:1 on paper, so focus rings, underlines and thin indicators use `accent-text`.
- **Accent covers at most about 5% of a screen.** If orange is everywhere, it signals
  nothing.
- **Danger is pink-red, not orange.** It is always paired with an icon and a label, so
  it can't be confused with the brand color.
- **Color is never the only signal.** Status always comes with an icon, a word or a
  shape.
- **Stars use the accent.** Your rating is "you".
- **No per-kind colors.** Kinds are told apart by icon and object shape (§8), not by hue.
- **Theme switches never animate,** and `theme-color` is set per scheme.

## 4. Typography

Two families:

- **Archivo** (`@fontsource-variable/archivo/wdth.css`, weight 100–900, width 62–125)
  does everything: display, titles, UI and prose. The width axis gives the expanded,
  poster-like display style without a third font.
- **Doto** (`@fontsource-variable/doto`), a dot-matrix face, is used **only** for airport
  codes, flight times, and big counters or countdowns. Minimum size 20px; below that the
  dots stop reading as letters.

| Role        | Size / leading                    | Weight · width       | Tracking | Example                           |
| ----------- | --------------------------------- | -------------------- | -------- | --------------------------------- |
| Display     | `clamp(2rem, 6vw, 3.5rem)` / 0.95 | 900 · 125, UPPERCASE | −0.02em  | Page titles: "ARCHIVE", "FLIGHTS" |
| Title       | 1.75–2.5rem / 1.05                | 750 · 100            | −0.02em  | Detail hero title                 |
| Heading     | 1.125–1.25rem / 1.25              | 650 · 100            | −0.01em  | Section headings                  |
| Body        | 0.9375–1rem / 1.5                 | 400 · 100            | 0        | Descriptions, notes               |
| Label       | 0.875rem / 1.3                    | 500 · 100            | 0        | Buttons, field labels             |
| Caption     | 0.75–0.8125rem / 1.35             | 450 · 100            | +0.01em  | Metadata: year, runtime           |
| Overline    | 0.6875rem / 1.2                   | 600 · 112, UPPERCASE | +0.08em  | Eyebrows: "RECORD", "BOOKING ZZ9" |
| Code (Doto) | 1.5–3.5rem / 1                    | 700                  | +0.02em  | `GRU` · `21:30`                   |

Rules:

- **Tracking depends on size.** Large type tightens, small type opens slightly. Never
  apply one letter-spacing to everything.
- **Leading goes the opposite way from size:** tight on big titles, comfortable on body
  text.
- **Weights never go below 400,** and weight never changes on hover or selection, because
  that shifts the layout.
- **Every number people compare uses `tabular-nums`:** ratings, years, durations, prices,
  counts.
- **Expanded uppercase is for display text and overlines only,** never for paragraphs.
- Titles use `text-wrap: balance`; prose uses `text-wrap: pretty`.
- **Doto text must stay readable to everyone.** A dot-matrix code gets an accessible name
  with plain text, for example `aria-label="São Paulo, GRU"`.
- Size type in `rem` so the user's text size setting scales the layout.

## 5. Space, shape, layout

- **Spacing:** a 4px grid. Use the steps 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64 and
  nothing in between.
- **Gutters:** 16px on mobile, 32px on desktop, plus the safe-area insets.
- **Widths:** content up to 72rem; forms and settings up to 32rem.
- **Radii:**

  | Element                                     | Radius    |
  | ------------------------------------------- | --------- |
  | Buttons, chips, segmented controls, tab bar | full pill |
  | Inputs                                      | 12px      |
  | Posters and covers                          | 10px      |
  | Cards                                       | 20px      |
  | Sheets, hero cards, boarding passes         | 28px      |

- **Concentric radii:** an inner element's radius equals the outer radius minus the
  padding between them, so nested corners stay parallel.
- **Bento grids** for facts and stats on detail pages: equal gaps, every tile on the
  grid, tiles grouped by meaning.
- **Tap targets are at least 44×44px.** Adjacent list items have no dead space between
  them; grow the padding instead.

## 6. Surfaces and depth

- **In dark mode, elevation is light, not shadow.** Each level is a lighter surface plus a
  top highlight, `inset 0 1px 0 rgb(255 255 255 / 6%)`, like light catching an edge.
  In light mode, use one soft shadow per level instead.
- **Glass only for floating chrome over content:** the tab bar, sticky headers, and
  controls over hero images. Use `backdrop-filter: blur(20px) saturate(160%)` over `ink`
  at 70%.
  - Never stack glass on glass; legibility collapses.
  - Under `prefers-reduced-transparency`, glass becomes a solid surface.
  - Under `prefers-contrast: more`, it becomes solid with a visible border.
- **Blocking tasks dim the page** (sheets, dialogs): a scrim of `ink` at 60%.
- **Scroll edges fade.** Where content scrolls under sticky chrome, use a short gradient
  or blur mask instead of a hard 1px divider.
- **Decorative glows** use radial gradients (blurred boxes band and cost more) and
  `pointer-events: none`.

## 7. Components

shadcn on Base UI provides behavior and accessibility; the styling is ours. Restyle the
components, don't fight their logic.

| Component         | Style                                                                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary button    | Orange pill with `on-accent` label. One per view                                                                                               |
| Secondary button  | `field` pill with `text` label                                                                                                                 |
| Ghost button      | Text only, `muted`; becomes `text` on hover                                                                                                    |
| Icon button       | Round, 44px touch size, always with `aria-label`                                                                                               |
| Sizes             | 36px (compact) and 44px (default, touch); press `scale(0.97)`                                                                                  |
| Chips and filters | Pill; may carry a count ("In progress 4"). Active = `text` fill with `ink` label. Removable chips end with ×                                   |
| Segmented control | `field` track with a `raised` thumb that slides (ease-in-out token)                                                                            |
| Tab bar           | Floating glass pill above the safe area. Active item: orange icon (filled variant) and label                                                   |
| Card              | `surface`, hairline `line` border, 20px radius. Media covers never animate on hover (owner's call); other cards may change background on hover |
| Detail hero       | Blurred cover as backdrop fading into `ink`; the poster/sleeve as an object; overline for the kind; title; one orange action                   |
| Sheet             | `ResponsiveSheet`: bottom sheet on mobile, side sheet on desktop; 28px top radius; grab handle; drawer easing                                  |
| Input             | `field` fill, no border at rest; 2px `accent-text` focus ring via `box-shadow`, offset 2px; 16px or larger text on touch                       |
| Rating            | Orange stars; hover previews on desktop, tap or drag on touch (already built)                                                                  |
| Toast             | Sonner on a `raised` surface; success and error with icons                                                                                     |
| Inline feedback   | A check next to the trigger for success; the field itself highlighted for errors                                                               |
| Loading           | Skeletons shaped like the content. Spinners only inside buttons                                                                                |
| Empty state       | One line saying what's missing plus one primary action ("Find something")                                                                      |

Other rules:

- Disabled buttons have no tooltip.
- Toggles apply immediately; no confirm step.
- Buttons disable while submitting.
- Clicking a label focuses its field.

## 8. Media as objects

Each kind looks like the thing it is:

| Kind             | Object treatment                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Movies and shows | The cover alone: 2:3 poster, 10px radius, hairline. No case or frame (owner's call). Heroes use the backdrop image                                |
| Games            | The cover alone, no case. The hero uses a landscape screenshot behind the title                                                                   |
| Books            | A spine edge on the left of the cover: a 2–3% darker band plus an inner shadow, so it reads as a physical book                                    |
| Records          | Square sleeve. On the detail page, a vinyl disc peeks out from behind the sleeve (static, CSS only)                                               |
| Flights          | Boarding pass: Doto codes and times, paper grain, perforation notches, airline logo. No barcode. Map planes fly each route in the direction flown |

- **Missing covers** show a typed fallback: the kind icon plus the title in Archivo on
  `field`. Never a broken image.
- **Future:** a shelf view of spines (the VHS-archive reference) as an alternative library
  layout. It's a rarely used view, so a little delight is allowed there.

## 9. Icons

- Lucide only, stroke width 1.75.
- Sizes 16, 20 and 24px, aligned to the text they sit next to.
- Filled variants only for the active tab.
- Icon-only controls always have an `aria-label`.

## 10. Motion

Easing tokens already exist in `apps/admin/src/styles/app.css`: `--ease-out`,
`--ease-in-out`, `--ease-drawer`.

**First, the gate.** How often is it seen, and why does it move?

| Frequency                                        | Decision           |
| ------------------------------------------------ | ------------------ |
| Keyboard actions, 100+ times a day               | No animation       |
| Tens of times a day (hover, list navigation)     | Minimal or none    |
| Occasional (sheets, toasts, page changes)        | Standard animation |
| Rare or first-time (shelf view, a finished trip) | Delight allowed    |

Valid reasons to animate: feedback, spatial consistency, state change, or preventing a
jarring jump. "It looks nice" on something frequent is not a reason.

**Then the values:**

| Motion                   | Value                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Press                    | 100–160ms `--ease-out`, `scale(0.97)`                                                       |
| Tooltips, small popovers | 125–200ms, from the trigger's `--transform-origin`                                          |
| Menus, selects           | 150–250ms                                                                                   |
| Sheets                   | `--ease-drawer`, up to 300ms; exit the way they entered                                     |
| Page changes             | 180ms crossfade (view transitions)                                                          |
| Grids on first load      | 30–50ms stagger, first load only                                                            |
| Gestures (drag, swipe)   | Springs (motion, bounce 0) that keep the release velocity; slight bounce only after a flick |

Never ship:

- `transition: all`
- an entrance from `scale(0)` (start at 0.95 with opacity 0)
- `ease-in` on UI
- keyframes on rapidly repeated UI (use transitions, which can be interrupted)
- animated `width`, `height`, `margin`, `padding`, `top` or `left`
- ungated hover motion

Under `prefers-reduced-motion`, movement becomes a short crossfade. Opacity and color
changes stay. Looping animations pause when off-screen.

## 11. Accessibility

- **Contrast:** the table in §3 is the source of truth. Body text is at least 4.5:1; large
  text and UI parts are at least 3:1. Check new pairs before using them.
- **Focus** is visible on every interactive element. Rings use `box-shadow`, so they
  follow the radius.
- Respect `prefers-reduced-motion`, `prefers-reduced-transparency` and
  `prefers-contrast`.
- **Never disable zoom.** Inputs stay at 16px or larger on touch instead.
- Lay out in `rem` so a larger text size doesn't break screens.
- Covers are `<img>` with the title as alt text; decorative images get `alt=""`.

## 12. Robustness

Run `break-ui` thinking on every new list, card and detail view:

- Card titles clamp at 2 lines. Detail titles wrap and are never cut.
- Secondary metadata may truncate at the end, as long as the full value is reachable.
- **Never truncate numbers, dates, durations or prices.**
- Every list handles empty, exactly one, and 1,000+ items (use Virtuoso past ~1,000
  rows).
- Test with non-Latin titles, emoji, missing years, missing covers and very long names.

## 13. Libraries

From `pick-ui-library`.

- **Already in use:** Base UI (primitives), Sonner (toasts), next-themes, cva/clsx.
- **Add only when a feature needs it:**

  | Need                          | Library    |
  | ----------------------------- | ---------- |
  | Drag, springs, gestures       | motion     |
  | Counters that change          | NumberFlow |
  | A 3D globe for flights        | Cobe       |
  | Charts for the new Stats page | recharts   |
  | A ⌘K command search           | cmdk       |
  | Very long lists               | Virtuoso   |

A simple hover or fade never needs a library; use CSS.

## 14. Before shipping UI

- [ ] Contrast checked in dark and light
- [ ] Looks right at 375px and at desktop width
- [ ] Hover styles gated by `(hover: hover)`
- [ ] Reduced motion handled
- [ ] Worst-case data tried (long, empty, one, many, missing)
- [ ] At most one orange call to action in the view
- [ ] Dot-matrix text has a plain-text accessible name
- [ ] Checked on a real phone (sticky hover, safe areas, keyboard)

## Where it lives in code

| Piece                                                                                                                             | File                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Color tokens (both themes), fonts                                                                                                 | `packages/ui/src/styles/globals.css`                                              |
| Type roles (`type-display`, `type-title`, `type-heading`, `type-overline`, `font-dots`), `glass`, `edge-highlight`, motion tokens | `apps/admin/src/styles/app.css`                                                   |
| Buttons, inputs, toggles                                                                                                          | `packages/ui/src/components/*` (restyled shadcn)                                  |
| Sidebar (desktop, collapsible ⌘B) and tab bar (phones)                                                                            | `apps/admin/src/components/app-shell.tsx`                                         |
| Covers (book spine, record sleeve + vinyl)                                                                                        | `components/poster.tsx`                                                           |
| Flights: map highlight and planes, boarding pass, trip legs, aircraft photos                                                      | `components/flights/*`, `routes/flights/*`, `lib/aircraft.ts`, `public/aircraft/` |
| Home facts                                                                                                                        | `server/facts.server.ts`, `components/home/facts-deck.tsx`                        |
