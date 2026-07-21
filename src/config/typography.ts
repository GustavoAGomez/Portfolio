/**
 * ── FOUNDATIONS · the type system is the SINGLE SOURCE OF TRUTH for typography ──
 *
 * Mirrors the colour palette pattern:
 *  • DOM  → `applyTypography()` writes the families into CSS custom properties on
 *           :root (`--font-display`, `--font-sans`, `--font-mono`), used directly
 *           and by Tailwind's font-* utilities.
 *  • WebGL → the 3D hero/statement <Text> reads `ACTIVE_TYPO.displayFontUrl`
 *           (troika needs a real font file: ttf/otf/woff, NOT woff2).
 *
 * To test a type system site-wide: add a set to TYPO_SETS and point ACTIVE_TYPO
 * at it — one change reskins the DOM; the 3D text follows via displayFontUrl.
 * Every @font-face referenced here is declared in styles/index.css (unused ones
 * are never fetched — @font-face is lazy).
 */

export interface TypeSystem {
  /** Display family (CSS font-family) — headlines, works titles, section heads. */
  display: string
  /** Body family — paragraphs + general UI text. */
  body: string
  /** Mono family — labels / data / meta / HUD (the developer-terminal register). */
  mono: string
  /** Display font FILE for the 3D <Text> (troika: ttf/otf/woff, never woff2). */
  displayFontUrl: string
}

