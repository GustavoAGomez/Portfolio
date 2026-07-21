import { Link } from "react-router-dom"
import { type MouseEvent } from "react"
import { useCurrentProject } from "../routes/useCurrentProject"
import { useTransition } from "../transition/TransitionProvider"
import { PROJECTS } from "../config/projects"
import { Decode } from "../components/Decode"
import { CornerHud } from "../components/CornerHud"

/** Strip protocol + trailing slash for a clean display label (tagorodive.com). */
function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

export function Footer() {
  const { content } = useCurrentProject()
  const { go } = useTransition()

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

    return (
      <>
        {/* Visit the live site — RIGHT-aligned, domain as a mid headline + an
            outlined pill button (the stack-chip border language). Reads as a CTA,
            not a list row, and its alignment opposes the LEFT-aligned next block. */}
        {content.url && (
          <section className="min-h-[45vh] flex flex-col items-end justify-center px-6 md:px-16 py-24 text-right pointer-events-none">
            <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
              <Decode>Sitio en vivo</Decode>
            </p>
            <h2 className="mt-6 font-display uppercase text-white text-3xl md:text-5xl" style={{ lineHeight: 1.05 }}>
              <Decode delay={0.06}>{prettyUrl(content.url)}</Decode>
            </h2>
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
          </section>
        )}

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
                  <span className="font-display uppercase text-white text-6xl md:text-8xl leading-none transition-colors group-hover:text-[var(--color-accent-b)]">
                    <Decode delay={0.06}>{next.title}</Decode>
                  </span>
                  <span aria-hidden="true" className="font-display text-4xl md:text-6xl text-white/40 transition-all group-hover:translate-x-1 group-hover:text-[var(--color-accent-b)]">
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
                  <span className="font-display uppercase text-white text-6xl md:text-8xl leading-none transition-colors group-hover:text-[var(--color-accent-b)]">
                    <Decode delay={0.06}>Hablemos</Decode>
                  </span>
                  <span aria-hidden="true" className="font-display text-4xl md:text-6xl text-white/40 transition-all group-hover:translate-x-1 group-hover:text-[var(--color-accent-b)]">
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

  // Generic detail (placeholder projects).
  return (
    <div className="relative flex flex-col justify-end">
      <div className="diagonal-stripe absolute inset-0" />
      <div className="relative px-6 md:px-16 pt-24 pb-10">
        <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">Contact</p>
        <a href="mailto:stgustavo.gomez@gmail.com" className="pointer-events-auto inline-block font-display text-white text-5xl md:text-8xl mt-4 hover:neon-b transition-all">
          SAY HELLO
        </a>
        <p className="mt-8 text-xs text-white/40">© {new Date().getFullYear()} — Built with three.js, R3F &amp; Lenis.</p>
      </div>
      <CornerHud variant="block" />
    </div>
  )
}
