/**
 * SINGLE SOURCE OF TRUTH for colour: applyPalette() feeds the DOM's CSS vars and
 * BRAND (tokens.ts) feeds WebGL — pointing ACTIVE at a set reskins both sides.
 */

export interface Palette {
  /** Page background + WebGL clear colour (the inky base). */
  bg: string
  /** Slightly lifted surface — the case-study grey plane (off pure black). */
  surface: string
  /** Primary text — DOM body + the 3D hero headline. */
  text: string
  /** Muted text — the oversized ambient word behind the statement title. */
  textDim: string
  /** Very dark tint for the big background numbers / hero stripe. */
  numberDim: string
  /** Warm accent — primary action / chromatic-split fringe A / neon-a. */
  accentA: string
  /** Cool accent — interactive elements + the neon "glow" highlight (hover). */
  accentB: string
}

export const PALETTES = {
  original: {
    bg: "#0e0e0f",
    surface: "#0f0f0f",
    text: "#f5f5f5",
    textDim: "#3c4454",
    numberDim: "#1a1e2a",
    accentA: "#d40749",
    accentB: "#2fe8c3"
  },
  neonNoir: {
    bg: "#0a0b10",
    surface: "#12141c",
    text: "#eef1f6",
    textDim: "#3f4658",
    numberDim: "#16192a",
    accentA: "#ff2e63",
    accentB: "#4df3ff"
  },
  bladeRunner: {
    bg: "#0b0b0d",
    surface: "#141216",
    text: "#f2efe8",
    textDim: "#4b4636",
    numberDim: "#1a1710",
    accentA: "#ff9e2c",
    accentB: "#16dcc4"
  },
  acidTerminal: {
    bg: "#07090a",
    surface: "#0f1315",
    text: "#edf3ee",
    textDim: "#35482f",
    numberDim: "#0e1a11",
    accentA: "#ff2f6e",
    accentB: "#79ff3c"
  },
  ultraviolet: {
    bg: "#0a0714",
    surface: "#150f28",
    text: "#efeaff",
    textDim: "#443a6b",
    numberDim: "#150d29",
    accentA: "#b026ff",
    accentB: "#ff54c6"
  },
  coralGlitch: {
    bg: "#0b0a0c",
    surface: "#16131a",
    text: "#f4eeee",
    textDim: "#463c3a",
    numberDim: "#180f14",
    accentA: "#ff2f8f",
    accentB: "#ff6a2b"
  },
  neonCircuit: {
    bg: "#080a0b",
    surface: "#101517",
    text: "#ecf4ef",
    textDim: "#3b4a42",
    numberDim: "#0d1a13",
    accentA: "#ff6a2b",
    accentB: "#ffdf00"
  },
  hologram: {
    bg: "#070a12",
    surface: "#0f1320",
    text: "#eaf2ff",
    textDim: "#3a4260",
    numberDim: "#10182c",
    accentA: "#12c8ff",
    accentB: "#ff2e88"
  },
  // "Volt": accentA hue 261° is the exact complement of the lime (81°).
  volt: {
    bg: "#090711",
    surface: "#141026",
    text: "#eef2f4",
    textDim: "#453a63",
    numberDim: "#160f2b",
    accentA: "#5606f0",
    accentB: "#b6ff2e"
  },
  ember: {
    bg: "#060810",
    surface: "#111726",
    text: "#eef2f4",
    textDim: "#33404e",
    numberDim: "#0d1622",
    accentA: "#00c1d4",
    accentB: "#ff6f61"
  }
} satisfies Record<string, Palette>

/** ← Switch this to test a palette site-wide (DOM + WebGL). */
export const ACTIVE: Palette = PALETTES.volt

/** "#rgb"/"#rrggbb" → "r, g, b" (for `rgba(var(--accent-a-rgb), α)` glows). */
function hexToRgbTriplet(hex: string): string {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  const n = parseInt(full, 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

/** Push the palette into :root CSS vars. Call ONCE in main.tsx BEFORE React renders. */
export function applyPalette(p: Palette = ACTIVE): void {
  const root = document.documentElement
  const set = (k: string, v: string) => root.style.setProperty(k, v)
  set("--color-bg", p.bg)
  set("--color-surface", p.surface)
  set("--color-text", p.text)
  set("--color-text-dim", p.textDim)
  set("--color-number-dim", p.numberDim)
  set("--color-accent-a", p.accentA)
  set("--color-accent-b", p.accentB)
  set("--accent-a-rgb", hexToRgbTriplet(p.accentA))
  set("--accent-b-rgb", hexToRgbTriplet(p.accentB))
}
