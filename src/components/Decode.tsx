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
 * LAYOUT-STABLE: the space-less binary wraps at different points than the real
 * words, so scrambling the flowed text changes the line count every frame and
 * everything below the paragraph jumps (worst on mobile widths). Instead, a
 * visibility-hidden GHOST of the real text reserves the exact final layout from
 * first paint, and the scramble plays in an absolutely-positioned overlay that
 * can't affect flow (extra binary lines are clipped). On complete the ghost is
 * revealed and the overlay dropped — the end state is the real text in normal
 * flow, pixel-identical to before.
 *
 * Always renders a <span>; wrap it in whatever block element carries the styling
 * (`<h2><Decode>…</Decode></h2>`), so layout/styles are untouched.
 */
export function Decode({ children, className, style, delay = 0, duration }: DecodeProps) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const ghostRef = useRef<HTMLSpanElement>(null)
  const liveRef = useRef<HTMLSpanElement>(null)
  const reducedMotion = useStore((s) => s.reducedMotion)

  useEffect(() => {
    const wrap = wrapRef.current
    const ghost = ghostRef.current
    const live = liveRef.current
    if (!wrap || !ghost || !live || reducedMotion) return
    const dur = duration ?? Math.min(0.8, 0.28 + children.length * 0.005)
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        io.disconnect() // decode once
        live.textContent = children
        gsap.set(live, { autoAlpha: 1 })
        gsap.to(live, {
          duration: dur,
          delay,
          ease: "none",
          scrambleText: { text: children, chars: "01", speed: 1, revealDelay: 0.15 },
          onComplete: () => {
            // Swap to the real text in normal flow (also restores a11y/selection).
            // Empty the overlay too so the element's textContent isn't doubled.
            ghost.style.visibility = "visible"
            live.style.display = "none"
            live.textContent = ""
          }
        })
      },
      { threshold: 0.25 }
    )
    io.observe(wrap)
    return () => {
      io.disconnect()
      gsap.killTweensOf(live)
    }
  }, [children, reducedMotion, delay, duration])

  // reduced-motion: the plain text, immediately (no ghost/overlay machinery).
  if (reducedMotion) {
    return (
      <span className={className} style={{ overflowWrap: "anywhere", ...style }}>
        {children}
      </span>
    )
  }

  return (
    <span ref={wrapRef} className={className} style={{ position: "relative", display: "inline-block", maxWidth: "100%", verticalAlign: "top", ...style }}>
      {/* Ghost — reserves the real text's final layout; revealed on complete. */}
      <span ref={ghostRef} style={{ visibility: "hidden" }}>
        {children}
      </span>
      {/* Overlay — plays the scramble inside the reserved box, clipped. */}
      <span
        ref={liveRef}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, overflow: "hidden", overflowWrap: "anywhere", visibility: "hidden" }}
      />
    </span>
  )
}