export const TYPO_SETS = {
  /** The original system (Anton + system sans) — kept for reference / rollback. */
  anton: {
    display: '"Anton", "Arial Narrow", "Helvetica Neue", Impact, sans-serif',
    body: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    displayFontUrl: "/fonts/Anton-Regular.ttf"
  },
  /**
   * Batch 1 — "Chakra": squarish techno display (Chakra Petch) over the IBM Plex
   * system (Plex Sans body + Plex Mono labels) — a developer/terminal register
   * that fits the cyberpunk context.
   */
  chakra: {
    display: '"Chakra Petch", "Rajdhani", "Arial Narrow", sans-serif',
    body: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/ChakraPetch-Bold.ttf"
  },
  /**
   * Batch 2 — "Rajdhani": condensed geometric techno display (tall, slender caps —
   * close to Anton but cleaner/more technical) over the same IBM Plex system.
   */
  rajdhani: {
    display: '"Rajdhani", "Chakra Petch", "Arial Narrow", sans-serif',
    body: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/Rajdhani-Bold.ttf"
  },
  /**
   * "Michroma": wide geometric sci-fi display (single weight) — strong "spaceship
   * interface" character; runs wide, so headlines read big. Same IBM Plex system.
   */
  michroma: {
    display: '"Michroma", "Chakra Petch", sans-serif',
    body: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/Michroma-Regular.ttf"
  },
  // ── Batch 3 · grounded in cyberpunk/sci-fi type references ──────────────────
  /**
   * "Bruno Ace": recent (2025) cyberpunk-adjacent display — geometric with a
   * stencilled, distinctive character. Fresh and characterful. Same IBM Plex system.
   */
  brunoAce: {
    display: '"Bruno Ace", "Chakra Petch", sans-serif',
    body: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/BrunoAce-Regular.ttf"
  },
  /**
   * "Orbitron": the iconic geometric sci-fi display. The most recognisable
   * "futuristic" face; medium-wide. Same IBM Plex system.
   */
  orbitron: {
    display: '"Orbitron", "Chakra Petch", sans-serif',
    body: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/Orbitron-Bold.ttf"
  },
  // ── Batch 4 · modern "creative-dev studio" register (less hard sci-fi) ───────
  /**
   * "Space Grotesk + Space Mono": the current creative-developer staple. Space
   * Grotesk (quirky modern grotesque) for display AND body, Space Mono (a
   * characterful monospace) for labels/data. A cleaner, less overtly-sci-fi look
   * that still reads technical/cyberpunk via the mono.
   */
  spaceGrotesk: {
    display: '"Space Grotesk", "IBM Plex Sans", sans-serif',
    body: '"Space Grotesk", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"Space Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/SpaceGrotesk-Bold.ttf"
  },
  // ── Batch 5 · Awwwards-tier professional faces (Fontshare, free commercial) ──
  /**
   * "Clash + Satoshi": the Awwwards studio staple. Clash Display (bold grotesk
   * display, superb at large sizes) + Satoshi (geometric-grotesque body, a free
   * Neue-Montreal register) + JetBrains Mono for the developer data/labels.
   */
  clashSatoshi: {
    display: '"Clash Display", "Space Grotesk", sans-serif',
    body: '"Satoshi", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/ClashDisplay-Bold.ttf"
  },
  /**
   * "Cabinet + General": a softer editorial alternative. Cabinet Grotesk (display
   * grotesque with friendlier terminals) + General Sans (clean neutral body) +
   * JetBrains Mono.
   */
  cabinetGeneral: {
    display: '"Cabinet Grotesk", "Space Grotesk", sans-serif',
    body: '"General Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/CabinetGrotesk-Bold.ttf"
  },
  // ── Batch 6 · Awwwards 2026 trend: oversized bold display + clean sans + mono ─
  /**
   * "Tanker + Supreme": oversized-headline energy. Tanker (ultra-bold, wide
   * display — Monument-Extended register) for statement titles + Supreme (clean
   * neo-grotesque, Söhne-like) for body + JetBrains Mono. Loud, editorial, pro.
   */
  tankerSupreme: {
    display: '"Tanker", "Clash Display", sans-serif',
    body: '"Supreme", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/Tanker-Regular.ttf"
  },
  /**
   * "Array + Supreme": angular techno display (Array — retro-technical, very
   * cyberpunk) + Supreme body + JetBrains Mono. The most overtly-cyberpunk of the
   * Awwwards-tier sets.
   */
  arraySupreme: {
    display: '"Array", "Clash Display", sans-serif',
    body: '"Supreme", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/Array-Regular.ttf"
  },
  // ── Batch 7 · more Tanker-adjacent oversized display faces (free Google) ─────
  /**
   * "Unbounded + Supreme": heavy punchy headlines with chevron-cut stems (a techy
   * edge). Closest free "wide heavy" to Tanker. Supreme body + JetBrains Mono.
   */
  unbounded: {
    display: '"Unbounded", "Tanker", sans-serif',
    body: '"Supreme", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/Unbounded-Bold.woff"
  },
  /**
   * "Bricolage + Supreme": contemporary grotesque with genuine character (optical
   * corrections, hand-touched feel) — an Awwwards favourite. Supreme + JetBrains Mono.
   */
  bricolage: {
    display: '"Bricolage Grotesque", "Tanker", sans-serif',
    body: '"Supreme", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/BricolageGrotesque-Bold.woff"
  },
  /**
   * "Syne + Supreme": expressive display where letters widen as they bolden — a
   * design/awards darling with real personality. Supreme + JetBrains Mono.
   */
  syne: {
    display: '"Syne", "Tanker", sans-serif',
    body: '"Supreme", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/Syne-Bold.woff"
  }
} satisfies Record<string, TypeSystem>

/** ← Switch this to test a type system site-wide (DOM + 3D text). */
export const ACTIVE_TYPO: TypeSystem = TYPO_SETS.anton

/**
 * Push the active type system into CSS custom properties on :root. Call ONCE in
 * main.tsx BEFORE React renders (first paint already on the active fonts; inline
 * :root styles win over Tailwind's @theme fallbacks).
 */
export function applyTypography(t: TypeSystem = ACTIVE_TYPO): void {
  const root = document.documentElement
  root.style.setProperty("--font-display", t.display)
  root.style.setProperty("--font-sans", t.body)
  root.style.setProperty("--font-mono", t.mono)
}
