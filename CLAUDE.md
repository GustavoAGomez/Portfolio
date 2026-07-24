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
  facets bright — that's the gem look, intended.
  - **CRITICAL: no EffectComposer.** A postprocessing composer would fight the manual multipass
    and kill the lens. Grain + vignette are a **CSS overlay** (`.fx-overlay` in `index.css`,
    mounted in `SiteShell`) instead. Background is a **clear color** (`onCreated → gl.setClearColor`),
    not `scene.background` (which repaints every pass and would wipe the scene render).
  - The Home headline MUST stay a 3D `<Text>` on layer 0 (`canvas/modules/HeroScene.tsx`) for the
    gem to refract it; the DOM keeps only an `sr-only` `<h1>`. `@react-three/postprocessing` +
    `postprocessing` are unused deps.

## Routing & section sets (ONE persistent canvas)

Single-canvas SPA on `react-router-dom` v6. The **canvas is never torn down across routes** —
only which sections are active changes.

- **`SiteShell`** (`src/components/`) is mounted ONCE above the router (`main.tsx`:
  `<BrowserRouter><SiteShell/></BrowserRouter>`). It owns the fixed `<Canvas>` (Scene), the
  `.fx-overlay`, the scrollable `<main>`, and the single Lenis instance (`useLenis`, called here —
  not per page). There is no `App.tsx`; SiteShell replaced it. It also wraps everything in
  `TransitionProvider` and mounts the `RouteBackButton`.
- **The URL is the single source of truth for the active section set.**
  `routes/activeSections.ts#activeSectionsFor(pathname)` returns one of THREE sets; SiteShell feeds
  it to BOTH `<main>` (DOM) and `<Scene sections>` (WebGL). No global `enabled` flag.
- **`src/config/sections.ts`** holds the section REGISTRY (`Record<SectionId, SectionConfig>` — every
  id must have an entry) and composes three disjoint route sets:
  - `HOME_SECTIONS = [hero, works]` — landing: name + diamond lens + interactive works list.
  - `DETAIL_SECTIONS = [statement, gallery, about, footer]` — generic placeholder detail (projects
    with no case-study content); `gallery` = the 3D chromatic-plane module (`Gallery` DOM + `WorksScene`).
  - `CASE_STUDY_SECTIONS = [statement, description, about, story, footer]` — a real case study; `story`
    (media walkthrough) replaces the generic `gallery`, and `description` (the brief) is inserted.
  - **`activeSectionsFor`**: an invalid or non-`/work` path → HOME; a valid `/work/:id` → CASE_STUDY
    if `getProjectContent(id)` exists, else DETAIL. Invalid ids fall back to HOME so there's no flash
    before the route's `<Navigate>` redirect lands.
  - **To move a section between routes, move it between those arrays.** Sets are disjoint, so
    navigation unmounts one set and mounts the other cleanly (bounds re-register, no orphans).
- **Routes** (`SiteShell`): `/` → Home; `/work/:id` → detail (a `DetailGuard` `<Navigate to="/"/>`s
  on an unknown id); `*` → redirect home. Rows in `WorksList` navigate with the transition (below).
- **On navigation**, SiteShell resets scroll (`lenis.scrollTo(0,{immediate,force})` + `scrollY=0` +
  `lenis.resize()`) and sets `store.caseStudyId` from the URL. `<Section>` unregisters bounds on
  unmount, so no orphan bounds survive a route change.

### Route transition — the WARP (`src/transition/TransitionProvider.tsx`)
`useTransition().go(to)` navigates with a **liquify/warp**: it deforms the REAL content (no texture
capture) via an SVG `feDisplacementMap` applied to `#warp-fixed` (the fixed canvas+grain layer) and
`#warp-main` (the scrollable DOM) — only during the transition, so idle keeps the canvas's
`position:fixed` + Lenis untouched. One GSAP timeline drives displacement 0→peak→0, a `seed` boil, a
scale/skew punch, and an opaque cover (+ brief RGB-split flash & grain) hiding the route swap. A
safety timeout force-finishes and clears inline styles. reduced-motion navigates instantly; browser
back/forward plays the recompose (deform-in) only. `RouteBackButton` uses it to return Home.

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
    (`justify-end` + `text-right`) so text alternates left/right down the page. `min-h-[78vh]`.
  - `About` → **credits** (overline "Trabajo", role, summary, stack chips, client·year). `min-h-[72vh]`.
  - `Story` → the **media walkthrough** (overline "Detalles"): one full-viewport slot per block,
    heading+copy on the opposite side of the media, text kept in the DOM.
  - `Footer` → **next project** link (`nextId`) navigated with the warp transition; else a generic
    mailto.
  - (`Description`/`About` were shortened from `min-h-screen` to tighten the gap between them.)
- **`StoryScene`** (`canvas/modules/StoryScene.tsx`) is the media layer: one **`<ChromaticPlane>` per
  block** inside a `<Block>`, so every image/video gets the RGB-split trail + parallax. Per block it
  picks `VideoPlane` (drei `useVideoTexture`) or `ImagePlane` (`useTexture`), each in its own
  `<Suspense>`. Landscape planes are wide (`LANDSCAPE_WIDTH`), portrait narrower. **The Canvas has no
  React Router context**, so StoryScene reads which project to render from `store.caseStudyId` (set by
  SiteShell) — NOT from the router. `VideoPlane` **pauses the `<video>` under reduced-motion**.
