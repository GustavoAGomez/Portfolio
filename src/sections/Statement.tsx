import { useRef } from "react"
import { useDomParallax } from "../scroll/useDomParallax"
import { useCurrentProject } from "../routes/useCurrentProject"
import { Decode } from "../components/Decode"
import { useT } from "../i18n/ui"

export function Statement() {
  const line = useRef<HTMLHeadingElement>(null)
  useDomParallax(line, 0.08)
  const { content } = useCurrentProject()
  const t = useT()

  if (content) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center px-6 text-center pointer-events-none">
        {/* Inline lineHeight — .font-display's 0.86 collides wrapped lines. */}
        <h2 ref={line} className="font-display uppercase tracking-tight text-white text-[14vw] md:text-[min(10vw,9rem)]" style={{ lineHeight: 1 }}>
          <Decode duration={0.6}>{content.title}</Decode>
        </h2>
        <p className="mt-6 text-xs md:text-sm font-mono tracking-[0.35em] uppercase text-[var(--color-accent-b)]">
          <Decode delay={0.15} duration={1.0}>
            {content.tagline}
          </Decode>
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex items-center justify-center px-6 pointer-events-none">
      <h2 ref={line} className="font-display text-center text-[13vw] md:text-[min(9vw,8.1rem)]" style={{ lineHeight: 1 }}>
        <span className="text-white">{t.stGeneric1}</span>
        <br />
        <span className="neon-b">{t.stGeneric2}</span>
        <br />
        <span className="text-white">{t.stGeneric3}</span>
      </h2>
    </div>
  )
}
