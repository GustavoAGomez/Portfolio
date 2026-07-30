import type { Locale } from "../scroll/store"

/** A per-locale string (es = source copy, en = translation). */
export type L10n = Record<Locale, string>

export interface Project {
  id: string
  /** Big background number (01..0N). */
  index: number
  title: string
  year: string
  role: L10n
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
  category?: L10n
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
  {
    id: "tagorodive",
    index: 1,
    title: "Tagorodive",
    year: "2024",
    role: { es: "Desarrollo · Web Full-stack", en: "Development · Full-stack Web" },
    image: "/images/tagoro/isla.jpg",
    aspect: 1.6,
    category: { es: "Web · Headless CMS", en: "Web · Headless CMS" },
    hoverVideo: "/videos/tagoro/map-zoom-hd.mp4"
  },
  {
    id: "basket-portfolio",
    index: 2,
    title: "Basket Portfolio",
    year: "2026",
    role: { es: "Desarrollo · Front-end", en: "Development · Front-end" },
    image: "/images/basket/thumb.jpg",
    aspect: 1.78,
    category: { es: "Portfolio · React", en: "Portfolio · React" },
    hoverVideo: "/videos/basket/hero.mp4"
  },
  {
    id: "district-4",
    index: 3,
    title: "District 4",
    year: "2024",
    role: { es: "Creative Dev · WebGL", en: "Creative Dev · WebGL" },
    image: "/images/work-01.jpg",
    aspect: 1.5,
    category: { es: "Interactive", en: "Interactive" }
  }
]
