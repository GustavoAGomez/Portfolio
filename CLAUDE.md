# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A scroll-driven WebGL portfolio. Reconstructed clean (Vite + React 18 + TS strict) from
the pmndrs "moksha" demo — which lives, untouched, at `../moksha-reference` as read-only
reference. Only two ideas were ported from it: the `factor`-based parallax and the
chromatic-aberration shader. Everything else (store, scroll, refraction, routing, case
studies) is a modern rewrite.

The site is one persistent canvas SPA: a **Home** (name + diamond lens + interactive works
list) and per-project **detail pages** at `/work/:id`. A detail page is either a full
**case study** (projects that have content in `config/projectContent.ts`) or a generic
placeholder detail (the rest). The real case study is **Tagorodive** (`/work/tagorodive`).

## Commands

- `pnpm dev` — Vite dev server (http://localhost:5173). Append `?debug` for r3f-perf + Leva.
- `pnpm build` — `tsc --noEmit` typecheck then `vite build`.
- `pnpm typecheck` — strict typecheck only (`strict` + `noUncheckedIndexedAccess`).
- `pnpm preview` — serve the production build.

There is no test runner or linter configured. Prettier config is `.prettierrc`.

## Architecture (the parts that span files)

**One persistent, fixed orthographic `<Canvas>` (z:0) behind a scrollable semantic DOM (z:10).**
Lenis drives everything; the DOM only provides scroll height + accessible text.

- **Scroll is the single source of truth, in a hybrid zustand store** (`src/scroll/store.ts`).
  The fast-changing values live in `store.scroll` — a **stable object mutated in place**
  (never via `set`), so the ~60fps churn triggers **zero React re-renders**. Read it with
  `useStore.getState().scroll.*` inside `useFrame`/rAF. Reactive slices (section `bounds`,
  `reducedMotion`, `caseStudyId`) do use `set` and change rarely. `SectionId` is the union of
  every section id (`hero | statement | description | story | works | gallery | about | footer`).
- **`useLenis`** (`src/scroll/`) creates Lenis, drives its rAF, and on each scroll event writes
  `scrollY / progress / rawVelocity` (normalized) into `store.scroll`. Mounted once in `SiteShell`.
  On coarse-pointer (touch) devices it enables **`syncTouch` + `touchMultiplier: 1.6`** — native
  touch scrolling bypasses Lenis (speed untunable, and no velocity → no chromatic effect on flicks);
  syncTouch hands the gesture to Lenis so both work. Feel tuning: **`touchMultiplier` MUST stay 1**
  (it scales the DRAG too — anything ≠1 breaks the 1:1 finger tracking and reads robotic on iOS;
  speed lives in the flick instead), `touchInertiaExponent` (touchend glides `|velocity|^exp` px,
  default 1.7, currently 1.8) + `syncTouchLerp` (glide ease-out, default 0.075, currently 0.06).
  Desktop wheel behaviour unchanged.
- **`ScrollBridge`** (inside the Canvas) is the store→frame integrator: each frame it damps
  `velocity` toward `rawVelocity` and decays `rawVelocity` to 0. This is **why the Canvas is
  `frameloop="always"`** — the chromatic decay must keep advancing while React is idle.
- **Parallax** (`src/canvas/parallax/`, ported from moksha `blocks.jsx`): `<Block factor anchor>`
  lerps its group's y toward `((scrollY + vh/2) - anchor()) * worldPerPixel * factor` each frame.
  factor 1 = tracks its section; >1 foreground, <1 background. `anchor` is a **live getter**
  (usually `useSection().getCenter`) so resize just works. Under reduced-motion factor collapses to 1.
- **Chromatic shader** (`src/canvas/materials/ChromaticPlaneMaterial.ts`, ported from moksha
  `CustomMaterial.js`): RGB-split + sinusoidal vertex wobble + UV zoom, all driven by `uShift`.
  `<ChromaticPlane>` lerps `uShift` toward `store.scroll.velocity` per frame — **the decay to
  rest is that lerp, not the shader**. Any texture works as `map`, incl. a **VideoTexture** — so
  video planes get the exact same red/blue trail + parallax. drei's `shaderMaterial` doesn't
  surface uniform props on the instance type, so the impl type is intersected in explicitly.
- **Refraction — the diamond is a LENS** (`src/canvas/Diamonds.tsx` + `materials/{Backface,Refraction}Material.ts`):
  the hand-rolled double-FBO technique ported verbatim from moksha (**GLSL unchanged — do not
  touch the shaders**). `envFbo` = the whole scene on **layer 0** (incl. 3D `<Text>`); `backfaceFbo`
  = the gem's back-faces as normals on **layer 1**; `RefractionMaterial` samples `envFbo` at a screen
  UV bent by `refract()` — so the gem **warps whatever is behind it**, not an HDRI reflection. The
  `instancedMesh` is on layer 1 (excluded from `envFbo`, never self-refracts). A **priority-1
  `useFrame` owns the render loop** (renders straight to screen in the exact moksha pass order),
  so R3F auto-render is off. Scale is viewport-relative (`s = contentMaxWidth/35 * scale`). FBOs
  are recreated + disposed on resize (`useMemo` on size). The shiny fresnel makes camera-facing
  facets bright — that's the gem look, intended. Two perf valves (GLSL untouched):
  - **When NO gem instance is visible** (all hidden or collapsed to ~0 — e.g. deep in a case study
    after `shrinkPastHero`), the frame skips the whole multipass and does ONE manual scene render
    (same clear, so the background tone doesn't shift). 4 scene renders/frame → 1 exactly where
    the story videos + chromatic planes live.
  - **The FBOs are the refraction SOURCE and must never render below the screen buffer.** The gem
    MAGNIFIES what it samples, so any resolution cap here is magnified into visible stair-steps —
    that is exactly what an earlier ≤1.5 cap did on phones (moksha, which looks right on mobile,
    renders them at the full pixel ratio). Measured on a fixed phone frame: parity = +10% edge
    sharpness over that cap, 1.5× supersampling = +38%. So `fboSupersample()` samples 1.5× FINER
    than the screen (1× on `deviceMemory ≤ 4`, still parity), and `FBO_MAX_TEXELS` may only trim
    the SUPERSAMPLING — `Math.max(ratio, …)` keeps the parity floor, since on a big laptop parity
    alone already exceeds the ceiling. The `resolution` uniform stays the SCREEN buffer size (it's
    the `gl_FragCoord` domain); the maps are sampled at normalized UVs, so FBO size is independent
    of it. Quality knob: `FBO_MAX_TEXELS` / the supersample factor in `Diamonds.tsx`.
  - **CRITICAL: no EffectComposer.** A postprocessing composer would fight the manual multipass
    and kill the lens. Grain + vignette are a **CSS overlay** (`.fx-overlay` in `index.css`,
    mounted in `SiteShell`) instead. Background is a **clear color** (`onCreated → gl.setClearColor`),
    not `scene.background` (which repaints every pass and would wipe the scene render).
  - The Home headline MUST stay a 3D `<Text>` on layer 0 (`canvas/modules/HeroScene.tsx`) for the
    gem to refract it; the DOM keeps only an `sr-only` `<h1>`. Debug tooling (leva/r3f-perf) is
    lazy-imported behind the `?debug` dev flag — leva injects CSS on import, so a static import
    would survive tree-shaking into the prod bundle.

## Routing & section sets (ONE persistent canvas)

Single-canvas SPA on `react-router-dom` v6. The **canvas is never torn down across routes** —
only which sections are active changes.

- **`SiteShell`** (`src/components/`) is mounted ONCE above the router (`main.tsx`:
  `<BrowserRouter><SiteShell/></BrowserRouter>`). It owns the fixed `<Canvas>` (Scene), the
  `.fx-overlay`, the scrollable `<main>`, and the single Lenis instance (`useLenis`, called here —
  not per page). There is no `App.tsx`; SiteShell replaced it. It also wraps everything in
  `TransitionProvider` and mounts the `RouteBackButton`.
- **The URL is the single source of truth for the active section set.**
  `routes/activeSections.ts#activeSectionsFor(pathname)` returns one of FIVE sets; SiteShell feeds
  it to BOTH `<main>` (DOM) and `<Scene sections>` (WebGL). No global `enabled` flag.
- **`src/config/sections.ts`** holds the section REGISTRY (`Record<SectionId, SectionConfig>` — every
  id must have an entry) and composes four disjoint route sets:
  - `HOME_SECTIONS = [hero, works]` — landing: name + diamond lens + interactive works list.
  - `DETAIL_SECTIONS = [statement, gallery, about, footer]` — generic placeholder detail (projects
    with no case-study content); `gallery` = the 3D chromatic-plane module (`Gallery` DOM + `WorksScene`).
  - `CASE_STUDY_SECTIONS = [statement, description, about, story, footer]` — a real case study; `story`
    (media walkthrough) replaces the generic `gallery`, and `description` (the brief) is inserted.
  - `ABOUT_SECTIONS = [profile, footer]` — `/about`, the personal About Me (see below).
  - `NOT_FOUND_SECTIONS = [notFound]` — the 404 page: statement-style message (`sections/NotFound`)
    + a giant dim ambient "404" behind it (`NotFoundScene`, statement recipe; no diamond → R3F
    auto-render). CTA back home with the warp.
  - **`activeSectionsFor`**: `/` → HOME; `/about` → ABOUT; a valid `/work/:id` → CASE_STUDY if
    `getProjectContent(id)` exists, else DETAIL; **anything else — unknown path OR unknown /work id
    — → NOT_FOUND. There are NO redirects**: the wrong URL stays in the bar and the 404 set renders
    in place (SiteShell has no `<Routes>` block anymore; route matching had no job left).
  - **To move a section between routes, move it between those arrays.** Sets are disjoint, so
    navigation unmounts one set and mounts the other cleanly (bounds re-register, no orphans).
- Rows in `WorksList` navigate with the transition (below). `RouteBackButton` shows on every
  non-home route (details, /about, 404).
- **On navigation**, SiteShell resets scroll (`lenis.scrollTo(0,{immediate,force})` + `scrollY=0` +
  `lenis.resize()`) **and zeroes `rawVelocity`/`velocity` AFTER the jump** — the immediate scrollTo
  emits a scroll event whose delta saturates the velocity, and every chromatic plane on the new
  route would render wobbled/zoomed ("media at the wrong size") until the decay finished. It also
  sets `store.caseStudyId` from the URL. `<Section>` unregisters bounds on
  unmount, so no orphan bounds survive a route change.

### Route transition — the WARP (`src/transition/TransitionProvider.tsx`)
`useTransition().go(to)` navigates with a **liquify/warp**: it deforms the REAL content (no texture
capture) via an SVG `feDisplacementMap` applied to `#warp-fixed` (the fixed canvas+grain layer) and
`#warp-main` (the scrollable DOM) — only during the transition, so idle keeps the canvas's
`position:fixed` + Lenis untouched. One GSAP timeline drives displacement 0→peak→0, a `seed` boil, a
scale/skew punch, and an opaque cover (+ brief RGB-split flash & grain) hiding the route swap. A
safety timeout force-finishes and clears inline styles. reduced-motion navigates instantly; browser
back/forward plays the recompose (deform-in) only. `RouteBackButton` uses it to return Home.
**The Canvas measures itself with `resize={{ offsetSize: true, … }}`** (layout size, not
`getBoundingClientRect`): the warp's scale transform on `#warp-fixed` inflates the bounding rect, and
without offsetSize R3F resized the whole world ~19% during every transition (story media visibly
oversized, snapping back only when the warp cleared). Keep offsetSize when touching Canvas props.

### Two render modes — the diamond owns the loop on Home AND on case studies
- **Diamond present** (Home hero, or a case-study `description`): `<Diamonds>` runs a **priority-1
  `useFrame`** → it OWNS the render loop (manual double-FBO passes, R3F auto-render off).
- **No diamond** (generic DETAIL): R3F resumes its own auto-render.
- The bridge: `Diamonds` flips `gl.autoClear=false` + `camera.layers.set(1)` every frame and
  **restores both on unmount** (`autoClear=true`, `layers.set(0)`). Without that restore, navigating
  to a no-diamond route renders black. `Scene` mounts `<Diamonds>` when the active set contains
  `hero` **or** `description`; diamond instances whose section isn't active are scaled to 0.
- **Manual loop renders the clear colour darker** than R3F auto-render (≈#0e0e0f → rgb 6–7 vs 17).
  The case study compensates with a fixed grey background plane (see below).

`<Section>` measures its rect and registers document-space bounds; `useSection(id)` exposes live
`getProgress()` / `getCenter()` that scene modules read in `useFrame`. Each
`canvas/modules/<Id>Scene.tsx` is self-contained and consumes only its own section.

## Case studies (`/work/:id` with content)

A case study is entirely **data-driven** from `src/config/projectContent.ts` and rendered by the
shared detail sections, which **branch on whether `content` exists**.

- **Data model** (`projectContent.ts`, i18n-ready — a future `getProjectContent(id, locale)` can
  return the same shape): `ProjectContent { title, tagline, intro?{heading, paragraphs[]},
  blocks: StoryBlock[], credits{role, summary, stack[], year?, client?}, nextId? }`, where
  `StoryBlock { heading, copy, image? | video?, aspect? }`. `getProjectContent(id)` returns it or
  `undefined`. Everything is optional/degradable. Copy is Spanish, in DATA (no translator built).
  **The Tagorodive copy describes the DEVELOPMENT work** (hero video, GSAP map zoom, carousels,
  responsive) — NOT the client's promotional text.
- **`useCurrentProject()`** (`routes/`) resolves `{id, project, content}` for the current route via
  `useLocation` (NOT `useParams`) — the detail sections render inside `<main>`, outside `<Routes>`,
  so they only have the URL, not a route match.
- **Section roles** (each `sections/*.tsx` branches on `content`):
  - `Statement` → project **title + tagline** (centered). Overline decodes on landing (below).
  - `Description` → the **brief** (overline "Encargo", heading, paragraphs). **Right-aligned**
    (`justify-end` + `text-right`) so text alternates left/right down the page. `min-h-[78svh]`.
  - `About` → **credits** (overline "Trabajo", role, summary, stack chips, client·year). `min-h-[72svh]`.
  - Both carry `py-[12svh]`: min-h only guarantees air while content is SHORTER than it — long copy
    on phones outgrows the box and the next section starts glued to the last line without the py.
  - `Story` → the **media walkthrough** (overline "Detalles"): ≥lg one full-viewport slot per block
    with heading+copy opposite the media; <lg compact slots (spacer + copy under it). It MEASURES
    the per-block media centers into `store.storyAnchors` for StoryScene (see Responsive).
  - `Footer` → **next project** link (`nextId`) navigated with the warp transition; else a generic
    mailto.
  - (`Description`/`About` were shortened from `min-h-screen` to tighten the gap between them.)
- **`StoryScene`** (`canvas/modules/StoryScene.tsx`) is the media layer: one **`<ChromaticPlane>` per
  block** inside a `<Block>`, so every image/video gets the RGB-split trail + parallax. Per block it
  picks `VideoPlane` (drei `useVideoTexture`) or `ImagePlane` (`useTexture`), each in its own
  `<Suspense>`. Landscape planes are wide (`LANDSCAPE_WIDTH`), portrait narrower. **The Canvas has no
  React Router context**, so StoryScene reads which project to render from `store.caseStudyId` (set by
  SiteShell) — NOT from the router. `VideoPlane` **pauses the `<video>` under reduced-motion**, and
  **also pauses any video whose block is more than ~a viewport away** (asymmetric hysteresis
  1.1/1.6·vh so the boundary never thrashes) — otherwise every case-study video decodes + uploads
  simultaneously for the whole scroll, the main non-render cost on mobile. A paused video produces
  no new frames, so pausing kills the per-frame texture upload too.
- **Media assets** live in `public/videos/tagoro/` (`hero.mp4`, `map-zoom.mp4`, `carousel.mp4` — the
  map-zoom/carousel are short boomerang loops, all compressed small) and `public/images/tagoro/`
  (`01-home.jpg` also serves as the works-list thumbnail, `02-map.jpg`, `05-la-isla-v.jpg` portrait).

### The oversized diamond behind the case-study hero
The Home hero gem is so large it reads as a glassy refraction **background**. The same effect sits
behind the case-study `statement`: `DIAMONDS` in `Diamonds.tsx` has a `{ section: "statement",
scale: 20, factor: 0.6, shrinkPastHero: true }` instance. Key points:
- It warps the ambient 3D word `StatementScene` renders behind the title (currently "PROJECT",
  drawn with its OWN lighter colour `BEYOND_COLOR` in `StatementScene.tsx`, not `BRAND.numberDim` —
  numberDim stays dark for the works numbers / hero stripe).
- **Every route carries one of these ambient words** (statement PROJECT · profile ABOUT · 404 ·
  hero PORTFOLIO) and that is what makes the page read dark PURPLE rather than flat black: the
  clear colour is the same `BRAND.bg` everywhere (measured #090711 in every route's corners), the
  word is the whole difference. The Home had none and read blacker — hence `AMBIENT_WORD` in
  `HeroScene`, whose fraction is normalized by letter count so any word bleeds like PROJECT's 7.
  Do NOT "fix" such a difference by changing a route's background colour: a `meshBasicMaterial`
  plane behaves differently under the gem's manual multipass (measured #010102 instead of its own
  hex on the Home, where a gem is always visible) — DescriptionScene's plane only lands 1:1
  because the case-study gem has collapsed by then.
- **`shrinkPastHero`** (shared with /about, same timings) collapses the gem via a TRIGGER, not a
  scroll scrub: crossing ~45% of the hero's viewport launches a fixed-time smoothstep collapse to 0
  (`SHRINK_DURATION` 0.7s, delta-based); scrolling back above ~30% re-grows it at the same speed
  (asymmetric hysteresis so the boundary never thrashes; reduced-motion snaps). Long gone before the
  first `story` image can appear — **never warps the media**. (It replaced a scroll-scrubbed
  `fadeOutAt: "story"` option, removed with it.)
- **Landing GROW-IN**: every arrival at a shrinkPastHero route starts the gem at 0 and plays the
  same 0.7s grow (the scroll-back-up animation). Two reset signals in Diamonds' frame loop — the
  section's bounds APPEARING (Home→detail, /about, hard load) and a `caseStudyId` CHANGE (case
  study→case study via "Siguiente proyecto": identical section set, bounds never re-register, so
  bounds-appearance alone would miss it). reduced-motion lands at full scale instantly.

### Case-study background plane (`DescriptionScene`)
Because the manual diamond loop draws the clear colour darker (rgb ~6–7), the case study would look
pure black. `canvas/modules/DescriptionScene.tsx` fixes this: a **fixed, full-screen plane** on
layer 0 at `z:-30` (`meshBasicMaterial` `BRAND.bg`, `toneMapped=false`), behind everything incl. the
ambient word. It does NOT scroll (no `<Block>`); it just fills the viewport for the whole case study.
Drawn as geometry the colour lands **1:1 on screen** (measured: exactly `#090711`, same as the Home),
so no route is a different black — it used to be `surface` (#141026) and the case study read lighter
than the Home. The gem refracts it, so the gem sits on the same tone. It is mounted via the
`description` section's `Scene`, so it's **case-study only** (never on Home/DETAIL).
(Measuring these: hide `.fx-overlay` first — its vignette darkens the edges of every screenshot,
which is why the page *looks* black in a corner crop while the centre is exactly `#090711`.)

### The decode / scramble text effect
`components/Decode.tsx` wraps text and plays the **binary `01` scramble→reveal** the Home works list
uses on hover (GSAP `ScrambleTextPlugin`) — the FIRST time each element scrolls into view
(`IntersectionObserver`, once). Text already in view on mount (the hero) decodes on landing. It's an
inline-block `<span>` (wrap it in the block element that carries the styling), **hidden until it
decodes** (no pre-decode flash). **Layout-stable on two levels**:
1. a visibility-hidden GHOST of the real text reserves the final layout from first paint and the
   scramble plays in an absolute overlay — the binary wraps at different points than the words, so
   scrambling in-flow used to change the paragraph's line count every frame and everything below it
   jumped (worst on mobile);
2. the overlay is split into **one `nowrap` span per LAID-OUT LINE**, measured off the ghost with a
   Range (word by word, grouped by `rect.top`) **after `document.fonts.ready`** so the webfont's
   metrics are the ones in play. Without this the *text itself* still re-wrapped inside the stable
   box: the space-less binary is narrower, so a title that ends on two lines flashed on ONE line and
   then jumped (the reported mobile flicker). Per line the structure is the final one from frame one
   and cannot change. Lines reveal in reading order (delay + duration proportional to their share of
   the characters, so the overall pace matches the old single tween) and each is **pre-filled with
   binary** — a line waiting its turn must not sit there showing its real text.
On complete the ghost is revealed and the overlay emptied. Decode
must stay the SOLE text child of its styled parent (all current usages are) — inline mid-sentence the
inline-block box would break the line. **Honors reduced-motion** (plain text immediately, no
ghost/overlay). Every case-study text
uses it, with small stagger `delay`s. Duration auto-scales with length (short cap so long paragraphs
stay fast); the hero pins explicit durations so it keeps its deliberate pace.

## About Me (`/about`)

Personal CV-light page, deliberately NOT a LinkedIn-style CV (researched against top creative-dev
portfolios — Payot/Bizarro/Miranda pattern): short first-person bio, numbered areas (01–05) instead
of a skills wall, a 4-line mini-timeline (incl. the AI-development máster at The Big School), and a
brands list that credits agency/team work (Santander, Getnet, Mutua, Mazda, Toyota, Netflix…) without
exposing NDA'd projects. Gustavo is a front-end / UI developer, NOT a designer — the copy must never
claim design-systems authorship; his thing is component LIBRARIES (PagoNxt, Mutua), animation
(GSAP/canvas/Three.js) and pixel-perfect UI. Detailed stacks stay in each case study's
`credits.stack`. No downloadable CV (LinkedIn in the HUD covers it).

- **Data-driven** from `src/config/aboutContent.ts` (same i18n-ready pattern as projectContent).
- **`Profile`** (`sections/Profile.tsx`) is the whole DOM; **`ProfileScene`** renders the portrait
  photo as a **chromatic plane** (RGB-split + parallax — the photo is a graphic piece, not an <img>).
  (It briefly had a giant dim `GUSGQ` behind the photo — removed: the photo covers it and it read
  broken.) Anchoring copies the Story technique: Profile MEASURES the
  photo slot (`[data-plane-slot]` <lg, the `article` ≥lg) into **`store.profileAnchors`**; the
  stacked plane fraction (0.58) must stay in sync between both files. Both are code-split with the
  detail modules (`preloadDetailModules`).
- **The /about hero replays the case-study statement effect**: the oversized gem (`profile` instance
  in `DIAMONDS`) refracts an ambient dim `ABOUT` word (statement recipe in ProfileScene, fontSize
  fraction ×7/5 so 5 letters bleed like PROJECT's 7). It uses the same **`shrinkPastHero`** trigger
  as the statement gem (see above), plus one /about-specific twist: because the `profile` section
  spans the WHOLE page (unlike `statement` = one svh box), **`heroAnchor`** pins the gem to the
  section's first viewport (top + vh/2, not the section centre).
  Diamond present → manual render loop → ProfileScene also
  mounts the same fixed `BRAND.bg` background plane as DescriptionScene (else /about reads darker).
- The HUD's `SITE_LINKS` gained an **internal** About link (warp navigation via `useTransition`,
  hidden while already on `/about`); `Footer` has an about branch (Spanish "Hablemos" close **+ a
  `tel:` pill with the phone number** — tapping opens the device dialer) and `RouteBackButton`
  shows there too (it shows on every non-home route). Photo asset: `public/images/about/gustavo.jpg`.
- Every case-study `Footer` also carries a small **"Sobre mí →" teaser**: left-aligned, the
  "Siguiente proyecto" language one size down (overline + display link + arrow, lime hover +
  glow), between the live-site CTA and the next-project headline. Iterated through centered
  hero / works-row / marquee versions (in this branch's history) before landing here — Gustavo
  wanted it eye-catching but SMALL. (`lib/scramble.ts` holds the works-list scramble helper,
  extracted during that iteration — WorksList consumes it.)

## i18n (ES source / EN translation)

Hand-rolled, data-driven — NO i18n library (the content was already locale-shaped data files):

- **`store.locale`** (`"es" | "en"`, Spanish default, persisted in localStorage) is the single
  reactive source; `setLocale` writes both. SiteShell mirrors it onto `<html lang>`.
- **The language switch IS the decode transition**: SiteShell keys every DOM section with
  `key={id + locale}`, so switching remounts them and every `<Decode>` replays the binary scramble
  toward the new language (in-view elements decode immediately; the rest on scroll-in).
- **The switch's layout shift is FLIPped, not jumped** (`lib/sectionFlip.ts`): new text lengths
  change section heights on remount (worst on mobile, where copy outgrows the min-h boxes), which
  used to shift everything below the reader in one frame. LangSwitch captures viewport tops BEFORE
  setLocale; SiteShell's layout effect on `locale` offsets everything back and glides it to its new
  place (0.65s power2.inOut). TWO levels, matched by structural index (both locales render the same
  tree): `[data-section]` tops AND the content blocks inside (`h1,h2,h3,p,ol,ul` — a centered hero
  re-centers when its tagline wraps differently WITHOUT the section top moving; block deltas are
  relative to their section's). Headlines owned by `useDomParallax` can't take a gsap transform
  (the rAF loop overwrites it every frame) — the flip tweens their `data-flip-y` instead, which the
  hook ADDS to its translate3d; the hook tags them `data-dom-parallax` in a LAYOUT effect so the
  tag exists before SiteShell's flip runs. A window `resize` is dispatched per frame so
  Story/Profile re-measure and the stacked WebGL planes travel glued to their DOM slots. CSS
  transitions can't do any of this — the elements are new and the shift is reflow. reduced-motion
  skips it (instant, consistent). The WebGL
  modules are NOT keyed — StoryScene reads `getProjectContent(caseStudyId, locale)` reactively and
  media/aspect/leadGap are duplicated VERBATIM across locales, so plane keys (src) never change on
  a switch: no texture reload, no layout jump. When editing case-study media fields, edit both
  locale entries.
- **Where the strings live**: long-form content with its data, per locale —
  `projectContent.ts` (`getProjectContent(id, locale)`), `aboutContent.ts` (`getAbout(locale)`;
  phone/photo/brands are shared constants), `projects.ts` (`role`/`category` are `L10n =
  Record<Locale, string>`). UI microcopy (overlines, buttons, 404) in **`i18n/ui.ts`** via the
  reactive `useT()`. Brand-English labels of the Spanish site (Selected Work, Scroll, ← Index, HUD
  links, "Creative Technologist — Portfolio") are identical in both locales and stay hardcoded.
- **`LangSwitch`** (`components/`): fixed TOP-RIGHT chip ("ES / EN", active in lime), mirroring the
  ← Index chip's blur-pill treatment and its 1440px content-cap `right` calc. Top-right per
  language-selector research (NN/g eye-tracking; Smartling/Weglot guides) — the corner this site
  keeps free on every route.

## Responsive (mobile / tablet)

The whole site is responsive with **two aligned DOM↔canvas breakpoints** (keep both sides in sync):

- **`mobile` = `< 768px`** (`SCENE.mobileBreakpoint` = Tailwind `md:`): hero headline fraction
  (`worldWidth * 0.19` vs `0.16` — kept below ~0.2 because the gem's refraction MAGNIFIES the word
  and larger fractions get the refracted copies cut at the phone edges), thinner hero stripe, and the
  diamond's `contentMaxWidth` fraction (0.8 vs 0.6, moksha's numbers).
- **`stacked` = `< 1024px`** (Tailwind `lg:`), used by the MEDIA scenes (`StoryScene`/`WorksScene`)
  and mirrored by their DOM (`Story.tsx`/`Gallery.tsx`): below lg the chromatic plane is **centered,
  near-full-bleed** (moksha's mobile technique). **The story's DOM is the anchor source of truth**:
  each stacked block is a COMPACT self-sized slot — a `[data-plane-slot]` spacer reserving the
  plane's exact box (same 0.86/0.58 width fractions as StoryScene — keep in sync) with the copy
  right under it and breathing via `pt/pb` only — and `Story.tsx` MEASURES each block's media center
  (spacer below lg, article on ≥lg) into `store.storyAnchors`; StoryScene pins every plane to the
  measured center (even-split fraction only as pre-measure fallback). So slot heights/gaps/copy can
  change freely in CSS with zero canvas drift. `≥lg` keeps the full-viewport side-by-side
  alternation. md widths do NOT fit side-by-side — that's why these use lg, not md. The works-list
  row (`WorksList`) also stacks title-over-meta until `lg`. Two more alignment invariants:
  - **Gallery's "Selected Work" overline is `absolute`** — `WorksScene` still splits its SECTION
    height into equal fraction slots, so in-flow header height would drift its anchors. The story's
    "Detalles" overline is back IN FLOW (measured anchors absorb its height).
  - **`<Block>` snaps (no trailing lerp) below 1024px** — stacked text+plane overlap page-wise, so
    the desktop trailing lag would drag a plane onto the next block's text during fast scrolls.
- **World-unit sizes are viewport fractions with desktop caps** — `Math.min(cap, worldWidth * f)`
  everywhere (story planes, works planes/numbers, statement ambient word), with `f` tuned so
  **≥1440px reproduces the previous fixed layout exactly**. Never reintroduce fixed world sizes.
- **Site-wide 1440px CONTENT CAP (ultra-wide)** — past 1440px the layout stops growing and centers,
  so a 27"+ screen reads exactly like the tuned desktop instead of pushing copy to the viewport
  edges (away from the world-unit-capped planes). Three mirrored pieces, keep in sync:
  `.content-max` (index.css — width:100% + max-width:1440px + margin-inline:auto, applied to every
  section's content container, paddings inside; full-bleed backdrops like the works hover image and
  the diagonal stripe stay full-bleed) · `SCENE.contentMaxPx` (tokens.ts) → **`layoutWidth`** in
  `useBlock` (worldWidth capped in world units — used by whatever LACKS a Math.min cap of its own:
  the hero GUSGQ fontSize and the gem's `contentMaxWidth` in Diamonds) · DOM display titles sized in
  vw carry a `min(Nvw, Xrem)` cap (statement `min(10vw,9rem)`, profile name `min(9vw,8.1rem)`) —
  Xrem = Nvw at 1440. New sections/scenes must follow all three.
- **`min-h-svh` (never `min-h-screen`/`vh`)** for full-viewport sections (mobile URL bar), fluid
  `clamp()` type for the works titles / footer headlines, `viewport-fit=cover` + safe-area insets
  (`max(…, env(safe-area-inset-*))`) on fixed UI: RouteBackButton, CornerHud, hero scroll cue.
- **Touch works list**: ONE tap on a row navigates (there is no two-tap "preview first" gate — it read
  as a dead link). The hover preview still appears on touch because the tap focuses the anchor and
  `onFocus` activates the row; it is deliberately NOT triggered on `pointerdown`, since a finger
  landing on a row to scroll fires that too and would flash the backdrop video on every drag. Tapping
  outside the rows dismisses. Mouse keeps the deterministic position-based selection.
- **Home snap** only engages while `(min-height: 560px)` matches — short/landscape-phone viewports
  scroll freely (the works list can exceed the viewport there and a full-jump snap would trap it).
- The route transition's px displacement peaks scale with viewport width (×0.5 floor, ≥1200px as
  tuned) in `TransitionProvider`. **Below 1024px (or `navigator.deviceMemory ≤ 4`) the warp runs in
  LITE mode**: the SVG `feTurbulence`+`feDisplacementMap` filter is never applied — full-viewport
  displacement is the worst case for SVG filters, and `filter: url(#warp)` over the WebGL canvas
  forces Chrome/Android through a software-composite path that flickers on some phones. Lite keeps
  the language with compositor-only pieces (slightly boosted scale/skew punch, cover fade, RGB-split
  flash, grain); desktop is untouched. Decided per-run in `isLiteWarp()`.

## Deploy (Netlify)

Hosted on Netlify with its Git integration: **every push to `main` builds and publishes**, and every
PR / non-main branch gets its own preview URL. Production: **https://gustavo-gomez-portfolio.netlify.app**.

`netlify.toml` (repo root) is the whole config — Netlify reads it, so build settings are NOT edited in
the dashboard:
- `pnpm build` → publish `dist`, pinned to Node 20 / pnpm 9 (matches local).
- **`/*` → `/index.html` 200.** Client routing needs this rewrite fallback or deep links like
  `/work/:id` 404 on a hard refresh. Local Vite dev/preview already serves the fallback, so this only
  ever breaks in production — do not remove it. (Same reason any other static host would need a
  `404.html` copy or `HashRouter`.)
- Cache headers: `assets/*` and `fonts/*` immutable for a year (Vite hashes the former, the latter
  never change); `videos|images|models|env/*` a week + `must-revalidate` since those names are stable
  and get replaced in place.

## Brand mark & favicon

A rhombus split down the middle — left half `accentB` (lime), right half `accentA` (violet) — with
the two halves **vertically displaced**: the site's own gem/refraction gesture as a static mark. It
self-simplifies: the ±1.5 offset (of a 64 viewBox) is sub-pixel at 16px, so the favicon reads as a
clean two-tone rhombus while the displacement only shows at logo size.

- **Two sources, same geometry — change both together**: `components/Logo.tsx` (in-site, colours via
  CSS vars so a palette swap reskins it) and `public/favicon.svg` (static, hex baked in). The
  resting offset + the hover widening live in `.logo-half-l/-r` (index.css, `@media (hover:hover)`).
- **PNG fallbacks** are generated from the SVG, not hand-drawn: `favicon-32.png` (transparent) and
  `apple-touch-icon.png` (180px, on `BRAND.bg` — iOS composites transparency badly). Regenerate with
  a headless screenshot of the same paths if the mark changes.
- **Placement — the identity corner**: `SiteLogo` is fixed top-left, **Home only**, and fades out
  past the hero exactly as `LangSwitch` fades in (same 50%-viewport threshold): the corners hand
  over, and the mark never crowds the works-list overline. Every other route puts `← Index` in that
  same slot, so the corner always holds either identity or the way back. Its md offset mirrors the
  1440px content cap like the rest of the fixed chrome.

## Conventions specific to this repo

- **Brand tokens live in two mirrored places**: CSS `@theme` in `src/styles/index.css` (DOM side)
  and `src/config/tokens.ts` (feeds shader uniforms / camera). Change the brand in both.
- **Never read scroll via React state in the render loop.** Use `getState()` in `useFrame`/rAF.
  Big text (hero/statement) parallaxes via `useDomParallax` — a compositor-only `translate3d`
  from rAF, no re-render.
- **The Canvas has no React Router context.** Anything inside `<Canvas>` that needs the current
  project reads `store.caseStudyId` (bridged by SiteShell), never `useLocation`/`useParams`.
- **reduced-motion is honored everywhere**: Lenis smoothing off, velocity/parallax forced to 0,
  GSAP reveals + decode skipped, story videos paused, grain reduced.
- **Do not modify the ported GLSL** (`Refraction`/`Backface`/`ChromaticPlane` materials) — the gem
  and chromatic looks depend on it verbatim.
- Assets are in `public/`: `models/diamond.glb` (from the reference), `env/*.hdr` (CC0 Poly Haven),
  `fonts/Anton-Regular.ttf` (OFL, used by CSS `--font-display` and drei `<Text>`), `images/`,
  `videos/`.
- The `<Canvas>` is wrapped in `CanvasErrorBoundary` so a WebGL-context failure degrades to
  DOM-only instead of blanking the page.
- **Custom cursor = INVERT + TINT, two discs** (`components/Cursor.tsx` + `.site-cursor*` in
  index.css). The look is fixed: **lime disc, and any text under it goes black** — over ANY content
  (DOM text, the WebGL hero `<Text>`, video, photos), with no per-element hover involved.
  1. `--invert`: white disc, `mix-blend-mode: difference`, + `backdrop-filter: grayscale(1)
     contrast(3)` — a LUMINANCE threshold (without it the negative is a gradient: plum letters over
     lime type, muddy olive over grey type). The `grayscale` is not optional: thresholding per
     channel leaves alive whatever channel the type lacks, so over the lime works-list title the
     invert came out pure blue and the tint left it navy instead of black. It degrades gracefully
     if backdrop-filter is unsupported (plain negative, still lime/black nearly everywhere).
  2. `--tint`: lime (accent-B) disc, `mix-blend-mode: multiply`, painted ON TOP — turns that
     black/white negative into lime/black.
  3. `--floor`: bg-coloured disc, `mix-blend-mode: lighten` (= max per channel) — floors that black
     at the palette bg (`#090711`), so the knocked-out letters are the SAME tone as the page and
     never pure black; lime is above it in every channel, so it passes through untouched.
  They MUST stay siblings in the root stacking context, in that paint order: the tint blends with
  the backdrop accumulated below it, so ANY wrapper (or transformed/filtered ancestor) isolates the
  group and breaks the effect. Same reason they're mounted in SiteShell OUTSIDE
  `#warp-fixed`/`#warp-main`, at z:200 (above the warp cover). Both discs are driven by the SAME
  gsap tweens (quickTo trailing + delegated-hover growth over `a/button/[data-cursor]`, back.out
  pop, shrink on press) so they stay pixel-aligned. Fine-pointer only; reduced-motion keeps the
  native cursor. `html.custom-cursor` hides the native cursor globally.
  A single lime disc in `difference` was the previous version — it only landed on black over lime
  type and read violet over white type; that's the bug this replaced.
- **Hover = lime, siempre** — the hover *language* (independent of the cursor now): every
  interactive text goes to accent-B via `.hover-neon-b` (index.css — colour + the `.neon-b` glow;
  fires on the element, on its `.group`, and on `:focus-visible`; glow dropped under reduced-motion).
  Applied to the works-list title + meta, footer next-project/mailto, HUD links and the back button.
  Note plain `hover:neon-b` in a Tailwind class does NOT work (`neon-b` is raw CSS, not a registered
  utility) — that's what `.hover-neon-b` is for. EXCEPTION — **pill/chip BORDERS stay dim white on
  hover (`hover:border-white/30`), never accent-b**: dim white sits below the cursor's luminance
  threshold, so inside the cursor disc the border inverts to lime-on-lime and VANISHES (the intended
  effect, per Gustavo); a lime border sits above the threshold and reads dark through the disc.
  Applies to ← Index, "Visitar la web" and "Llámame". Text still goes lime.
- **The works-list selection re-runs on scroll** (`WorksList`): position-based hover goes stale when
  the cursor sits still and the page scrolls under it (no mousemove fires) — the row never activated
  and its title stayed white. A window `pointermove` ref + `scroll` listener re-tests the last mouse
  position (and clears when it falls outside the `<ol>`); the CSS `hover-neon-b` on the title is the
  belt-and-braces fallback since browser `:hover` does update on scroll.
- Pinned to **React 18 → R3F 8 / drei 9** on purpose (R3F 9 / drei 10 require React 19). Do not
  bump these to "latest".
