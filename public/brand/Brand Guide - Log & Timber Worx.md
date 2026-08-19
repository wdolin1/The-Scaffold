# Log & Timber Worx — Brand Guide

Handoff reference for producing LTW collateral (email, print, social). Everything below is taken from shipped pieces, not invented. If a value isn't here, match the nearest shipped piece rather than introducing something new.

---

## 1. Who they are

Log and timber home restoration and maintenance: media blasting, chinking, log replacement, staining and finish systems, ongoing maintenance programs.

- Owner: **Dan Link**
- Service area: **VA, WV, MD, PA, TN, DE** (six states)
- Positioning line: **Wood Restoration Specialists**
- Sign-off / tagline: **Plan Ahead with Confidence**
- LTW **acquired Shenandoah Log Homes in 2024**. LTW was never Shenandoah. Never write "formerly Shenandoah Log Homes." For that audience, the eyebrow is **"Now Home to Shenandoah Log Homes Customers"** and the transition is framed as a **name change**, not a new company.

---

## 2. Color

| Role | Hex | Use |
|---|---|---|
| Brick red | `#b33624` | Primary accent: links, thin rules, eyebrow italics, bullet dashes, hover-from state |
| Brick red dark | `#8f291b` | Link hover only |
| Gold | `#ffc20e` | Secondary accent: top band, hero eyebrows, highlighted words in headlines, timeline year labels, rules on dark |
| Charcoal (ink) | `#231f1e` | Headlines, logo bands, dark panels |
| Charcoal alt | `#2b2523` | Secondary dark panel when two darks are stacked |
| Charcoal rule light | `#4a423f` | Hairlines inside dark panels |
| Cream (email body) | `#f6f1e6` | Main email canvas |
| Cream deep (page backdrop) | `#dcd6c8` | Area *behind* the 600px email, print board backdrops |
| White | `#ffffff` | Cards inside cream, headline text on photos |
| Body text | `#3a3634` | Paragraphs on cream/white |
| Muted text | `#4f4e4f` | Labels, subject lines, captions |
| Body text on dark | `#ded8cc` | Paragraphs inside charcoal panels |

Rules of thumb:
- Two darks max per piece. Never introduce a third hue family (no blues, no greens).
- Gold is a **band and highlight** color, never a large fill behind body text.
- Brick red is used at hairline scale (3–5px rules) far more often than as a fill.

---

## 3. Type

Loaded from Google Fonts in every piece:

```
Oswald            ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700
DM Serif Display  ital@0;1
Inter             wght@400;500;600;700
```

Stacks (email-safe fallbacks matter — keep them):

```css
.f-os    { font-family:'Oswald','Segoe UI',Arial,Helvetica,sans-serif }
.f-inter { font-family:'Inter','Segoe UI',Arial,Helvetica,sans-serif }
.f-serif { font-family:'DM Serif Display',Georgia,serif }
```

### Roles

**Oswald** — all display. Condensed caps, always `text-transform:uppercase`.
- Hero headline: 54px / `line-height:0.94` / 700 / `letter-spacing:-0.01em` / white on photo with `text-shadow:0 4px 20px rgba(0,0,0,0.5)`. Mobile 34px.
- Section title: 30–44px / 700 / uppercase.
- Eyebrow: 12–14px / 600 / **italic** / `letter-spacing:0.18em–0.22em` / uppercase / gold on dark, brick on cream.
- Box label: 14px / 700 / `letter-spacing:0.16em` / uppercase / charcoal.
- Timeline label: 15px / 700 / `letter-spacing:0.12em` / uppercase / gold.
- Big phone number: 700, 34–44px, uppercase, tight tracking.

**DM Serif Display** — accents only, almost always **italic**. Reserved for the greeting ("Howdy," 30px italic brick) and the occasional pull quote. Never body copy, never a whole headline.

**Inter** — all body copy.
- Paragraph: 17px / `line-height:1.68` / `#3a3634`.
- Bullet / card copy: 15px / `line-height:1.55`.
- Caption, subject line, label: 14–15px / `#4f4e4f`.
- `<strong>` inside dark panels goes `#ffffff`.

Do not substitute Inter's display role with Archivo or Hanken — that was tried and rejected. Oswald condensed caps are the LTW signature.

---

## 4. Layout system (email)

- Container **600px** fixed, `max-width:600px`, `box-shadow:0 18px 50px rgba(35,31,30,0.16)`, sitting on `#dcd6c8`.
- Table-based HTML email throughout: `role="presentation"`, `cellpadding="0"`, `cellspacing="0"`, `border-collapse:collapse`, `mso-table-lspace/rspace:0pt`. Images `display:block`.
- Horizontal padding: **48px** desktop, **26px** mobile via `.px`.
- Preheader: hidden div, `display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:#f6f1e6`.
- Responsive breakpoint: `@media only screen and (max-width:620px)` with `.container`, `.px`, `.h1`, `.hpad`, `.logo`, `.hero`, `.stack` overrides.

### Standard stack, top to bottom

1. **Gold band** 9px, then **charcoal hairline** 3px. This pair is the LTW opening signature.
2. **Logo band** — `bgcolor="#231f1e"`, 18px/40px padding. Left: `photos/email-ltw-logo.png` at `height:66px` with `filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5))`. Right: gold italic Oswald eyebrow, e.g. "Wood Restoration Specialists."
3. **Photo hero** — 430px tall (280px mobile). Both `background=""` (Outlook) and CSS `background-image` with a gradient over the photo:
   ```
   linear-gradient(to bottom, rgba(35,31,30,0.05) 0%, rgba(35,31,30,0.34) 46%, rgba(35,31,30,0.92) 100%)
   ```
   Text sits `valign="bottom"`: gold italic eyebrow, then the big Oswald headline with one word in gold.
