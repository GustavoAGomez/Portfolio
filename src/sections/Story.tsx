import { useEffect, useRef } from "react"
import { useCurrentProject } from "../routes/useCurrentProject"
import { useStore } from "../scroll/store"
import { Decode } from "../components/Decode"

/**
 * Case-study story: the project's blocks stacked down the page. The REAL UI
 * screenshot for every block is rendered as a WebGL chromatic plane in
 * StoryScene (palette-tinted split trail on scroll + parallax) — this DOM layer
 * keeps the accessible heading + copy, plus (stacked) a SPACER that reserves the
 * plane's exact box in the flow.
 *
 * ANCHORING — the DOM is the source of truth: this component MEASURES each
 * block's media center (the spacer below lg, the article center on ≥lg where
 * the plane sits beside the text) and writes document-space px into
 * `store.storyAnchors`; StoryScene pins each plane to its measured anchor. So
 * slot heights, paddings, `leadGap`s and copy length can change freely here
 * without any mirrored canvas math drifting out of sync.
 *
 * Stacked (<lg): compact slots — spacer (plane) with the copy right under it,
 * breathing room via py only (no full-viewport slots, which read as dead gulfs
 * on phones). ≥lg: the previous full-viewport side-by-side alternation.
 */
export function Story() {
  const { content } = useCurrentProject()
  const rootRef = useRef<HTMLDivElement>(null)
  const setStoryAnchors = useStore((s) => s.setStoryAnchors)

  // Measure media centers (doc-space) on mount, resize and any reflow of the
  // section (ResizeObserver on the root catches copy/fonts reflows). rect.top +
  // scrollY is scroll-independent, so WHEN we measure doesn't matter.
  useEffect(() => {
    const root = rootRef.current
    if (!root || !content) return
    const measure = () => {
      const stacked = window.innerWidth < 1024
      const els = root.querySelectorAll<HTMLElement>(stacked ? "[data-plane-slot]" : "article")
      const centers: number[] = []
      els.forEach((el) => {
        const r = el.getBoundingClientRect()
        centers.push(r.top + window.scrollY + r.height / 2)
      })
      setStoryAnchors(centers)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
      setStoryAnchors([])
    }
  }, [content, setStoryAnchors])

  if (!content) return null

  return (
    <div ref={rootRef} className="pointer-events-none relative">
      {/* Overline IN FLOW — safe here because the plane anchors are MEASURED
          from the DOM (its height just pushes the blocks down and the planes
          follow). Gallery.tsx still needs its absolute header: WorksScene splits
          the section into equal fraction slots. */}
      <div className="px-6 md:px-16 pt-24 pb-6">
        <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
          <Decode>Detalles</Decode>
        </p>
      </div>

      {content.blocks.map((b, i) => {
        // The WebGL plane sits on the `left` side for even blocks → put the copy
        // on the opposite side (mirrored for odd blocks) so text stays readable.
        const planeLeft = i % 2 === 0
        // `leadGap` (viewport heights) loosens the rhythm before a block. The
        // measured anchors absorb it automatically.
        const lead = b.leadGap ?? 0
        // Spacer mirrors StoryScene's stacked plane box: width fraction of the
        // viewport (86vw landscape / 58vw portrait) at the block's aspect.
        const aspect = b.aspect ?? 1.6
        const wFrac = aspect < 1 ? 58 : 86
        return (
          <article
            key={b.video ?? b.image}
            style={lead ? { marginTop: `${lead * 100}vh` } : undefined}
            // Stacked: compact self-sized slot (spacer + copy), breathing via
            // pt/pb. ≥lg: full-viewport slot, copy centered opposite the plane.
            className={`flex flex-col pt-[10svh] pb-[6svh] px-6 md:px-16 lg:min-h-svh lg:flex-row lg:items-center lg:py-0 ${planeLeft ? "lg:justify-end" : "lg:justify-start"}`}
          >
            {/* Plane box (stacked only) — the chromatic plane renders exactly
                here (StoryScene anchors to this element's measured center). */}
            <div data-plane-slot aria-hidden="true" className="self-center lg:hidden" style={{ width: `${wFrac}vw`, aspectRatio: String(aspect) }} />
            <div className={`max-w-sm text-left mt-7 lg:mt-0 ${planeLeft ? "lg:text-right" : "lg:text-left"}`}>
              <h3 className="font-display uppercase tracking-tight text-white text-2xl md:text-3xl lg:text-5xl" style={{ lineHeight: 1.05 }}>
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
