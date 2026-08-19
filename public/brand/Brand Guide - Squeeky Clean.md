# Squeeky Clean — Brand Guide

Handoff reference for producing Squeeky Clean collateral (email, postcard, flier, social). Values are taken from shipped pieces. Squeeky is a **separate brand from Log & Timber Worx** — do not mix palettes, fonts, or logos between them.

---

## 1. Who they are

Exterior cleaning: soft washing, house washing, window cleaning, gutters, roofs, driveways and patios. Residential, route-based, repeat-visit business.

- Mascot-forward, friendly, high-energy — the inverse of LTW's restrained craftsman tone.
- Rally line seen on collateral: **We Fight Dirty**
- Bundle/offer language and phone-first CTAs carry most pieces.

---

## 2. Color

| Role | Hex | Use |
|---|---|---|
| Green | `#9bcf36` | Primary energy color: bands, highlight bars, pull quotes, checkmarks, hairlines on navy |
| Green dark | `#7bab24` | Green type on white, hover, secondary accents |
| Blue | `#176b8d` | Links, labels, eyebrows, secondary type |
| Light blue | `#55b0d9` | Top bands, kicker type on navy, dashed dividers, tab accents |
| Navy | `#0e3c56` | Headlines on light, primary dark panel |
| Navy deep | `#0a2e42` | Full-bleed dark backgrounds, print boards, footers |
| Cream / pale blue | `#eef6fb` | Light panel fill |
| Page backdrop (email) | `#dfeef7` | Area behind the 600px email |
| Print board backdrop | `#c9c4bb` | Neutral behind print sheets |
| White | `#ffffff` | Cards, reverse type |
| Body text on light | `#43687c` | Paragraphs |
| Body text on navy | `#12384a` (on green) / `#eef6fb` (on navy) | Contextual body |
| Neutral print type | `#3d3a34`, `#6b665c` | Board labels above print sheets only |

Also used: a **pale green field** (a light tint of `#9bcf36`) as a full email background with navy type. Keep the tint restrained — a saturated green field was tried and pulled back.

Rules of thumb:
- Green and navy are the identity. Light blue is a supporting band color, blue `#176b8d` is a *type* color.
- One dark (navy) per piece. Don't stack navy and near-black.
- No brick red, gold, or cream from the LTW palette. Ever.

---

## 3. Type

Two stacks, depending on medium:

**Email** — Open Sans only (email-client safety):
```
Open Sans  ital,wght@0,400;0,600;0,700;0,800;1,600;1,700
.f-os { font-family:'Open Sans','Segoe UI',Arial,Helvetica,sans-serif }
```

**Print / social / flier** — Archivo for display, Open Sans for body:
```
Archivo    ital,wght@0,600;0,700;0,800;0,900;1,800;1,900
Open Sans  ital,wght@0,400;0,600;0,700;0,800;1,700;1,800
--disp:'Archivo',system-ui,sans-serif;
--body:'Open Sans',system-ui,sans-serif;
```

### Roles

Display (Archivo 800/900, or Open Sans 800 in email) — always **uppercase**, tight tracking, often **italic** for punch.
- Email hero headline: 42–52px / 800 / `letter-spacing:-0.02em` / `line-height:1` (mobile 38–42px)
- Email section head: 36px / 800 / uppercase / navy
- Print hero: Archivo 900, up to 270px, `line-height:0.84`, `letter-spacing:-0.035em`
- Italic display: Archivo 900 italic for subheads and list items — the Squeeky signature move
- Label / eyebrow: 12px / 800 / `letter-spacing:0.14em`–`0.22em` / uppercase / blue on light, light blue on navy
- Big phone: 800/900, 30–86px depending on medium, navy

Body — Open Sans.
- Paragraph: 15px / `line-height:1.55` / `#43687c`
- Print body: 600/700 weight, 33–36px at 2550px scale
- Body copy runs heavier than LTW's (600–700 vs 400) — that weight is part of the brand's loudness.

