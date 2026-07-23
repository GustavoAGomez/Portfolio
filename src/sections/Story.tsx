import { useCurrentProject } from "../routes/useCurrentProject"
import { Decode } from "../components/Decode"

/**
 * Case-study story: the project's blocks stacked down the page, one full-viewport
 * slot each. The REAL UI screenshot for every block is rendered as a WebGL
 * chromatic plane in StoryScene (palette-tinted split trail on scroll + parallax,
 * the SAME treatment the works gallery gives its images) — this DOM layer keeps
 * only the accessible heading + copy, positioned opposite the plane so the text
 * never sits over the busy screenshot. The slot count here MUST match the block
 * count so each plane centers with its text.
 */
export function Story() {
  const { content } = useCurrentProject()
  if (!content) return null

  return (
    <div className="pointer-events-none">
      <div className="px-6 md:px-16 pt-24">
        <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
          <Decode>Detalles</Decode>
        </p>
      </div>

      {content.blocks.map((b, i) => {
        // The WebGL plane sits on the `left` side for even blocks → put the copy
        // on the opposite side (mirrored for odd blocks) so text stays readable.
        const planeLeft = i % 2 === 0
        // `leadGap` (viewport heights) loosens the rhythm before a block; the same
        // value drives the plane anchor in StoryScene, so the two stay aligned.
        const lead = b.leadGap ?? 0
        return (
          <article
            key={b.video ?? b.image}
            style={lead ? { marginTop: `${lead * 100}vh` } : undefined}
            className={`min-h-screen flex items-center px-6 md:px-16 ${planeLeft ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-sm ${planeLeft ? "text-right" : "text-left"}`}>
              <h3 className="font-display uppercase tracking-tight text-white text-3xl md:text-5xl" style={{ lineHeight: 1.05 }}>
                <Decode>{b.heading}</Decode>
              </h3>
              <p className="mt-5 text-sm md:text-base leading-relaxed text-white/70">
                <Decode delay={0.08}>{b.copy}</Decode>
              </p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
