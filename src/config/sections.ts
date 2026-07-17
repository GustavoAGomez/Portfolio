import type { ComponentType } from "react"
import type { SectionId } from "../scroll/store"

import { Hero } from "../sections/Hero"
import { Statement } from "../sections/Statement"
import { WorksList } from "../sections/WorksList"
import { Gallery } from "../sections/Gallery"
import { About } from "../sections/About"
import { Footer } from "../sections/Footer"

import { HeroScene } from "../canvas/modules/HeroScene"
import { StatementScene } from "../canvas/modules/StatementScene"
import { WorksScene } from "../canvas/modules/WorksScene"
import { AboutScene } from "../canvas/modules/AboutScene"

export interface SectionConfig {
  id: SectionId
  /** Only enabled sections render (DOM + WebGL) and register scroll bounds. */
  enabled: boolean
  /** Landing anchor — the top of the page. Keep exactly one anchor enabled. */
  anchor?: boolean
  /** Semantic DOM component. */
  Dom: ComponentType
  /** Optional WebGL module (receives its section id). */
  Scene?: ComponentType<{ id: SectionId }>
}

/**
 * ── HOW TO TURN A SECTION ON / OFF ─────────────────────────────────────────
 * Flip `enabled` to false (or delete the entry). That's the ONLY change needed:
 *   • the DOM section stops rendering, so it no longer contributes scroll height
 *   • its WebGL module stops rendering
 *   • it no longer registers bounds, so parallax anchors + local progress for the
 *     remaining sections re-measure automatically (bounds are read live)
 * Do NOT disable the `anchor` section (hero) — keep one anchor enabled so the
 * page still has a top. Reordering entries reorders the page.
 * ───────────────────────────────────────────────────────────────────────────
 */
export const SECTIONS: SectionConfig[] = [
  { id: "hero", enabled: true, anchor: true, Dom: Hero, Scene: HeroScene },
  { id: "statement", enabled: true, Dom: Statement, Scene: StatementScene },
  // Home `works` slot: the interactive DOM works list (no 3D behind it).
  { id: "works", enabled: true, Dom: WorksList },
  { id: "about", enabled: true, Dom: About, Scene: AboutScene },
  { id: "footer", enabled: true, Dom: Footer },
  // Defined but OFF the Home for now (enabled:false → excluded everywhere).
  // The 3D chromatic-plane gallery; reused later for per-project detail pages.
  { id: "gallery", enabled: false, Dom: Gallery, Scene: WorksScene }
]

export const ENABLED_SECTIONS = (): SectionConfig[] => SECTIONS.filter((s) => s.enabled)
