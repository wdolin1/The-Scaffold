/* wick-brain.js, Wick's head: who he is, what he knows, what he can do, and
   what he remembers between sessions.

   Storage today is localStorage, shaped exactly like the Supabase tables in
   wick-schema.sql (same column names), so the real build is a swap of the four
   read/write helpers at the bottom, not a rewrite. */
const WICK_KEYS = { memory:'wick_memory', sessions:'wick_sessions', campaigns:'cg_mcc_campaigns', links:'cg_mcc_links' };
const jget = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } };
const jput = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const uid = () => 'w-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ── what he can see right now ─────────────────────────────────────── */
function liveSnapshot() {
  const all = CAMPAIGNS; // mcc-data.js has already merged Wick's own rows in
  const sent = all.filter(c => c.status !== 'draft');
  const lines = [];
  ['ltw','sq'].forEach(b => {
    const B = BRANDS[b], mine = sent.filter(c => c.brand === b);
    const spend = mine.reduce((a,c) => a + (c.cost || 0), 0);
    const pct = Math.round(B.leads / B.goal * 100);
    lines.push(`${B.name} (${b}): ${B.leads}/${B.goal} leads this month (${pct}% of goal, ${pct >= 74 ? 'on pace' : 'behind pace'}), ${money(spend)} spent across ${mine.length} campaigns.`);
    const by = {};
    mine.forEach(c => { by[c.channel] = by[c.channel] || { leads:0, cost:0 }; by[c.channel].leads += c.leads || 0; by[c.channel].cost += c.cost || 0; });
    Object.entries(by).sort((x,y) => y[1].leads - x[1].leads).forEach(([ch,v]) =>
      lines.push(`  · ${ch}: ${v.leads} leads, ${money(v.cost)} spent${v.leads ? `, ${money(Math.round(v.cost / v.leads))}/lead` : ''}`));
  });
  const flagged = all.filter(c => c.status === 'flagged');
  if (flagged.length) lines.push(`Untracked sends (no attribution assigned): ${flagged.map(c => `${c.name} [${c.id}]`).join('; ')}.`);
  const drafts = all.filter(c => c.status === 'draft');
  if (drafts.length) lines.push(`Drafts never finished: ${drafts.map(c => c.name).join('; ')}.`);
  lines.push('Not connected: Pipedrive (no lead or revenue sync), Meta, Google Ads, ISN, NiceJob. CallRail, Constant Contact and Send Jim are manual entry only. So closed revenue is unknown, say so rather than guessing.');
  return lines.join('\n');
}
function memoryDigest() {
  const rows = jget(WICK_KEYS.memory);
  if (!rows.length) return 'Nothing remembered yet, this is the first session.';
  return rows.slice(-24).map(r => `[${r.date}${r.related_brand ? ' · ' + r.related_brand : ''}] ${r.topic}: ${r.summary}`).join('\n');
}
function brandBrief() {
  if (typeof BRAND_KIT === 'undefined') return '';
  return Object.values(BRAND_KIT).map(k => `${k.name} (${k.short}): ${k.position}. Tagline "${k.tagline}".${k.owner ? ' Owner ' + k.owner + '.' : ''}
  Voice: ${k.voice}
  Type: ${k.typeNote}. Palette: ${k.colors.map(c => c[0] + ' ' + c[1]).join(', ')}.${k.opener ? ' Opens with "' + k.opener + '".' : ''}
  Contact: ${k.phone}, ${k.site}, ${k.address}.${k.sales ? ' Sales: ' + k.sales + '.' : ''}
  Rules: ${k.rules.join('; ')}.`).join('\n');
}
const WICK_PERSONA = `You are Wick. You run marketing intelligence for Carter Groff, who does marketing for two businesses: Log & Timber Worx (LTW, log home restoration) and Squeeky Clean (exterior cleaning). You live inside his private tool space, The Scaffold.

Who you are:
- A coworker who has been embedded in this business for years. Direct, dry, a little blunt. Never a customer-service assistant.
- You hold opinions and defend them, about channels, copy, design taste, and whether he is overcommitted across two brands. If he proposes something the numbers contradict, say so plainly and cite the number. Do not open with praise. Do not hedge with "you might also consider".
- You tell him when he is wrong. You also tell him when something he is avoiding matters more than what he asked about.
- When you do not have the data, say exactly that and name what is missing. Never estimate a number that is not in your context.
- Short paragraphs, no bullet lists unless he asks for a plan or checklist. No emoji. No sign-offs. Never use em dashes; use commas, periods or parentheses. Never say "How can I help you today?".
- Two or three sentences is usually right. Longer only when he asks for a plan.

What you can do, use the tools rather than describing the steps:
- log_campaign to write a real entry in the Command Center.
- generate_utm to mint a properly named tracking link.
- pull_numbers when you need a figure you do not already have in context.
- open_screen when the answer is something he should look at, the app renders a real button.
- remember for anything worth carrying into future sessions: decisions, preferences, what worked, what failed.

When you write or judge copy, work from the brand guides below. The two brands are separate: never mix their palettes, fonts, imagery or language. LTW is measured and plainspoken; Squeeky is loud and neighborly. Neither uses em dashes or emoji.`;

