# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A scroll-driven WebGL portfolio. Reconstructed clean (Vite + React 18 + TS strict) from
the pmndrs "moksha" demo — which lives, untouched, at `../moksha-reference` as read-only
reference. Only two ideas were ported from it: the `factor`-based parallax and the
chromatic-aberration shader. Everything else (store, scroll, refraction) is a modern rewrite.

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
  `reducedMotion`) do use `set` and change rarely.
- **`useLenis`** (`src/scroll/`) creates Lenis, drives its rAF, and on each scroll event writes
  `scrollY / progress / rawVelocity` (normalized) into `store.scroll`. Mounted once in `App`.
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
  rest is that lerp, not the shader**. drei's `shaderMaterial` doesn't surface uniform props on
  the instance type, so the impl type is intersected in explicitly (`ShaderMaterial & Uniforms`).
- **Refraction — the diamond is a LENS** (`src/canvas/Diamonds.tsx` + `materials/{Backface,Refraction}Material.ts`):
  the hand-rolled double-FBO technique ported verbatim from moksha (GLSL unchanged). `envFbo` =
  the whole scene on **layer 0** (incl. the 3D `<Text>` headline); `backfaceFbo` = the gem's
  back-faces as normals on **layer 1**; `RefractionMaterial` samples `envFbo` at a screen UV bent
  by `refract()` — so the gem **warps the titles behind it**, not an HDRI reflection. The
  `instancedMesh` is on layer 1 (excluded from `envFbo`, never self-refracts). A **priority-1
  `useFrame` owns the render loop** (renders straight to screen in the exact moksha pass order),
  so R3F auto-render is off. Scale is viewport-relative (`s = contentMaxWidth/35 * scale`). FBOs
  are recreated + disposed on resize (`useMemo` on size).
  - **CRITICAL: no EffectComposer.** A postprocessing composer would fight the manual multipass
    and kill the lens. Grain + vignette are a **CSS overlay** (`.fx-overlay` in `index.css`,
    mounted in `App`) instead. Background is a **clear color** (`onCreated → gl.setClearColor`),
    not `scene.background` (which repaints every pass and would wipe the scene render).
  - The hero headline MUST stay a 3D `<Text>` on layer 0 (`canvas/modules/HeroScene.tsx`) for the
    gem to refract it; the DOM keeps only an `sr-only` `<h1>`. `@react-three/postprocessing` +
    `postprocessing` are now unused deps.

## Routing & section sets (ONE persistent canvas)

The app is a single-canvas SPA on `react-router-dom` v6. The **canvas is never torn
down across routes** — only which sections are active changes.

- **`SiteShell`** (`src/components/`) is mounted ONCE above the router (`main.tsx`:
  `<BrowserRouter><SiteShell/></BrowserRouter>`). It owns the fixed `<Canvas>` (Scene),
  the `.fx-overlay`, the scrollable `<main>`, and the single Lenis instance (`useLenis`,
  called here — not per page). App.tsx is gone; SiteShell replaced it.
- **The URL is the single source of truth for the active section set.**
  `routes/activeSections.ts#activeSectionsFor(pathname)` returns `HOME_SECTIONS` or
  `DETAIL_SECTIONS`; SiteShell feeds that set to BOTH `<main>` (DOM) and `<Scene sections>`
  (WebGL). No global `enabled` flag anymore.
- **`src/config/sections.ts`** holds the section REGISTRY and composes two disjoint sets:
  - `HOME_SECTIONS = [hero, works]` — landing: name + diamond lens + interactive works list.
  - `DETAIL_SECTIONS = [statement, gallery, about, footer]` — `/work/:id`, a clone of the
    Home minus hero/diamond (same fixed copy for every id). `gallery` = the 3D chromatic-plane
    module (`Gallery` DOM + `WorksScene`), reused here.
  - **To move a section between routes, move it between those two arrays.** Sets are disjoint,
    so navigation unmounts one set and mounts the other cleanly (see below).
- **Routes** (`SiteShell`): `/` → Home set; `/work/:id` → Detail set (a `DetailGuard`
  `<Navigate to="/"/>`s on an unknown id); `*` → redirect home. Rows in `WorksList` use
  `<Link>` (client nav, no reload).
- **On navigation**, SiteShell resets scroll (`lenisRef.current.scrollTo(0,{immediate:true})`
  + `store.scroll.scrollY=0` + `lenis.resize()`). `<Section>` unregisters bounds on unmount,
  so no orphan bounds survive a route change.

### Two render modes — the diamond owns the loop only on Home
- **HOME**: `<Diamonds>` runs a **priority-1 `useFrame`** → it OWNS the render loop (manual
  double-FBO passes, R3F auto-render off).
- **DETAIL**: no diamond → no priority frame → **R3F resumes its own auto-render**.
- The bridge: `Diamonds` flips `gl.autoClear=false` + `camera.layers.set(1)` every frame and
  **restores both on unmount** (`gl.autoClear=true`, `camera.layers.set(0)`). Without that
  restore the detail route renders black. `Scene` mounts `<Diamonds>` only when the active set
  contains `hero`; diamond instances whose section isn't active are scaled to 0.

`<Section>` measures its rect and registers document-space bounds; `useSection(id)` exposes live
`getProgress()` / `getCenter()` that scene modules read in `useFrame`. Each
`canvas/modules/<Id>Scene.tsx` is self-contained and consumes only its own section.

### Static hosting note (GitHub Pages)
Client routing needs a rewrite fallback to `index.html` for deep links like `/work/:id`
(otherwise a hard refresh 404s). On GitHub Pages, either add a `404.html` copy of `index.html`
or switch `BrowserRouter` → `HashRouter`. Local Vite dev/preview already serves the fallback.

## Conventions specific to this repo

- **Brand tokens live in two mirrored places**: CSS `@theme` in `src/styles/index.css` (DOM side)
  and `src/config/tokens.ts` (feeds shader uniforms / camera). Change the brand in both.
- **Never read scroll via React state in the render loop.** Use `getState()` in `useFrame`/rAF.
  Big text (hero/statement) parallaxes via `useDomParallax` — a compositor-only `translate3d`
  from rAF, no re-render.
- **reduced-motion is honored everywhere**: Lenis smoothing off, velocity/parallax forced to 0,
  GSAP reveals skipped, grain reduced.
- Assets are in `public/`: `models/diamond.glb` (from the reference), `env/*.hdr` (CC0 Poly Haven),
  `fonts/Anton-Regular.ttf` (OFL, used by CSS `--font-display` and drei `<Text>`), `images/`.
- The `<Canvas>` is wrapped in `CanvasErrorBoundary` so a WebGL-context failure degrades to
  DOM-only instead of blanking the page.
- Pinned to **React 18 → R3F 8 / drei 9** on purpose (R3F 9 / drei 10 require React 19). Do not
  bump these to "latest".
