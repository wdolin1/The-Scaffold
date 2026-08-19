/* wick.js, the walk-with-me dock. Same brass tube as his room, shrunk to a
   sconce at the edge of the Command Center. Rules: never modal, never dims,
   never narrates. One line when something's worth saying, then it recedes.
   Real work happens in his room (Wick.html). */
class WickAssistant extends HTMLElement {
  static get observedAttributes(){ return ['state','screen','brand']; }
  connectedCallback(){
    if (this._built) return; this._built = true;
    this.attachShadow({mode:'open'});
    this.shadowRoot.innerHTML = `<style>
:host{--w-align:center;--w-amber:#d99a3d;--w-lit:#f5cd6a;--w-ink:#ecd9b2;--w-soft:#c9b48a;--w-mute:#8a7758;--w-dim:#5a4a36;--w-bg:#170f08;--w-panel:23,15,8;--w-rule:rgba(236,217,178,.14);--w-ui:"Karla",system-ui,sans-serif;--w-body:"Spectral",Georgia,serif;--w-disp:"Cormorant Garamond",Georgia,serif;position:fixed;inset:0;z-index:70;pointer-events:none}
.stack{position:absolute;right:0;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:14px}
.said{position:absolute;right:62px;top:50%;transform:translateY(-50%);display:flex;justify-content:flex-end}
*{box-sizing:border-box}
button,input{font:inherit;color:inherit}
/* the word he has, if he has one */
.aside{pointer-events:auto;max-width:300px;background:linear-gradient(90deg,rgba(var(--w-panel),0),rgba(var(--w-panel),.94) 18%);border-top:1px solid var(--w-rule);border-bottom:1px solid var(--w-rule);padding:15px 18px 15px 26px;opacity:0;transform:translateX(14px);transition:opacity .5s ease,transform .5s cubic-bezier(.2,.7,.3,1);visibility:hidden}
:host([say]) .aside{opacity:1;transform:none;visibility:visible}
.line{font-family:var(--w-body);font-size:13.5px;line-height:1.6;color:var(--w-soft);margin:0}
.acts{display:flex;align-items:center;gap:14px;margin-top:12px}
.acts button,.acts a{font-family:var(--w-ui);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--w-dim);background:none;border:none;cursor:pointer;padding:6px 0;text-decoration:none;transition:color .25s}
.acts button:hover,.acts a:hover{color:var(--w-amber)}
.ask{display:none;margin-top:12px;align-items:center;gap:8px;border-bottom:1px solid var(--w-rule)}
:host([asking]) .ask{display:flex}
.ask input{flex:1;background:none;border:none;outline:none;color:var(--w-ink);font-family:var(--w-body);font-size:14px;padding:9px 0;min-width:0}
.ask input::placeholder{color:var(--w-dim)}
.ask a{font-family:var(--w-ui);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--w-amber);text-decoration:none;padding:9px 0}
/* the tube */
.bar{pointer-events:auto;display:flex;align-items:center;gap:10px;padding:18px 12px 18px 8px;background:none;border:none;cursor:pointer}
.tube{position:relative;width:15px;height:186px;border-radius:10px;padding:5px 0;display:flex;justify-content:center;background:linear-gradient(90deg,#0e0904,#211708 34%,#312410 58%,#130c05);border:1px solid rgba(217,154,61,.34);box-shadow:inset 0 0 12px rgba(0,0,0,.9),0 2px 10px rgba(0,0,0,.6);transition:border-color .5s}
.core{width:5px;border-radius:4px;background:linear-gradient(to bottom,rgba(245,205,106,.35),rgba(245,205,106,.85) 12%,#fff0c8 50%,rgba(245,205,106,.85) 88%,rgba(245,205,106,.35));opacity:.42;box-shadow:0 0 8px rgba(217,154,61,.55);transition:opacity .6s,box-shadow .6s}
.wall{position:absolute;left:50%;top:50%;width:190px;height:300px;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,rgba(245,205,106,.26),rgba(217,154,61,.1) 44%,transparent 74%);opacity:0;transition:opacity .6s;mix-blend-mode:screen}
.tag{font-family:var(--w-ui);font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:var(--w-dim);writing-mode:vertical-rl;transform:rotate(180deg);transition:color .3s}
.bar:hover .core,:host([say]) .core{opacity:1;box-shadow:0 0 12px #f5cd6a,0 0 34px rgba(245,205,106,.7),0 0 80px rgba(217,154,61,.45)}
.bar:hover .wall,:host([say]) .wall{opacity:.85}
.bar:hover .tag,:host([say]) .tag{color:var(--w-amber)}
.bar:hover .tube,:host([say]) .tube{border-color:rgba(245,205,106,.66)}
:host([say]) .core{animation:flick 6s ease-in-out infinite}
@keyframes flick{0%,100%{filter:brightness(1)}46%{filter:brightness(.9)}52%{filter:brightness(1.09)}70%{filter:brightness(.96)}}
@media(max-width:760px){
  .stack{right:auto;left:50%;top:auto;bottom:0;transform:translateX(-50%);flex-direction:column}
  .said{right:auto;left:50%;top:auto;bottom:76px;transform:translateX(-50%);width:min(360px,92vw);justify-content:center}
  .aside{max-width:min(360px,92vw);border:1px solid var(--w-rule);border-bottom:none;background:rgba(var(--w-panel),.96);padding:15px 18px;transform:translateY(14px)}
  :host([say]) .aside{transform:none}
  .bar{flex-direction:column;padding:10px 18px 12px}
  .tube{width:160px;height:15px;padding:0 5px;flex-direction:column}
  .core{width:auto;height:5px;background:linear-gradient(to right,rgba(245,205,106,.35),rgba(245,205,106,.85) 12%,#fff0c8 50%,rgba(245,205,106,.85) 88%,rgba(245,205,106,.35))}
  .wall{width:300px;height:170px}
  .tag{writing-mode:horizontal-tb;transform:none}
}</style>
<div class="said"><div class="aside" role="status">
  <p class="line" id="w-line"></p>
  <div class="acts">
    <button id="w-ask">Ask</button>
    <a href="Wick.html" id="w-room">His room</a>
    <button id="w-hush">Hush</button>
  </div>
  <div class="ask"><input id="w-q" placeholder="Quick one…"><a href="Wick.html" id="w-go">Go</a></div>
</div></div>
<div class="stack"><button class="bar" id="w-bar" aria-label="Wick">
  <span class="tag">Wick</span>
  <span class="tube"><span class="core"></span><span class="wall"></span></span>
</button></div>`;
    const r = this.shadowRoot;
    r.getElementById('w-bar').addEventListener('click', () => {
      if (this.hasAttribute('say')) { this.toggleAttribute('asking'); if (this.hasAttribute('asking')) r.getElementById('w-q').focus(); return; }
      this.speak(this.observe(true) || "Nothing worth flagging on this screen. I'm here.");
    });
    r.getElementById('w-ask').addEventListener('click', () => { this.setAttribute('asking',''); r.getElementById('w-q').focus(); });
    r.getElementById('w-hush').addEventListener('click', () => this.hush());
    /* on the Command Center, his room has to know it came from a tool with no hub above it */
    const from = /Marketing(%20| )Command(%20| )Center/i.test(location.pathname) ? 'from=mcc' : '';
    r.getElementById('w-room').href = 'Wick.html' + (from ? '?' + from : '');
    const goto = () => { const q = r.getElementById('w-q').value.trim();
      const qs = [from, q ? 'ask=' + encodeURIComponent(q) : ''].filter(Boolean).join('&');
      location.href = 'Wick.html' + (qs ? '?' + qs : ''); };
    r.getElementById('w-go').addEventListener('click', e => { e.preventDefault(); goto(); });
    r.getElementById('w-q').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); goto(); } });
    // One look on arrival; nothing after that unless the screen changes.
    setTimeout(() => { const l = this.observe(); if (l) this.speak(l); }, 1400);
  }
  speak(line, hold = 13000) {
    this.shadowRoot.getElementById('w-line').textContent = line;
    this.setAttribute('say','');
    clearTimeout(this._t);
    this._t = setTimeout(() => { if (!this.hasAttribute('asking')) this.hush(); }, hold);
  }
  hush(){ this.removeAttribute('say'); this.removeAttribute('asking'); clearTimeout(this._t); }
  /* Silent unless this screen has something worth one sentence. */
  observe(force) {
    const screen = this.getAttribute('screen') || 'home';
    const said = this._said = this._said || {};
    if (!force && said[screen]) return null;
    said[screen] = 1;
    if (typeof CAMPAIGNS === 'undefined') return null;
    const all = CAMPAIGNS; // already merged at load in mcc-data.js
    const flagged = all.filter(c => c.status === 'flagged');
    const drafts = all.filter(c => c.status === 'draft');
    if (screen === 'home' || screen === 'campaigns') {
      if (flagged.length) return `${flagged[0].name} still has no attribution on it. Anything it pulled is landing nowhere.`;
      const behind = ['ltw','sq'].map(b => BRANDS[b]).find(B => B.leads / B.goal < .74);
      if (behind) return `${behind.short} is at ${behind.leads} of ${behind.goal} with the month better than half gone.`;
      if (drafts.length && screen === 'campaigns') return `${drafts[0].name} has been a draft for a while. Finish it or kill it.`;
      return null;
    }
    if (screen === 'links') return null;
    if (screen === 'detail') {
      const id = new URLSearchParams(location.search).get('id');
      const c = all.find(x => x.id === id);
      if (c && !c.attribution) return `No mechanism on this one, so its leads can't be traced. Assign a UTM or a tracked number before it ships again.`;
      return null;
    }
    if (screen === 'revenue' || screen === 'connections') return `Pipedrive isn't connected, so everything past lead count here is sample data. Don't quote it.`;
    return null;
  }
  attributeChangedCallback(name, old, val) {
    if (name === 'screen' && old && old !== val) { this.hush(); setTimeout(() => { const l = this.observe(); if (l) this.speak(l); }, 900); }
  }
}
customElements.define('wick-assistant', WickAssistant);
