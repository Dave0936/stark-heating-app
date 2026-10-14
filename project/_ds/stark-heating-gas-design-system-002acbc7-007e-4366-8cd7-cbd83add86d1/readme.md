# Stark Heating & Gas — Design System

Stark Heating & Gas is an independent, family-run plumbing and heating company based at 13 West End, West Calder, West Lothian (Scotland). Gas Safe engineers, 18+ years' experience. Services: new boiler installation, combi boilers, boiler servicing, boiler repair, central heating and gas services. The one product surface is the marketing website **starkheatingandgas.com** — a lead-generation brochure site whose job is to get a quote request or a phone call (01506 243550).

## Sources
- **Figma:** "Untitled (5).fig" / "Untitled (4).fig" — an html.to.design capture of the homepage (14/10/2026). Page-1 contains the homepage frame (node 1:3124, 1578w) and a component sheet (node 1:2258) with 13 auto-named component sets ("Component 1"…"Component 13"; each listed twice in the file metadata = 26 sets) and 130 Figma variables in one collection "starkheatingandgas.com". No text styles are defined.
- **Uploads:** `uploads/Stark-Heating-Gas-Logo.svg` (official logo), Montserrat OTFs (Hairline, Light, Regular, Bold, ExtraBold, Black), full-page screenshots of Home, New Boiler Installation, Combi Boiler, Boiler Repair, Central Heating.

## Index
- `styles.css` — global entry; `@import`s only.
- `tokens/` — `fonts.css` (local Montserrat), `fonts-google.css` (Montserrat 600 + Inter substitutes), `figma/fig-tokens.css` (all 130 Figma variables, verbatim), `figma/fig-typography.css` (empty — file has no text styles), `colors.css`, `typography.css`, `spacing.css` (semantic aliases).
- `assets/` — `logo.svg` (original), `logo-clean.svg` (metadata stripped), `icons/*.svg` (14 glyphs), `images/` (hero, about, 6 service photos, 3 advice photos, favicon, 3 review avatars).
- `components/` — React primitives Component1–13 (see below), one `@dsCard` per folder.
- `guidelines/` — foundation specimen cards (colours, type, spacing, radii, imagery).
- `ui_kits/website/` — click-through homepage + service page recreation.
- `thumbnail.html`, `SKILL.md`.

