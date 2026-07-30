import { Link, useLocation } from "react-router-dom"
import { type MouseEvent } from "react"
import { useCurrentProject } from "../routes/useCurrentProject"
import { useTransition } from "../transition/TransitionProvider"
import { PROJECTS } from "../config/projects"
import { ABOUT } from "../config/aboutContent"
import { Decode } from "../components/Decode"
import { CornerHud } from "../components/CornerHud"
import { useT } from "../i18n/ui"

/** Strip protocol + trailing slash for a clean display label (tagorodive.com). */
function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

export function Footer() {
  const { content } = useCurrentProject()
  const t = useT()
  const { go } = useTransition()
  const isAbout = useLocation().pathname.startsWith("/about")

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
        {/* PILL hover rule (all interactive pills: this, Llámame, ← Index): the
            border stays DIM WHITE on hover — never accent-b. Dim white sits
            BELOW the cursor's luminance threshold, so inside the cursor disc it
            inverts to lime-on-lime and VANISHES (the effect Gustavo wants);
            a lime border sits above the threshold and reads dark through the
            disc instead. Text still goes lime. */}
        {(content.url || content.urlPending) && (
          <section className="content-max min-h-[45svh] flex flex-col items-end justify-center px-6 md:px-16 py-24 text-right pointer-events-none">
            <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
              <Decode>{t.liveSite}</Decode>
            </p>
            <h2 className="mt-6 font-display uppercase text-white text-3xl md:text-5xl" style={{ lineHeight: 1.05 }}>
              <Decode delay={0.06}>{content.url ? prettyUrl(content.url) : t.comingSoon}</Decode>
            </h2>
            {content.url ? (
              <a
                href={content.url}
                target="_blank"
                rel="noreferrer"
                className="group pointer-events-auto mt-8 inline-flex items-center gap-3 rounded-full border border-white/20 px-6 py-3 text-xs font-mono tracking-[0.3em] uppercase text-white/80 transition-colors hover:border-white/30 hover:text-[var(--color-accent-b)]"
              >
                <Decode delay={0.12}>{t.visitSite}</Decode>
                <span aria-hidden="true" className="text-base transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  ↗
                </span>
              </a>
            ) : (
              <span className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 px-6 py-3 text-xs font-mono tracking-[0.3em] uppercase text-white/40">
                <Decode delay={0.12}>{t.inDevelopment}</Decode>
              </span>
            )}
          </section>
        )}

        {/* About teaser — small, LEFT-aligned, the "Siguiente proyecto" language
            one size down: overline + display link + arrow. Quiet in the layout
            but still a real headline gesture (lime hover + glow), vs the HUD's
            tiny mono link. */}
        <section className="content-max px-6 md:px-16 py-24 pointer-events-none">
          <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
            <Decode>{t.whoIsBehind}</Decode>
          </p>
          <Link to="/about" onClick={onAbout} className="group pointer-events-auto mt-4 flex items-baseline gap-3 md:gap-4">
            <span className="font-display uppercase text-white text-[clamp(1.5rem,4vw,2.75rem)] leading-none hover-neon-b">
              <Decode delay={0.06}>{t.aboutMe}</Decode>
            </span>
            <span aria-hidden="true" className="font-display text-[clamp(1rem,2.5vw,1.75rem)] text-white/40 transition-all group-hover:translate-x-1 group-hover:text-[var(--color-accent-b)]">
              →
            </span>
          </Link>
        </section>

        {/* Next project + footer HUD share the diagonal-stripe backdrop. LEFT-aligned
            giant headline — the primary navigation gesture. */}
        <div className="relative flex flex-col justify-end">
          <div className="diagonal-stripe absolute inset-0" />
          <div className="content-max relative px-6 md:px-16 pt-24 pb-10">
            {next && nextTo ? (
              <>
                <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
                  <Decode>{t.nextProject}</Decode>
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
                  <Decode>{t.contact}</Decode>
                </p>
                <a href="mailto:stgustavo.gomez@gmail.com" className="group pointer-events-auto mt-4 flex items-baseline gap-4 md:gap-6">
                  <span className="font-display uppercase text-white text-[clamp(2.25rem,9vw,6rem)] leading-none hover-neon-b">
                    <Decode delay={0.06}>{t.letsTalk}</Decode>
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
        <div className="content-max relative px-6 md:px-16 pt-24 pb-10">
          <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
            <Decode>{t.contact}</Decode>
          </p>
          <a href="mailto:stgustavo.gomez@gmail.com" className="group pointer-events-auto mt-4 flex items-baseline gap-4 md:gap-6">
            <span className="font-display uppercase text-white text-[clamp(2.25rem,9vw,6rem)] leading-none hover-neon-b">
              <Decode delay={0.06}>{t.letsTalk}</Decode>
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
            className="group pointer-events-auto mt-8 inline-flex items-center gap-3 rounded-full border border-white/20 px-6 py-3 text-xs font-mono tracking-[0.3em] uppercase text-white/80 transition-colors hover:border-white/30 hover:text-[var(--color-accent-b)]"
          >
            <Decode delay={0.12}>{`${t.callMe} · ${ABOUT.phone.display}`}</Decode>
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
      <div className="content-max relative px-6 md:px-16 pt-24 pb-10">
        <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">{t.contact}</p>
        <a href="mailto:stgustavo.gomez@gmail.com" className="pointer-events-auto inline-block font-display uppercase text-white text-[clamp(2.5rem,9vw,6rem)] mt-4 hover-neon-b">
          {t.sayHello}
        </a>
        <p className="mt-8 text-xs text-white/40">© {new Date().getFullYear()} — {t.builtWith}</p>
      </div>
      <CornerHud variant="block" />
    </div>
  )
}
