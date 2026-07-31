/** WebGL-side view of the palette — derives from palette.ts ACTIVE; change colours there. */

import { ACTIVE } from "./palette"

export const BRAND = {
  bg: ACTIVE.bg,
  surface: ACTIVE.surface,
  text: ACTIVE.text,
  textDim: ACTIVE.textDim,
  numberDim: ACTIVE.numberDim,
  accentA: ACTIVE.accentA,
  accentB: ACTIVE.accentB
} as const

export const SCENE = {
  /** Orthographic zoom. World→pixel factor (pixels = worldUnits * zoom). */
  zoom: 75,
  cameraPosition: [0, 0, 500] as [number, number, number],
  near: 0.1,
  far: 2000,
  /** DPR clamp — never render above 2x, keeps the refraction affordable. */
  dpr: [1, 2] as [number, number],
  /** Scroll velocity normalization reference (Lenis px/frame that maps to ~1.0). */
  velocityRef: 40,
  /** WebGL mobile-layout breakpoint — matches Tailwind's `md:` (768px). */
  mobileBreakpoint: 768,
  /** Site-wide content cap — MIRRORS `.content-max` in styles/index.css, change together. */
  contentMaxPx: 1440
} as const
