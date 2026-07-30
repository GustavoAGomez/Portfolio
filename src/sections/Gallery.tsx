import { PROJECTS } from "../config/projects"
import { useStore } from "../scroll/store"
import { useT } from "../i18n/ui"

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
  const locale = useStore((s) => s.locale)
  const t = useT()
  return (
    <div className="pointer-events-none relative">
      {/* Out of flow — WorksScene splits the section height into equal slots;
          in-flow header height would drift every plane anchor (cf. Story.tsx). */}
      <div className="absolute top-0 inset-x-0">
        <div className="content-max px-6 md:px-16 pt-24">
          <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">{t.selectedWork}</p>
        </div>
      </div>
      {PROJECTS.map((project, i) => {
        const left = i % 2 === 0
        return (
          <article
            key={project.id}
            className={`content-max min-h-svh flex items-end pb-[14svh] lg:items-center lg:pb-0 justify-start px-6 md:px-16 ${left ? "lg:justify-start" : "lg:justify-end"}`}
          >
            <div className={`max-w-xs text-left ${left ? "lg:text-left" : "lg:text-right"}`}>
              <h3 className="font-display text-white text-4xl md:text-6xl">{project.title}</h3>
              <p className="mt-3 text-sm text-white/60">{project.role[locale]}</p>
              <p className="mt-1 text-xs tracking-widest uppercase text-[var(--color-accent-b)]">{project.year}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
