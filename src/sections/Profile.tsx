import { useLayoutEffect, useRef } from "react"
import { useDomParallax } from "../scroll/useDomParallax"
import { useStore } from "../scroll/store"
import { Decode } from "../components/Decode"
import { getAbout } from "../config/aboutContent"
import { useT } from "../i18n/ui"

// The DOM is the anchor source of truth: the photo slot's center is measured into
// store.profileAnchors; the stacked 0.58 width fraction must stay in sync with ProfileScene.
export function Profile() {
  const rootRef = useRef<HTMLDivElement>(null)
  const line = useRef<HTMLHeadingElement>(null)
  useDomParallax(line, 0.08)
  const setProfileAnchors = useStore((s) => s.setProfileAnchors)
  const ABOUT = getAbout(useStore((s) => s.locale))
  const t = useT()

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const measure = () => {
      const stacked = window.innerWidth < 1024
      const els = root.querySelectorAll<HTMLElement>(stacked ? "[data-plane-slot]" : "article")
      const centers: number[] = []
      els.forEach((el) => {
        const r = el.getBoundingClientRect()
        centers.push(r.top + window.scrollY + r.height / 2)
      })
      setProfileAnchors(centers)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
      setProfileAnchors([])
    }
  }, [setProfileAnchors])

  return (
    <div ref={rootRef} className="pointer-events-none relative">
      <div className="min-h-svh flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
          <Decode>{t.aboutMe}</Decode>
        </p>
        {/* Inline lineHeight — .font-display's 0.86 collides wrapped lines. */}
        <h2 ref={line} className="mt-6 font-display uppercase tracking-tight text-white text-[14vw] md:text-[min(9vw,8.1rem)]" style={{ lineHeight: 1 }}>
          <Decode duration={0.6}>{ABOUT.title}</Decode>
        </h2>
        <p className="mt-6 text-xs md:text-sm font-mono tracking-[0.35em] uppercase text-[var(--color-accent-b)]">
          <Decode delay={0.15} duration={1.0}>
            {ABOUT.tagline}
          </Decode>
        </p>
      </div>

      <article className="content-max flex flex-col pt-[10svh] pb-[6svh] px-6 md:px-16 lg:min-h-svh lg:flex-row lg:items-center lg:justify-end lg:py-0">
        {/* Plane box (stacked only) — mirrors ProfileScene's 0.58 fraction. */}
        <div data-plane-slot aria-hidden="true" className="self-center lg:hidden" style={{ width: "58vw", aspectRatio: String(ABOUT.photo.aspect) }} />
        <div className="max-w-sm text-left mt-7 lg:mt-0 lg:text-right">
          <h3 className="font-display uppercase tracking-tight text-white text-2xl md:text-3xl lg:text-5xl" style={{ lineHeight: 1.05 }}>
            <Decode>{t.hi}</Decode>
          </h3>
          {ABOUT.bio.map((p, i) => (
            <p key={p.slice(0, 24)} className="mt-5 text-sm md:text-base leading-relaxed text-white/70">
              <Decode delay={0.08 + i * 0.06}>{p}</Decode>
            </p>
          ))}
        </div>
      </article>

      <div className="content-max min-h-[72svh] py-[12svh] flex items-center justify-start md:justify-end px-6 md:px-16">
        <div className="max-w-2xl text-left md:text-right">
          <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
            <Decode>{t.whatIDo}</Decode>
          </p>
          <ol className="mt-8 space-y-7">
            {ABOUT.areas.map((a, i) => (
              <li key={a.title}>
                <p className="font-display uppercase text-white text-2xl md:text-4xl" style={{ lineHeight: 1.15 }}>
                  <span className="text-[var(--color-accent-b)] text-lg md:text-2xl align-middle mr-3 md:mr-4">
                    <Decode delay={0.06 + i * 0.08}>{"0" + (i + 1)}</Decode>
                  </span>
                  <Decode delay={0.06 + i * 0.08}>{a.title}</Decode>
                </p>
                <p className="mt-2 text-[10px] md:text-xs font-mono tracking-[0.25em] uppercase text-white/50">
                  <Decode delay={0.12 + i * 0.08}>{a.detail}</Decode>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="content-max min-h-[72svh] py-[12svh] flex items-center px-6 md:px-16">
        <div className="w-full max-w-3xl">
          <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
            <Decode>{t.trajectory}</Decode>
          </p>
          <ol className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {ABOUT.stints.map((s, i) => (
              <li key={s.place} className="py-5 flex flex-col gap-1 md:flex-row md:items-baseline md:gap-8">
                <span className="shrink-0 w-32 text-[10px] md:text-xs font-mono tracking-[0.25em] uppercase text-[var(--color-accent-b)]">
                  <Decode delay={0.06 + i * 0.08}>{s.period}</Decode>
                </span>
                <span className="font-display uppercase text-white text-xl md:text-2xl" style={{ lineHeight: 1.15 }}>
                  <Decode delay={0.09 + i * 0.08}>{s.place}</Decode>
                </span>
                <span className="text-sm leading-relaxed text-white/60 md:ml-auto md:max-w-xs md:text-right">
                  <Decode delay={0.12 + i * 0.08}>{s.summary}</Decode>
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-14 text-xs font-mono tracking-[0.35em] uppercase text-white/60">
            <Decode>{t.codeFor}</Decode>
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {ABOUT.brands.map((b, i) => (
              <span key={b} className="rounded-full border border-white/15 px-3 py-1 text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] text-white/70">
                <Decode delay={0.1 + i * 0.04}>{b}</Decode>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
