/* mcc-builder.js, the Content Builder: a second door into the same generation
   Wick uses. Parlor chrome around a preview that follows each brand's real
   identity from brand/Brand Guide - *.md. Pieces land in one shared history
   (cg_generated) so Wick reads the same list. */
const GEN_KEY = 'cg_generated';
const gread = () => { try { return JSON.parse(localStorage.getItem(GEN_KEY)) || SEED_GEN; } catch (e) { return SEED_GEN; } };
const gwrite = v => { try { localStorage.setItem(GEN_KEY, JSON.stringify(v)); } catch (e) {} };
const SEED_GEN = [
  { id:'g-3', brand:'ltw', kind:'Email', title:'August reactivation, past estimates', date:'2026-08-11', by:'Wick', campaign:'c-101',
    eyebrow:'Wood Restoration Specialists', subject:'Same Wood. One More Season.', hi:'Sun',
    preheader:'Two crews with room in September', greeting:'Howdy,',
    body:['We wrote you an estimate in 2024 and the walls we walked that day are two summers older now. Sun and water do not wait for a decision.','If you want it looked at before winter, we have two crews with room in September. A wash and an inspection tells us what the finish has left in it.'],
    cta:'Call to get on the September schedule', cta2:'Download the 5-Year Maintenance Guide' },
  { id:'g-2', brand:'sq', kind:'Email', title:'Pre-fall gutter push', date:'2026-08-09', by:'Builder', campaign:'c-102',
    eyebrow:'Fall route is filling', subject:'Leaves Fall. Gutters Clog.', hi:'Clog',
    preheader:'Book the early route before September', greeting:null,
    body:['Every gutter in the valley is about to fill up. Book before September and you land on the early route.','Same crew, same day window, no surprises on the invoice.'],
    cta:'Call and grab an early slot', cta2:null },
  { id:'g-1', brand:'ltw', kind:'Social', title:'Rockingham cabin, second act', date:'2026-08-06', by:'Wick', campaign:'c-103',
    eyebrow:'Restoration', subject:'Told To Tear It Down. Standing Instead.', hi:'Standing',
    preheader:'Six months, forty replaced logs', greeting:'Howdy,',
    body:['The sills were gone and the chinking had let go. Six months later the walls are sound and the porch faces the same mountain it did in 1908.'],
    cta:'See the restoration', cta2:null },
];
const kitOf = b => BRAND_KIT[b];