## Components
Components use the Figma family names verbatim (the file's sets are auto-named "Component 1"…"Component 13"; each appears twice in the file metadata — once on the homepage capture, once on the component sheet — giving 26 sets for 13 families). Exact values are copied from the Figma JSX.

- **Component1** (brand/) — logo lockup (`variant="logo"`, Figma variant 1) and the glyph set (named or Figma variant 2–29: pencil, phone, chevrons, caret, stars, google, facebook, instagram, arrows)
- **Component2** (navigation/) — header nav link / blue dropdown item
- **Component3** (navigation/) — header item with caret + hover dropdown
- **Component4** (buttons/) — square red/blue CTA, Figma variants 1–7
- **Component5** (cards/) — service-card title bar
- **Component6** (cards/) — service photo tile (red → blue on hover)
- **Component7** (cards/) — Help & Advice article card
- **Component8** (buttons/) — "See all reviews" pill (reviews widget)
- **Component9** (reviews/) — reviews-widget name labels
- **Component10** (reviews/) — 5-star rating
- **Component11** (navigation/) — footer text link
- **Component12** (navigation/) — red square social link
- **Component13** (reviews/) — floating Google Rating badge

### Duplicate sets (component sheet)
The file's inventory counts 26 sets because every family is listed twice: once as captured on the homepage frame (node 1:3124) and again on the html.to.design component sheet (node 1:2258). The sheet copies are exported as pass-throughs with identical API:
- Component_1, Component_2, Component_3, Component_4, Component_5, Component_6, Component_7, Component_8, Component_9, Component_10, Component_11, Component_12, Component_13

Use the primary names (Component1 … Component13) in new work.

Shared glyph/logo data lives in `components/brand/glyphs.js` (internal). `ReviewCard` (the repeated review frame) lives in the UI kit only. No intentional additions.

## CONTENT FUNDAMENTALS
- **Voice:** plain, warm, local, reassuring. "We" for the company, "you" for the homeowner. "As a local family business, we have over 18 years' experience." Trust words recur: *independent, trusted, reliable, recommended, Gas Safe, family-run, local*.
- **Place names** carry credibility: West Lothian, West Calder, Livingston, Bathgate, Whitburn.
- **Casing:** Title Case for buttons, nav and card titles ("Get A Quick Quote", "Read More About Us", "New Boiler Installation" — even "A" is capitalised). Sentence case for page hero H1s on service pages ("New boiler installations in West Lothian") and section headings ("Trusted, reliable and recommended").
- **CTAs** are imperative and short: Get A Quote, Contact Us, View Services, View More Advice. The phone number itself is a button label.
- **Advice titles** are question/benefit headlines: "Is Poor Water Quality Costing You Money?", "The Benefits of Smart Heating Controls".
- British spelling (organisation, enquiries). No emoji, no exclamation-heavy hype (one "worry-free"/"we're here for you!" at most), no jargon beyond trade terms (combi, Powerflush, Gas Safe).

## VISUAL FOUNDATIONS
- **Colour:** white page; Stark red rgb(189,18,46) is the primary action colour; Stark blue rgb(2,87,189) is the secondary/alternate. Every interactive coloured surface darkens on hover (red→rgb(147,16,38), blue→rgb(0,66,147)); service tiles swap red→blue. Text is a single charcoal rgb(51,51,51) — headings and body alike. Section bands alternate white / light grey rgb(239,239,239) / charcoal rgb(51,51,51). The logo's flame uses red and blue ramps (in tokens) — don't use those ramps in UI.
- **Type:** Montserrat throughout. SemiBold 600 for H1 (46/64.4), H2 (30/48 & 27/37.8), card titles (20/28, 18/25.2), nav (17/27.2) and buttons (14/22.4, +0.5px tracking). Regular 400 for lead (20/32), body (15/24), footer (13/20.8). Inter appears only inside the embedded Google reviews widget.
- **Layout:** 1366px max content, 20px inner gutter, 110px header (logo left, nav centre, two CTAs right). 3-column grids (service tiles 418.66w, advice cards with 40px gaps). Sections pad 70px vertically. 50/50 image-text splits with text padded 80px left / 60px right. Floating Google Rating badge fixed bottom-left (left 30px).
- **Shape:** Everything Stark-owned is square — 0 radius on buttons, tiles, dropdowns, social squares, images. Radii (2/8/12/round) and soft drop shadows appear only in the third-party reviews widget.
- **Cards:** no borders, no shadows. Service tile = full-bleed photo + solid red 56px bar with white title + chevron. Advice card = photo + centred title, no container.
- **Backgrounds/imagery:** real photography of the actual team, van and installs — bright, natural daylight, neutral/warm, slightly saturated, no grain or filters. Hero is a full-bleed photo with a left-to-right black protection gradient (0.8 → 0.5 → 0) under white type. No illustrations, patterns or textures.
- **Hover:** colour shifts only (text #333→red; fills darken; tile red→blue; widget pill gains slightly deeper shadow). No scale, no underline (except widget links).
- **Press / focus:** not specified in the source — use the hover colour.
- **Motion:** essentially none; dropdowns appear instantly on hover; review carousel slides horizontally. Keep any transitions short and ease-out.
- **Transparency/blur:** only the hero gradient. No glassmorphism.
- **Borders:** only 1px rgb(204,204,204) on round carousel arrows.

## ICONOGRAPHY
- The site uses **Font Awesome-style solid glyphs** (layer names reference FontAwesome) at 11–16px: pencil (quote/contact), phone, chevron-right, chevron-down, caret-down (nav), plus thin arrows, stars and Google/Facebook/Instagram marks in the reviews widget and footer. These were extracted from the Figma file into `components/brand/glyphs.js` (rendered via `Component1`) and `assets/icons/*.svg` — use those, don't substitute.
- Glyphs are always white inside coloured buttons/bars, or charcoal/grey in nav and arrows. Stars are orange rgb(251,142,40).
- Service pages also show red circular pictogram icons (survey, installation, aftercare…) — these are **not in the Figma source** and aren't included; ask for the files.
- No emoji, no unicode icon characters.
- Logo: `assets/logo.svg` / `<Component1 variant="logo"/>` — full-colour flame + STARK / HEATING & GAS. Never redraw.

## Font substitution
Montserrat **SemiBold (600)** — the most-used weight — and **Inter** were not supplied; both load from Google Fonts (`tokens/fonts-google.css`). Supply `Montserrat-SemiBold.otf` to make the system fully self-hosted.
