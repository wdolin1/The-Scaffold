/* mode.js — the light switch. One flick decides whether the Scaffold's curtains
   are open (lit) or closed (dark). Mode is stored in cg_mode and applied to
   <html> before paint by a snippet in each page head, so there is no flash. */
const MODE_KEY = 'cg_mode';
(() => { const s = document.createElement('style');
  s.textContent = 'html.cg-no-tx,html.cg-no-tx *,html.cg-no-tx *::before,html.cg-no-tx *::after{transition:none!important}';
  (document.head || document.documentElement).appendChild(s); })();
const modeIsLit = () => document.documentElement.classList.contains('lit');
function setMode(lit) {
  const root = document.documentElement;
  root.classList.add('cg-no-tx');
  root.classList.toggle('lit', lit);
  void root.offsetWidth;
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('cg-no-tx')));
  try { localStorage.setItem(MODE_KEY, lit ? 'lit' : 'dark'); } catch (e) {}
  document.querySelectorAll('mode-switch, mode-chain').forEach(c => c.sync && c.sync());
  document.dispatchEvent(new CustomEvent('cg-mode', { detail:{ lit } }));
}
/* A plate with a rocker in it. Up is lit, down is dark. size="sm" for headers. */
class ModeSwitch extends HTMLElement {
  connectedCallback() {
    if (this._built) return; this._built = true;
    const sm = this.getAttribute('size') === 'sm';
    const W = sm ? 18 : 24, H = sm ? 30 : 38, R = sm ? 13 : 17;
    this.attachShadow({ mode:'open' });
    this.shadowRoot.innerHTML = `<style>
:host{display:inline-block;line-height:0}
button{display:flex;align-items:center;gap:${sm ? 7 : 8}px;background:none;border:none;cursor:pointer;padding:${sm ? '4px 6px' : '8px'};min-height:${sm ? 38 : 44}px;min-width:36px}
.plate{display:block;flex:none;position:relative;width:${W}px;height:${H}px;margin:0 auto;border-radius:3px;
  background:linear-gradient(160deg,var(--sw-plate-hi,#2b2013),var(--sw-plate-lo,#140d06));
  border:1px solid var(--sw-edge,rgba(236,217,178,.22));
  box-shadow:inset 0 1px 0 var(--sw-inner,rgba(236,217,178,.10)),0 1px 3px rgba(0,0,0,.5)}
.rocker{display:block;position:absolute;left:${sm ? 3 : 4}px;right:${sm ? 3 : 4}px;height:${R}px;border-radius:2px;
  background:linear-gradient(180deg,var(--sw-key-hi,#c9b48a),var(--sw-key-lo,#8a7758));
  box-shadow:0 1px 2px rgba(0,0,0,.5);
  transition:top .16s cubic-bezier(.3,1.6,.5,1),background .2s;top:${H - R - (sm ? 3 : 4)}px}
:host([on]) .rocker{background:linear-gradient(180deg,var(--sw-key-on-hi,#f5cd6a),var(--sw-key-on-lo,#c99a3d))}
button:active .rocker{transition-duration:.09s}
.lbl{display:${sm ? 'none' : 'block'};margin-top:${sm ? 0 : 7}px;font-family:"Karla",system-ui,sans-serif;font-size:${sm ? 7.5 : 8}px;
  letter-spacing:.24em;text-transform:uppercase;color:var(--sw-lbl,#8a7758);text-align:center;white-space:nowrap}
</style>
<button type="button" role="switch" aria-checked="false">
  <span class="plate"><span class="rocker"></span></span>
  <span class="lbl" id="m-lbl">Dark</span>
</button>`;
    this._up = (sm ? 3 : 4) + 'px'; this._down = (H - R - (sm ? 3 : 4)) + 'px';
    this.shadowRoot.querySelector('button').addEventListener('click', () => setMode(!modeIsLit()));
    this.sync();
  }
  sync() {
    const r = this.shadowRoot; if (!r) return;
    const lit = modeIsLit();
    this.toggleAttribute('on', lit);
    r.querySelector('.rocker').style.top = lit ? this._up : this._down;
    r.getElementById('m-lbl').textContent = lit ? 'Lit' : 'Dark';
    const b = r.querySelector('button');
    b.setAttribute('aria-checked', lit);
    b.setAttribute('aria-label', lit ? 'Turn the lights down' : 'Turn the lights up');
  }
}
customElements.define('mode-switch', ModeSwitch);
/* Older markup used <mode-chain>; same switch either way. */
customElements.define('mode-chain', class extends ModeSwitch {});
Object.assign(window, { setMode, modeIsLit, MODE_KEY });
