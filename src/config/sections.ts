import { lazy, type ComponentType } from "react"
import type { SectionId } from "../scroll/store"

import { Hero } from "../sections/Hero"
import { Statement } from "../sections/Statement"
import { Description } from "../sections/Description"
import { Story } from "../sections/Story"
import { WorksList } from "../sections/WorksList"
import { About } from "../sections/About"
import { Footer } from "../sections/Footer"
import { Legal } from "../sections/Legal"
import { NotFound } from "../sections/NotFound"

import { HeroScene } from "../canvas/modules/HeroScene"
import { StatementScene } from "../canvas/modules/StatementScene"
import { DescriptionScene } from "../canvas/modules/DescriptionScene"
import { StoryScene } from "../canvas/modules/StoryScene"
import { LegalScene } from "../canvas/modules/LegalScene"
import { NotFoundScene } from "../canvas/modules/NotFoundScene"

// Detail-only heavy modules — code-split so the Home bundle skips them.
const loadGallery = () => import("../sections/Gallery")
const loadWorksScene = () => import("../canvas/modules/WorksScene")
const loadProfile = () => import("../sections/Profile")
const loadProfileScene = () => import("../canvas/modules/ProfileScene")
const Gallery = lazy(() => loadGallery().then((m) => ({ default: m.Gallery }))) as unknown as ComponentType
const WorksScene = lazy(() => loadWorksScene().then((m) => ({ default: m.WorksScene }))) as unknown as ComponentType<{
  id: SectionId
}>
const Profile = lazy(() => loadProfile().then((m) => ({ default: m.Profile }))) as unknown as ComponentType
const ProfileScene = lazy(() => loadProfileScene().then((m) => ({ default: m.ProfileScene }))) as unknown as ComponentType<{
  id: SectionId
}>

/** Warm the detail-only chunks so a transition lands on painted content. Call once early. */
export function preloadDetailModules(): void {
  void loadGallery()
  void loadWorksScene()
  void loadProfile()
  void loadProfileScene()
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

/** Section registry — what renders is whichever route set (below) is active. */
const REGISTRY: Record<SectionId, SectionConfig> = {
  hero: { id: "hero", anchor: true, Dom: Hero, Scene: HeroScene },
  statement: { id: "statement", anchor: true, Dom: Statement, Scene: StatementScene },
  description: { id: "description", Dom: Description, Scene: DescriptionScene }, // brief + grey background plane
  story: { id: "story", Dom: Story, Scene: StoryScene }, // case-study blocks: DOM heading/copy + WebGL chromatic image planes
  works: { id: "works", Dom: WorksList },
  gallery: { id: "gallery", Dom: Gallery, Scene: WorksScene },
  about: { id: "about", Dom: About },
  profile: { id: "profile", anchor: true, Dom: Profile, Scene: ProfileScene }, // /about: CV-light bio + chromatic photo plane
  footer: { id: "footer", Dom: Footer },
  legal: { id: "legal", anchor: true, Dom: Legal, Scene: LegalScene }, // /legal: aviso legal + privacidad, palabra ambiental "LEGAL" detrás
  notFound: { id: "notFound", anchor: true, Dom: NotFound, Scene: NotFoundScene } // 404: message + giant dim "404" behind
}

// Route section sets — disjoint; move a section between routes by moving it between arrays.
/** Landing: hero (name + diamond lens) + interactive works list. */
export const HOME_SECTIONS: SectionConfig[] = [REGISTRY.hero, REGISTRY.works]
/** Generic detail (placeholder projects with no case-study content). */
export const DETAIL_SECTIONS: SectionConfig[] = [REGISTRY.statement, REGISTRY.gallery, REGISTRY.about, REGISTRY.footer]
/** Case-study detail (projects with content): `story` replaces the generic gallery. */
export const CASE_STUDY_SECTIONS: SectionConfig[] = [REGISTRY.statement, REGISTRY.description, REGISTRY.about, REGISTRY.story, REGISTRY.footer]
/** /about — the personal About Me page (CV-light profile + shared footer). */
export const ABOUT_SECTIONS: SectionConfig[] = [REGISTRY.profile, REGISTRY.footer]
/** /legal — aviso legal + privacidad (+ shared footer for the contact/HUD close). */
export const LEGAL_SECTIONS: SectionConfig[] = [REGISTRY.legal, REGISTRY.footer]
/** Any unknown URL (no redirect — the wrong URL stays in the bar). */
export const NOT_FOUND_SECTIONS: SectionConfig[] = [REGISTRY.notFound]
