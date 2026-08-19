/* mcc-core.js, the screens I use daily: Home, Campaign List, Campaign Detail,
   Quick-Add, UTM Builder. Mobile-first markup; CSS in the shell widens them. */
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const bdot = b => `<span class="dot ${b}"></span>`;
const btag = b => `<span class="tag">${bdot(b)}${BRANDS[b].short}</span>`;
const statusPill = c => c.status === 'draft' ? '<span class="pill mute">Draft</span>'
  : checklistDone(c) ? '<span class="pill ok">Tracked</span>' : '<span class="pill bad">Missing info</span>';

/* ── Home ─────────────────────────────────────────────────────────── */
const trend = (now, prev, lowerIsBetter) => {
  if (prev == null) return '';
  const d = now - prev, pct = Math.round(Math.abs(d) / prev * 100);
  const arrow = d < 0 ? '↓' : '↑';
  if (!pct) return '<span class="delta flat">flat</span>';
  if (lowerIsBetter == null) return `<span class="delta flat">${arrow} ${pct}%</span>`;
  const good = lowerIsBetter ? d < 0 : d > 0;
  return `<span class="delta ${good ? 'up' : 'down'}">${arrow} ${pct}%</span>`;
};
/* A half-dial: track, the arc drawn to leads/goal from the very left end, and a
   needle landing exactly where that arc stops. Pace lives in the line of type
   under it, not as a second mark on the face. */
