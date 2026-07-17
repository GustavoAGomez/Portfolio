import { PROJECTS } from "../config/projects"

/**
 * Semantic list of projects for the 3D chromatic-plane GALLERY. Each item is
 * ~one viewport tall so the section height matches the WebGL slots in WorksScene
 * (one slot per project). The chromatic image planes + giant numbers render
 * behind this text.
 *
 * NOTE: kept off the Home for now (sections.ts → `gallery` is enabled:false).
 * Reused later for per-project detail pages. The interactive DOM works list on
 * the Home lives in sections/WorksList.tsx instead.
 */
export function Gallery() {
  return (
    <div className="pointer-events-none">
      <div className="px-6 md:px-16 pt-24">
        <p className="text-xs tracking-[0.35em] uppercase text-white/60">Selected Work</p>
      </div>
      {PROJECTS.map((project, i) => {
        const left = i % 2 === 0
        return (
          <article key={project.id} className={`min-h-screen flex items-center px-6 md:px-16 ${left ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-xs ${left ? "text-left" : "text-right"}`}>
              <h3 className="font-display text-white text-4xl md:text-6xl">{project.title}</h3>
              <p className="mt-3 text-sm text-white/60">{project.role}</p>
              <p className="mt-1 text-xs tracking-widest uppercase text-[var(--color-accent-b)]">{project.year}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