/* ── tools (client-side; each has a run handler) ────────────────────── */
const WICK_PENDING = { links: [] };
const slug = s => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const UTM_SRC = { 'Direct Mail':'directmail','Email':'email','Instagram':'instagram','Facebook':'facebook','Google Ads':'google','Referral Program':'partner','Trade Show':'tradeshow','Yard Sign':'yardsign' };
const UTM_MED = { 'Direct Mail':'postcard','Email':'constant-contact','Instagram':'social','Facebook':'social','Google Ads':'cpc','Referral Program':'referral','Trade Show':'event','Yard Sign':'print' };
const WICK_TOOLS = [
  { name:'log_campaign', description:'Create a campaign entry in the Command Center. Brand, channel and date are required; anything else can be filled later.',
    input_schema:{ type:'object', properties:{ brand:{type:'string',enum:['ltw','sq']}, channel:{type:'string'}, date:{type:'string',description:'YYYY-MM-DD'},
      name:{type:'string'}, cost:{type:'number'}, qty:{type:'number'}, type:{type:'string'}, audience:{type:'string'}, notes:{type:'string'} }, required:['brand','channel','date'] },
    run: async i => {
      const rows = jget(WICK_KEYS.campaigns);
      const rec = { id:uid(), brand:i.brand, date:i.date, channel:i.channel, type:i.type || 'Always-On', name:i.name || (i.channel + ' send'),
        audience:i.audience || null, qty:i.qty ?? null, cost:i.cost ?? null, attribution:null, leads:0,
        status:(i.cost != null && i.qty != null) ? 'sent' : 'draft', checklist:{ cost:i.cost != null, attr:false, qty:i.qty != null }, notes:i.notes || null, source:'wick' };
      rows.push(rec); jput(WICK_KEYS.campaigns, rows);
      WICK_PENDING.links.push({ label:'Open ' + rec.name, screen:'detail', id:rec.id });
      return `Logged ${rec.name} (${rec.id}) as ${rec.status}. Checklist still open: ${Object.entries(rec.checklist).filter(([,v]) => !v).map(([k]) => k).join(', ') || 'none'}.`;
    } },
  { name:'generate_utm', description:'Build and save a UTM-tagged link using the house naming convention brand-yymm-slug.',
    input_schema:{ type:'object', properties:{ brand:{type:'string',enum:['ltw','sq']}, channel:{type:'string'}, campaign_name:{type:'string'}, path:{type:'string'} }, required:['brand','channel','campaign_name'] },
    run: async i => {
      const host = i.brand === 'ltw' ? 'logandtimberworx.com' : 'squeekycleanva.com';
      const d = new Date(), yy = String(d.getFullYear()).slice(2), mm = String(d.getMonth() + 1).padStart(2,'0');
      const camp = `${i.brand === 'ltw' ? 'ltw' : 'squeeky'}-${yy}${mm}-${slug(i.campaign_name)}`;
      const path = (i.path || '').replace(/^\/?/, '/').replace(/^\/$/, '');
      const url = `https://${host}${path}?utm_source=${UTM_SRC[i.channel] || slug(i.channel)}&utm_medium=${UTM_MED[i.channel] || 'referral'}&utm_campaign=${camp}`;
      const rows = jget(WICK_KEYS.links);
      rows.unshift({ name:camp, brand:i.brand, channel:i.channel, date:new Date().toISOString().slice(0,10), url, source:'wick' });
      jput(WICK_KEYS.links, rows);
      WICK_PENDING.links.push({ label:'Open the link table', screen:'links' });
      return url;
    } },
  { name:'pull_numbers', description:'Read current campaign and lead figures. scope: overview | channels | untracked.',
    input_schema:{ type:'object', properties:{ brand:{type:'string',enum:['ltw','sq','both']}, scope:{type:'string'} }, required:['brand'] },
    run: async i => liveSnapshot() },
  { name:'open_screen', description:'Give Carter a button that jumps straight to a Command Center screen. screen: home | campaigns | detail | links | calendar | connections | revenue | present.',
    input_schema:{ type:'object', properties:{ screen:{type:'string'}, id:{type:'string'}, label:{type:'string'} }, required:['screen'] },
    run: async i => { WICK_PENDING.links.push({ label:i.label || ('Open ' + i.screen), screen:i.screen, id:i.id }); return 'Button rendered.'; } },
  { name:'draft_proposal', description:'Start a proposal or campaign brief draft and hand back the outline you intend to write.',
    input_schema:{ type:'object', properties:{ brand:{type:'string'}, subject:{type:'string'}, angle:{type:'string'} }, required:['brand','subject'] },
    run: async i => `Draft started for ${i.subject} (${i.brand}). Held in this session, the real build writes it to the proposals table.` },
  { name:'remember', description:'Store something worth carrying into future sessions: a decision, a preference, a result, a pattern.',
    input_schema:{ type:'object', properties:{ topic:{type:'string'}, summary:{type:'string'}, related_brand:{type:'string'} }, required:['topic','summary'] },
    run: async i => { wickRemember(i.topic, i.summary, i.related_brand); return 'Filed.'; } },
];
function wickRemember(topic, summary, related_brand) {
  const rows = jget(WICK_KEYS.memory);
  rows.push({ id:uid(), date:new Date().toISOString().slice(0,10), topic, summary, related_brand:related_brand || null, source:'conversation' });
  jput(WICK_KEYS.memory, rows.slice(-300));
  document.dispatchEvent(new CustomEvent('wick-memory'));
}