function dial(b, zero) {
  const B = BRANDS[b], leads = zero ? 0 : B.leads, hasGoal = B.goal != null;
  const frac = hasGoal ? Math.min(leads / B.goal, 1) : 0;
  const pace = HOME_METRICS.monthElapsed;
  const R = 68, C = Math.PI * R, ang = t => Math.PI * (1 - t);
  const at = (t, r) => ({ x: 84 + r * Math.cos(ang(t)), y: 80 - r * Math.sin(ang(t)) });
  const tip = at(frac, R - 4), hub = { x:84, y:80 };
  const ahead = hasGoal && frac >= pace;
  return `<div class="dial">
    <svg viewBox="0 0 168 94" width="100%" height="auto" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <path d="M16 80a68 68 0 01136 0" fill="none" stroke="var(--line-2)" stroke-width="9" stroke-linecap="butt"/>
      ${hasGoal && frac > 0 ? `<path d="M16 80a68 68 0 01136 0" fill="none" stroke="var(--${b})" stroke-width="9" stroke-linecap="butt"
        stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - frac)).toFixed(1)}"/>` : ''}
      ${hasGoal ? `<line x1="${hub.x}" y1="${hub.y}" x2="${tip.x.toFixed(1)}" y2="${tip.y.toFixed(1)}" stroke="var(--text)" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="${hub.x}" cy="${hub.y}" r="3" fill="var(--text)"/>` : ''}
    </svg>
    <div class="dialnum mono">${leads}<span>/${hasGoal ? B.goal : '·'}</span></div>
    <div class="row" style="gap:7px;justify-content:center">${bdot(b)}<span class="lbl">${esc(B.short)}</span></div>
    ${hasGoal ? `<div class="dialpace ${ahead ? 'ok' : 'warn'}">${Math.round(frac / pace * 100)}% of pace</div>`
      : `<div class="dialpace">No goal in Pipedrive</div>`}
  </div>`;
}
/* ── Pipedrive: live leads-started-vs-goal, replacing the sample numbers once
   fetched. BRANDS.sq._staticGoal is the "real" goal to fall back to once the
   ?state=nogoal demo toggle (see the page's inline script) is turned back off,
   so a live value has to update that alongside BRANDS.sq.goal itself. ────── */
let PIPEDRIVE_LIVE = { status: 'idle', error: null };
async function loadPipedriveLive() {
  if (PIPEDRIVE_LIVE.status === 'loading') return;
  PIPEDRIVE_LIVE = { status: 'loading', error: null };
  try {
    const res = await fetch('/api/pipedrive/pace');
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || `Pipedrive request failed (${res.status})`);
    BRANDS.ltw.goal = body.ltw.target; BRANDS.ltw.leads = body.ltw.actual; BRANDS.ltw.goalSynced = 'just now';
    BRANDS.sq.goal = body.sq.target; BRANDS.sq._staticGoal = body.sq.target; BRANDS.sq.leads = body.sq.actual; BRANDS.sq.goalSynced = 'just now';
    PIPEDRIVE_LIVE = { status: 'ready', error: null };
  } catch (e) {
    PIPEDRIVE_LIVE = { status: 'error', error: e.message };
  }
  rerenderMCC();
}
function tilePace(s, zero) {
  const brands = s.brand === 'both' ? ['ltw','sq'] : [s.brand];
  if (PIPEDRIVE_LIVE.status === 'idle') loadPipedriveLive();
  const pill = PIPEDRIVE_LIVE.status === 'ready' ? '<span class="pill ok">Live</span>'
    : PIPEDRIVE_LIVE.status === 'loading' ? '<span class="pill mute">Live · loading…</span>'
    : PIPEDRIVE_LIVE.status === 'error' ? `<span class="pill bad" title="${esc(PIPEDRIVE_LIVE.error)}">Live call failed</span>` : '';
  return `<section class="tile t-pace">
    <div class="tilehead"><h2 class="h2">Leads started vs. goal</h2><span class="lbl">Pipedrive · ${esc(HOME_METRICS.monthLabel)}</span>${pill}</div>
    <div class="dials">${brands.map(b => dial(b, zero)).join('')}</div>
    <div class="pacefoot"><span class="lbl">${Math.round(HOME_METRICS.monthElapsed * 100)}% of the month gone · ${HOME_METRICS.daysLeft} days left</span></div>
  </section>`;
}
function tileCost() {
  const m = HOME_METRICS.costPerConv, max = Math.max(...m.rows.map(r => r[1]));
  return `<section class="tile">
    <div class="tilehead"><h2 class="h2">Cost per conversion</h2><span class="lbl">Adwords</span></div>
    <div class="bigline"><span class="big mono">${money(m.value)}</span>${trend(m.value, m.prev, true)}</div>
    <div class="lbl">Blended, all live campaigns</div>
    <div class="minirows">${m.rows.map(([n, v, b]) => `<div class="minirow">
      <div class="row" style="gap:7px;min-width:0">${bdot(b)}<span class="mtxt">${esc(n)}</span></div>
      <span class="mono mval">${money(v)}</span>
      <div class="bar" style="height:2px;grid-column:1/-1"><i class="${b}" style="width:${v / max * 100}%"></i></div>
    </div>`).join('')}</div>
  </section>`;
}
function tileVelocity() {
  const v = HOME_METRICS.velocity;
  return `<section class="tile">
    <div class="tilehead"><h2 class="h2">Velocity out of Stage 42</h2><span class="lbl">Photos received</span></div>
    <div class="bigline"><span class="big mono">${v.days}<em>d</em></span>${trend(v.days, v.prev, true)}</div>
    <div class="lbl">Average time to leave the stage</div>
    <div class="vrows">
      <div class="vrow"><span class="lbl">In stage now</span><span class="mono">${v.inStage}</span></div>
      <div class="vrow"><span class="lbl">Oldest sitting</span><span class="mono">${v.oldest}d</span></div>
      <div class="vrow"><span class="lbl">Last month</span><span class="mono">${v.prev}d</span></div>
    </div>
    <div class="tilefoot"><span class="sub">Photos in hand is the strongest interest signal there is, so moving out of 42 fast matters more than raw lead count.</span></div>
  </section>`;
}
function sourceList(rows, total) {
  const max = Math.max(...rows.map(r => r[1]));
  return rows.map(([n, v]) => {
    const notSet = /not set/i.test(n);
    return `<div class="srow${notSet ? ' notset' : ''}">
      <span class="stxt">${esc(n)}</span>
      <div class="bar" style="height:4px"><i style="width:${v / max * 100}%${notSet ? ';background:var(--warn)' : ''}"></i></div>
      <span class="mono sval">${Math.round(v / total * 100)}%</span>
    </div>`;
  }).join('');
}
function tileSource() {
  const m = HOME_METRICS.source;
  const sum = rows => rows.reduce((a, r) => a + r[1], 0);
  const notSet = rows => (rows.find(r => /not set/i.test(r[0])) || [,0])[1] / sum(rows);
  const worst = Math.max(notSet(m.reported), notSet(m.analytics));
  const shown = Math.round(worst * 100), target = Math.round(m.notSetTarget * 100);
  const over = shown > target;
  return `<section class="tile t-source">
    <div class="tilehead"><h2 class="h2">Lead source</h2>
      <span class="pill ${over ? 'bad' : 'ok'}">Not set ${shown}% · target under ${target}%</span></div>
    ${over ? `<p class="sub warnline">Attribution is leaking. Every point above ${target}% is spend you cannot defend at renewal time.</p>` : ''}
    <div class="srcgrid">
      <div><div class="lbl srchead">Self reported <span>Pipedrive field</span></div>${sourceList(m.reported, sum(m.reported))}</div>
      <div><div class="lbl srchead">Analytics <span>UTM</span></div>${sourceList(m.analytics, sum(m.analytics))}</div>
    </div>
    <div class="tilefoot"><span class="sub">Where the two columns disagree is usually a channel getting credit it did not earn.</span>
      <button class="btn quiet sm" data-go="links">Check the links →</button></div>
  </section>`;
}
function tileSpend() {
  const m = HOME_METRICS.spend, max = Math.max(...m.byChannel.map(r => r[1]));
  return `<section class="tile">
    <div class="tilehead"><h2 class="h2">Total spend</h2><span class="lbl">All channels</span></div>
    <div class="bigline"><span class="big mono">${money(m.total)}</span>${trend(m.total, m.prev, null)}</div>
    <div class="lbl">Month to date</div>
    <div class="minirows">${m.byChannel.map(([n, v]) => `<div class="minirow plain">
      <span class="mtxt">${esc(n)}</span><span class="mono mval">${money(v)}</span>
      <div class="bar" style="height:2px;grid-column:1/-1"><i style="width:${v / max * 100}%"></i></div>
    </div>`).join('')}</div>
  </section>`;
}
function tileDeal() {
  const m = HOME_METRICS.dealValue;
  return `<section class="tile t-deal">
    <div class="tilehead"><h2 class="h2">Average deal value</h2><span class="lbl">Closed won</span></div>
    <div class="bigline"><span class="big mono">${money(m.value)}</span>${trend(m.value, m.prev, false)}</div>
    <div class="lbl">Across ${m.closed} closed deals this month</div>
    <div class="vrows">
      <div class="vrow"><span class="lbl">Last month</span><span class="mono">${money(m.prev)}</span></div>
      <div class="vrow"><span class="lbl">Spend per deal</span><span class="mono">${money(Math.round(HOME_METRICS.spend.total / m.closed))}</span></div>
    </div>
  </section>`;
}
/* Channel drill-downs, specific to Home. Not app navigation. */
function channelRail(s) {
  return `<aside class="rail">
    <div class="lbl railhead">Channels</div>
    <div class="railwrap">
      ${HOME_METRICS.channels.map(ch => `<button class="railrow${s.chan === ch.key && s.screen === 'channel' ? ' on' : ''}" data-channel="${ch.key}">
        <span class="rtxt">${esc(ch.name)}</span><span class="rmeta">${esc(ch.metric)}</span><span class="rarrow">→</span>
      </button>`).join('')}
    </div>
  </aside>`;
}
function recentRow(c) {
  return `<button class="reclist" data-go="detail" data-id="${c.id}">
    <div class="between"><div class="row" style="gap:8px">${bdot(c.brand)}<span style="font-size:13.5px;font-weight:500">${esc(c.name)}</span></div>${statusPill(c)}</div>
    <div class="row" style="gap:14px;margin-top:6px"><span class="sub mono">${fmtDate(c.date)}</span><span class="sub">${esc(c.channel)}</span><span class="sub mono">${c.cost == null ? '·' : money(c.cost)}</span><span class="sub mono">${c.leads} leads</span></div>
  </button>`;
}
/* Every campaign, either brand, failing its pre-send checklist. */
function tileAttention() {
  const rows = CAMPAIGNS.filter(c => !checklistDone(c));
  if (!rows.length) return '';
  const missing = c => [[!c.checklist.cost, 'cost'], [!c.checklist.attr, 'attribution'], [!c.checklist.qty, 'quantity']].filter(x => x[0]).map(x => x[1]).join(', ');
  return `<section class="tile" style="grid-column:1/-1">
    <div class="tilehead"><h2 class="h2">Needs attention</h2><span class="pill bad">${rows.length} incomplete</span></div>
    <div class="reclistwrap">${rows.map(c => `<button class="reclist" data-go="detail" data-id="${c.id}">
      <div class="between"><div class="row" style="gap:8px">${bdot(c.brand)}<span style="font-size:13.5px;font-weight:500">${esc(c.name)}</span></div>${statusPill(c)}</div>
      <div class="row" style="gap:14px;margin-top:6px"><span class="sub mono">${fmtDate(c.date)}</span><span class="sub">${esc(c.channel)}</span><span class="sub" style="color:var(--warn)">Missing ${missing(c)}</span></div>
    </button>`).join('')}</div>
  </section>`;
}
function screenHome(s) {
  const zero = s.state === 'zero';
  return `<div class="homewrap">
    ${channelRail(s)}
    <div class="homemain">
      <div class="hgrid">
        ${tileAttention()}
        ${tilePace(s, zero)}${tileCost()}${tileVelocity()}
        ${tileSource()}${tileSpend()}${tileDeal()}
      </div>
    </div>
  </div>`;
}

/* ── Campaign list ────────────────────────────────────────────────── */
function screenCampaigns(s) {
  if (s.state === 'empty') return emptyState();
  const rows = inBrand(CAMPAIGNS, s.brand).filter(c => (!s.ch || c.channel === s.ch) && (!s.type || c.type === s.type));
  return `<div class="stack">
    <div class="filters">
      <select class="select" data-filter="ch"><option value="">All channels</option>${CHANNELS.map(c => `<option ${s.ch === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <select class="select" data-filter="type"><option value="">All types</option>${TYPES.map(c => `<option ${s.type === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <select class="select"><option>This month</option><option>Last 30 days</option><option>Quarter to date</option><option>Year to date</option><option>Custom range…</option></select>
      <span class="lbl" style="margin-left:auto;white-space:nowrap">${rows.length} campaigns · ${money(rows.reduce((a,c) => a + (c.cost || 0), 0))} spent</span>
      <button class="btn ghost sm" data-act="import-campaigns">Import CSV</button>
      <button class="btn ghost sm" data-act="export-campaigns">Export CSV</button>
    </div>
    <div class="card scroll-x desktop-only">
      <table><thead><tr><th>Date</th><th>Brand</th><th>Campaign</th><th>Channel</th><th>Type</th><th>Cost</th><th>Qty</th><th>Leads</th><th>Status</th></tr></thead>
      <tbody>${rows.map(c => `<tr data-go="detail" data-id="${c.id}">
        <td class="mono" style="color:var(--text-2)">${fmtDate(c.date)}</td><td>${bdot(c.brand)}</td>
        <td style="font-weight:500">${esc(c.name)}</td><td style="color:var(--text-2)">${esc(c.channel)}</td>
        <td><span class="tag">${esc(c.type)}</span></td><td class="mono">${c.cost == null ? '·' : money(c.cost)}</td>
        <td class="mono" style="color:var(--text-2)">${c.qty == null ? '·' : c.qty.toLocaleString()}</td>
        <td class="mono">${c.leads || '·'}</td><td>${statusPill(c)}</td></tr>`).join('')}</tbody></table>
    </div>
    <div class="mobile-only reclistwrap card">${rows.map(recentRow).join('')}</div>
  </div>`;
}
function emptyState() {
  return `<div class="card pad empty">
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="1.3"><path d="M3 6h18M3 12h18M3 18h11"/></svg>
    <h2 class="h1" style="margin-top:16px">Nothing logged yet</h2>
    <p class="sub" style="max-width:340px;margin:8px auto 0">The first campaign you log sets the baseline. Thirty seconds now beats reconstructing it in November.</p>
    <div class="row" style="justify-content:center;gap:10px;margin-top:20px;flex-wrap:wrap">
      <button class="btn" data-sheet="quickadd">Log a campaign</button>
      <button class="btn ghost" data-go="links">Build a UTM link first</button>
    </div>
  </div>`;
}

/* ── Campaign detail ──────────────────────────────────────────────── */
const field = (l, v, mono) => `<div class="fld"><div class="lbl">${l}</div><div ${mono ? 'class="mono"' : ''} style="margin-top:5px;font-size:14.5px">${v == null || v === '' ? '<span style="color:var(--text-3)">·</span>' : v}</div></div>`;
function screenDetail(s) {
  const c = CAMPAIGNS.find(x => x.id === s.id) || CAMPAIGNS[0];
  const done = checklistDone(c), items = [['cost','Cost entered'],['attr','Attribution mechanism assigned'],['qty','Audience quantity logged']];
  return `<div class="stack">
    <div class="between detailhead">
      <div>
        <button class="btn quiet sm" data-go="campaigns" style="margin-left:-12px">← All campaigns</button>
        <h1 class="h1" style="font-size:24px;margin-top:6px">${esc(c.name)}</h1>
        <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">${btag(c.brand)}<span class="tag">${esc(c.channel)}</span><span class="tag">${esc(c.type)}</span><span class="tag mono">${fmtDate(c.date)}</span></div>
      </div>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <button class="btn ghost" data-act="edit-campaign" data-id="${c.id}">Edit</button>
        <button class="btn" data-act="clone-campaign" data-id="${c.id}">Clone this campaign</button>
      </div>
    </div>
    ${done ? '' : `<div class="flagbox slim"><b>Checklist incomplete.</b> This campaign can't be marked <em>Sent</em> until every item below is cleared.</div>`}
    <div class="cols">
      <div class="stack">
        <section class="card"><div class="pad" style="border-bottom:1px solid var(--line)"><h2 class="h2">The record</h2></div>
          <div class="pad fldgrid">
            ${field('Date', fmtDate(c.date), 1)}${field('Brand', esc(BRANDS[c.brand].name))}
            ${field('Channel', esc(c.channel))}${field('Campaign type', esc(c.type))}
            ${field('Audience', esc(c.audience))}${field('Quantity', c.qty == null ? null : c.qty.toLocaleString(), 1)}
            ${field('Total cost', c.cost == null ? null : money(c.cost), 1)}${field('Cost per lead', c.leads && c.cost ? money(Math.round(c.cost / c.leads)) : null, 1)}
            ${field('Creative reference', c.creative ? `<a href="#">${esc(c.creative)}</a>` : null)}
          </div>
          ${c.channel === 'Direct Mail' ? `<div class="pad mailblock">
            <div class="lbl" style="margin-bottom:16px">Piece economics · direct mail only</div>
            <div class="fldgrid">${field('Piece count', c.pieces == null ? null : c.pieces.toLocaleString(), 1)}${field('Print / piece', c.cpp == null ? null : '$' + c.cpp.toFixed(2), 1)}${field('Postage / piece', c.postage == null ? null : '$' + c.postage.toFixed(2), 1)}${field('List + mail house', c.listCost == null ? null : money(c.listCost) + ' · ' + esc(c.mailHouse || 'TBD'), 1)}</div>
          </div>` : ''}
          <div class="pad" style="border-top:1px solid var(--line)">${field('Notes / post-mortem', c.notes ? esc(c.notes) : null)}</div>
        </section>
        ${(() => { const L = leadsFor(c); const won = L.filter(l => l.stage === 'Won');
          return `<section class="card"><div class="pad between" style="border-bottom:1px solid var(--line)"><h2 class="h2">Linked leads</h2>
            <span class="lbl">${L.length ? L.length + ' from Pipedrive' : 'None yet'}</span></div>
          ${L.length ? `<div class="scroll-x"><table><thead><tr><th>Lead</th><th>Stage</th><th>Value</th><th>Created</th></tr></thead>
            <tbody>${L.map(l => `<tr><td style="color:var(--text)">${esc(l.name)}</td>
              <td><span class="pill ${l.stage === 'Won' ? 'ok' : l.stage === 'Lost' ? 'bad' : 'mute'}">${esc(l.stage)}</span></td>
              <td class="mono">${money(l.value)}</td><td class="mono" style="color:var(--text-3)">${fmtDate(l.date)}</td></tr>`).join('')}</tbody></table></div>
            <div class="pad between" style="border-top:1px solid var(--line)"><span class="lbl">${won.length} won</span>
              <span class="mono" style="font-family:var(--display);font-size:22px">${money(won.reduce((a,l) => a + l.value, 0))}</span></div>`
            : `<div class="pad empty" style="padding:34px 18px"><p class="sub" style="max-width:330px;margin:0 auto">Nothing attributed to this campaign yet. Leads appear here as they come in carrying its UTM, tracked number, or promo code.</p></div>`}
          </section>`; })()}
      </div>
      <div class="stack">
        <section class="card"><div class="pad" style="border-bottom:1px solid var(--line)"><h2 class="h2">Pre-send checklist</h2></div>
          <div class="pad" style="display:flex;flex-direction:column;gap:2px">
            ${items.map(([k, label]) => `<div class="chk ${c.checklist[k] ? 'on' : 'off'}">
              <span class="box">${c.checklist[k] ? '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M1.5 6.5l3 3 6-7"/></svg>' : ''}</span>
              <span>${label}</span>${c.checklist[k] ? '' : '<span class="pill bad" style="margin-left:auto">Needed</span>'}</div>`).join('')}
          </div>
          <div class="pad" style="border-top:1px solid var(--line)">
            ${(() => { const sent = c.status === 'sent', can = done && !sent;
              return `<button class="btn" data-act="mark-sent" data-id="${c.id}" style="width:100%${can ? '' : ';opacity:.45;cursor:not-allowed'}"${can ? '' : ' disabled'}>${sent ? 'Marked as sent' : 'Mark as sent'}</button>`; })()}
          </div>
        </section>
        <section class="card"><div class="pad" style="border-bottom:1px solid var(--line)"><h2 class="h2">Attribution mechanism</h2></div>
          <div class="pad">
            ${c.attribution ? `<div class="attr">${esc(c.attribution)}</div>` : `<div class="attr missing">Nothing assigned, leads from this send can't be traced back</div>`}
            ${c.utm ? `<div class="urlbox mono">${esc(c.utm)}</div>` : ''}
            <div class="row" style="gap:8px;margin-top:14px;flex-wrap:wrap">
              <button class="btn ghost sm" data-go="links">${c.attribution ? 'Build another link' : 'Assign a mechanism'}</button>
              ${c.utm ? '<button class="btn ghost sm" data-act="copy-url">Copy link</button>' : ''}
            </div>
          </div>
        </section>
        <section class="card"><div class="pad" style="border-bottom:1px solid var(--line)"><h2 class="h2">Result</h2></div>
          ${(() => { const rev = closedFor(c), ret = c.cost ? (rev / c.cost) : null;
            return `<div class="pad fldgrid">${field('Leads attributed', c.leads || '0', 1)}${field('Closed revenue', rev ? money(rev) : null, 1)}${field('Return on spend', ret ? ret.toFixed(1) + '\u00D7' : null, 1)}</div>`; })()}
        </section>
      </div>
    </div>
  </div>`;
}

/* ── Quick-add ────────────────────────────────────────────────────── */
function sheetQuickAdd(s) {
  const editing = window.QA_EDIT ? CAMPAIGNS.find(c => c.id === window.QA_EDIT) : null;
  const c = editing || {};
  const brand = c.brand || (s.brand === 'both' ? 'ltw' : s.brand);
  const opt = (list, v) => list.map(x => '<option' + (x === v ? ' selected' : '') + '>' + x + '</option>').join('');
  return `<div class="sheet" role="dialog" aria-modal="true" aria-label="${editing ? 'Edit campaign' : 'Log a campaign'}">
    <div class="sheethead between"><div><h2 class="h1">${editing ? 'Edit campaign' : 'Log a campaign'}</h2><p class="sub" style="margin-top:3px">${editing ? 'Changes save to the record you came from.' : 'Three fields saves it. The rest can wait.'}</p></div>
      <button class="btn quiet" data-sheet="">Close</button></div>
    <div class="sheetbody">
      <div class="req">
        <div class="lbl" style="color:var(--accent)">Required</div>
        <div class="qgrid" style="margin-top:12px">
          <div><div class="lbl">Brand</div><div class="seg" style="margin-top:7px;width:100%">
            <button data-qa-brand="ltw" aria-pressed="${brand === 'ltw'}" style="flex:1"><span class="dot ltw"></span>LTW</button><button data-qa-brand="sq" aria-pressed="${brand === 'sq'}" style="flex:1"><span class="dot sq"></span>Squeeky</button></div></div>
          <div><div class="lbl">Channel</div><select class="select" id="qa-ch" style="margin-top:7px">${opt(CHANNELS, c.channel)}</select></div>
          <div><div class="lbl">Date sent</div><input class="input" id="qa-date" type="date" value="${c.date || today()}" style="margin-top:7px"></div>
        </div>
      </div>
      <div class="opt">
        <div class="between"><div class="lbl">Fill now or later</div><span class="pill mute">Optional</span></div>
        <div class="qgrid" style="margin-top:12px">
          <div><div class="lbl">Campaign name</div><input class="input" id="qa-name" value="${esc(c.name)}" placeholder="Bee season postcard" style="margin-top:7px"></div>
          <div><div class="lbl">Cost</div><input class="input" id="qa-cost" value="${c.cost == null ? '' : c.cost}" placeholder="$" inputmode="decimal" style="margin-top:7px"></div>
          <div><div class="lbl">Quantity / audience size</div><input class="input" id="qa-qty" value="${c.qty == null ? '' : c.qty}" placeholder="1,850" inputmode="numeric" style="margin-top:7px"></div>
          <div><div class="lbl">Campaign type</div><select class="select" id="qa-type" style="margin-top:7px">${opt(TYPES, c.type)}</select></div>
          <div><div class="lbl">Audience</div><input class="input" id="qa-aud" value="${esc(c.audience)}" placeholder="Past estimates, 2023-2025" style="margin-top:7px"></div>
          <div><div class="lbl">Attribution mechanism</div><input class="input" id="qa-attr" value="${esc(c.attribution)}" placeholder="CallRail, UTM, promo code" style="margin-top:7px"></div>
          <div><div class="lbl">Notes</div><input class="input" id="qa-notes" value="${esc(c.notes)}" placeholder="Anything you'll forget by Friday" style="margin-top:7px"></div>
        </div>
      </div>
    </div>
    <div class="sheetfoot">
      <button class="btn ghost" data-act="qa-draft">${editing ? 'Save as draft' : 'Save as draft, finish later'}</button>
      <button class="btn" data-act="qa-save">${editing ? 'Save changes' : 'Save campaign'}</button>
    </div>
  </div>`;
}
function readQuickAdd(root) {
  const v = id => { const el = root.querySelector('#' + id); return el ? el.value.trim() : ''; };
  const num = x => { const n = parseFloat(String(x).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? null : n; };
  const bb = root.querySelector('[data-qa-brand][aria-pressed="true"]');
  return { brand: bb ? bb.dataset.qaBrand : 'ltw', channel: v('qa-ch'), date: v('qa-date') || today(),
    name: v('qa-name'), cost: num(v('qa-cost')), qty: num(v('qa-qty')), type: v('qa-type'),
    audience: v('qa-aud'), attribution: v('qa-attr') || null, notes: v('qa-notes') || null };
}

/* ── UTM builder ──────────────────────────────────────────────────── */
const linkOrphans = () => {
  const attached = l => CAMPAIGNS.some(c => (c.utm && c.utm === l.url) || (c.attribution || '').includes(l.name));
  const utmish = c => c.utm || /utm/i.test(c.attribution || '');
  return {
    campaigns: CAMPAIGNS.filter(c => c.attribution && utmish(c) && !LINKS.some(l => l.url === c.utm || (c.attribution || '').includes(l.name))),
    links: LINKS.filter(l => !attached(l)),
  };
};
function auditPanel() {
  const o = linkOrphans(), clean = !o.campaigns.length && !o.links.length;
  return `<section class="card"><div class="pad between" style="border-bottom:1px solid var(--line)"><h2 class="h2">Orphan check</h2>
    <span class="pill ${clean ? 'ok' : 'bad'}">${clean ? 'Both lists agree' : (o.campaigns.length + o.links.length) + ' to reconcile'}</span></div>
    ${clean ? '<div class="pad"><p class="sub">Every UTM campaign has a saved link, and every link is attached to something.</p></div>'
      : `<div class="pad" style="display:flex;flex-direction:column">
      ${o.campaigns.map(c => `<div class="vrow"><span class="row" style="gap:8px;min-width:0">${bdot(c.brand)}<span class="mtxt">${esc(c.name)}</span></span>
        <span class="row" style="gap:10px"><span class="sub" style="color:var(--warn)">UTM attribution, no saved link</span><button class="btn quiet sm" data-go="detail" data-id="${c.id}">Open</button></span></div>`).join('')}
      ${o.links.map(l => `<div class="vrow"><span class="row" style="gap:8px;min-width:0">${bdot(l.brand)}<span class="mtxt mono" style="font-size:12.5px">${esc(l.name)}</span></span>
        <span class="sub" style="color:var(--text-3)">Link not attached to a campaign</span></div>`).join('')}
    </div>`}
  </section>`;
}
function screenLinks(s) {
  const camps = inBrand(CAMPAIGNS, s.brand);
  return `<div class="stack">
    <div class="cols links">
      <section class="card"><div class="pad" style="border-bottom:1px solid var(--line)"><h2 class="h2">Build a link</h2><p class="sub" style="margin-top:4px">Naming convention is enforced: brand-yymm-slug.</p></div>
        <div class="pad" style="display:flex;flex-direction:column;gap:14px">
          <div><div class="lbl">Brand</div><div class="seg" style="margin-top:7px;width:100%">
            <button aria-pressed="true" data-utm-brand="ltw" style="flex:1"><span class="dot ltw"></span>LTW</button>
            <button aria-pressed="false" data-utm-brand="sq" style="flex:1"><span class="dot sq"></span>Squeeky</button></div></div>
          <div><div class="lbl">Channel</div><select class="select" id="utm-ch" style="margin-top:7px">${CHANNELS.map(c => `<option>${c}</option>`).join('')}</select></div>
          <div><div class="lbl">Date</div><input class="input" type="date" id="utm-date" value="${today()}" style="margin-top:7px"></div>
          <div><div class="lbl">Campaign name</div><input class="input" id="utm-name" placeholder="Bee season postcard" style="margin-top:7px"></div>
          <div><div class="lbl">Landing path</div><input class="input" id="utm-path" placeholder="/ (home)" style="margin-top:7px"></div>
          <div><div class="lbl">Attach to a campaign</div><select class="select" id="utm-camp" style="margin-top:7px"><option value="">Don't attach yet</option>${camps.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
        </div>
        <div class="pad" style="border-top:1px solid var(--line)">
          <div class="lbl">Generated link</div>
          <div class="urlbox mono" id="utm-out" style="margin-top:9px"></div>
          <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap">
            <button class="btn sm" id="utm-copy">Copy link</button>
            <button class="btn ghost sm" data-act="save-link">Save &amp; attach to a campaign</button>
          </div>
          <div class="sub" id="utm-msg" style="margin-top:10px"></div>
        </div>
        <div class="pad" style="border-top:1px solid var(--line)">
          <h2 class="h2">Paste a link</h2>
          <p class="sub" style="margin-top:4px">For one built somewhere else. Brand and campaign come off the URL, the rest you pick.</p>
          <div style="display:flex;flex-direction:column;gap:14px;margin-top:14px">
            <div><div class="lbl">Existing URL</div><input class="input" id="paste-url" placeholder="https://logandtimberworx.com/?utm_source=…" style="margin-top:7px"></div>
            <div><div class="lbl">Channel</div><select class="select" id="paste-ch" style="margin-top:7px">${CHANNELS.map(c => `<option>${c}</option>`).join('')}</select></div>
            <div><div class="lbl">Date</div><input class="input" type="date" id="paste-date" value="${today()}" style="margin-top:7px"></div>
            <div><div class="lbl">Attach to a campaign</div><select class="select" id="paste-camp" style="margin-top:7px"><option value="">Don't attach yet</option>${camps.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
          </div>
          <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn ghost sm" data-act="paste-link">Save pasted link</button></div>
          <div class="sub" id="paste-msg" style="margin-top:10px"></div>
        </div>
      </section>
      <div class="stack">
        <section class="card"><div class="pad between" style="border-bottom:1px solid var(--line)"><h2 class="h2">Every link ever built</h2>
          <div class="row" style="gap:8px;flex-wrap:wrap">
            <input class="input" id="link-search" placeholder="Search links…" style="max-width:200px;min-height:38px">
            <button class="btn ghost sm" data-act="import-links">Import CSV</button>
            <button class="btn ghost sm" data-act="export-links">Export CSV</button></div></div>
          <div class="scroll-x"><table><thead><tr><th>Campaign</th><th>Brand</th><th>Channel</th><th>Date</th><th>URL</th></tr></thead>
          <tbody id="link-rows">${LINKS.map(l => `<tr><td class="mono" style="font-size:12.5px">${esc(l.name)}</td><td>${bdot(l.brand)}</td>
            <td style="color:var(--text-2)">${esc(l.channel)}</td><td class="mono" style="color:var(--text-2)">${fmtDate(l.date)}</td>
            <td><span class="urlcell mono">${esc(l.url)}</span></td></tr>`).join('')}</tbody></table></div>
        </section>
        ${auditPanel()}
      </div>
    </div>
  </div>`;
}
const MCC_MED = { 'Direct Mail':'postcard','Email':'constant-contact','Instagram':'social','Facebook':'social','Google Ads':'cpc','Referral Program':'referral','Trade Show':'event','Yard Sign':'print' };
const MCC_SRC = { 'Direct Mail':'directmail','Email':'email','Instagram':'instagram','Facebook':'facebook','Google Ads':'google','Referral Program':'partner','Trade Show':'tradeshow','Yard Sign':'yardsign' };
const utmSlug = s => s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function utmFields(root) {
  const bb = root.querySelector('[data-utm-brand][aria-pressed="true"]');
  const brand = bb ? bb.dataset.utmBrand : 'ltw';
  const val = id => { const el = root.querySelector('#' + id); return el ? el.value : ''; };
  const date = val('utm-date') || today(), nm = val('utm-name') || 'campaign-name';
  return { brand, channel: val('utm-ch'), date, name: nm, path: val('utm-path'), campaign: val('utm-camp'),
    slug: `${brand === 'ltw' ? 'ltw' : 'squeeky'}-${yymm(date)}-${utmSlug(nm)}` };
}
function wireLinks(root) {
  const out = root.querySelector('#utm-out'); if (!out) return;
  const build = () => {
    const f = utmFields(root);
    const path = (f.path || '').replace(/^\/?/,'/').replace(/^\/$/,'');
    const host = f.brand === 'ltw' ? 'logandtimberworx.com' : 'squeekycleanva.com';
    out.textContent = `https://${host}${path}?utm_source=${MCC_SRC[f.channel]}&utm_medium=${MCC_MED[f.channel]}&utm_campaign=${f.slug}`;
  };
  root.querySelectorAll('[data-utm-brand]').forEach(b => b.onclick = () => {
    root.querySelectorAll('[data-utm-brand]').forEach(x => x.setAttribute('aria-pressed', x === b));
    build();
  });
  ['#utm-ch','#utm-name','#utm-path','#utm-date'].forEach(sel => { const el = root.querySelector(sel); if (el) el.addEventListener('input', build); });
  root.querySelector('#utm-copy').onclick = e => { navigator.clipboard?.writeText(out.textContent); e.target.textContent = 'Copied'; setTimeout(() => e.target.textContent = 'Copy link', 1400); };
  const search = root.querySelector('#link-search');
  if (search) search.addEventListener('input', () => {
    const q = search.value.toLowerCase().trim();
    root.querySelectorAll('#link-rows tr').forEach(tr => { tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none'; });
  });
  build();
}

/* ── CSV round-trip. PapaParse when it's on the page, a small fallback
   parser when it isn't, so the tool never dead-ends offline. ────────── */
const CSV_COLS = {
  campaigns: ['brand','date','channel','type','name','audience','qty','cost','attribution','utm','leads','status'],
  links: ['name','brand','channel','date','url'],
};
const CSV_REQ = { campaigns: ['brand','date','channel','name'], links: ['name','brand','channel','date','url'] };
function toCSV(rows, cols) {
  const cell = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; };
  return [cols.join(',')].concat(rows.map(r => cols.map(c => cell(r[c])).join(','))).join('\r\n');
}
function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type:'text/csv' }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function parseCSV(text) {
  if (window.Papa) return Papa.parse(text.trim(), { header:true, skipEmptyLines:true }).data;
  const lines = text.trim().split(/\r?\n/);
  const split = l => { const out = []; let cur = '', q = false;
    for (let i = 0; i < l.length; i++) { const ch = l[i];
      if (q) { if (ch === '"' && l[i+1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch; }
    out.push(cur); return out; };
  const head = split(lines.shift()).map(h => h.trim());
  return lines.map(l => { const c = split(l), o = {}; head.forEach((h, i) => o[h] = (c[i] || '').trim()); return o; });
}
const brandAlias = v => { const s = String(v || '').toLowerCase();
  return /ltw|log|timber/.test(s) ? 'ltw' : /sq|squeek|clean/.test(s) ? 'sq' : null; };
function importCSV(kind) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.csv,text/csv';
  inp.onchange = () => {
    const file = inp.files[0]; if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      let raw = [];
      try { raw = parseCSV(String(fr.result)) || []; } catch (err) { raw = []; }
      const ok = [], bad = [];
      raw.forEach((r, i) => {
        const row = {}; CSV_COLS[kind].forEach(c => { if (r[c] !== undefined && r[c] !== '') row[c] = r[c]; });
        const b = brandAlias(row.brand); if (b) row.brand = b;
        const missing = CSV_REQ[kind].filter(c => !row[c]);
        if (missing.length) bad.push({ n: i + 2, why: 'missing ' + missing.join(', ') });
        else ok.push(kind === 'campaigns' ? normalizeCampaign(row) : row);
      });
      importPreview(kind, ok, bad);
    };
    fr.readAsText(file);
  };
  inp.click();
}
function importPreview(kind, ok, bad) {
  const host = document.createElement('div'); host.className = 'scrim';
  const cols = CSV_COLS[kind];
  host.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Confirm import">
    <div class="sheethead between"><div><h2 class="h1">Import ${kind}</h2>
      <p class="sub" style="margin-top:3px">${ok.length} row${ok.length === 1 ? '' : 's'} ready${bad.length ? ' · ' + bad.length + ' skipped' : ''}. Nothing is written until you commit.</p></div>
      <button class="btn quiet" data-imp="cancel">Close</button></div>
    <div class="sheetbody">
      ${ok.length ? `<div class="scroll-x"><table><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${ok.slice(0, 25).map(r => `<tr>${cols.map(c => `<td class="mono" style="font-size:12px;color:var(--text-2)">${esc(r[c] == null ? '' : r[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        ${ok.length > 25 ? `<span class="lbl">Showing the first 25 of ${ok.length}</span>` : ''}`
        : `<p class="sub">No usable rows. The header row has to match: ${cols.join(', ')}</p>`}
      ${bad.length ? `<div><div class="lbl" style="color:var(--warn)">Skipped</div>
        <div style="margin-top:10px;display:flex;flex-direction:column">${bad.map(b => `<div class="vrow"><span class="sub">Row ${b.n}</span><span class="sub" style="color:var(--warn)">${esc(b.why)}</span></div>`).join('')}</div></div>` : ''}
    </div>
    <div class="sheetfoot">
      <button class="btn ghost" data-imp="cancel">Cancel</button>
      <button class="btn" data-imp="commit"${ok.length ? '' : ' disabled style="opacity:.45;cursor:not-allowed"'}>Import ${ok.length} row${ok.length === 1 ? '' : 's'}</button>
    </div>
  </div>`;
  document.body.appendChild(host);
  host.addEventListener('click', e => {
    if (e.target === host || e.target.closest('[data-imp="cancel"]')) return host.remove();
    if (e.target.closest('[data-imp="commit"]')) {
      if (kind === 'campaigns') { ok.forEach(r => CAMPAIGNS.unshift(r)); cwrite(CAMPAIGNS); }
      else { ok.forEach(r => LINKS.unshift(r)); lwrite(LINKS); }
      host.remove(); rerenderMCC();
    }
  });
}

/* ── the wiring behind buttons the design pass left dead ──────────── */
const rerenderMCC = () => { if (typeof render === 'function') render(); };
const mccState = () => (typeof S !== 'undefined' ? S : { brand:'ltw' });
document.addEventListener('click', e => {
  const qb = e.target.closest('[data-qa-brand]');
  if (qb) { qb.parentElement.querySelectorAll('[data-qa-brand]').forEach(x => x.setAttribute('aria-pressed', x === qb)); return; }
  const a = e.target.closest('[data-act]'); if (!a) return;
  const s = mccState(), act = a.dataset.act;
  if (act === 'copy-url') {
    const box = (a.closest('.card') || document).querySelector('.urlbox');
    if (box) { navigator.clipboard?.writeText(box.textContent); a.textContent = 'Copied'; setTimeout(() => a.textContent = 'Copy link', 1400); }
    return;
  }
  if (act === 'qa-save' || act === 'qa-draft') {
    const sheet = a.closest('.sheet'); if (!sheet) return;
    const f = readQuickAdd(sheet);
    const editing = window.QA_EDIT ? CAMPAIGNS.find(c => c.id === window.QA_EDIT) : null;
    if (!f.name) f.name = (f.channel || 'Campaign') + ', ' + fmtDate(f.date);
    let rec;
    if (editing) { Object.assign(editing, f); if (act === 'qa-draft') editing.status = 'draft';
      editing.checklist = { cost: editing.cost != null, attr: !!editing.attribution, qty: editing.qty != null };
      rec = normalizeCampaign(editing); }
    else { rec = normalizeCampaign(Object.assign({ leads:0, status: act === 'qa-draft' ? 'draft' : 'sent' }, f)); CAMPAIGNS.unshift(rec); }
    cwrite(CAMPAIGNS);
    window.QA_EDIT = null; s.sheet = ''; if (editing) s.id = rec.id;
    return rerenderMCC();
  }
  if (act === 'edit-campaign') { window.QA_EDIT = a.dataset.id; s.sheet = 'quickadd'; return rerenderMCC(); }
  if (act === 'clone-campaign') {
    const src = CAMPAIGNS.find(c => c.id === a.dataset.id); if (!src) return;
    const copy = normalizeCampaign(Object.assign(JSON.parse(JSON.stringify(src)), {
      id: 'c-' + Date.now().toString(36), date: today(),
      name: String(src.name || 'Campaign').replace(/ \(copy\)$/, '') + ' (copy)', leads: 0, status: 'draft' }));
    CAMPAIGNS.unshift(copy); cwrite(CAMPAIGNS);
    s.screen = 'detail'; s.id = copy.id; return rerenderMCC();
  }
  if (act === 'mark-sent') {
    const c = CAMPAIGNS.find(x => x.id === a.dataset.id);
    if (c && checklistDone(c)) { c.status = 'sent'; cwrite(CAMPAIGNS); rerenderMCC(); }
    return;
  }
  if (act === 'save-link') {
    const root = a.closest('.card'), f = utmFields(root);
    const url = root.querySelector('#utm-out').textContent, msg = root.querySelector('#utm-msg');
    if (LINKS.some(l => l.url === url)) { msg.textContent = 'That exact link is already saved.'; return; }
    LINKS.unshift({ name: f.slug, brand: f.brand, channel: f.channel, date: f.date, url });
    lwrite(LINKS);
    if (f.campaign) {
      const c = CAMPAIGNS.find(x => x.id === f.campaign);
      if (c) { c.utm = url; c.attribution = 'UTM · ' + f.slug; c.checklist.attr = true; cwrite(CAMPAIGNS); }
    }
    return rerenderMCC();
  }
  if (act === 'paste-link') {
    const root = a.closest('.card'), msg = root.querySelector('#paste-msg');
    const raw = root.querySelector('#paste-url').value.trim();
    let u; try { u = new URL(raw); } catch (err) { msg.textContent = 'That is not a full URL. Include https://'; return; }
    const camp = u.searchParams.get('utm_campaign');
    if (!u.searchParams.get('utm_source') && !camp) { msg.textContent = 'No utm_source or utm_campaign on that URL, nothing to log.'; return; }
    if (LINKS.some(l => l.url === raw)) { msg.textContent = 'Already saved.'; return; }
    const brand = /logandtimberworx/i.test(u.hostname) ? 'ltw' : /squeek/i.test(u.hostname) ? 'sq' : (s.brand === 'sq' ? 'sq' : 'ltw');
    const name = camp || utmSlug(u.hostname + u.pathname);
    LINKS.unshift({ name, brand, channel: root.querySelector('#paste-ch').value,
      date: root.querySelector('#paste-date').value || today(), url: raw });
    lwrite(LINKS);
    const pc = root.querySelector('#paste-camp'), pid = pc ? pc.value : '';
    if (pid) {
      const c = CAMPAIGNS.find(x => x.id === pid);
      if (c) { c.utm = raw; c.attribution = 'UTM · ' + name; c.checklist.attr = true; cwrite(CAMPAIGNS); }
    }
    return rerenderMCC();
  }
  if (act === 'import-campaigns') return importCSV('campaigns');
  if (act === 'import-links') return importCSV('links');
  if (act === 'export-campaigns') {
    const rows = inBrand(CAMPAIGNS, s.brand).filter(c => (!s.ch || c.channel === s.ch) && (!s.type || c.type === s.type));
    return download('campaigns-' + today() + '.csv', toCSV(rows, CSV_COLS.campaigns));
  }
  if (act === 'export-links') {
    const el = document.querySelector('#link-search'), q = (el ? el.value : '').toLowerCase().trim();
    const rows = LINKS.filter(l => !q || (l.name + l.url + l.channel).toLowerCase().includes(q));
    return download('links-' + today() + '.csv', toCSV(rows, CSV_COLS.links));
  }
});
Object.assign(window, { esc, bdot, btag, statusPill, field, screenHome, screenCampaigns, screenDetail, sheetQuickAdd, readQuickAdd, screenLinks, wireLinks, emptyState,
  tileAttention, auditPanel, linkOrphans, utmFields, toCSV, parseCSV, importCSV, importPreview, download, CSV_COLS, rerenderMCC });
