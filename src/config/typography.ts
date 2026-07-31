/**
 * SINGLE SOURCE OF TRUTH for typography: applyTypography() feeds the DOM's CSS vars,
 * the 3D <Text> reads displayFontUrl — pointing ACTIVE_TYPO at a set reskins both.
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
  anton: {
    display: '"Anton", "Arial Narrow", "Helvetica Neue", Impact, sans-serif',
    body: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    displayFontUrl: "/fonts/Anton-Regular.ttf"
  },
  chakra: {
    display: '"Chakra Petch", "Rajdhani", "Arial Narrow", sans-serif',
    body: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/ChakraPetch-Bold.ttf"
  },
  rajdhani: {
    display: '"Rajdhani", "Chakra Petch", "Arial Narrow", sans-serif',
    body: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/Rajdhani-Bold.ttf"
  },
  michroma: {
    display: '"Michroma", "Chakra Petch", sans-serif',
    body: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/Michroma-Regular.ttf"
  },
  brunoAce: {
    display: '"Bruno Ace", "Chakra Petch", sans-serif',
    body: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/BrunoAce-Regular.ttf"
  },
  orbitron: {
    display: '"Orbitron", "Chakra Petch", sans-serif',
    body: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/Orbitron-Bold.ttf"
  },
  spaceGrotesk: {
    display: '"Space Grotesk", "IBM Plex Sans", sans-serif',
    body: '"Space Grotesk", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"Space Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/SpaceGrotesk-Bold.ttf"
  },
  clashSatoshi: {
    display: '"Clash Display", "Space Grotesk", sans-serif',
    body: '"Satoshi", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/ClashDisplay-Bold.ttf"
  },
  cabinetGeneral: {
    display: '"Cabinet Grotesk", "Space Grotesk", sans-serif',
    body: '"General Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/CabinetGrotesk-Bold.ttf"
  },
  tankerSupreme: {
    display: '"Tanker", "Clash Display", sans-serif',
    body: '"Supreme", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/Tanker-Regular.ttf"
  },
  arraySupreme: {
    display: '"Array", "Clash Display", sans-serif',
    body: '"Supreme", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/Array-Regular.ttf"
  },
  unbounded: {
    display: '"Unbounded", "Tanker", sans-serif',
    body: '"Supreme", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/Unbounded-Bold.woff"
  },
  bricolage: {
    display: '"Bricolage Grotesque", "Tanker", sans-serif',
    body: '"Supreme", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/BricolageGrotesque-Bold.woff"
  },
  syne: {
    display: '"Syne", "Tanker", sans-serif',
    body: '"Supreme", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    displayFontUrl: "/fonts/Syne-Bold.woff"
  }
} satisfies Record<string, TypeSystem>

/** ← Switch this to test a type system site-wide (DOM + 3D text). */
export const ACTIVE_TYPO: TypeSystem = TYPO_SETS.anton

/** Push the active type system into :root CSS vars. Call ONCE in main.tsx BEFORE React renders. */
export function applyTypography(t: TypeSystem = ACTIVE_TYPO): void {
  const root = document.documentElement
  root.style.setProperty("--font-display", t.display)
  root.style.setProperty("--font-sans", t.body)
  root.style.setProperty("--font-mono", t.mono)
}
