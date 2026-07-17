/**
 * WebGL-side mirror of the brand tokens declared in src/styles/index.css (@theme).
 * Keep these in sync with the CSS custom properties — this file is what feeds
 * shader uniforms, material colors and camera/scene setup.
 */

export const BRAND = {
  bg: "#0e0e0f",
  accentA: "#d40749",
  accentB: "#2fe8c3",
  numberDim: "#1a1e2a"
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
  /** Below this viewport width we degrade the refraction (bounces / count). */
  mobileBreakpoint: 700
} as const