No serif anywhere in Squeeky. No condensed faces (that's LTW).

---

## 4. Layout system (email)

- Container **600px** fixed on `#dfeef7`, table-based email HTML, same technical conventions as any HTML email: `role="presentation"`, zeroed cellpadding/spacing, `mso-table-lspace/rspace:0pt`, `img{display:block}`.
- Horizontal padding **26px** mobile via `.px`.
- Breakpoint `@media only screen and (max-width:620px)` with overrides for `.container .px .h1 .h1xl .stack .hero .photo .tallphoto .phone .mascot .btn a`.
- Hero heights: 330px mobile / larger desktop. Inline photos `.photo` 210px, `.tallphoto` 230px.

### Format variety is the rule
Squeeky sequences deliberately look different send to send. Four shipped builds in the August sequence, and they are the reference set:

1. **Photo poster** — full-bleed photo hero, no logo band at top, headline over image.
2. **Pale green field** — light green background, navy type, checklist structure.
3. **Split editorial** — two-column split page, hairline rules, a capacity/availability strip.
4. **Dark navy close** — navy field, green pull quote, last-call framing.

Do not reskin one layout four times. Structural variation is the brief.

### Components
- **Green highlight bar** — inline green block behind display type, `padding:26px 40px`, navy type inside.
- **Checklist** — circular badge (light blue, or green in emphasis columns) with a check glyph, Archivo italic caps item text.
- **Dashed divider** — `4px dashed #a9c0cd` for tear-off tabs and column splits; `5px solid rgba(85,176,217,0.35)` for column rules on navy.
- **Pull-tab strip** (print/hiring) — navy header bar, dashed vertical tabs with rotated `-90deg` contact stacks.
- **QR block** — 206px square, `6px solid navy` border, white fill, Archivo caps caption under it. Assets: `qr-site.png`, `qr-newmover.png`, `qr-gen-postcard.png`.
- **Mascot** — used as a personality accent, `.mascot` ~104px on mobile.

### CTAs
**No buttons on Squeeky emails.** They close with a text CTA block: uppercase Archivo/Open Sans display line, a large phone number, and a green rule. Print pieces may use a filled green bar or a stamp/roundel.

### Print
8.5×11 at 300dpi = **2550×3300px**, safe inset **110px**. Facebook 4:5 variant = **2550×3188px**. Print sheets sit on `#c9c4bb` with a neutral Archivo board label above them.

---

## 5. Assets

All in `squeeky-assets/`.

- Logos: `squeeky-logo.png`, `squeeky-logo-2x.png`, `logo-tight.png`
- Mascot: `squeeky-mascot.png`, `squeeky-mascot-2x.png`, `logo-mascot.png`, `logo-mascot-v2.png`, `logo-mascot-white-eyes.png`
- Rally graphic: `we-fight-dirty.png`
- Texture / decoration: `bubble-texture.png`, `bubble-texture-2x.png`, `bubbles-green.png`, `bubbles-light.png`, `bubbles-white.png`, `sparkle-green.png`, `sparkle-white.png`, `wave-graphic.png`
- Crew and job photos: `crew-truck-washing.png`, `crew-truck-house.jpeg`, `crew-softwash-house.png`, `crew-patio-wash.jpeg`, `crew-patio-rinse.png`, `crew-photo.jpg`, `tech-softwash-brick.jpeg`, `tech-softwash-wide.jpeg`, `tech-windows-tall.jpeg`, `tech-windows-wide.jpeg`
- QR: `qr-site.png`, `qr-newmover.png`, `qr-gen-postcard.png`

Bubbles and sparkles are accents at low density — a scattering, never a wallpaper.

---

## 6. Voice

Upbeat, punchy, neighborly. Short lines, high contrast, a little playful. Where LTW is measured, Squeeky is loud.

- Headline pattern: rhythmic pairs and rhymes — "Back to School, Back to Clean."
- Verbs first. Uppercase display. Offers and bundles stated plainly.
- Phone number is the hero of every CTA.
- Keep it clean-humored; the mascot carries the fun so the copy doesn't have to strain.

### Hard rules
- No buttons in email — text CTA + big phone + green rule.
- Don't oversaturate the green field background.
- No LTW colors, fonts, or wood/timber language.
- Footers stay deep navy with a green hairline (a sky-blue footer was tried and rejected).
- No emoji in body copy.

---

## 7. Build checklist

- [ ] Palette limited to green / navy / light blue / blue + neutrals
- [ ] Archivo 800–900 uppercase display (Open Sans 800 in email), Open Sans body at 600–700
- [ ] No serif, no condensed type
- [ ] Layout structurally distinct from the previous send in the sequence
- [ ] Text CTA, not a button; phone number large
- [ ] Deep navy footer with green hairline
- [ ] Mascot or bubble accent present but not wallpapered
- [ ] Real crew photography from `squeeky-assets/`
- [ ] Print at 2550×3300 (or 2550×3188 for 4:5) with 110px safe inset
- [ ] Mobile overrides for container, padding, headline, hero, photo heights, phone, mascot
