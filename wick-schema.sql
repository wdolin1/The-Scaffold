-- wick-schema.sql, the tables Wick needs in Supabase. The prototype writes the
-- same shapes into localStorage under the keys named in wick-brain.js, so
-- swapping in these tables means replacing four helpers, not the logic.

-- Distilled understanding, not transcripts. One row per thing worth carrying.
create table wick_memory (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  date          date not null default current_date,
  topic         text not null,                    -- short label: "Bee season timing"
  summary       text not null,                    -- one sentence, months-from-now useful
  related_brand text check (related_brand in ('ltw','sq')),
  kind          text default 'decision'           -- decision | preference | result | pattern | disagreement
                  check (kind in ('decision','preference','result','pattern','disagreement')),
  source        text default 'conversation',
  weight        int  default 1,                   -- bump when a memory keeps proving true
  session_id    uuid references wick_sessions(id) on delete set null
);
create index wick_memory_brand_date on wick_memory (related_brand, date desc);

-- One row per conversation, for pruning and for "what did we talk about in July".
create table wick_sessions (
  id         uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  turns      int default 0,
  headline   text                                  -- written by the close-of-session summariser
);

-- Full log, kept separately so memory stays clean. Prune on a schedule.
create table wick_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references wick_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  tool_calls jsonb                                  -- what he actually did on this turn
);

-- Every action he took, so "who logged this" is answerable later.
create table wick_actions (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id uuid references wick_sessions(id) on delete set null,
  tool       text not null,                         -- log_campaign | generate_utm | draft_proposal | remember
  input      jsonb not null,
  result     text,
  entity     text,                                  -- campaigns.id, links.name, …
  ok         boolean default true
);

-- Extend the Command Center's existing campaign table rather than duplicating it:
-- alter table campaigns add column created_by text default 'carter';  -- 'wick' when he logs it
-- alter table campaigns add column wick_session uuid references wick_sessions(id);
