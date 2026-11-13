# Design system

`packages/ui` is meant to become one design system for every personal app: the site
(guilhermevictor.me), the archive, and future apps (finance first). This doc is the plan
and the inventory. The vibe is still open (see "Vibe" below); `design.md` is the
archive's current identity, and `web-interface-guidelines.md` is the baseline every app
follows whatever the vibe.

## Principles

Our base is **Airbnb's design philosophy and UX thinking**, not its look. The visual
identity stays ours (see "Vibe"). What we take:

### The four system principles

From Airbnb's Design Language System (2016), as quoted by
[principles.design](https://principles.design/examples/airbnb-design-principles) and
[Design Principles FTW](https://www.designprinciplesftw.com/collections/airbnbs-design-principles),
with what each means here:

| Principle          | Airbnb's words                                                                                                          | For us                                                                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unified**        | "Each piece is part of a greater whole … There should be no isolated features or outliers."                             | Every screen is built from `packages/ui` and the shared patterns. A one-off component is a bug: either it becomes a pattern or it goes                              |
| **Universal**      | "Our products and visual language should be welcoming and accessible."                                                  | `web-interface-guidelines.md` is the floor. Two languages on the site (en/pt), `Intl` for every number, date and currency, works with one thumb and with a keyboard |
| **Iconic**         | "We're focused when it comes to both design and functionality. Our work should speak boldly and clearly."               | One job and one primary action per screen. Cut features before adding settings                                                                                      |
| **Conversational** | "Our use of motion breathes life into our products, and allows us to communicate with users in easily understood ways." | Motion explains (where a sheet came from, that a value changed), never decorates. The gate in `design.md` §10 decides                                               |

### How we design a flow

These come from Airbnb's public talks and practice (not from the DLS text above):

- **Storyboard the whole journey, not the screen.** Airbnb storyboarded the guest and
  host trips frame by frame before designing screens. We write each app's journey as
  moments and design for the feeling at each one:
  - Archive: discover → save for later → watch / play / read → log and rate → remember
    (year in review).
  - Flights: planned → countdown → day of (gate, boarding) → flown → kept (the pass in
    the archive). Light before the flight, paper after it.
  - Finance: month starts → money moves (daily) → something looks off → month closes.
- **The 11-star exercise.** For each core flow, describe the 1-star, 5-star and 11-star
  versions, then build the best one that's realistic (usually 7–8). Example, logging a
  movie: 1★ a form with eight required fields; 5★ title search, rating, done; 7★ it's
  already open from the poster, today's date and "where" are prefilled, one tap; 11★ it
  knows you watched it. Build the 7★.
- **Reduce anxiety at every decision.** Say what will happen and that it's reversible
  next to the button ("You can edit this later"). Prefer undo over confirm dialogs. Show
  totals before committing (finance), and local times with the airport for flights.
- **Put the evidence next to the decision.** The facts you need to decide sit beside the
  action: your last rating and watch date next to "Log watch", the previous charges
  next to a recurring payment, the connection time next to a flight leg.
- **Let people be vague.** Optional dates ("Date unknown"), "around 2019", fuzzy search,
  no required fields that aren't truly required.
- **Saving is a first-class, low-commitment action.** Backlog, "want to visit", "watch
  a price": one tap, no form, easy to find again.
- **Search first, details one level down.** The common path is a search or a single
  action; filters and advanced options live in a sheet.

## Layers

| Layer          | What it is                                                                 | Lives in                                 |
| -------------- | -------------------------------------------------------------------------- | ---------------------------------------- |
| Tokens         | Color roles, type scale, spacing, radii, shadows, easing/duration          | `packages/ui/src/styles/globals.css`     |
| Primitives     | Base UI components with our styles (one file each, shadcn layout)          | `packages/ui/src/components/*`           |
| Patterns       | Shared compositions: page header, list row, stat tile, empty state, sheet  | `packages/ui/src/patterns/*` (to create) |
| Blocks         | Whole sections: hero, bento, timeline, data table + filters, settings page | per app until two apps need one          |
| App components | Domain objects: poster, boarding pass, transaction row                     | each app                                 |

Rules:

- **Base UI is the only primitive layer.** Every interactive component starts from
  `@base-ui/react`; no Radix, no Headless UI, no hand-rolled focus traps.
- **Tokens are roles, not values** (`surface`, `muted`, `accent`), so each app can tune
  its own theme on the same components.
- **A component moves to `packages/ui` when a second app needs it,** not before.
- **Showpiece effects (shaders, cursor trails, text effects) are opt-in and local:** only
  on rare, first-time surfaces (site hero, a year-in-review), behind
  `prefers-reduced-motion` and a static fallback. Never in app chrome.
- Align the site's Base UI (`^1.4.1`) with `packages/ui` (`^1.9.0`) when the site moves
  onto it.

## Primitives (Base UI)

| Base UI component | In `packages/ui`  | Site | Archive | Finance | Notes                                          |
| ----------------- | ----------------- | ---- | ------- | ------- | ---------------------------------------------- |
| Button            | ✓ `button`        | ✓    | ✓       | ✓       |                                                |
| Input             | ✓ `input`         |      | ✓       | ✓       | + `input-group` for prefix/suffix              |
| Field / Fieldset  | ✓ `field`         | ✓    | ✓       | ✓       | contact form on the site                       |
| Form              |                   | ✓    | ✓       | ✓       | consolidated errors                            |
| Number Field      |                   |      | ✓       | ✓✓      | amounts, quantities; scrub area                |
| Select            | ✓ `select`        |      | ✓       | ✓       |                                                |
| Combobox          | ✓ `combobox`      |      | ✓       | ✓       | categories, payees, airports                   |
| Autocomplete      |                   | ✓    | ✓       | ✓       | search with suggestions                        |
| Checkbox (+Group) |                   |      | ✓       | ✓       | bulk select, filters                           |
| Radio Group       |                   |      | ✓       | ✓       |                                                |
| Switch            | ✓ `switch`        |      | ✓       | ✓       |                                                |
| Slider            | ✓ `slider`        |      | ✓       | ✓       | budget ranges                                  |
| Toggle / Group    | ✓                 | ✓    | ✓       | ✓       | segmented controls                             |
| Tabs              | ✓ `tabs`          | ✓    | ✓       | ✓       |                                                |
| Toolbar           |                   |      | ✓       | ✓       | list toolbars (sort, filter, view)             |
| Menu              | ✓ `dropdown-menu` | ✓    | ✓       | ✓       |                                                |
| Context Menu      | ✓                 |      | ✓       | ✓       | long-press actions on rows                     |
| Menubar           |                   |      |         | (✓)     | desktop-only power UI                          |
| Navigation Menu   |                   | ✓    |         |         | site header if it grows                        |
| Popover           | ✓ `popover`       | ✓    | ✓       | ✓       |                                                |
| Preview Card      |                   | ✓✓   | ✓       |         | link previews in writing; the music hover card |
| Tooltip           | ✓ `tooltip`       | ✓    | ✓       | ✓       |                                                |
| Dialog            | ✓ `dialog`        |      | ✓       | ✓       |                                                |
| Alert Dialog      |                   |      | ✓       | ✓       | destructive confirms                           |
| Drawer            | ✓ `drawer`        | ✓    | ✓       | ✓       | bottom sheets on phones                        |
| Accordion         |                   | ✓    | ✓       | ✓       | FAQ, grouped settings                          |
| Collapsible       |                   | ✓    | ✓       | ✓       |                                                |
| Scroll Area       |                   | ✓    | ✓       | ✓       | rails, tables                                  |
| Progress          |                   |      | ✓       | ✓       | reading/game progress, imports                 |
| Meter             |                   |      | ✓       | ✓✓      | budget used, savings goal                      |
| Avatar            |                   | ✓    |         | ✓       | payees, accounts                               |
| OTP Field         |                   |      |         | (✓)     | if finance gets a step-up check                |
| Toast             | Sonner today      |      | ✓       | ✓       | decide: keep Sonner or move to Base UI Toast   |

Non-Base-UI pieces already chosen in `design.md` §13: Sonner, cmdk (⌘K), motion
(gestures), NumberFlow (changing numbers), recharts (charts), Virtuoso (long lists),
Cobe (globe).

## Patterns (shared, to build)

Things all three apps need, built once on the primitives:

- **App shell**: phone tab bar + desktop dock/sidebar, safe areas, glass chrome.
- **Page header**: overline, title, actions; large title collapsing into a sticky bar.
- **List row**: leading media, title, meta, trailing value/chevron; swipe actions;
  ≥44px.
- **Grouped list** (iOS settings style) and **section header**.
- **Card** and **bento grid** (fact tiles, stat tiles).
- **Stat tile / KPI**: label, big tabular number (NumberFlow), delta, sparkline.
- **Empty state**, **error state**, **skeletons** of real size.
- **Responsive sheet** (bottom sheet ↔ side sheet), **command menu** (⌘K).
- **Filter bar**: chips with counts + "Filters" sheet; sort menu; view toggle.
- **Date / range picker** (`calendar` exists), month switcher.
- **Inline copy** (check feedback), **keyboard shortcut hint** (`<kbd>`).
- **Charts**: line/area, bar, donut, calendar heatmap, sparkline (one chart theme).
- **Timeline**: dated entries grouped by month/year (logs, writing, transactions).

## Blocks by app

### Site (guilhermevictor.me)

| Block             | Today                    | Ideas / React Bits Pro categories to browse       |
| ----------------- | ------------------------ | ------------------------------------------------- |
| Home intro        | serif name + bio + links | Hero Section, Profile, About; one text effect max |
| Now playing       | Last.fm hover card       | Preview Card; "Album Rail" style cover strip      |
| Records           | Discogs list             | Showcase, Bento; Contact Sheet / Infinite Gallery |
| Writing index     | list                     | Blog                                              |
| Article           | MDX, text reveal, tabs   | prose, footnotes, code blocks, image comparison   |
| Now / uses / work | —                        | Bento, Stats, How It Works (timeline)             |
| Contact / footer  | —                        | Contact, Footer                                   |
| 404               | —                        | 404 (48 options: a good place for one delight)    |

### Archive

| Block                 | Today                      | Ideas / React Bits Pro categories                  |
| --------------------- | -------------------------- | -------------------------------------------------- |
| Home                  | feature cards, next flight | Dashboard, Bento; "considered too simple"          |
| Library grids & rails | poster grid, rails         | List, Cards, Filtering; Album Rail, Reel Gallery   |
| Detail page           | hero + facts + logs        | Showcase; bento facts                              |
| Log sheet / history   | sheet + list               | App Dialog, Forms                                  |
| Search                | field + results            | Command Menu, Filtering                            |
| Stats (to rebuild)    | —                          | Analytics, Stats, calendar heatmap, year-in-review |
| Flights               | map, boarding pass         | Globe, Monitoring (departure-board feel)           |
| Settings              | form                       | Settings Form                                      |

### Finance (future)

| Block                     | Notes                                                        |
| ------------------------- | ------------------------------------------------------------ |
| Overview dashboard        | net worth, month cash flow, KPI tiles, sparkline (Dashboard) |
| Accounts list             | grouped list with balances, institution avatars              |
| Transactions              | Data Table + Filtering, grouped by day, swipe to categorize  |
| Add transaction           | sheet with amount Number Field, category Combobox, date      |
| Budgets                   | Meter per category, month switcher                           |
| Recurring / subscriptions | Scheduling-style calendar, upcoming list                     |
| Reports                   | Analytics: bar by category, area over time, donut            |
| Goals                     | Progress + target date                                       |
| Import (CSV/OFX)          | Wizard + File drop                                           |
| Settings                  | Settings Form; currency, categories                          |

React Bits Pro's **App UI** section (Data: Cards, Data Table, Dashboard, Analytics, List,
Filtering, Empty State; Navigation: App Shell, Command Menu, Mobile; Forms; Overlays) is
the most relevant reference for archive and finance. **Blocks** suits the site.
**Components** (text, backgrounds, 3D, cursors) are showpieces: use them under the
rule above, rebuilt on our tokens and with Base UI when they're interactive.

## Motion resources

[Motion Primitives](https://motion-primitives.com/docs) (open source, MIT; `motion` +
Tailwind, copy-paste like shadcn) is the main open source reference for motion
components; React Bits Pro (above) covers the showpiece effects. Copy the idea or the
code, then make it pass `design.md` §10 and the motion skills (`animate`,
`choreograph`, `gestures`). Triage of its 35 components:

| Verdict                                  | Components                                                                                                                                     | Why                                                                                                                                                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use** (fits the rules as-is or nearly) | Progressive Blur, Image Comparison, Scroll Progress, Transition Panel                                                                          | Scroll-edge blur under glass chrome; before/after in articles; reading progress on long posts; step changes in the finance import wizard                                                                |
| **Use NumberFlow instead**               | Sliding Number, Animated Number                                                                                                                | One number component across apps (see "Numbers" below)                                                                                                                                                  |
| **Rare surfaces only** (delight)         | Text Effect, Text Morph, Text Loop, Text Roll, Text Scramble, Text Shimmer, Spinning Text, Infinite Slider, In View, Morphing Dialog / Popover | Site hero, 404, year-in-review, record showcase. Text Scramble/Roll fit a departure-board flip on flight codes. In View content must be visible at rest. Morphing Dialog only as a view transition idea |
| **Reference only** (keep Base UI)        | Accordion, Dialog, Disclosure, Carousel, Toolbar Dynamic / Expandable, Animated Background                                                     | Base UI already owns the behavior and a11y; animate it with `data-starting-style` CSS transitions. Carousels are native `scroll-snap`. Animated Background = the segmented control's sliding thumb      |
| **Skip**                                 | Dock (magnification), Magnetic, Tilt, Spotlight, Glow Effect, Border Trail, Cursor, Animated Group                                             | Hover and pointer gimmicks on frequent UI, ungated by `(hover: hover)` or with no purpose. At most one, on the site, if a vibe asks for it                                                              |

## Numbers

[NumberFlow](https://number-flow.barvian.me/) (`@number-flow/react`) is the one
component for numbers that change while you look at them. It's dependency-free,
accessible (the value is read as plain text), formats with `Intl.NumberFormat`, and
respects reduced motion by default. Every number, animated or not, uses `tabular-nums`.

Animate a number only when it changes in front of the user and the change means
something:

| Animate                                                       | Don't animate                                                         |
| ------------------------------------------------------------- | --------------------------------------------------------------------- |
| Finance: balance and totals when switching month or account   | Numbers in lists and tables (many at once, scanned, not watched)      |
| Finance: budget % and amount right after adding a transaction | First render and cached data (nothing changed; NumberFlow won't spin) |
| Archive: counters on Stats when changing the year or filter   | Amounts while the user is typing them (`animated={false}`)            |
| Archive: countdown to the next flight (`digits` so 59 → 00)   | Years, dates and ratings (identifiers, not quantities)                |
| Site: a live counter if one exists (scrobbles, records owned) |                                                                       |

Rules:

- **Format through `Intl`, never by hand.** Pass `locales` (`pt-BR` for BRL, the site's
  active locale on the site) and `format` (`{ style: "currency", currency: "BRL" }`,
  `{ notation: "compact" }`, `{ style: "percent" }`). Units go in `suffix` (`/mo`).
- **Related numbers move together:** a value and its delta, or a total and its parts,
  go in one `NumberFlowGroup` so their layout shifts are coordinated.
- **`trend` follows meaning.** Default (direction of the change) for quantities; `trend={0}`
  when up/down isn't the point (switching between unrelated accounts).
- **Keep the default timings** unless the vibe asks otherwise; they sit inside the
  occasional-motion budget in `design.md` §10. No `continuous` plugin on money: passing
  through in-between amounts suggests values that never existed.
- **Leave `respectMotionPreference` on.**
- Doto counters on the archive can use NumberFlow too; the font still needs ≥20px and a
  plain-text accessible name.

## Vibe

### Decided: flights use the LED board

Upcoming and live flight information is an amber LED board (picked from the boarding pass
studies):

- Panel `#0d0b08`, 16px radius, recessed (`inset` shadows), with a grid of unlit dots behind
  the text: `radial-gradient(circle, rgb(255 157 46 / .075) 1px, transparent 1.35px)` at
  5px.
- Codes, times, gate, seat and countdown in Doto 800, amber `#ff9d2e`, glowing with two
  `text-shadow`s (`0 0 6px` at 55%, `0 0 18px` at 22%). Codes 2.6–3.6rem, values ≥1.4rem
  (never under 20px).
- Labels in Archivo condensed (`font-stretch: 80%`), uppercase, tracked, `#8f8170`.
- Green (`#7dff9a`) only for "on time", red only for "delayed"/"cancelled", always with
  the word. Amber is the board itself, not a status.
- The countdown ticks with NumberFlow (`digits` so 59 → 00); nothing else on the board
  animates.
- The glyphs are `aria-hidden`; the board carries one plain sentence for screen readers
  ("Next departure: TP 82 from São Paulo, GRU, to Lisbon, LIS…").

Open: whether flown flights keep the paper boarding pass (`design.md` §8) or also use the
board.

### Overall direction: Vellum (decided 2026-11-12)

Paper and tracing paper, Acme-like plainness, glass as a material, a serif for names and
a grotesk (Switzer) for the interface, one blue pencil. Rules and tokens live in `design.md`
(§3 colour, §4 type, §5 shape, §6 surfaces) and `packages/ui/src/styles/globals.css`.
Flights keep the amber LED board above.

Directions explored before choosing:

1. **Paper & Ink**: the site's warm paper + the archive's dark ink, one orange signal.
2. **Instrument**: the archive's departure-board identity extended to everything.
3. **Gallery**: off-white museum calm, serif display, content as the only color.
4. **Soft Native**: system-feeling, iOS-grouped lists, materials, quiet color.
5. **Hi-Fi**: vintage audio gear; engraved wide labels, amber display window, VU meter.
6. **Index Card**: library catalogue; ruled cards, typewriter metadata, date stamps.
7. **Swiss Grid**: visible 12-column grid, huge numerals, black/white + cobalt.
8. **Riso Zine**: fluorescent pink/blue overprint, halftone, chunky grotesk.
9. **Acme**: Plan 9 editor; pale yellow/cyan, monospace, text commands.
10. **Contact Sheet**: light table, film strips, edge codes, grease-pencil circle.
11. **Liquid Glass**: translucent layers over vivid blur, specular edges.

Font sources: [Fontshare](https://www.fontshare.com/) (free for personal and commercial
use; self-host the woff2), [Google Fonts](https://fonts.google.com/) (via
`@fontsource`), and for discovery [Fonts In Use](https://fontsinuse.com/),
[Free Faces](https://www.freefaces.gallery/) and
[Best Free Fonts](https://bestfreefonts.com/). Check each font's license before
shipping it, and self-host every font (no third-party font CDN at runtime).

Once chosen, record it here and in `design.md` §1, then move the tokens into
`packages/ui`.
