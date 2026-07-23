export interface Project {
  id: string
  /** Big background number (01..0N). */
  index: number
  title: string
  year: string
  role: string
  image: string
  /** Image aspect (w/h) — planes are sized from this. */
  aspect: number
  /**
   * Optional looping clip for the works-list hover background. When present, the
   * row shows this muted video (over `image` as a poster/fallback) while hovered;
   * paused/hidden otherwise and under reduced-motion.
   */
  hoverVideo?: string

  // ── Optional metadata (used by the works list + the future detail page).
  //    Everything below degrades gracefully when absent.
  /** Short metadata label shown in the list row. */
  category?: string
  /** Long-form copy for the detail page. */
  description?: string
  /** Tech / tooling chips for the detail page. */
  stack?: string[]
  /** Client / studio credit. */
  client?: string
  /** Id of the next project (detail-page navigation). */
  nextId?: string
}

/**
 * Real projects first, then placeholders (kept until replaced with real work).
 * A project with an entry in config/projectContent.ts renders the case-study
 * detail; the rest fall back to the generic detail layout.
 */
export const PROJECTS: Project[] = [
  { id: "tagorodive", index: 1, title: "Tagorodive", year: "2024", role: "Desarrollo · Web Full-stack", image: "/images/tagoro/isla.jpg", aspect: 1.6, category: "Web · Headless CMS", hoverVideo: "/videos/tagoro/map-zoom-hd.mp4" },
  { id: "basket-portfolio", index: 2, title: "Basket Portfolio", year: "2026", role: "Desarrollo · Front-end", image: "/images/basket/thumb.jpg", aspect: 1.78, category: "Portfolio · React", hoverVideo: "/videos/basket/hero.mp4" },
  { id: "district-4", index: 3, title: "District 4", year: "2024", role: "Creative Dev · WebGL", image: "/images/work-01.jpg", aspect: 1.5, category: "Interactive" }
]
