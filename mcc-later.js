/* mcc-later.js, screens designed now, built later: Present Mode, Campaign
   Calendar, Channel Connections, Revenue/Attribution. Plus the loading state. */
function screenPresent(s) {
  const month = 'August 2026';
  const rows = CAMPAIGNS.filter(c => c.status !== 'draft');
  const by = {};
  rows.forEach(c => { by[c.channel] = by[c.channel] || { leads:0, cost:0 }; by[c.channel].leads += c.leads; by[c.channel].cost += c.cost || 0; });
  const list = Object.entries(by).sort((a,b) => b[1].leads - a[1].leads);
  const maxL = Math.max(...list.map(([,v]) => v.leads));
  const cpl = list.filter(([,v]) => v.cost > 0).map(([k,v]) => [k, Math.round(v.cost / Math.max(v.leads,1))]).sort((a,b) => a[1] - b[1]);
  const maxC = Math.max(...cpl.map(([,v]) => v));
  const best = rows.reduce((a,c) => (c.leads > a.leads ? c : a));
  const worst = rows.filter(c => c.cost > 200).reduce((a,c) => ((c.cost / Math.max(c.leads,1)) > (a.cost / Math.max(a.leads,1)) ? c : a));
  return `<div class="present">
    <div class="presenthead">
      <div class="row" style="gap:14px"><button class="btn quiet sm">←</button><h1 class="pmonth">${month}</h1><button class="btn quiet sm">→</button></div>
      <div class="row" style="gap:10px"><button class="btn ghost sm">Export as PDF</button><button class="btn quiet sm" data-go="home">Exit present mode</button></div>
    </div>
    <div class="pgoals">${['ltw','sq'].map(b => { const B = BRANDS[b], pct = Math.round(B.leads / B.goal * 100); return `<div class="pgoal">
      <div class="row" style="gap:10px"><span class="dot ${b}"></span><span class="lbl" style="font-size:12px">${esc(B.name)}</span></div>
      <div class="pnum mono">${B.leads}<span>/${B.goal}</span></div>
      <div class="bar" style="height:9px"><i class="${b}" style="width:${Math.min(pct,100)}%"></i></div>
      <div class="row" style="justify-content:space-between;margin-top:10px"><span class="sub mono" style="font-size:15px">${pct}% of goal</span><span class="sub" style="font-size:15px">${pct >= 74 ? 'On pace' : 'Behind pace'}</span></div>
    </div>`; }).join('')}</div>
    <div class="pcharts">
      <section><h2 class="ptitle">Leads by channel</h2>
        <div class="pchart">${list.map(([k,v]) => `<div class="pbar"><span class="pk">${esc(k)}</span><div class="bar" style="height:22px;border-radius:2px"><i style="width:${v.leads / maxL * 100}%;border-radius:2px"></i></div><span class="pv mono">${v.leads}</span></div>`).join('')}</div>
      </section>
      <section><h2 class="ptitle">Cost per lead</h2>
        <div class="pchart">${cpl.map(([k,v]) => `<div class="pbar"><span class="pk">${esc(k)}</span><div class="bar" style="height:22px;border-radius:2px"><i style="width:${v / maxC * 100}%;background:var(--warn);border-radius:2px"></i></div><span class="pv mono">${money(v)}</span></div>`).join('')}</div>
      </section>
    </div>
    <div class="phigh">
      <div class="pcard"><div class="lbl" style="color:var(--accent)">Carried the month</div><h3>${esc(best.name)}</h3>
        <p class="sub" style="font-size:15px">${esc(BRANDS[best.brand].short)} · ${esc(best.channel)} · ${best.leads} leads at ${money(Math.round(best.cost / best.leads))} each.</p></div>
      <div class="pcard"><div class="lbl" style="color:var(--warn)">Worth a second look</div><h3>${esc(worst.name)}</h3>
        <p class="sub" style="font-size:15px">${esc(BRANDS[worst.brand].short)} · ${esc(worst.channel)} · ${money(worst.cost)} for ${worst.leads} leads, ${money(Math.round(worst.cost / Math.max(worst.leads,1)))} per lead.</p></div>
    </div>
  </div>`;
}
function screenCalendar(s) {
  const events = inBrand(CALENDAR, s.brand);
  const start = 6; // Aug 1, 2026 is a Saturday
  const cells = [];
  for (let i = 0; i < start; i++) cells.push('<div class="cal-cell out"></div>');
  for (let d = 1; d <= 31; d++) {
    const evs = events.filter(e => e.d === d);
    cells.push(`<div class="cal-cell${d === 17 ? ' today' : ''}"><span class="cal-d mono">${d}</span>
      ${evs.map(e => `<button class="cal-ev" data-go="detail" data-id="${(CAMPAIGNS.find(c => c.name.startsWith(e.name.split(' ')[0])) || {}).id || 'c-101'}">
        <span class="dot ${e.brand}"></span><span>${esc(e.name)}</span></button>`).join('')}</div>`);
  }
  return `<div class="stack">
    <div class="between"><div class="row" style="gap:12px"><button class="btn quiet sm">←</button><h2 class="h1">August 2026</h2><button class="btn quiet sm">→</button></div>
      <div class="row" style="gap:8px;flex-wrap:wrap"><span class="pill mute">Later build</span><button class="btn ghost sm" data-sheet="quickadd">Plan a campaign</button></div></div>
    <div class="card scroll-x"><div class="cal">
      <div class="cal-head">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<span class="lbl">${d}</span>`).join('')}</div>
      <div class="cal-grid">${cells.join('')}</div>
    </div></div>
    <div class="row" style="gap:14px;flex-wrap:wrap"><span class="tag"><span class="dot ltw"></span>Log &amp; Timber Worx</span><span class="tag"><span class="dot sq"></span>Squeeky Clean</span><span class="sub">Channel shows on the chip; brand carries the color.</span></div>
  </div>`;
}
function screenConnections(s) {
  const pill = st => st === 'ok' ? '<span class="pill ok">Connected</span>' : st === 'manual' ? '<span class="pill warn">Manual entry only</span>' : '<span class="pill mute">Not connected</span>';
  return `<div class="stack">
    <div class="card pad"><div class="between"><div><h2 class="h2">Sources</h2>
      <p class="sub" style="margin-top:5px;max-width:520px">Everything the tool can eventually pull from. Manual-entry sources still work, you type the numbers in, but connecting one means the campaign log fills itself.</p></div>
      <span class="pill mute">Later build</span></div></div>
    <div class="card">${CONNECTIONS.map((c, i) => `<div class="connrow${i ? '' : ' first'}">
      <div style="flex:1;min-width:0"><div class="row" style="gap:9px"><h3 class="h2">${esc(c.name)}</h3>${c.name === 'Pipedrive' ? '<span class="tag">Spine of attribution</span>' : ''}</div>
        <p class="sub" style="margin-top:4px">${esc(c.role)}</p></div>
      ${pill(c.status)}<button class="btn ghost sm">${c.status === 'not' ? 'Connect' : 'Configure'}</button>
    </div>`).join('')}</div>
  </div>`;
}
function screenRevenue(s) {
  const by = {};
  CAMPAIGNS.filter(c => c.status !== 'draft').forEach(c => {
    const k = c.brand + '|' + c.channel;
    by[k] = by[k] || { channel:c.channel, brand:c.brand, cost:0, leads:0, closed:0, revenue:0 };
    const L = leadsFor(c), won = L.filter(x => x.stage === 'Won');
    by[k].cost += c.cost || 0; by[k].leads += c.leads || 0;
    by[k].closed += won.length; by[k].revenue += won.reduce((a,x) => a + x.value, 0);
  });
  const rows = inBrand(Object.values(by), s.brand).sort((a,b) => b.revenue - a.revenue);
  const max = Math.max(...rows.map(r => r.revenue));
  const t = rows.reduce((a,r) => ({ cost:a.cost + r.cost, leads:a.leads + r.leads, closed:a.closed + r.closed, revenue:a.revenue + r.revenue }), {cost:0,leads:0,closed:0,revenue:0});
  return `<div class="stack">
    <div class="card pad"><div class="between"><div><h2 class="h2">Cost against closed revenue</h2>
      <p class="sub" style="margin-top:5px;max-width:520px">Lead counts only tell half the story. Deal values come from Pipedrive, so every figure here traces back to a closed deal.</p></div>
      <span class="pill ok">Pipedrive</span></div></div>
    <div class="kpis">
      ${[['Spend', money(t.cost)],['Leads', t.leads],['Closed', t.closed],['Revenue', money(t.revenue)],['Return', (t.revenue / t.cost).toFixed(1) + '×']].map(([l,v]) => `<div class="card pad kpi"><div class="lbl">${l}</div><div class="mono kpin">${v}</div></div>`).join('')}
    </div>
    <div class="card scroll-x"><table><thead><tr><th>Channel</th><th>Brand</th><th>Spend</th><th>Leads</th><th>Cost / lead</th><th>Closed</th><th>Revenue</th><th>Return</th><th style="width:24%">Share</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td style="font-weight:500">${esc(r.channel)}</td><td>${bdot(r.brand)}</td>
        <td class="mono">${money(r.cost)}</td><td class="mono">${r.leads}</td><td class="mono">${r.cost ? money(Math.round(r.cost / r.leads)) : '·'}</td>
        <td class="mono">${r.closed}</td><td class="mono" style="font-weight:500">${money(r.revenue)}</td>
        <td class="mono" style="color:${r.cost && r.revenue / r.cost > 5 ? 'var(--accent)' : 'var(--text-2)'}">${r.cost ? (r.revenue / r.cost >= 100 ? Math.round(r.revenue / r.cost) + '×' : (r.revenue / r.cost).toFixed(1) + '×') : '·'}</td>
        <td><div class="bar"><i class="${r.brand}" style="width:${r.revenue / max * 100}%"></i></div></td></tr>`).join('')}</tbody></table></div>
  </div>`;
}
function screenLoading() {
  const sk = (w, h, mt) => `<div class="skel" style="width:${w};height:${h}px;margin-top:${mt || 0}px"></div>`;
  const tile = (extra, body) => `<section class="tile ${extra}">${sk('54%', 13)}${body}</section>`;
  const big = () => `${sk('46%', 40, 16)}${sk('30%', 10, 12)}${[0,1,2].map(() => sk('100%', 9, 14)).join('')}`;
  return `<div class="homewrap" aria-busy="true">
    <aside class="rail">${sk('50%', 11)}<div class="railwrap">${[0,1,2,3].map(() => `<div class="railrow">${sk('120px', 12)}</div>`).join('')}</div></aside>
    <div class="homemain">
      <div class="hgrid">
        ${tile('t-pace', `<div class="dials">${[0,1].map(() => `<div class="dial">${sk('100%', 52, 14)}${sk('54%', 26, 14)}</div>`).join('')}</div>`)}
        ${tile('', big())}
        ${tile('', big())}
        ${tile('t-source', `<div class="srcgrid">${[0,1].map(() => `<div>${sk('60%', 11, 8)}${[0,1,2,3,4].map(() => sk('100%', 10, 13)).join('')}</div>`).join('')}</div>`)}
        ${tile('', big())}
        ${tile('', big())}
      </div>
      <section class="card"><div class="pad" style="border-bottom:1px solid var(--line)">${sk('28%', 13)}</div>
        <div class="pad" style="display:flex;flex-direction:column;gap:20px">${[0,1,2].map(() => `<div>${sk('62%', 12)}${sk('40%', 10, 9)}</div>`).join('')}</div></section>
    </div>
  </div>`;
}
Object.assign(window, { screenPresent, screenCalendar, screenConnections, screenRevenue, screenLoading });