function brandChip(k) {
  const kit = kitOf(k);
  return `<div class="kit">
    <div class="kitrow"><span class="lbl">Palette</span><span class="swatches">${kit.colors.map(([n, hex]) => `<span class="sw" style="background:${hex}" title="${esc(n)} ${hex}"></span>`).join('')}</span></div>
    <div class="kitrow"><span class="lbl">Type</span><span class="sub">${esc(kit.typeNote)}</span></div>
    <div class="kitrow"><span class="lbl">Voice</span><span class="sub">${esc(kit.voice)}</span></div>
    ${kit.opener ? `<div class="kitrow"><span class="lbl">Opens with</span><span class="sub">${esc(kit.opener)}</span></div>` : ''}
    <div class="kitrow"><span class="lbl">Sign-off</span><span class="sub">${esc(kit.tagline)}${kit.signoff ? ' · ' + esc(kit.signoff) : ''}</span></div>
    <div class="kitrow"><span class="lbl">CTA</span><span class="sub">${kit.ctaStyle === 'buttons' ? 'Brick button plus outlined secondary' : 'Text CTA, big phone, green rule. No buttons'}</span></div>
    <div class="rules">${kit.rules.map(r => `<span class="rule">${esc(r)}</span>`).join('')}</div>
    <div class="kitrow"><span class="lbl">Contact</span><span class="sub">${esc(kit.phone)} · ${esc(kit.site)}</span></div>
    <div class="kitrow" style="border:none"><span class="lbl">Guide</span><span class="sub"><a href="brand/Brand Guide - ${k === 'ltw' ? 'Log &amp; Timber Worx' : 'Squeeky Clean'}.md">Full brand guide</a></span></div>
  </div>`;
}
/* The artwork is its own world: each brand rendered by its own guide. */
function preview(p) {
  const kit = kitOf(p.brand);
  const hl = (s, word) => word && s.includes(word) ? esc(s).replace(esc(word), `<span class="hi">${esc(word)}</span>`) : esc(s);
  if (p.brand === 'ltw') return `<div class="art art-ltw">
    <div class="l-band"></div><div class="l-hair"></div>
    <div class="l-logo"><img class="l-logoimg" src="${kit.logo}" alt="Log and Timber Worx"><span class="l-eyebrow">${esc(kit.position)}</span></div>
    <div class="l-hero">
      <span class="l-plate">Hero photo from photos/</span>
      <div class="l-herotext"><span class="l-kicker">${esc(p.eyebrow || 'Wood Restoration Specialists')}</span>
        <h3 class="l-h1">${hl(p.subject, p.hi)}</h3></div>
    </div>
    <div class="l-brick"></div>
    <div class="l-body">
      <p class="l-greet">${esc(p.greeting || kit.opener)}</p>
      ${p.body.map(t => `<p class="l-p">${esc(t)}</p>`).join('')}
      <div class="l-ctas"><span class="l-btn">${esc(p.cta)} · ${esc(kit.phone)}</span>${p.cta2 ? `<span class="l-btn2">${esc(p.cta2)}</span>` : ''}</div>
      <p class="l-sign">${esc(kit.signoff)}<br><b>${esc(kit.tagline)}</b></p>
    </div>
    <div class="l-foot"><span class="l-hairgold"></span><span class="l-fkicker">${esc(kit.position)}</span>
      <span class="l-fsmall">${esc(kit.address)} · ${esc(kit.phone)} · ${esc(kit.site)}<br>Serving ${esc(kit.states)} · Unsubscribe</span></div>
  </div>`;
  return `<div class="art art-sq">
    <div class="s-band"></div>
    <div class="s-top"><img class="s-logoimg" src="${kit.logo}" alt="Squeeky Clean"><span class="s-kicker">${esc(kit.tagline)}</span></div>
    <div class="s-hero">
      <span class="s-plate">Crew photo from squeeky-assets/</span>
      <h3 class="s-h1">${hl(p.subject, p.hi)}</h3>
    </div>
    <div class="s-body">
      <span class="s-eyebrow">${esc(p.eyebrow || 'This week')}</span>
      ${p.body.map(t => `<p class="s-p">${esc(t)}</p>`).join('')}
      <div class="s-bar">Early route, best price</div>
      <ul class="s-check">${['Soft wash, no pressure damage','Same day window','Flat invoice'].map(t => `<li><i></i>${esc(t)}</li></ul>`.replace('</ul>','')).join('')}</ul>
      <div class="s-cta"><span class="s-ctaline">${esc(p.cta)}</span><span class="s-phone">${esc(kit.phone)}</span><span class="s-rule"></span></div>
    </div>
    <div class="s-foot"><span class="s-hairgreen"></span>${esc(kit.address)} · ${esc(kit.phone)} · ${esc(kit.site)} · Unsubscribe</div>
  </div>`;
}
function screenBuilder(s) {
  const brand = s.brand === 'both' ? 'ltw' : s.brand;
  const kit = kitOf(brand);
  const hist = gread().filter(p => p.brand === brand);
  const piece = window.BUILDER_PIECE && window.BUILDER_PIECE.brand === brand ? window.BUILDER_PIECE : hist[0];
  const campaigns = CAMPAIGNS.filter(c => c.brand === brand).slice(0, 8);
  return `<div class="stack">
    <div class="cols builder">
      <section class="card">
        <div class="pad" style="border-bottom:1px solid var(--line)"><h2 class="h2">Ask for a piece</h2>
          <p class="sub" style="margin-top:5px">Describe it the way you would to Wick. Same engine, same brand guides.</p></div>
        <div class="pad" style="display:flex;flex-direction:column;gap:16px">
          <div><div class="lbl">Brand context</div>
            <div class="seg" style="margin-top:8px;width:100%">
              <button data-bk="ltw" aria-pressed="${brand === 'ltw'}" style="flex:1"><span class="dot ltw"></span>LTW</button>
              <button data-bk="sq" aria-pressed="${brand === 'sq'}" style="flex:1"><span class="dot sq"></span>Squeeky</button>
            </div>
            ${brandChip(brand)}
          </div>
          <div><div class="lbl">Piece</div>
            <div class="seg" style="margin-top:8px;width:100%">${['Email','Social','Postcard'].map((k, i) => `<button data-kind="${k}" aria-pressed="${i === 0}" style="flex:1">${k}</button>`).join('')}</div></div>
          <div><div class="lbl">Module or angle</div>
            <select class="select" id="b-mod" style="margin-top:8px"><option value="">None</option>${kit.modules.map(m => `<option>${esc(m)}</option>`).join('')}</select></div>
          <div><div class="lbl">What's it for</div>
            <textarea class="input" id="b-brief" rows="3" style="margin-top:8px;resize:vertical;min-height:92px" placeholder="Reactivation email for past estimates, August theme">${brand === 'ltw' ? 'Reactivation email for past estimates, push the fall chinking window' : 'Pre-fall gutter push, early route offer, keep it loud'}</textarea></div>
          <div class="row" style="gap:10px;flex-wrap:wrap">
            <button class="btn" id="b-gen">Generate</button>
            <button class="btn ghost" id="b-refine">Refine this one</button>
          </div>
          <p class="sub" id="b-status" style="min-height:18px;color:var(--text-3)"></p>
        </div>
      </section>
      <section class="card">
        <div class="pad between" style="border-bottom:1px solid var(--line)"><h2 class="h2">Preview</h2>
          <span class="lbl">${piece ? esc(piece.kind) + ' \u00B7 ' + esc(kit.name) : 'Nothing yet'}</span></div>
        <div class="pad" id="b-preview">${piece ? preview(piece) : '<div class="empty"><p class="sub">Describe a piece and it renders here in the brand\'s own identity.</p></div>'}</div>
        ${piece ? `<div class="pad between" style="border-top:1px solid var(--line);flex-wrap:wrap;gap:10px">
          <div class="row" style="gap:10px;flex-wrap:wrap">
            <select class="select" id="b-camp" style="min-height:38px;max-width:220px">
              <option value="">Attach to a campaign…</option>
              ${campaigns.map(c => `<option value="${c.id}">${esc(fmtDate(c.date))} \u00B7 ${esc(c.name)}</option>`).join('')}
            </select>
            <button class="btn sm" id="b-save">Save to campaign</button>
          </div>
          <span class="lbl" id="b-saved">${piece.campaign ? 'Attached to ' + esc((CAMPAIGNS.find(c => c.id === piece.campaign) || {}).name || piece.campaign) : 'Not attached yet'}</span>
        </div>` : ''}
      </section>
    </div>
    <section class="card">
      <div class="pad between" style="border-bottom:1px solid var(--line)"><h2 class="h2">Generated for ${esc(kit.name)}</h2>
        <span class="lbl">Shared with Wick</span></div>
      <div class="pad genwrap">${hist.length ? hist.map(p => `<button class="gencard" data-piece="${p.id}">
        <div class="genthumb" style="--a:${p.brand === 'ltw' ? '#b33624' : '#9bcf36'}"><span>${esc(p.subject)}</span></div>
        <div class="lbl" style="margin-top:11px">${esc(p.kind)} \u00B7 ${esc(fmtDate(p.date))} \u00B7 ${esc(p.by)}</div>
        <div class="sub" style="margin-top:4px">${esc(p.title)}</div>
      </button>`).join('') : '<p class="sub">Nothing generated for this brand yet.</p>'}</div>
    </section>
  </div>`;
}
function wireBuilder(root, S, rerender) {
  const brand = S.brand === 'both' ? 'ltw' : S.brand;
  let kind = 'Email';
  const status = root.querySelector('#b-status');
  root.querySelectorAll('[data-bk]').forEach(b => b.onclick = () => { S.brand = b.dataset.bk; window.BUILDER_PIECE = null; rerender(); });
  root.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => {
    root.querySelectorAll('[data-kind]').forEach(x => x.setAttribute('aria-pressed', x === b)); kind = b.dataset.kind;
  });
  root.querySelectorAll('[data-piece]').forEach(b => b.onclick = () => {
    window.BUILDER_PIECE = gread().find(p => p.id === b.dataset.piece); rerender();
  });
  const gen = async refine => {
    const brief = root.querySelector('#b-brief').value.trim();
    if (!brief) { status.textContent = 'Say what it is for first.'; return; }
    const kit = kitOf(brand), mod = root.querySelector('#b-mod').value;
    status.textContent = refine ? 'Refining\u2026' : 'Writing\u2026';
    let piece = null;
    if (window.claude?.complete) {
      try {
        const out = await window.claude.complete({ max_tokens:900,
          system:`You write ${kit.name} collateral, working strictly from their brand guide.
Positioning: ${kit.position}. Tagline: ${kit.tagline}.${kit.owner ? ' Owner: ' + kit.owner + '.' : ''}
Voice: ${kit.voice}
${kit.opener ? 'Open with "' + kit.opener + '" and no merge tag.' : 'No greeting line; lead with the headline.'}
Hard rules: ${kit.rules.join('; ')}.
Headlines are uppercase display type, so write them as short clipped sentences that read well in caps. Pick one word from the headline to highlight.
Never use em dashes. No emoji. Do not borrow the other brand's language, colors or imagery.
Reply with JSON only: {"title":"short internal label","eyebrow":"short kicker","subject":"headline","hi":"one word from the headline to highlight","preheader":"one short line","greeting":${kit.opener ? '"' + kit.opener + '"' : 'null'},"body":["paragraph","paragraph"],"cta":"primary call to action","cta2":${kit.ctaStyle === 'buttons' ? '"secondary action or null"' : 'null'}}`,
          messages:[{ role:'user', content:`${refine && window.BUILDER_PIECE ? 'Revise this piece: ' + JSON.stringify(window.BUILDER_PIECE) + '\n\nApply this note: ' : ''}${brief}${mod ? '\n\nBuild it around the ' + mod + ' module.' : ''}\n\nFormat: ${kind}.` }] });
        const j = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1));
        piece = { id:'g-' + Date.now().toString(36), brand, kind, date:new Date().toISOString().slice(0,10), by:'Builder', campaign:null, ...j };
      } catch (e) { status.textContent = 'That call failed. Nothing written.'; return; }
    } else {
      const base = gread().find(p => p.brand === brand) || SEED_GEN[0];
      piece = { ...base, id:'g-' + Date.now().toString(36), kind, date:new Date().toISOString().slice(0,10), by:'Builder', campaign:null, title:brief.slice(0, 48) };
      status.textContent = 'Model not reachable in this view, showing the last piece for shape.';
    }
    const rows = gread(); rows.unshift(piece); gwrite(rows);
    window.BUILDER_PIECE = piece;
    rerender();
  };
  const g = root.querySelector('#b-gen'), rf = root.querySelector('#b-refine');
  if (g) g.onclick = () => gen(false);
  if (rf) rf.onclick = () => gen(true);
  const save = root.querySelector('#b-save');
  if (save) save.onclick = () => {
    const id = root.querySelector('#b-camp').value; if (!id) return;
    const rows = gread(), p = rows.find(x => x.id === window.BUILDER_PIECE?.id) || rows[0];
    p.campaign = id; gwrite(rows); window.BUILDER_PIECE = p;
    const c = CAMPAIGNS.find(x => x.id === id);
    if (c) c.creative = (p.title || p.kind) + '.html';
    root.querySelector('#b-saved').textContent = 'Attached to ' + (c ? c.name : id);
  };
}
Object.assign(window, { screenBuilder, wireBuilder, gread, gwrite, GEN_KEY, kitOf });
