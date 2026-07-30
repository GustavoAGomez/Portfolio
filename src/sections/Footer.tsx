import { Link, useLocation } from "react-router-dom"
import { useEffect, useRef, type MouseEvent } from "react"
import gsap from "gsap"
import { useCurrentProject } from "../routes/useCurrentProject"
import { useTransition } from "../transition/TransitionProvider"
import { useStore } from "../scroll/store"
import { PROJECTS } from "../config/projects"
import { ABOUT } from "../config/aboutContent"
import { Decode } from "../components/Decode"
import { CornerHud } from "../components/CornerHud"

/** Copies of the marquee phrase per half — enough to exceed any viewport width. */
const MARQUEE_REPEATS = 4

/** Strip protocol + trailing slash for a clean display label (tagorodive.com). */
function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

export function Footer() {
  const { content } = useCurrentProject()
  const { go } = useTransition()
  const isAbout = useLocation().pathname.startsWith("/about")
  const reducedMotion = useStore((s) => s.reducedMotion)

  // "Sobre mí" marquee (case studies only): an infinite band — the track holds
  // TWO identical halves and loops xPercent 0→-50, so the wrap lands exactly on
  // the seam and never jumps. Compositor-only (transform), killed on unmount;
  // reduced-motion never starts it (static band, still clickable).
  const marqueeTrack = useRef<HTMLDivElement | null>(null)
  const marqueeTween = useRef<gsap.core.Tween | null>(null)
  useEffect(() => {
    const track = marqueeTrack.current
    if (!track || reducedMotion) return
    marqueeTween.current = gsap.to(track, { xPercent: -50, ease: "none", duration: 22, repeat: -1 })
    return () => {
      marqueeTween.current?.kill()
      marqueeTween.current = null
      gsap.set(track, { xPercent: 0 })
    }
  }, [reducedMotion, content])

  // Hover slows the band to a crawl (readable + "it noticed you"), leave restores.
  const setMarqueeSpeed = (scale: number) => {
    const tween = marqueeTween.current
    if (tween) gsap.to(tween, { timeScale: scale, duration: 0.5, ease: "power2.out", overwrite: true })
  }

  // Case study: live-site CTA → next project → shared footer HUD.
  if (content) {
    const nextId = content.nextId
    const next = nextId ? PROJECTS.find((p) => p.id === nextId) : undefined
    const nextTo = next ? `/work/${next.id}` : undefined
    const onNext = (e: MouseEvent<HTMLAnchorElement>) => {
      if (!nextTo) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      e.preventDefault()
      go(nextTo)
    }
    const onAbout = (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      e.preventDefault()
      go("/about")
    }

    return (
      <>
        {/* Visit the live site — RIGHT-aligned, domain as a mid headline + an
            outlined pill button (the stack-chip border language). Reads as a CTA,
            not a list row, and its alignment opposes the LEFT-aligned next block.
            When the site is still in development (`urlPending`), the domain is
            replaced by "Próximamente" and the CTA becomes a non-clickable pill. */}
        {(content.url || content.urlPending) && (
          <section className="min-h-[45svh] flex flex-col items-end justify-center px-6 md:px-16 py-24 text-right pointer-events-none">
            <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
              <Decode>Sitio en vivo</Decode>
            </p>
            <h2 className="mt-6 font-display uppercase text-white text-3xl md:text-5xl" style={{ lineHeight: 1.05 }}>
              <Decode delay={0.06}>{content.url ? prettyUrl(content.url) : "Próximamente"}</Decode>
            </h2>
            {content.url ? (
              <a
                href={content.url}
                target="_blank"
                rel="noreferrer"
                className="group pointer-events-auto mt-8 inline-flex items-center gap-3 rounded-full border border-white/20 px-6 py-3 text-xs font-mono tracking-[0.3em] uppercase text-white/80 transition-colors hover:border-[var(--color-accent-b)] hover:text-[var(--color-accent-b)]"
              >
                <Decode delay={0.12}>Visitar la web</Decode>
                <span aria-hidden="true" className="text-base transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  ↗
                </span>
              </a>
            ) : (
              <span className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 px-6 py-3 text-xs font-mono tracking-[0.3em] uppercase text-white/40">
                <Decode delay={0.12}>En desarrollo</Decode>
              </span>
            )}
          </section>
        )}

        {/* About teaser — an infinite MARQUEE band: full-bleed, bordered top and
            bottom, "SOBRE MÍ →" looping right-to-left in giant display type. The
            whole band is one link to /about; hovering slows it to a crawl and
            tints the words lime (the arrows are lime always). Louder than the
            HUD's tiny About link, without the centered-hero look. */}
        <section className="min-h-[36svh] flex flex-col justify-center py-24 pointer-events-none">
          <p className="px-6 md:px-16 text-xs font-mono tracking-[0.35em] uppercase text-white/60">
            <Decode>Quién hay detrás</Decode>
          </p>
          <Link
            to="/about"
            onClick={onAbout}
            onMouseEnter={() => setMarqueeSpeed(0.15)}
            onMouseLeave={() => setMarqueeSpeed(1)}
            aria-label="Sobre mí — quién hay detrás"
            className="group pointer-events-auto mt-6 block overflow-hidden border-y border-white/10 py-5 md:py-7"
          >
            <div ref={marqueeTrack} className="flex w-max whitespace-nowrap will-change-transform" aria-hidden="true">
              {[0, 1].map((half) => (
                <div key={half} className="flex items-baseline">
                  {Array.from({ length: MARQUEE_REPEATS }, (_, i) => (
                    <span key={i} className="flex items-baseline gap-5 md:gap-9 mr-5 md:mr-9">
                      <span className="font-display uppercase leading-none tracking-tight text-white text-[clamp(2.75rem,8vw,5.5rem)] transition-colors duration-300 hover-neon-b">
                        Sobre mí
                      </span>
                      <span className="font-display leading-none text-[clamp(1.75rem,5vw,3.5rem)] text-[var(--color-accent-b)]">→</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </Link>
        </section>

        {/* Next project + footer HUD share the diagonal-stripe backdrop. LEFT-aligned
            giant headline — the primary navigation gesture. */}
        <div className="relative flex flex-col justify-end">
          <div className="diagonal-stripe absolute inset-0" />
          <div className="relative px-6 md:px-16 pt-24 pb-10">
            {next && nextTo ? (
              <>
                <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
                  <Decode>Siguiente proyecto</Decode>
                </p>
                <Link to={nextTo} onClick={onNext} className="group pointer-events-auto mt-4 flex items-baseline gap-4 md:gap-6">
                  <span className="font-display uppercase text-white text-[clamp(2.25rem,9vw,6rem)] leading-none hover-neon-b">
                    <Decode delay={0.06}>{next.title}</Decode>
                  </span>
                  <span aria-hidden="true" className="font-display text-[clamp(1.5rem,5vw,3.75rem)] text-white/40 transition-all group-hover:translate-x-1 group-hover:text-[var(--color-accent-b)]">
                    →
                  </span>
                </Link>
              </>
            ) : (
              <>
                <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
                  <Decode>Contacto</Decode>
                </p>
                <a href="mailto:stgustavo.gomez@gmail.com" className="group pointer-events-auto mt-4 flex items-baseline gap-4 md:gap-6">
                  <span className="font-display uppercase text-white text-[clamp(2.25rem,9vw,6rem)] leading-none hover-neon-b">
                    <Decode delay={0.06}>Hablemos</Decode>
                  </span>
                  <span aria-hidden="true" className="font-display text-[clamp(1.5rem,5vw,3.75rem)] text-white/40 transition-all group-hover:translate-x-1 group-hover:text-[var(--color-accent-b)]">
                    →
                  </span>
                </a>
              </>
            )}
          </div>

          {/* Same footer as the Home, below the works list. */}
          <CornerHud variant="block" />
        </div>
      </>
    )
  }

  // About page: Spanish contact close (same language as the case studies).
  if (isAbout) {
    return (
      <div className="relative flex flex-col justify-end">
        <div className="diagonal-stripe absolute inset-0" />
        <div className="relative px-6 md:px-16 pt-24 pb-10">
          <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
            <Decode>Contacto</Decode>
          </p>
          <a href="mailto:stgustavo.gomez@gmail.com" className="group pointer-events-auto mt-4 flex items-baseline gap-4 md:gap-6">
            <span className="font-display uppercase text-white text-[clamp(2.25rem,9vw,6rem)] leading-none hover-neon-b">
              <Decode delay={0.06}>Hablemos</Decode>
            </span>
            <span aria-hidden="true" className="font-display text-[clamp(1.5rem,5vw,3.75rem)] text-white/40 transition-all group-hover:translate-x-1 group-hover:text-[var(--color-accent-b)]">
              →
            </span>
          </a>
          {/* Direct call — tel: opens the device's dialer. The number is spelled
              out in the label (the pill is the same outlined language as the
              live-site CTA), so it's readable even without tapping. */}
          <a
            href={ABOUT.phone.href}
            className="group pointer-events-auto mt-8 inline-flex items-center gap-3 rounded-full border border-white/20 px-6 py-3 text-xs font-mono tracking-[0.3em] uppercase text-white/80 transition-colors hover:border-[var(--color-accent-b)] hover:text-[var(--color-accent-b)]"
          >
            <Decode delay={0.12}>{`Llámame · ${ABOUT.phone.display}`}</Decode>
            <span aria-hidden="true" className="text-base transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              ↗
            </span>
          </a>
        </div>
        <CornerHud variant="block" />
      </div>
    )
  }

  // Generic detail (placeholder projects).
  return (
    <div className="relative flex flex-col justify-end">
      <div className="diagonal-stripe absolute inset-0" />
      <div className="relative px-6 md:px-16 pt-24 pb-10">
        <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">Contact</p>
        <a href="mailto:stgustavo.gomez@gmail.com" className="pointer-events-auto inline-block font-display text-white text-[clamp(2.5rem,9vw,6rem)] mt-4 hover-neon-b">
          SAY HELLO
        </a>
        <p className="mt-8 text-xs text-white/40">© {new Date().getFullYear()} — Built with three.js, R3F &amp; Lenis.</p>
      </div>
      <CornerHud variant="block" />
    </div>
  )
}
