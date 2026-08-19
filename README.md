# The Scaffold · Marketing Command Center, Wick, and The Docket

Real implementation of three tools from the Claude Design handoff, for one operator
(Carter Groff) running marketing for two businesses: **Log & Timber Worx** (LTW, log home
restoration) and **Squeeky Clean** (exterior cleaning). This is a standalone build of just
these three tools, not the full Scaffold suite (no Business Hub, no Scaffold Hub).

## What's here

- **Marketing Command Center** (`public/Marketing Command Center.html`) — campaign log, UTM
  link builder, on-brand content builder, home dashboard for both brands. The four nav
  items marked "later" (Present, Calendar, Connections, Revenue) render against sample data
  by design.
- **Wick** (`public/Wick.html`) — the assistant's own room: a chat interface wired to Claude,
  with tools that read and write the Command Center's data (log a campaign, build a UTM
  link, pull numbers, jump to a screen, search job photos, remember something across
  sessions).
- **The Docket** (`public/The Docket.html`) — a drag-and-drop task board across both brands
  plus personal, fully self-contained (no AI, no shared data with the other two beyond the
  shared visual system).

All three link to each other via their nav and share the same look (`mcc.css`, `parlor.css`
for Wick's room) and mode switch (light/dark).

## Setup

```bash
npm install
cp .env.example .env   # then add ANTHROPIC_API_KEY=sk-ant-...
npm start              # or `npm run dev` to auto-restart on changes
```

Open `http://localhost:3000` (redirects to the Command Center). Every key in `.env` is
optional and independent: leave one blank and only the screen that depends on it falls back
to sample data, with a "Live call failed" or "not configured" pill saying so. Without
`ANTHROPIC_API_KEY` the whole app still works except Wick's replies and the Content
Builder's Generate.

Constant Contact is OAuth rather than a bare key: set the client id and secret, then visit
`/auth/constantcontact/start` once and approve access. Tokens are written to
`server/.constantcontact-tokens.json` (gitignored) and refreshed automatically.

## What's real vs. sample

| Surface | Source | Status |
|---|---|---|
| Wick's replies, Content Builder | Anthropic Messages API via `/api/claude/message` | live |
| Home pace dials (leads vs. goal) | Pipedrive goals | live |
| CallRail channel screen | CallRail v3 calls | live |
| Constant Contact channel screen | Constant Contact v3 (sends/opens/clicks; list health still sample) | live |
| Wick's `find_job_photos` | CompanyCam v2 | live |
| Adwords, Social, Send Jim screens | — | sample |
| Present, Calendar, Connections, Revenue | — | sample |
| Campaigns, links, Docket tasks, Wick's memory | localStorage | local only |

Frontend data still lives in localStorage on purpose, so a later swap to Supabase touches a
handful of read/write helpers rather than any UI logic: `cread`/`lread`/`cwrite`/`lwrite` in
`public/mcc-data.js`, `gread`/`gwrite` in `public/mcc-builder.js`, and the memory helpers in
`public/wick-brain.js`. `wick-schema.sql` holds the Supabase tables for Wick's memory and
sessions, matching those shapes column for column.

The three live integrations that were built without a reachable network fail loudly with the
raw response shape included rather than guessing at a number, so the first run against a
real account will tell you plainly if a field moved: see the notes in `server/pipedrive.js`,
`server/companycam.js` and `server/constantcontact.js`.

## Layout

| Path | What it is |
|---|---|
| `server/index.js` | Express app: serves `public/`, the API routes, the Constant Contact OAuth flow |
| `server/claude.js` | the Anthropic client, the one place the API key is used |
| `server/callrail.js`, `pipedrive.js`, `companycam.js`, `constantcontact.js` | one module per integration, each summarising to the shape its screen renders |
| `public/claude-client.js` | `window.claude.complete`, posting to `/api/claude/message` |
| `public/mcc-core.js` | Home, campaign list and detail, Quick Add, UTM builder, CSV import/export, button wiring |
| `public/mcc-data.js` | seed records and the four persistence helpers |
| `public/mcc-channel.js` | the five channel drill-downs |
| `public/mcc-builder.js` | Content Builder |
| `public/mcc-later.js` | the four screens parked behind locks |
| `public/wick.js` | `<wick-assistant>`, the walk-with-me dock (shadow DOM, fixed to the viewport) |
| `public/wick-brain.js` | system prompt, tool definitions, the client-side tool-use loop, memory |
| `public/mode.js`, `nav-fade.js` | light/dark switch, the dissolve between screens |
| `public/brand/*.md` | the two brand guides, source of truth for all generated copy |
| `wick-schema.sql` | Supabase tables for Wick's memory and sessions |

## How the AI wiring works

`public/claude-client.js` defines `window.claude.complete`, replacing the preview-only global
the design relied on. It posts `{system, messages, tools, max_tokens}` to
`/api/claude/message`, which is the only place the Anthropic API key lives.

Wick's tools read and write the user's own localStorage, so they can't run on the server.
`wickSay()` in `public/wick-brain.js` runs the agentic loop itself: call the model, execute
any `tool_use` blocks locally, send `tool_result`s back, repeat (capped at 6 turns) until
Claude replies with plain text. The one exception is `find_job_photos`, which calls
`/api/companycam/search` because that needs a server-held token.

## Design rules that constrain edits

- **Square edges** (`--r:0px`); nothing is rounded except dots, pills and the brass tube.
- **Hairlines, not cards.** Structure comes from 1px rules and generous space.
- **One accent**, amber. Brand identity is a 6px dot, never chrome color. No emoji.
- Wick's dock is `position:fixed` and must hold the viewport's vertical center while the page
  scrolls: never put a transform, filter or `will-change` on an ancestor. That's also why
  `nav-fade.js` dissolves opacity rather than transforming the body.
- The pace dial is a half-arc whose needle lands exactly where the colored arc stops. Both
  arc caps are square, or the fill overshoots its own ends.
- A campaign cannot be marked *sent* until all three checklist items clear; `checklistDone()`
  is the gate and Home's "Needs attention" rollup lists every campaign failing it.
- Reduced motion turns off all entry animations and the page dissolve.

## Known gaps

- **No auth on `/api/claude/message`.** Anyone who can reach this server can spend your
  Anthropic credits. Worth adding before exposing it beyond your own machine.
- **No Scaffold Hub.** Navigation between the three built tools works; there is no hub page.
- Adwords, Social and Send Jim have no integration yet, and Constant Contact's list-health
  panel is still sample.
- Pipedrive goal lookup matches on the goal titles `2026 LTW count started` and
  `2026 SC count started`. Rename a goal in Pipedrive and the pace dials will say so.