/* ── how he says hello: one short clause, then the observation ───────── */
function wickGreeting() {
  const h = new Date().getHours(), SEEN = 'wick_last_seen';
  let gap = null;
  try {
    const last = localStorage.getItem(SEEN);
    if (last) gap = Math.round((Date.now() - +last) / 864e5);
    localStorage.setItem(SEEN, String(Date.now()));
  } catch (e) {}
  const hour = h < 5 ? 'Late one' : h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
  if (gap === null) return `${hour}. I'm Wick.`;
  if (gap >= 7) return `${hour}. It has been a week.`;
  if (gap >= 2) return `${hour}. Been a few days.`;
  if (gap === 0 && h >= 5) return 'Back again.';
  return hour + '.';
}
/* ── the opening line: a greeting, then an observation ───────────────── */
function wickOpener() {
  const all = CAMPAIGNS;
  const flagged = all.filter(c => c.status === 'flagged');
  const behind = ['ltw','sq'].map(b => BRANDS[b]).filter(B => B.leads / B.goal < .74);
  if (flagged.length) {
    const c = flagged[0];
    return `${c.name} went out with no attribution on it, so whatever it pulled is landing nowhere${flagged.length > 1 ? `, and it isn't the only one, there are ${flagged.length} sitting like that` : ''}. Fix that before anything else.`;
  }
  if (behind.length) {
    const B = behind[0], key = B.key;
    const mine = all.filter(c => c.brand === key && c.status !== 'draft');
    const worst = mine.filter(c => c.cost > 200).sort((a,b) => (b.cost / Math.max(b.leads,1)) - (a.cost / Math.max(a.leads,1)))[0];
    return `${B.short} is at ${B.leads} of ${B.goal} with the month better than half gone, behind pace.${worst ? ` ${worst.channel} is the drag: ${money(worst.cost)} for ${worst.leads} leads.` : ''} Where do you want to put the next dollar?`;
  }
  const drafts = all.filter(c => c.status === 'draft');
  if (drafts.length) return `Both brands are on pace. The loose end is ${drafts[0].name}, still a draft with nothing costed. Want to finish it or kill it?`;
  return `Both brands are on pace and nothing's untracked. Good week to work on something that isn't urgent.`;
}

/* ── the call ──────────────────────────────────────────────────────── */
async function wickSay(history) {
  if (!window.claude?.complete) throw new Error('offline');
  const system = `${WICK_PERSONA}

BRAND GUIDES:
${brandBrief()}

CURRENT DATA (read-only, as of ${new Date().toDateString()}):
${liveSnapshot()}

WHAT YOU REMEMBER FROM PAST SESSIONS:
${memoryDigest()}`;
  return await window.claude.complete({ model:'claude-sonnet-4-5', max_tokens:900, system, tools:WICK_TOOLS,
    messages:history.map(m => ({ role:m.role, content:m.text })) });
}
/* Session close: distil the thread into memory rows rather than dumping the transcript. */
async function wickCloseSession(history) {
  if (history.filter(m => m.role === 'user').length < 2) return;
  const sessions = jget(WICK_KEYS.sessions);
  sessions.push({ id:uid(), ended:new Date().toISOString(), turns:history.length });
  jput(WICK_KEYS.sessions, sessions.slice(-100));
  if (!window.claude?.complete) return;
  try {
    const out = await window.claude.complete({ max_tokens:500,
      system:'Distil this working conversation into at most four memory rows. Reply with JSON only: [{"topic":"short label","summary":"one sentence worth remembering months from now","related_brand":"ltw|sq|null"}]. Keep decisions, preferences, results and disagreements. Drop pleasantries and anything already obvious from the data.',
      messages:[{ role:'user', content:history.map(m => `${m.role === 'user' ? 'Carter' : 'Wick'}: ${m.text}`).join('\n\n') }] });
    (JSON.parse(out.slice(out.indexOf('['), out.lastIndexOf(']') + 1)) || []).forEach(r => wickRemember(r.topic, r.summary, r.related_brand === 'null' ? null : r.related_brand));
  } catch (e) {}
}
// { greeting, observation } so the page can style each part on its own.
function wickHello() { return { greeting: wickGreeting(), observation: wickOpener() }; }
Object.assign(window, { WICK_KEYS, WICK_TOOLS, brandBrief, wickGreeting, wickHello, WICK_PENDING, wickSay, wickOpener, wickRemember, wickCloseSession, liveSnapshot, memoryDigest, jget, jput });
