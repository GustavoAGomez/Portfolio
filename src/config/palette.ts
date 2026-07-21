/**
 * ── FOUNDATIONS · the palette is the SINGLE SOURCE OF TRUTH for colour ───────
 *
 * Every screen + component drinks from here:
 *  • DOM  → `applyPalette()` writes these into CSS custom properties on :root
 *           (`var(--color-*)`, used directly and by Tailwind utilities).
 *  • WebGL → `BRAND` in tokens.ts derives from `ACTIVE`, feeding shader uniforms,
 *           material colours and the canvas clear colour.
 *
 * To test a palette site-wide: add it to PALETTES and point ACTIVE at it — that
 * ONE change reskins the whole site (DOM + canvas), no per-file edits.
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
  /** The original brand (crimson + spearmint) — kept for reference / rollback. */
  original: {
    bg: "#0e0e0f",
    surface: "#0f0f0f",
    text: "#f5f5f5",
    textDim: "#3c4454",
    numberDim: "#1a1e2a",
    accentA: "#d40749",
    accentB: "#2fe8c3"
  },
  /**
   * Batch 1 — "Neon Noir": the iconic cyberpunk pairing, hot magenta + electric
   * cyan over an inky blue-black. Cyan is the interactive/neon highlight, magenta
   * the primary-action accent (60-30-10). A clear step up in neon punch from the
   * muted original crimson + mint.
   */
  neonNoir: {
    bg: "#0a0b10",
    surface: "#12141c",
    text: "#eef1f6",
    textDim: "#3f4658",
    numberDim: "#16192a",
    accentA: "#ff2e63",
    accentB: "#4df3ff"
  },
  // ── Batch 2 ────────────────────────────────────────────────────────────────
  /**
   * "Blade Runner" — cinematic amber + teal over a warm near-black. Teal is the
   * interactive/glow, amber the primary-action accent. Sophisticated, less
   * common than magenta/cyan; the 2049 noir look.
   */
  bladeRunner: {
    bg: "#0b0b0d",
    surface: "#141216",
    text: "#f2efe8",
    textDim: "#4b4636",
    numberDim: "#1a1710",
    accentA: "#ff9e2c",
    accentB: "#16dcc4"
  },
  /**
   * "Acid Terminal" — hacker/terminal acid green with a magenta pop over cool
   * black. Acid green is the interactive/glow, magenta the primary action. The
   * most aggressive, overtly-cyberpunk option.
   */
  acidTerminal: {
    bg: "#07090a",
    surface: "#0f1315",
    text: "#edf3ee",
    textDim: "#35482f",
    numberDim: "#0e1a11",
    accentA: "#ff2f6e",
    accentB: "#79ff3c"
  },
  /**
   * "Ultraviolet" — synthwave electric violet + neon pink over deep indigo. Pink
   * is the interactive/glow, violet the primary action. Retro-futurist, moodier.
   */
  ultraviolet: {
    bg: "#0a0714",
    surface: "#150f28",
    text: "#efeaff",
    textDim: "#443a6b",
    numberDim: "#150d29",
    accentA: "#b026ff",
    accentB: "#ff54c6"
  },
  /**
   * "Coral Glitch" — electric-orange interactive/glow (hover + subtitles) with a
   * magenta primary action, over warm near-black. accentB (orange) is the hover
   * highlight; accentA (magenta) drives primary actions + the chromatic wash. A
   * warm, non-blue take on the neon.
   */
  coralGlitch: {
    bg: "#0b0a0c",
    surface: "#16131a",
    text: "#f4eeee",
    textDim: "#463c3a",
    numberDim: "#180f14",
    accentA: "#ff2f8f",
    accentB: "#ff6a2b"
  },
  // ── Batch 3 ────────────────────────────────────────────────────────────────
  /**
   * "Neon Circuit" — yellow interactive/glow (hover + subtitles) + electric-orange
   * primary action, over cool near-black. A warm analogous duo (amber→yellow); the
   * chromatic split of the story media decomposes into orange + yellow.
   */
  neonCircuit: {
    bg: "#080a0b",
    surface: "#101517",
    text: "#ecf4ef",
    textDim: "#3b4a42",
    numberDim: "#0d1a13",
    accentA: "#ff6a2b",
    accentB: "#ffdf00"
  },
  // ── Batch 4 · refocus on the core cyberpunk look (1 primary + 1 secondary neon
  //    over inky dark, max contrast; hover is never blue). ──────────────────────
  /**
   * "Hologram" — electric cyan primary + hot-magenta hover over inky navy-black.
   * The iconic cyberpunk duo; cyan ↔ magenta are complementary, so the story split
   * decomposes into two crisp colours. Hover (magenta) is the non-blue accent.
   */
  hologram: {
    bg: "#070a12",
    surface: "#0f1320",
    text: "#eaf2ff",
    textDim: "#3a4260",
    numberDim: "#10182c",
    accentA: "#12c8ff",
    accentB: "#ff2e88"
  },
  /**
   * "Volt" — electric violet primary + acid-lime hover over violet-black. High
   * contrast (violet ↔ lime), fresh and aggressive. Lime is the non-blue hover.
   */
  volt: {
    bg: "#090711",
    surface: "#141026",
    text: "#f0ecff",
    textDim: "#453a63",
    numberDim: "#160f2b",
    accentA: "#7c4dff",
    accentB: "#b6ff2e"
  },
  /**
   * "Ember" — teal primary + smoldering-coral hover over steel-black (from the
   * "Drone Dock Embers" reference). Warm hover ↔ cool primary read as two clear
   * colours in the split. Coral is the non-blue hover.
   */
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

/**
 * Push the active palette into CSS custom properties on :root. Call ONCE in
 * main.tsx BEFORE React renders, so the first paint is already themed (no flash;
 * inline :root styles also win over Tailwind's @theme fallbacks). WebGL reads the
 * same values via BRAND (tokens.ts), so DOM + canvas stay in lockstep.
 */
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
