import { lazy, type ComponentType } from "react"
import type { SectionId } from "../scroll/store"

import { Hero } from "../sections/Hero"
import { Statement } from "../sections/Statement"
import { WorksList } from "../sections/WorksList"
import { About } from "../sections/About"
import { Footer } from "../sections/Footer"

import { HeroScene } from "../canvas/modules/HeroScene"
import { StatementScene } from "../canvas/modules/StatementScene"
import { AboutScene } from "../canvas/modules/AboutScene"

// Detail-only heavy modules — code-split so the Home bundle skips them.
// (`as unknown as ComponentType` bridges React.lazy's LazyExoticComponent to the
// plain ComponentType the config uses; keeps JSX rendering uniform, no `any`.)
const Gallery = lazy(() => import("../sections/Gallery").then((m) => ({ default: m.Gallery }))) as unknown as ComponentType
const WorksScene = lazy(() => import("../canvas/modules/WorksScene").then((m) => ({ default: m.WorksScene }))) as unknown as ComponentType<{
  id: SectionId
}>

export interface SectionConfig {
  id: SectionId
  /** Landing anchor — the top of a route's set (cosmetic data-attr). */
  anchor?: boolean
  /** Semantic DOM component. */
  Dom: ComponentType
  /** Optional WebGL module (receives its section id). */
  Scene?: ComponentType<{ id: SectionId }>
}

/**
 * The section registry. Route-active SETS are composed from these below — there
 * is no global `enabled` flag anymore; what renders (DOM + WebGL) is whichever
 * set the current route selects (see routes/activeSections + SiteShell).
 */
const REGISTRY: Record<SectionId, SectionConfig> = {
  hero: { id: "hero", anchor: true, Dom: Hero, Scene: HeroScene },
  statement: { id: "statement", anchor: true, Dom: Statement, Scene: StatementScene },
  works: { id: "works", Dom: WorksList },
  gallery: { id: "gallery", Dom: Gallery, Scene: WorksScene },
  about: { id: "about", Dom: About, Scene: AboutScene },
  footer: { id: "footer", Dom: Footer }
}

/**
 * ── ROUTE SECTION SETS ─────────────────────────────────────────────────────
 * HOME    = the landing: hero (name + diamond lens) + the interactive works list.
 * DETAIL  = /work/:id — a clone of the Home MINUS hero/diamond: statement +
 *           chromatic-plane gallery + about + footer (same fixed copy for all ids).
 *
 * To move a section between routes, just move it between these two arrays — e.g.
 * add REGISTRY.footer to HOME_SECTIONS to keep the footer on the Home too. The
 * two sets are disjoint, so navigation unmounts one set and mounts the other
 * cleanly (bounds re-register, no orphans).
 * ───────────────────────────────────────────────────────────────────────────
 */
export const HOME_SECTIONS: SectionConfig[] = [REGISTRY.hero, REGISTRY.works]
export const DETAIL_SECTIONS: SectionConfig[] = [REGISTRY.statement, REGISTRY.gallery, REGISTRY.about, REGISTRY.footer]
