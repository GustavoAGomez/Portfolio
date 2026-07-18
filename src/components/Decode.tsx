import { useEffect, useRef, type CSSProperties } from "react"
import gsap from "gsap"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import { useStore } from "../scroll/store"

gsap.registerPlugin(ScrambleTextPlugin)

interface DecodeProps {
  /** Plain text to decode (binary `01` → words). */
  children: string
  className?: string
  style?: CSSProperties
  /** Seconds to wait after entering view before decoding. */
  delay?: number
  /** Override the auto duration (scaled by length otherwise). */
  duration?: number
}

/**
 * Inline text that plays the binary scramble→reveal "decoding" effect (the same
 * GSAP ScrambleTextPlugin the Home works list uses on hover) the first time it
 * scrolls into view. Text already in view on mount — the hero — decodes on
 * landing. Hidden until it decodes so there's no pre-decode flash; honors
 * reduced-motion (renders the text immediately, no scramble).
 *
 * Always renders a <span>; wrap it in whatever block element carries the styling
 * (`<h2><Decode>…</Decode></h2>`), so layout/styles are untouched.
 */
export function Decode({ children, className, style, delay = 0, duration }: DecodeProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const reducedMotion = useStore((s) => s.reducedMotion)

  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion) return
    const dur = duration ?? Math.min(0.8, 0.28 + children.length * 0.005)
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        io.disconnect() // decode once
        gsap.set(el, { autoAlpha: 1 })
        gsap.to(el, {
          duration: dur,
          delay,
          ease: "none",
          scrambleText: { text: children, chars: "01", speed: 1, revealDelay: 0.15 }
        })
      },
      { threshold: 0.25 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [children, reducedMotion, delay, duration])

  // Hidden until decoded (motion); visible immediately under reduced-motion.
  // `overflowWrap: anywhere` lets the space-less binary string wrap instead of
  // overflowing (real words still break only at spaces).
  return (
    <span ref={ref} className={className} style={{ overflowWrap: "anywhere", ...style, visibility: reducedMotion ? undefined : "hidden" }}>
      {children}
    </span>
  )
}
