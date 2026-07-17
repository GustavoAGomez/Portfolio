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
}

/** Placeholder work — swap freely, the scene lays out however many exist. */
export const PROJECTS: Project[] = [
  { id: "district-4", index: 1, title: "District 4", year: "2024", role: "Art Direction · WebGL", image: "/images/work-01.jpg", aspect: 1.5 },
  { id: "diamond-road", index: 2, title: "Diamond Road", year: "2024", role: "Creative Dev", image: "/images/work-02.jpg", aspect: 0.67 },
  { id: "sector-8", index: 3, title: "Sector 8", year: "2025", role: "Design · Motion", image: "/images/work-03.jpg", aspect: 1.55 },
  { id: "the-factory", index: 4, title: "The Factory", year: "2025", role: "Full-stack 3D", image: "/images/work-04.jpg", aspect: 1.77 }
]
