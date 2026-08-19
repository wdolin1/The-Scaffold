# Handoff: Marketing Command Center (with Wick and The Docket)

## Scope

Three screens for one operator, Carter Groff, who runs marketing for two businesses:
**Log & Timber Worx** (LTW, log home restoration) and **Squeeky Clean** (exterior cleaning).

1. **Marketing Command Center** — campaign tracking. Leads vs. goal, cost per conversion,
   velocity, lead source attribution, spend, average deal value; a campaign log with detail
   and a pre-send checklist; a UTM link builder; a Content Builder that generates on-brand
   email / social / postcard pieces.
2. **Wick** — a personal assistant with his own room. A brass tube on the right is his
   presence; he also rides along the Command Center as a dock. Persistent memory, tool use.
3. **The Docket** — a task board where priority is decided by *placement* in one of four
   quadrant columns (Now, Chores, Plan it, Someday).

Nothing else from The Scaffold is in scope here. The Business ring, the website backend and
the hub are separate tools and are deliberately not part of this bundle.

## About these files

**They are design references written in HTML, not production code.** They show intended look
and behavior. Recreate them in the target codebase using its own patterns, routing and data
layer. If no codebase exists yet, pick the framework that fits and implement there.

Two things *are* meant to be used close to as-is:
- `wick-schema.sql` — Supabase tables for Wick's memory and sessions. Create these,
  adjusting naming to match existing conventions.
- `brand/*.md` — the two brand guides. Source of truth for all generated copy and
  collateral. Load them; do not paraphrase them into a prompt.

## Fidelity

High. Colors, type, spacing and interactions are final. Every token below is exact, taken
from `parlor.css` and `mcc.css`.

---

## Design tokens

### Command Center (`mcc.css`) — dark, the default

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#1a120b` | page ground |
| `--surface` / `--surface-2` / `--surface-3` | `#20160e` / `#271a10` / `#2f2013` | panels, sheets |
| `--field` | `rgba(0,0,0,.32)` | input ground |
| `--line` / `--line-2` | `rgba(236,217,178,.13)` / `.26` | hairlines |
| `--text` → `--text-4` | `#ecd9b2` `#c9b48a` `#9c8a68` `#8b7a5c` | type ramp |
| `--accent` / `--accent-lit` | `#d99a3d` / `#f5cd6a` | the one accent |
| `--warn` / `--danger` | `#c9922f` / `#b8643f` | pills, flags |
| `--ltw` / `--sq` | `#b8643f` / `#8e9462` | brand dots, arcs, bars |

### Command Center — light (`html.lit`)

`--bg:#e7e0d1`, surfaces `#eee8db` `#f3eee2` `#e2dbc9`, lines `rgba(42,33,24,.15/.3)`,
type `#2a2118` `#403528` `#574c3d` `#6b5e4c`, accent `#7d5c1d`/`#6d5019`,
warn `#75500c`, danger `#963c1c`, brands `--ltw:#963c1c` `--sq:#6f7548`.

### Wick's room and shared chrome (`parlor.css`)

`--bg:#1a120b`, `--bg-soft:#221710`, `--bg-deep:#0f0a06`, `--bg-warm:#2a1c11`,
`--ink:#ecd9b2`, `--ink-soft:#c9b48a`, `--ink-mute:#9c8a68`, `--ink-dim:#8b7a5c`,
`--amber:#d99a3d`, `--amber-lit:#f5cd6a`, `--rule:rgba(236,217,178,.16)`.
Light mode swaps to plaster: `--bg:#e7e0d1`, ink `#2a2118`, amber `#7d5c1d`.

### Type

- Display: **Cormorant Garamond** (`--display`) — headings, big numbers.
- Body: **Spectral** (`--sans` / `--body`) — prose, table cells.
- UI: **Karla** (`--ui`, also `--mono`) — labels, buttons, all-caps micro type at
  9–10.5px with .2–.24em letter-spacing.

### Rules of the house

- **Square edges.** `--r:0px`; nothing is rounded except dots, pills and the brass tube.
- **Hairlines, not cards.** Structure comes from 1px rules and generous space.
- **One accent.** Amber. Brand identity is carried by a 6px dot, never by chrome color.
- Minimum hit target 44px. No emoji.

---

## Files

