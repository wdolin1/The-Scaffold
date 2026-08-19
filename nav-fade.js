/* nav-fade.js, the walk between rooms of the Command Center set. No wash, no
   glow: the page you are leaving settles back and dissolves, the one you arrive
   in lifts into place over the same backdrop, so the two reads as one move.
   Only pages listed in ROOMS get it; anything else navigates normally. */
(() => {
  const ROOMS = ['marketing command center.html', 'the docket.html', 'wick.html', 'business hub.html', 'scaffold hub.html'];
  const file = s => decodeURIComponent(String(s).split('?')[0].split('#')[0].split('/').pop() || '').toLowerCase();
  const slow = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (slow) return;
  const css = document.createElement('style');
  /* the backdrop has to be the room's own colour, or the dissolve flashes.
     Opacity only, never transform: a transformed body would become the
     containing block for fixed children (Wick's dock) and drag them down the
     page instead of holding them to the viewport. */
  css.textContent = `html{background:var(--bg,#1a120b)}
html.pagein body{animation:pgin .42s cubic-bezier(.2,.7,.3,1)}
html.pageout body{animation:pgout .26s cubic-bezier(.4,.02,.5,1) forwards}
@keyframes pgin{0%{opacity:0}100%{opacity:1}}
@keyframes pgout{0%{opacity:1}100%{opacity:0}}`;
  document.head.appendChild(css);
  document.documentElement.classList.add('pagein');
  addEventListener('pageshow', e => { if (e.persisted) document.documentElement.classList.remove('pageout'); });
  addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button || a.target) return;
    const href = a.getAttribute('href') || '';
    if (/^(#|mailto:|tel:|http)/.test(href)) return;
    const dest = file(href);
    if (!ROOMS.includes(dest) || dest === file(location.pathname)) return;
    e.preventDefault();
    document.documentElement.classList.remove('pagein');
    document.documentElement.classList.add('pageout');
    setTimeout(() => { location.href = href; }, 235);
  }, true);
})();
