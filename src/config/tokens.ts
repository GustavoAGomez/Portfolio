/**
 * WebGL-side view of the palette. The colours are NOT declared here — they derive
 * from the single source of truth (config/palette.ts → ACTIVE), the same object
 * that `applyPalette` pushes into the DOM's CSS variables. This file feeds shader
 * uniforms, material colours and the canvas clear colour; change the palette in
 * palette.ts and both DOM + WebGL reskin together.
 */

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
  /** Recurring diagonal stripe angle. */
  stripeAngle: Math.PI / 8,
  /**
   * Scroll velocity normalization reference (Lenis px/frame that maps to ~1.0).
   * Raw Lenis velocity is divided by this before being damped in the store.
   */
  velocityRef: 40,
  /**
   * Below this viewport width the WebGL side switches to its mobile layout
   * (centered planes, wider content fraction). Matches Tailwind's `md:` (768px)
   * so DOM and canvas always flip together.
   */
  mobileBreakpoint: 768
} as const
