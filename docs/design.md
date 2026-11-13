# Design

The visual identity (Vellum) and the rules every screen follows. It started as the
archive's and is becoming the shared system for every app (`design-system.md`). `ui.md` covers the
implementation side (components, native-feel utilities); this file covers how things
should look, move and read. When the two disagree, this file wins, and `ui.md` should
be updated to match.

## 0. Before you build UI

Read the relevant guide first. They are the source of most rules below.

| Read                                                                              | When                                                            |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `.claude/skills/emil-design-eng`                                                  | Any UI work: philosophy, component details, animation decisions |
| `.claude/skills/apple-design`                                                     | Gestures, sheets, springs, materials, typography                |
| `.claude/skills/animate` / `review-animations`                                    | Before adding or reviewing any motion                           |
| `.claude/skills/choreograph` / `gestures`                                         | Several things moving together; drags, swipes, sheets           |
| `.claude/skills/remove-animations` / `learn-taste`                                | Toning motion down; building taste from references              |
| `.claude/skills/mobile-native`                                                    | Anything touch: tap, scroll, inputs, safe areas                 |
| `.claude/skills/break-ui`                                                         | New list, card or detail view: try the worst-case data          |
| `.claude/skills/pick-ui-library`                                                  | Before adding a UI dependency                                   |
| [You don't need animations](https://emilkowal.ski/ui/you-dont-need-animations)    | Deciding whether something should animate at all                |
| [7 practical animation tips](https://emilkowal.ski/ui/7-practical-animation-tips) | Concrete values for press, easing, origin, speed                |
| `docs/web-interface-guidelines.md` ([source](https://interfaces.rauno.me/))       | Baseline rules: forms, typography, touch, a11y, performance     |
| `docs/design-system.md`                                                           | Shared components across apps, Base UI inventory, blocks        |
| [Craft](https://craft.gustavofior.com/resources) (principles 8–12 below)          | Alignment, radii, scroll edges, hover and interruptible motion  |

## 1. Brand

**Idea: a personal museum of what you lived.** Every movie, show, game, book, record and
flight is an object you collected: a poster, a game case, a book with a spine, a record
sleeve, a boarding pass. The chrome around them is **Vellum**: paper and tracing paper,
monospace labels like a catalogue, a serif for names, and one blue pencil. Plain like a
text editor, warm like paper. Flights are the one exception: an amber LED board.

**Personality:** collected · precise · warm · plain. It is not playful-bouncy, and it is
not neon-techy.

**Voice:** short and specific labels. Write "Log watch", "Owned ×2", "Date unknown",
"1h 50m connection in LIS". No exclamation marks, no jargon, no cute copy. Name things
for what they contain ("Backlog", "My copies"), not with vague umbrella words.

**Philosophy:** Airbnb's design principles and UX thinking (`design-system.md`
"Principles"), never its look.

**References (mood, not to copy):** Acme (plain, text-first), index cards and
contact sheets (analog objects), tracing paper and glass (material), dark flight trackers (departure-board codes, bento
fact tiles, boarding passes), a VHS-spine film archive (objects on a shelf, editorial
calm), a game tracker (expanded uppercase titles, status chips with counts). Layout
references the owner liked: yourmovieprofile.com / yourgamerprofile.com detail pages
(minus social features) and the discogs.com release page. Home and Search are still
considered too simple, and Stats is to be rebuilt.

## 2. Principles

1. **Content is the color.** Posters, covers and sleeves bring all the color. The
   chrome stays paper and ink, so the collection is what you see.
2. **One signal.** The blue pencil marks the single primary action, or "you" (your
   rating, your active tab, focus). Never more than one blue call to action per view.
3. **Objects, not rows.** Each kind has a physical form (§8). Prefer showing the object
   over a text row whenever there's room.
4. **Catalogue precision.** Numbers line up (tabular), data aligns to a grid, labels
   read like a catalogue (monospace), and flight codes and times use the dot-matrix
   face on an LED board.
5. **Native feel first.** It should feel like an installed app on a phone. The
   mobile-native rules in `ui.md` are not optional.
6. **Motion needs a reason.** Every animation passes the frequency and purpose gate
   (§10). When in doubt, leave it out.
7. **Simplicity, not minimalism.** Show the common path first and put advanced options
   one level down (filters live in a sheet, not on the page).
8. **Align by eye, not by box** ([optical alignment](https://craft.gustavofior.com/optical-alignment)).
   Geometry is a starting point; what matters is where the weight looks centered.
   - A play triangle sits 1–2px right of center (`translate-x-px` / `ml-0.5`); stars and
     downloads may need a 1px nudge. Check by blurring the element (`filter: blur()`
     in the inspector, or squint): the blob should be centered.
   - Icon + label pills: the icon brings its own whitespace, so the icon side gets less
     padding (`ps-3 pe-3.5`, not `px-3.5`). Trailing chevrons the same (`pe-2`).
   - Circles and triangles look smaller than squares in the same box; size them up a
     touch to match.
   - Keep `font-optical-sizing: auto` (set on `body`); hang opening quotes
     (`hanging-punctuation: first`) in quoted notes.
9. **Concentric corners** ([nested border radius](https://craft.gustavofior.com/nested-border-radius)).
   Inner radius = outer radius − inset (the padding, plus any border), never the same
   radius on both, and never below zero (`max(0px, …)` → square).
   - Feature cards: `rounded-2xl` (≈11px) − 8px inset → `rounded-sm` (≈4px) covers.
   - Menus and selects: `rounded-lg` (6px) popup − 4px padding → 2px items
     (`rounded-[calc(var(--radius-lg)-4px)]`).
   - A pill inside a pill of the same height stays `rounded-full`.
   - Tune by eye when the inset isn't even or the inner element doesn't reach the
     corner.
10. **Fade only the edge that hides something** ([scroll fades](https://craft.gustavofior.com/scroll-fades)).
    Scrollers use `fade-x` / `fade-y` (`app.css`): a `mask-image` (works over any
    background, never blocks taps) whose start/end sizes are `@property` lengths driven by
    `animation-timeline: scroll(self)`. At the start only the end fades; at the end only
    the start. Without scroll-timeline support both ends fade a little. The mask covers
    the scrollbar too, so use it on scrollers with a hidden scrollbar (rails, chip rows,
    `CardRow`) or on an inner wrapper.
11. **Hover restraint** ([hover restraint](https://craft.gustavofior.com/hover-restraint)).
    The more often something happens, the less animation it can afford.
    - Hover highlights switch instantly: no `transition-colors` on rows, chips or
      buttons (`Button` only transitions `transform`/`box-shadow`, for the press).
    - Only the first tooltip waits (500ms, `TooltipProvider`); neighbours open at once
      (`data-instant` skips the transition).
    - Frequent navigation doesn't animate: tab-bar and dock links skip the view
      transition (`viewTransition={false}`); the crossfade is for going into a page.
    - Decide by frequency and intent, not by input device.
12. **Interruptible motion** ([interruptibility](https://craft.gustavofior.com/interruptibility)).
    Anything the user can toggle animates with a CSS transition toward its end state,
    so reversing mid-way retargets from where it is instead of jumping.
    - Popovers, menus, selects, comboboxes, tooltips and dialogs use Base UI's
      `data-starting-style` / `data-ending-style` with `transition-[opacity,scale]`, like
      the drawer. No `animate-in`/`animate-out` keyframes for open/close.
    - Keyframes only for one-shots nothing interrupts: spinners, skeleton pulse, the
      `animate-reveal` fade of content that waited for data.
    - Never block input while something moves (no `isAnimating` flags, no
      `pointer-events: none` during motion).
    - A sheet must be mounted closed and then opened; one mounted already open just
      pops in (that's why the log sheet is a single always-mounted `LogHost`).
    - Springs only for gestures where release velocity matters (swipes, flicks).

## 3. Color

Light (paper) is the hero theme; dark is the same paper at night, with the same roles.
Tokens are semantic: use the role name, never a raw hex value in components. Values live
in `packages/ui/src/styles/globals.css`.

Contrast ratios below were computed with the WCAG 2 formula.

| Token       | Light                    | Dark         | Role and contrast                                                                                  |
| ----------- | ------------------------ | ------------ | -------------------------------------------------------------------------------------------------- |
| `ink`       | `#EFECE4` (paper)        | `#15140F`    | Page background                                                                                    |
| `surface`   | `#FBF9F3` (vellum)       | `#1E1D18`    | Cards, lists                                                                                       |
| `raised`    | `#FBF9F3` + float shadow | `#25241E`    | Sheets, popovers, menus                                                                            |
| `field`     | `#E5E1D6`                | `#2D2B25`    | Inputs, chips, segmented tracks                                                                    |
| `line`      | warm black at 14%        | white at 10% | Hairlines and dividers                                                                             |
| `text`      | `#1E1D1A`                | `#EEEAE0`    | Primary text: 11.8–16:1 on every surface                                                           |
| `muted`     | `#524F47`                | `#AAA596`    | Secondary text: at least 5.7:1 on every surface                                                    |
| `subtle`    | `#67635A`                | `#8F8A7C`    | Metadata, **only on `ink`/`surface`** (light 5.1–5.7:1, dark 4.9–5.4:1). Never on `raised`/`field` |
| `signal`    | `#2F4FB3` (blue pencil)  | `#9FB4FF`    | Primary action, active state, stars, focus rings, links (light 5.6–6.9:1, dark 7–9.2:1)            |
| `on-signal` | `#FBF9F3`                | `#15140F`    | Text on the signal fill: 6.9:1 light, 9.2:1 dark                                                   |
| `success`   | `#1F6B3A`                | `#5FD08E`    | Finished, on time (≥5:1 on every surface)                                                          |
| `danger`    | `#B3261E`                | `#FF7A6B`    | Destructive (≥5:1 on every surface)                                                                |

In code `signal` is `--primary` (fill) and `--signal-text` (text and rings); they are the
same colour in Vellum.

Rules:

- **Signal covers at most about 5% of a screen.** If blue is everywhere, it signals
  nothing.
- **Color is never the only signal.** Status always comes with an icon, a word or a
  shape.
- **Stars use the signal.** Your rating is "you".
- **No per-kind colors.** Kinds are told apart by icon and object shape (§8), not by hue.
- **The LED board is the only other colour system:** amber `#FF9D2E` on `#0D0B08`, the
  same in both themes, only for flights (`led-panel`, `led-glow`, `led-label`).
- **Theme switches never animate,** and `theme-color` is set per scheme.

## 4. Typography

Three families, each with one job (self-hosted, `packages/ui/src/fonts/README.md`):

- **Erode** (Fontshare, 400–600), a warm serif, for names, titles and prose: the
  things you collected and what you wrote about them.
- **IBM Plex Mono** (400–600) for the interface: labels, buttons, metadata, numbers.
  It's the body default, so UI reads like a catalogue card.
- **Doto** (`@fontsource-variable/doto`), a dot-matrix face, **only** for airport codes,
  flight times and big counters or countdowns. Minimum size 20px; below that the dots
  stop reading as letters.

| Role        | Utility         | Size / leading                  | Family · weight      | Tracking | Example                       |
| ----------- | --------------- | ------------------------------- | -------------------- | -------- | ----------------------------- |
| Display     | `type-display`  | `clamp(2rem, 6vw, 3.25rem)` / 1 | Erode 500            | −0.025em | Page titles: "Archive"        |
| Title       | `type-title`    | 1.75–2.5rem / 1.08              | Erode 600            | −0.02em  | Detail hero title             |
| Heading     | `type-heading`  | 1.125–1.25rem / 1.25            | Erode 600            | −0.01em  | Section headings              |
| Prose       | `type-prose`    | 1.0625rem / 1.55                | Erode 400            | 0        | Descriptions, notes           |
| Label/body  | (default)       | 0.8125–0.875rem / 1.4           | Plex Mono 400–500    | 0        | Buttons, field labels, lists  |
| Caption     | (default)       | 0.75rem / 1.35                  | Plex Mono 400        | 0        | Metadata: year, runtime       |
| Overline    | `type-overline` | 0.6875rem / 1.2                 | Plex Mono 500, UPPER | +0.06em  | Eyebrows: "RECORD", "BOOKING" |
| Code (Doto) | `font-dots`     | 1.25–3.5rem / 1                 | Doto 700–800         | +0.02em  | `GRU` · `21:30`               |

Rules:

- **Tracking depends on size.** Large type tightens, small type opens slightly. Never
  apply one letter-spacing to everything.
- **Leading goes the opposite way from size:** tight on big titles, comfortable on body
  text.
- **Weights never go below 400,** and weight never changes on hover or selection, because
  that shifts the layout.
- **Every number people compare uses `tabular-nums`:** ratings, years, durations, prices,
  counts.
- **Uppercase is for overlines only,** never for titles or paragraphs.
- **Monospace is wide:** keep UI labels short, and let titles (Erode) carry long text.
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

  Paper corners: small, like cut sheets. `--radius` is 6px; Tailwind's scale derives
  from it.

  | Element                                  | Radius                          |
  | ---------------------------------------- | ------------------------------- |
  | Buttons, chips, segmented controls       | `rounded-md` (≈5px)             |
  | Inputs, selects, menus                   | `rounded-lg` / `rounded-xl`     |
  | Posters and covers                       | `rounded-sm`–`rounded-md`       |
  | Cards, tab bar                           | `rounded-xl` (≈8px)             |
  | Sheets, hero cards, boarding passes, LED | `rounded-2xl` (≈11px)           |
  | Avatars, icon buttons, discs             | `rounded-full` (they are round) |

- **Concentric radii:** an inner element's radius equals the outer radius minus the
  padding between them, so nested corners stay parallel.
- **Bento grids** for facts and stats on detail pages: equal gaps, every tile on the
  grid, tiles grouped by meaning.
- **Tap targets are at least 44×44px.** Adjacent list items have no dead space between
  them; grow the padding instead.

## 6. Surfaces and depth

- **Sheets of paper, edge-lit.** Every level has a pale top edge (`edge-highlight`), like
  light catching a sheet. Floating things add one soft shadow (`shadow-float`); in dark
  mode the shadow fades and each level is a lighter surface.
- **Vellum only for floating chrome over content:** the tab bar, sticky headers, and
  controls over hero images (`glass`): `surface` at 64% with
  `backdrop-filter: blur(14px) saturate(115%)`, like tracing paper over the content.
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

| Component         | Style                                                                                                                                                                                                                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary button    | Blue-pencil fill with `on-signal` label, paper corners. One per view                                                                                                                                                                                                                                      |
| Secondary button  | `field` fill with `text` label                                                                                                                                                                                                                                                                            |
| Ghost button      | Text only, `muted`; becomes `text` on hover                                                                                                                                                                                                                                                               |
| Icon button       | Round, 44px touch size, always with `aria-label`                                                                                                                                                                                                                                                          |
| Sizes             | 36px (compact) and 44px (default, touch); press `scale(0.97)`                                                                                                                                                                                                                                             |
| Chips and filters | Paper corners; may carry a count ("In progress 4"). Active = `text` fill with `ink` label. Removable chips end with ×                                                                                                                                                                                     |
| Segmented control | `field` track with a `raised` thumb that slides (ease-in-out token)                                                                                                                                                                                                                                       |
| Tab bar and dock  | Floating vellum bar above the safe area. Active item: blue-pencil icon (filled variant) and label. Desktop dock: one pill per group, 8px apart; icons only (56px circles, named by a tooltip), so a one-item pill is a circle; no top highlight on its pills (on a circle it reads as a thicker top edge) |
| Card              | `surface`, hairline `line` border, `rounded-xl`. Media covers never animate on hover (owner's call); other cards may change background on hover                                                                                                                                                           |
| Detail hero       | Blurred cover as backdrop fading into `ink`; the poster/sleeve as an object; overline for the kind; title; one blue-pencil action                                                                                                                                                                         |
| Sheet             | `ResponsiveSheet`: bottom sheet on mobile, side sheet on desktop; `rounded-2xl` top; grab handle; drawer easing                                                                                                                                                                                           |
| Input             | `field` fill, no border at rest; 2px `signal` focus ring via `box-shadow`, offset 2px; 16px or larger text on touch                                                                                                                                                                                       |
| Rating            | Blue-pencil stars; hover previews on desktop, tap or drag on touch (already built)                                                                                                                                                                                                                        |
| Toast             | Sonner on a `raised` surface; success and error with icons                                                                                                                                                                                                                                                |
| Inline feedback   | A check next to the trigger for success; the field itself highlighted for errors                                                                                                                                                                                                                          |
| Loading           | Skeletons shaped like the content. Spinners only inside buttons                                                                                                                                                                                                                                           |
| Empty state       | One line saying what's missing plus one primary action ("Find something")                                                                                                                                                                                                                                 |

Other rules:

- Disabled buttons have no tooltip.
- Toggles apply immediately; no confirm step.
- Buttons disable while submitting.
- Clicking a label focuses its field.

**Choosing from a list:** up to 8 options, a select. More than that (platforms,
streaming services, genres, airports, aircraft), a searchable combobox. `OptionPicker`
(`components/option-picker.tsx`) makes the switch by itself, and `f.SelectField` uses it.
A select on a narrow toolbar button (sort menus) opens below the button
(`alignItemWithTrigger={false}`); laying the list over the button only lines up in
full-width form fields.

## 8. Media as objects

Each kind looks like the thing it is:

| Kind             | Object treatment                                                                                                                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Movies and shows | The cover alone: 2:3 poster, 10px radius, hairline. No case or frame (owner's call). Heroes use the backdrop image                                                                                                                                         |
| Games            | The cover alone, no case. The hero uses a landscape screenshot behind the title                                                                                                                                                                            |
| Books            | The cover alone, like the other kinds (owner's call)                                                                                                                                                                                                       |
| Records          | Square sleeve. On the detail page, a vinyl disc peeks out from behind the sleeve (static, CSS only)                                                                                                                                                        |
| Flights          | Upcoming/live: amber LED board (Doto, unlit dot grid, countdown; spec in `design-system.md`). Flown: boarding pass with Doto codes and times, paper grain, perforation notches, airline logo. No barcode. Map planes fly each route in the direction flown |

- **Missing covers** show a typed fallback: the kind icon plus the title in Erode on
  `field`. Never a broken image.
- **Future:** a shelf view of spines (the VHS-archive reference) as an alternative library
  layout. It's a rarely used view, so a little delight is allowed there.

## 9. Icons

- Lucide only, stroke width 1.75.
- Sizes 16, 20 and 24px, aligned to the text they sit next to.
- Filled variants only for the active tab.
- Icon-only controls always have an `aria-label`.

## 10. Motion

Easing tokens already exist in `apps/archive/src/styles/app.css`: `--ease-out`,
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
| Page changes             | 180ms crossfade (view transitions) into a page; tab switches are instant                    |
| Grids on first load      | 30–50ms stagger, first load only                                                            |
| Gestures (drag, swipe)   | Springs (motion, bounce 0) that keep the release velocity; slight bounce only after a flick |

Loading (details in `data-fetching.md`): sections suspend into skeletons of their real
size, so nothing shifts. Content that had to wait fades in once (`animate-reveal`,
180ms); cached content renders without animation. Blurred background images fade in on
load (`useImageReveal`) and skip the fade when already decoded, so tab switches never
blink.

Never ship:

- `transition: all`
- an entrance from `scale(0)` (start at 0.95 with opacity 0)
- `ease-in` on UI
- keyframes on toggled or rapidly repeated UI (use transitions, which can be interrupted)
- hover colour transitions
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
- [ ] At most one blue-pencil call to action in the view
- [ ] Dot-matrix text has a plain-text accessible name
- [ ] Checked on a real phone (sticky hover, safe areas, keyboard)

## Where it lives in code

| Piece                                                                                                                                                                    | File                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Color tokens (both themes), fonts                                                                                                                                        | `packages/ui/src/styles/globals.css`                                              |
| Type roles (`type-display`, `type-title`, `type-heading`, `type-prose`, `type-overline`, `font-dots`), `glass`, `edge-highlight`, `shadow-float`, `led-*`, motion tokens | `apps/archive/src/styles/app.css`                                                 |
| Buttons, inputs, toggles                                                                                                                                                 | `packages/ui/src/components/*` (restyled shadcn)                                  |
| Dock (desktop) and tab bar (phones)                                                                                                                                      | `apps/archive/src/components/app-shell.tsx`                                       |
| Covers (record sleeve + vinyl)                                                                                                                                           | `components/poster.tsx`                                                           |
| Flights: map highlight and planes, boarding pass, trip legs, aircraft photos                                                                                             | `components/flights/*`, `routes/flights/*`, `lib/aircraft.ts`, `public/aircraft/` |
