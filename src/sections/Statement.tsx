import { useRef } from "react"
import { useDomParallax } from "../scroll/useDomParallax"
import { useCurrentProject } from "../routes/useCurrentProject"
import { Decode } from "../components/Decode"

export function Statement() {
  const line = useRef<HTMLHeadingElement>(null)
  useDomParallax(line, 0.08)
  const { content } = useCurrentProject()

  // Case study: project title + tagline.
  if (content) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center px-6 text-center pointer-events-none">
        {/* Inline lineHeight (like Story's h3): .font-display hard-sets 0.86 —
            tuned for SINGLE-line display text — and beats any leading-* utility
            in the cascade; at 0.86 a wrapped title (mobile) collides its lines
            (Anton caps span ~0.87em). Inline style wins over the class. */}
        <h2 ref={line} className="font-display uppercase tracking-tight text-white text-[14vw] md:text-[10vw]" style={{ lineHeight: 1 }}>
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

  // Generic detail (placeholder projects).
  return (
    <div className="min-h-svh flex items-center justify-center px-6 pointer-events-none">
      {/* Inline lineHeight: this one always wraps (3 lines) — see note above. */}
      <h2 ref={line} className="font-display text-center text-[13vw] md:text-[9vw]" style={{ lineHeight: 1 }}>
        <span className="text-white">CULTURE IS</span>
        <br />
        <span className="neon-b">NOT YOUR</span>
        <br />
        <span className="text-white">FRIEND.</span>
      </h2>
    </div>
  )
}
