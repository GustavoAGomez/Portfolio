import { useLayoutEffect, useRef, type CSSProperties } from "react"
import { useCurrentProject } from "../routes/useCurrentProject"
import { useStore } from "../scroll/store"
import { Decode } from "../components/Decode"
import { useT } from "../i18n/ui"

// The DOM is the anchor source of truth: each block's media center is measured into
// store.storyAnchors; the stacked width fractions (0.86/0.58) must stay in sync with StoryScene.
export function Story() {
  const { content } = useCurrentProject()
  const t = useT()
  const rootRef = useRef<HTMLDivElement>(null)
  const setStoryAnchors = useStore((s) => s.setStoryAnchors)

  useLayoutEffect(() => {
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
      <div className="content-max px-6 md:px-16 pt-24 pb-6">
        <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
          <Decode>{t.details}</Decode>
        </p>
      </div>

      {content.blocks.map((b, i) => {
        const planeLeft = i % 2 === 0
        const lead = b.leadGap ?? 0
        // Spacer mirrors StoryScene's stacked plane box (86vw landscape / 58vw portrait).
        const aspect = b.aspect ?? 1.6
        const wFrac = aspect < 1 ? 58 : 86
        return (
          <article
            key={b.video ?? b.image}
            style={lead ? ({ "--lead-mt": `${lead * 12}svh`, "--lead-mt-lg": `${lead * 100}vh` } as CSSProperties) : undefined}
            className={`content-max mt-[var(--lead-mt)] lg:mt-[var(--lead-mt-lg)] flex flex-col pt-[10svh] pb-[6svh] px-6 md:px-16 lg:min-h-svh lg:flex-row lg:items-center lg:py-0 ${planeLeft ? "lg:justify-end" : "lg:justify-start"}`}
          >
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
