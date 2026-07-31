import { useRef, type MouseEvent } from "react"
import { Link } from "react-router-dom"
import { useDomParallax } from "../scroll/useDomParallax"
import { useTransition } from "../transition/TransitionProvider"
import { Decode } from "../components/Decode"
import { useT } from "../i18n/ui"

export function NotFound() {
  const line = useRef<HTMLHeadingElement>(null)
  useDomParallax(line, 0.08)
  const { go } = useTransition()
  const t = useT()

  const onHome = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    go("/")
  }

  return (
    <div className="content-max relative min-h-svh flex flex-col items-center justify-center px-6 text-center pointer-events-none">
      <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
        <Decode>{t.error404}</Decode>
      </p>
      {/* Inline lineHeight — .font-display's 0.86 collides wrapped lines. */}
      <h1 ref={line} className="mt-6 font-display uppercase tracking-tight text-white text-[13vw] md:text-[min(9vw,8.1rem)]" style={{ lineHeight: 1 }}>
        <Decode duration={0.6}>{t.nothingHere}</Decode>
      </h1>
      <p className="mt-6 max-w-md text-sm md:text-base leading-relaxed text-white/70">
        <Decode delay={0.15}>{t.notFoundCopy}</Decode>
      </p>
      <Link to="/" onClick={onHome} className="group pointer-events-auto mt-10 flex items-baseline gap-3 md:gap-4">
        <span className="font-display uppercase text-white text-[clamp(1.5rem,4vw,2.75rem)] leading-none hover-neon-b">
          <Decode delay={0.25}>{t.backToIndex}</Decode>
        </span>
        <span aria-hidden="true" className="font-display text-[clamp(1rem,2.5vw,1.75rem)] text-white/40 transition-all group-hover:translate-x-1 group-hover:text-[var(--color-accent-b)]">
          →
        </span>
      </Link>
    </div>
  )
}
