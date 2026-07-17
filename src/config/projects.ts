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

/** Placeholder work — swap freely, the scene lays out however many exist. */
export const PROJECTS: Project[] = [
  { id: "district-4", index: 1, title: "District 4", year: "2024", role: "Art Direction · WebGL", image: "/images/work-01.jpg", aspect: 1.5, category: "Interactive" },
  { id: "diamond-road", index: 2, title: "Diamond Road", year: "2024", role: "Creative Dev", image: "/images/work-02.jpg", aspect: 0.67, category: "Installation" },
  { id: "sector-8", index: 3, title: "Sector 8", year: "2025", role: "Design · Motion", image: "/images/work-03.jpg", aspect: 1.55, category: "Identity" },
  { id: "the-factory", index: 4, title: "The Factory", year: "2025", role: "Full-stack 3D", image: "/images/work-04.jpg", aspect: 1.77, category: "Platform" }
]