| File | What it is |
|---|---|
| `Marketing Command Center.html` | the shell: header, nav, screen router, URL state, brand toggle, light/dark switch |
| `mcc-core.js` | Home, campaign list, campaign detail, Quick Add sheet, UTM builder, CSV import/export, all the button wiring |
| `mcc-data.js` | stand-in records + the four persistence helpers (`cread`/`lread`/`cwrite`/`lwrite`) |
| `mcc-channel.js` | the five channel drill-downs (Adwords, Social, CallRail, Send Jim, Constant Contact) |
| `mcc-builder.js` | Content Builder: generates a piece per brand guide, saves to shared history |
| `mcc-later.js` | screens parked behind locks: Present, Calendar, Connections, Revenue |
| `mcc.css` | the Command Center's tokens and primitives |
| `Wick.html` | his room: thread, memory drawer, quick capture |
| `wick.js` | `<wick-assistant>`, the walk-with-me dock (shadow DOM, fixed to the viewport) |
| `wick-brain.js` | system prompt, tool definitions, memory read/write |
| `wick-schema.sql` | Supabase tables for memory and sessions |
| `The Docket.html` | the four-column task board, drag to rank and to move columns |
| `parlor.css` | shared palette and primitives for the room chrome |
| `mode.js` | `<mode-switch>`, light/dark, persisted |
| `nav-fade.js` | the opacity dissolve between the three screens (never transform: a transformed body would break Wick's fixed dock) |
| `brand/*.md` | the two brand guides |
| `assets/` | antler mark and the two brand logos |

## Data model

Everything reads from four localStorage-shaped tables. Swapping the helpers in
`mcc-data.js` (`cread`, `lread`, `cwrite`, `lwrite`) and `gread`/`gwrite` in
`mcc-builder.js` for real queries is the only change needed to go live.

| Data | Key | Becomes |
|---|---|---|
| Campaigns | `cg_mcc_campaigns` | campaigns table |
| UTM links | `cg_mcc_links` | links table |
| Generated content | `cg_generated` | one shared store, read by both the Builder and Wick |
| Wick memory / sessions | `wick_memory`, `wick_sessions` | see `wick-schema.sql` |
| Docket tasks | `cg_docket` | tasks table |
| Light / dark | `cg_mode` | user preference |

A stored list **replaces** the seed rows rather than stacking on them, so saves survive a
refresh. `normalizeCampaign()` is the one place a row gets defaults and its checklist.

### Campaign shape

```
id, brand ('ltw'|'sq'), date (YYYY-MM-DD), channel, type, name, audience,
qty, cost, attribution, utm, leads, status ('sent'|'draft'|'flagged'),
checklist { cost, attr, qty }, notes, creative
// direct mail only: pieces, cpp, postage, listCost, mailHouse
```

A campaign cannot be marked *sent* until all three checklist items clear. `checklistDone()`
is the gate, and Home's "Needs attention" rollup lists every campaign failing it, across
both brands, hiding itself entirely when the list is clean.

### Link shape

```
name (brand-yymm-slug), brand, channel, date, url
```

The naming convention is enforced by the builder. The yymm stamp comes from the builder's
date field, so links can be backdated. Links save with or without a campaign attached;
attaching one also sets that campaign's `utm` and `attribution` and clears its attr
checklist item.

## Live data, later

Nothing is wired to a real source yet. Intended sources: **Pipedrive** (leads, deal value,
goals, the spine of attribution), **CallRail** (tracked numbers per campaign),
**Constant Contact** (sends, opens, clicks), **Send Jim** (mail drops, piece counts, cost),
**Google Ads** and **Meta** (spend, conversions). Home's metrics in `mcc-data.js`
(`HOME_METRICS`) are plausible stand-ins shaped like what those APIs return.

## URL state

`?screen=` plus `brand`, `id` (detail), `ch` (channel), `fch`/`ftype` (list filters),
`sheet`, `state`. Every screen is linkable; Wick's deep links depend on it.
Wick's room reads `?from=mcc` / `?from=docket` to decide where its exit goes.

## Notes for the build

- Wick's dock is `position:fixed` and must hold the viewport's vertical center while the
  page scrolls. Never put a transform, filter or `will-change` on an ancestor.
- The pace dial is a half-arc with a needle that lands exactly where the colored arc stops.
  Both arc caps are square, or the fill overshoots its own ends.
- Quick Add saves on three fields; everything else is optional and fillable later.
- CSV import validates per row, previews, and skips bad rows rather than failing the file.
- Reduced motion: all entry animations and the page dissolve turn off.
