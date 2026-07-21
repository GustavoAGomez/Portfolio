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
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center pointer-events-none">
        <h2 ref={line} className="font-display uppercase leading-[0.9] tracking-tight text-white text-[14vw] md:text-[10vw]">
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
    <div className="min-h-screen flex items-center justify-center px-6 pointer-events-none">
      <h2 ref={line} className="font-display text-center leading-[0.9] text-[13vw] md:text-[9vw]">
        <span className="text-white">CULTURE IS</span>
        <br />
        <span className="neon-b">NOT YOUR</span>
        <br />
        <span className="text-white">FRIEND.</span>
      </h2>
    </div>
  )
}
