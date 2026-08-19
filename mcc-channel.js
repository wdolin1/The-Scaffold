/* mcc-channel.js — one detail screen per channel in Home's rail. Each medium
   gets the readings that actually matter for it rather than a shared template,
   so Adwords shows conversion economics, CallRail shows call handling, Send Jim
   shows piece economics, Constant Contact shows list behaviour. */
const CHANNEL_DETAIL = {
  adwords: {
    name:'Adwords', label:'Google Ads', match:c => c.channel === 'Google Ads',
    lede:'Paid search across both brands. Cost per conversion is the number to watch here; everything else explains it.',
    kpis:[['Spend','$2,860'],['Conversions','45'],['Cost / conv.','$42'],['Impr. share','38%'],['CTR','4.1%']],
    panels:[
      { title:'Cost per conversion by campaign', kind:'bars', unit:'money',
        rows:[['House wash, Harrisonburg',31,'sq'],['Log home restoration',44,'ltw'],['Gutter clean, valley',38,'sq'],['Chink season, exact match',68,'ltw']] },
      { title:'Impressions against spend', kind:'pairs',
        rows:[['Impressions','214,800'],['Clicks','8,760'],['Cost / click','$0.33'],['Conv. rate','0.5%'],['Wasted spend, no conv.','$412']] },
      { title:'Worth doing', kind:'notes',
        rows:['Chink season is exact match only and still runs $68 a conversion. Either the terms are too broad for the intent or the landing page is the problem.',
              'House wash carries the account at $31. That is the budget to feed first.'] },
    ],
  },
  social: {
    name:'Social', label:'Instagram and Facebook', match:c => c.channel === 'Instagram' || c.channel === 'Facebook',
    lede:'Mostly organic with the occasional boost. Reach is cheap here; the job is turning it into a conversation.',
    kpis:[['Spend','$285'],['Leads','12'],['Cost / lead','$24'],['Reach','48,200'],['Saves','610']],
    panels:[
      { title:'By platform', kind:'bars', unit:'plain',
        rows:[['Instagram, organic',34,'ltw'],['Instagram, boosted',9,'ltw'],['Facebook, retargeting',5,'sq']] },
      { title:'What people did', kind:'pairs',
        rows:[['Profile visits','2,140'],['Link clicks','386'],['Saves','610'],['Shares','88'],['DMs that became leads','7']] },
      { title:'Worth doing', kind:'notes',
        rows:['Restoration before-and-afters outperform everything else by roughly four to one on saves. Shoot more of them while the scaffolding is still up.',
              'The Facebook retargeting set has spent $210 for two leads. It is the weakest line on this screen.'] },
    ],
  },
  callrail: {
    name:'CallRail', label:'Tracked phone numbers', match:c => /CallRail/i.test(c.attribution || ''),
    lede:'A tracked number per campaign. This is the only place a direct mail piece can prove it worked.',
    kpis:[['Calls','38'],['Answered','34'],['Missed','4'],['First time','29'],['Avg. length','3m 41s']],
    panels:[
      { title:'Calls by tracked number', kind:'bars', unit:'plain',
        rows:[['(540) 555-0142 · Aug reactivation',21,'ltw'],['(540) 555-0177 · Chink season',13,'ltw'],['Main line, untagged',4,'sq']] },
      { title:'Handling', kind:'pairs',
        rows:[['Answered inside 30s','27'],['Voicemail left','3'],['Missed, no voicemail','1'],['Repeat callers','9'],['Calls after 6pm','6']] },
      { title:'Worth doing', kind:'notes',
        rows:['Four missed calls off a direct mail drop is four estimates that never happened. Every one of them arrived between 4:30 and 6.',
              'The untagged main line is still catching calls that belong to a campaign. Assign it a number before the next drop.'] },
    ],
  },
  sendjim: {
    name:'Send Jim', label:'Direct mail drops', match:c => c.channel === 'Direct Mail',
    lede:'Print and postage, priced per piece. The most expensive channel per lead and still the one that closes.',
    kpis:[['Spend','$3,778'],['Pieces','4,250'],['Leads','33'],['Cost / lead','$114'],['Response','0.78%']],
    panels:[
      { title:'Cost per piece', kind:'pairs',
        rows:[['Print','$0.53'],['Postage','$0.36'],['List','$455'],['Mail house','Send Jim'],['All in, per piece','$0.89']] },
      { title:'Drops this period', kind:'bars', unit:'plain',
        rows:[['Chink & seal season, 2,400',19,'ltw'],['August reactivation, 1,850',14,'ltw']] },
      { title:'Worth doing', kind:'notes',
        rows:['Reactivation to past estimates responds at nearly twice the rate of a cold list. Mail the people who already said maybe.',
              'At $114 a lead this only works because the jobs are five figures. It would be indefensible for Squeeky.'] },
    ],
  },
  constantcontact: {
    name:'Constant Contact', label:'Email sends', match:c => c.channel === 'Email',
    lede:'Cheapest channel you have. The list is the asset, so watch what the sends do to it.',
    kpis:[['Spend','$96'],['Sends','4,530'],['Opens','41%'],['Clicks','6.2%'],['Leads','12']],
    panels:[
      { title:'By send', kind:'bars', unit:'plain',
        rows:[['Pre-fall gutter push',9,'sq'],['Monthly restoration letter',3,'ltw']] },
      { title:'List health', kind:'pairs',
        rows:[['Subscribers','4,530'],['New this month','+112'],['Unsubscribes','-38'],['Bounced','-14'],['Never opened, 6 months','681']] },
      { title:'Worth doing', kind:'notes',
        rows:['The monthly restoration letter still has no attribution on it, so its three leads are a guess. Fix that before the next send.',
              'Six hundred and eighty-one addresses have not opened anything in six months. They are hurting the open rate, not helping it.'] },
    ],
  },
};
function chanBars(p) {
  const max = Math.max(...p.rows.map(r => r[1]));
  return p.rows.map(([n, v, b]) => `<div class="minirow">
    <div class="row" style="gap:7px;min-width:0">${b ? bdot(b) : ''}<span class="mtxt">${esc(n)}</span></div>
    <span class="mono mval">${p.unit === 'money' ? money(v) : v}</span>
    <div class="bar" style="height:3px;grid-column:1/-1"><i class="${b || ''}" style="width:${v / max * 100}%"></i></div>
  </div>`).join('');
}
const chanPairs = p => p.rows.map(([k, v]) => `<div class="vrow"><span class="lbl">${esc(k)}</span><span class="mono">${esc(v)}</span></div>`).join('');
const chanNotes = p => p.rows.map(t => `<p class="sub" style="margin-bottom:12px">${esc(t)}</p>`).join('');
function screenChannel(s) {
  const d = CHANNEL_DETAIL[s.chan] || CHANNEL_DETAIL.adwords;
  const rows = CAMPAIGNS.filter(c => c.status !== 'draft' && d.match(c));
  const spend = rows.reduce((a, c) => a + (c.cost || 0), 0), leads = rows.reduce((a, c) => a + (c.leads || 0), 0);
  const body = p => p.kind === 'bars' ? `<div class="minirows">${chanBars(p)}</div>`
    : p.kind === 'pairs' ? `<div class="vrows">${chanPairs(p)}</div>` : chanNotes(p);
  return `<div class="stack">
    <div class="chanhead">
      <button class="btn quiet sm" data-go="home" style="margin-left:-12px">← Home</button>
      <h1 class="h1" style="font-size:30px;margin-top:6px">${esc(d.name)}</h1>
      <p class="sub" style="margin-top:8px;max-width:620px">${esc(d.lede)}</p>
      <div class="row" style="gap:10px;margin-top:12px;flex-wrap:wrap"><span class="pill mute">One ${esc(d.label)} account · both brands</span>
        <span class="lbl">Brand dots mark which side each row belongs to</span></div>
      <div class="chantabs">${Object.entries(CHANNEL_DETAIL).map(([k, v]) => `<button class="chantab" data-channel="${k}" aria-current="${k === s.chan}">${esc(v.name)}</button>`).join('')}</div>
    </div>
    <div class="kpis">${d.kpis.map(([l, v]) => `<div class="kpi"><div class="lbl">${l}</div><div class="mono kpin">${v}</div></div>`).join('')}</div>
    <div class="changrid">${d.panels.map(p => `<section class="tile">
      <div class="tilehead"><h2 class="h2">${esc(p.title)}</h2></div>${body(p)}
    </section>`).join('')}</div>
    <section class="card">
      <div class="pad between" style="border-bottom:1px solid var(--line)"><h2 class="h2">Campaigns on this channel</h2>
        <span class="lbl">${rows.length} · ${money(spend)} · ${leads} leads · both brands</span></div>
      ${rows.length ? `<div class="reclistwrap">${rows.map(recentRow).join('')}</div>`
        : `<div class="pad empty" style="padding:34px 0"><p class="sub">Nothing logged on ${esc(d.name)} yet.</p></div>`}
    </section>
  </div>`;
}
Object.assign(window, { CHANNEL_DETAIL, screenChannel });
