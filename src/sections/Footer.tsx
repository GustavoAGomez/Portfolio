import { Link, useLocation } from "react-router-dom"
import { useEffect, useRef, type MouseEvent } from "react"
import { useCurrentProject } from "../routes/useCurrentProject"
import { useTransition } from "../transition/TransitionProvider"
import { useStore } from "../scroll/store"
import { PROJECTS } from "../config/projects"
import { ABOUT } from "../config/aboutContent"
import { scrambleToReal } from "../lib/scramble"
import { Decode } from "../components/Decode"
import { CornerHud } from "../components/CornerHud"

/** Meta of the "Sobre mí" row — mirrors a works-list row's role/category/year. */
const ABOUT_ROW_META = ["Gustavo Gómez", "Creative front-end", "Madrid"] as const

/** Strip protocol + trailing slash for a clean display label (tagorodive.com). */
function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

export function Footer() {
  const { content } = useCurrentProject()
  const { go } = useTransition()
  const isAbout = useLocation().pathname.startsWith("/about")
  const reducedMotion = useStore((s) => s.reducedMotion)

  // "Sobre mí" row (case studies only): first-view decode of its meta — the same
  // IntersectionObserver + scramble-toward-real-text mechanism as a works row
  // (Decode can't drive these spans: the hover scramble mutates textContent and
  // would fight Decode's ghost/overlay structure).
  const aboutRowRef = useRef<HTMLAnchorElement | null>(null)
  useEffect(() => {
    const el = aboutRowRef.current
    if (!el || reducedMotion) return
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        io.disconnect() // decode once
        scrambleToReal(el.querySelectorAll<HTMLElement>("[data-scramble]"), 0.06)
      },
      { threshold: 0.6 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reducedMotion, content])

  // Hover/focus re-scramble of the row meta (same feel as the Home list).
  const scrambleAboutMeta = () => {
    const el = aboutRowRef.current
    if (!el || reducedMotion) return
    scrambleToReal(el.querySelectorAll<HTMLElement>("[data-scramble]"), 0.05)
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

        {/* About teaser — a WORKS-LIST ROW: full-width, bordered top/bottom,
            display title left + mono meta right, with the exact hover language
            of the Home list (lime + binary scramble). Reads as "the author is
            one more entry in the index" — louder than the HUD's tiny About link,
            without the centered-hero look. */}
        <section className="min-h-[36svh] flex flex-col justify-center px-6 md:px-16 py-24 pointer-events-none">
          <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
            <Decode>Quién hay detrás</Decode>
          </p>
          <Link
            ref={aboutRowRef}
            to="/about"
            onClick={onAbout}
            onMouseEnter={scrambleAboutMeta}
            onFocus={scrambleAboutMeta}
            aria-label="Sobre mí — Gustavo Gómez, creative front-end, Madrid"
            className="group pointer-events-auto mt-6 flex flex-col gap-2 border-y border-white/10 py-5 lg:flex-row lg:items-baseline lg:justify-between lg:gap-8 lg:py-6"
          >
            <span className="font-display uppercase leading-none tracking-tight text-white text-[clamp(2.5rem,11vw,6rem)] transition-colors duration-300 hover-neon-b">
              <Decode>Sobre mí</Decode>
            </span>
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[10px] md:text-xs font-mono tracking-[0.3em] uppercase text-white/60 transition-colors duration-300 group-hover:text-[var(--color-accent-b)] group-focus-visible:text-[var(--color-accent-b)] lg:max-w-[50%] lg:justify-end">
              {ABOUT_ROW_META.map((m, i) => (
                <span key={m} className="contents">
                  {i > 0 && <span className="opacity-30">/</span>}
                  <span
                    data-scramble
                    data-text={m}
                    className={`whitespace-nowrap ${i === ABOUT_ROW_META.length - 1 ? "text-[var(--color-accent-b)]" : ""}`}
                  >
                    {m}
                  </span>
                </span>
              ))}
            </span>
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