4. **Brick rule** 5px directly under the hero.
5. **Cream body** — DM Serif italic greeting, Inter paragraphs.
6. **Two-up cards** — white on cream, `border-top:4px solid`, charcoal for the "same/stayed" side and gold for the "better/new" side, 48% / 4% gap / 48%, `.stack` on all three cells so they stack on mobile. Bullets are an Oswald em-dash marker in brick in an 18px-wide cell, copy in Inter 15px. Keep the two columns' bullet counts and line lengths balanced so the cards render equal height.
7. **Dark feature panel** — `#231f1e` or `#2b2523`. Gold eyebrow, white Oswald title, `#ded8cc` copy, `#4a423f` hairlines. Timeline rows use a 96px Oswald gold year label + Inter description.
8. **CTA pair** — two buttons side by side: filled brick (`#b33624`, white Oswald caps) for the phone/booking action, outlined charcoal for the secondary download. Print/postcard pieces and Squeeky pieces use text CTAs instead; LTW email keeps buttons.
9. **Sign-off** — Dan Link, then **Plan Ahead with Confidence**.
10. **Footer** — charcoal, gold hairline, brick italic eyebrow line, address/contact in Inter `#4f4e4f`-on-dark equivalents.

### Print pieces
8.5×11 at 300dpi = **2550×3300px** with a **110px safe inset**. Scale all type proportionally (headlines land in the 130–270px range at that size).

---

## 5. Photography

Live in `photos/`. Real crew and job photography only — no stock, no illustration, no SVG-drawn scenes.

- Heroes: `deck-staining-cabin.png`, `bg-logwall.jpeg`, `summer-home.jpeg`, `email-summer-home.jpg`
- Crew at work: `work-staining.jpeg`, `crew-staining-door.png`, `crew-brush-door.jpeg`, `chinking-action.jpeg`, `work-chinking.jpeg`, `work-logreplace.jpeg`
- Problem/threat imagery: `carpenter-bee.jpeg`, `carpenter-bee-lg.jpeg`, `work-stainclose.jpeg`
- Before/after pairs: `before-*.jpeg` / `after-*.jpg`, `sm-blast-before-*` / `sm-blast-after-*`, and per-name pairs (`mike-`, `trevor-`, `ben-`)
- Logo: `photos/email-ltw-logo.png` (email band), `photos/ltw-logo.png`

Treatment: always a dark bottom-weighted gradient when type sits on the photo. Crop so a person or a working hand is visible when the photo is meant to read as "crew."

---

## 6. Voice

Plainspoken contractor talking to a homeowner. Direct, confident, a little folksy, never salesy or corporate.

- Openers: **"Howdy,"** — no merge tag, no `[First Name]`.
- Short declarative sentences. Concrete nouns. Second person.
- Headline pattern: two clipped sentences, often a contrast — "Same Crew. New Name on the Truck." / "Take a Walk Around 7 Tonight."
- Sign-off: **Plan Ahead with Confidence**, then Dan Link.

### Hard rules
- **No em dashes in prose.** (The em-dash bullet marker in cards is a graphic element, that's fine.)
- No emoji.
- No exclamation stacking, no "Act now," no urgency theater.
- Don't overclaim. Specifically off limits, all previously cut: a maintenance-only crew, "trained on your home," "every warranty and past agreement honored in full," "not just new jobs," "instead of a guess," "on a plan instead of a phone call," anything "formerly Shenandoah."
- No FAQ blocks on the reintroduction email.

---

## 7. Recurring content modules

**Three Threats** — the sun/water/pests framing that drives finish failure. Charcoal panel, three columns or three rows, gold numerals or labels.

**Clean / Dry / Sound** — three-word condition strip, Oswald caps, brick or gold dividers.

**60 Month Maintenance Program** — dark panel with a 5-year timeline:
- **Year 1** — wash, inspect, spot-treat with **Capture** and **Cascade**
- **Year 2–3** — maintenance coat of **Ultra 7** on the walls taking the most sun and weather
- **Year 4–5** — full refresh with **Q8** log oil, sealed and sound going into year six

**Growth story** (for reintroduction/acquisition copy) — Shenandoah ran a handful of crews; LTW fields several, backed by finish specialists, restoration experience, six-state coverage. Benefit: shorter waits, deeper expertise, crews coming back on a set schedule instead of only when something goes wrong.

**5-Year Maintenance Guide** — the gated PDF offered as the secondary CTA. Placeholder link token: `[PDF_LINK_HERE]`.

---

## 8. Build checklist

- [ ] Gold 9px + charcoal 3px band at the very top
- [ ] Hidden preheader present
- [ ] 600px container on `#dcd6c8`, cream `#f6f1e6` inside
- [ ] Oswald uppercase display, DM Serif italic only for the greeting/quote, Inter for all body
- [ ] Hero photo has the bottom-weighted charcoal gradient and a gold-highlighted word in the headline
- [ ] Real photography from `photos/`, cropped so people are visible
- [ ] Two-up cards balanced to equal height, `.stack` on all cells
- [ ] Zero em dashes in prose, zero emoji
- [ ] No "formerly" framing anywhere
- [ ] Sign-off is Dan Link + Plan Ahead with Confidence
- [ ] Mobile overrides present for container, padding, headline, hero height, logo
