import { lazy, type ComponentType } from "react"
import type { SectionId } from "../scroll/store"

import { Hero } from "../sections/Hero"
import { Statement } from "../sections/Statement"
import { Story } from "../sections/Story"
import { WorksList } from "../sections/WorksList"
import { About } from "../sections/About"
import { Footer } from "../sections/Footer"

import { HeroScene } from "../canvas/modules/HeroScene"
import { StatementScene } from "../canvas/modules/StatementScene"
import { StoryScene } from "../canvas/modules/StoryScene"

// Detail-only heavy modules — code-split so the Home bundle skips them.
// (`as unknown as ComponentType` bridges React.lazy's LazyExoticComponent to the
// plain ComponentType the config uses; keeps JSX rendering uniform, no `any`.)
const loadGallery = () => import("../sections/Gallery")
const loadWorksScene = () => import("../canvas/modules/WorksScene")
const Gallery = lazy(() => loadGallery().then((m) => ({ default: m.Gallery }))) as unknown as ComponentType
const WorksScene = lazy(() => loadWorksScene().then((m) => ({ default: m.WorksScene }))) as unknown as ComponentType<{
  id: SectionId
}>

/**
 * Warm the detail-only chunks so a route transition captures a painted
 * destination (not the <Suspense> fallback). Call once early (SiteShell mount).
 */
export function preloadDetailModules(): void {
  void loadGallery()
  void loadWorksScene()
}

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
  story: { id: "story", Dom: Story, Scene: StoryScene }, // case-study blocks: DOM heading/copy + WebGL chromatic image planes
  works: { id: "works", Dom: WorksList },
  gallery: { id: "gallery", Dom: Gallery, Scene: WorksScene },
  about: { id: "about", Dom: About },
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
/** Generic detail (placeholder projects with no case-study content). */
export const DETAIL_SECTIONS: SectionConfig[] = [REGISTRY.statement, REGISTRY.gallery, REGISTRY.about, REGISTRY.footer]
/** Case-study detail (projects with content): `story` replaces the generic gallery. */
export const CASE_STUDY_SECTIONS: SectionConfig[] = [REGISTRY.statement, REGISTRY.story, REGISTRY.about, REGISTRY.footer]