- **Media assets** live in `public/videos/tagoro/` (`hero.mp4`, `map-zoom.mp4`, `carousel.mp4` — the
  map-zoom/carousel are short boomerang loops, all compressed small) and `public/images/tagoro/`
  (`01-home.jpg` also serves as the works-list thumbnail, `02-map.jpg`, `05-la-isla-v.jpg` portrait).

### The oversized diamond behind the case-study hero
The Home hero gem is so large it reads as a glassy refraction **background**. The same effect sits
behind the case-study `statement`: `DIAMONDS` in `Diamonds.tsx` has a `{ section: "statement",
scale: 20, factor: 0.6, fadeOutAt: "story" }` instance. Key points:
- It warps the ambient 3D word `StatementScene` renders behind the title (currently "PROJECT",
  drawn with its OWN lighter colour `BEYOND_COLOR` in `StatementScene.tsx`, not `BRAND.numberDim` —
  numberDim stays dark for the works numbers / hero stripe).
- **`fadeOutAt`** shrinks the gem to scale 0 over the viewport-height BEFORE that section's top
  reaches the **bottom** of the screen (measured on `scrollY + size.height`, not the centre) — so it
  is fully gone before the first `story` image can appear and **never warps the media**. Full behind
  the statement, gradually gone by "Detalles".

### Case-study grey background (`DescriptionScene`)
Because the manual diamond loop draws the clear colour darker (rgb ~6–7), the case study would look
pure black. `canvas/modules/DescriptionScene.tsx` fixes this: a **fixed, full-screen grey plane** on
layer 0 at `z:-30` (`meshBasicMaterial` `#0f0f0f`, `toneMapped=false`), behind everything incl. the
ambient word. It does NOT scroll (no `<Block>`); it just fills the viewport for the whole case study,
restoring the soft grey (renders ≈rgb 18). The gem refracts it, so the gem sits on grey too. It is
mounted via the `description` section's `Scene`, so it's **case-study only** (never on Home/DETAIL).

### The decode / scramble text effect
`components/Decode.tsx` wraps text and plays the **binary `01` scramble→reveal** the Home works list
uses on hover (GSAP `ScrambleTextPlugin`) — the FIRST time each element scrolls into view
(`IntersectionObserver`, once). Text already in view on mount (the hero) decodes on landing. It's an
inline `<span>` (wrap it in the block element that carries the styling), **hidden until it decodes**
(no pre-decode flash), with `overflowWrap:anywhere` so the space-less binary wraps instead of
overflowing. **Honors reduced-motion** (shows text immediately, no scramble). Every case-study text
uses it, with small stagger `delay`s. Duration auto-scales with length (short cap so long paragraphs
stay fast); the hero pins explicit durations so it keeps its deliberate pace.

## Responsive (mobile / tablet)

The whole site is responsive with **two aligned DOM↔canvas breakpoints** (keep both sides in sync):

- **`mobile` = `< 768px`** (`SCENE.mobileBreakpoint` = Tailwind `md:`): hero headline fraction
  (`worldWidth * 0.19` vs `0.16` — kept below ~0.2 because the gem's refraction MAGNIFIES the word
  and larger fractions get the refracted copies cut at the phone edges), thinner hero stripe, and the
  diamond's `contentMaxWidth` fraction (0.8 vs 0.6, moksha's numbers).
- **`stacked` = `< 1024px`** (Tailwind `lg:`), used by the MEDIA scenes (`StoryScene`/`WorksScene`)
  and mirrored by their DOM (`Story.tsx`/`Gallery.tsx`): below lg the chromatic plane is **centered,
  near-full-bleed** (moksha's mobile technique) and shifted slightly up, while the copy drops to the
  bottom of the slot (`items-end pb-[14svh]`), left-aligned; `≥lg` restores the side-by-side
  left/right alternation. md widths do NOT fit the side-by-side layout — that's why these use lg,
  not md. The works-list row (`WorksList`) also stacks title-over-meta until `lg` (at md the meta
  strip is wider than the viewport and would crush the title to 0 width).
- **World-unit sizes are viewport fractions with desktop caps** — `Math.min(cap, worldWidth * f)`
  everywhere (story planes, works planes/numbers, statement ambient word), with `f` tuned so
  **≥1440px reproduces the previous fixed layout exactly**. Never reintroduce fixed world sizes.
- **`min-h-svh` (never `min-h-screen`/`vh`)** for full-viewport sections (mobile URL bar), fluid
  `clamp()` type for the works titles / footer headlines, `viewport-fit=cover` + safe-area insets
  (`max(…, env(safe-area-inset-*))`) on fixed UI: RouteBackButton, CornerHud, hero scroll cue.
- **Touch works list**: hover doesn't exist, so the FIRST tap on a row plays the hover preview
  (backdrop video + scramble) and a SECOND tap navigates — the pre-tap `active` state is captured on
  `pointerdown` (before tap-focus mutates it); tapping outside the rows dismisses. Mouse keeps the
  deterministic position-based selection.
- **Home snap** only engages while `(min-height: 560px)` matches — short/landscape-phone viewports
  scroll freely (the works list can exceed the viewport there and a full-jump snap would trap it).
- The route transition's px displacement peaks scale with viewport width (×0.5 floor, ≥1200px as
  tuned) in `TransitionProvider`.

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
- Pinned to **React 18 → R3F 8 / drei 9** on purpose (R3F 9 / drei 10 require React 19). Do not
  bump these to "latest".
