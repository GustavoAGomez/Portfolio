import { useRef } from "react"
import { useDomParallax } from "../scroll/useDomParallax"

export function Statement() {
  const line = useRef<HTMLHeadingElement>(null)
  useDomParallax(line, 0.08)

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
