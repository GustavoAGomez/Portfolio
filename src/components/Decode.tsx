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
 * Read back the lines the browser ACTUALLY laid out for the ghost's text: walk
 * the words with a Range and group them by the top of their client rect. Words
 * are enough (breaks happen at spaces) and it's ~one measurement per word.
 * Returns [] if there's nothing to measure — callers fall back to one blob.
 */
function measureLines(host: HTMLElement, text: string): string[] {
  const node = host.firstChild
  if (!(node instanceof Text)) return []
  const range = document.createRange()
  const lines: string[] = []
  let top: number | null = null
  let current = ""
  const word = /\S+/g
  let m: RegExpExecArray | null
  while ((m = word.exec(text)) !== null) {
    range.setStart(node, m.index)
    range.setEnd(node, m.index + m[0].length)
    const rect = range.getBoundingClientRect()
    if (top === null || Math.abs(rect.top - top) < 1) {
      current = current ? `${current} ${m[0]}` : m[0]
      if (top === null) top = rect.top
    } else {
      lines.push(current)
      current = m[0]
      top = rect.top
    }
  }
  if (current) lines.push(current)
  return lines
}

/**
 * Inline text that plays the binary scramble→reveal "decoding" effect (the same
 * GSAP ScrambleTextPlugin the Home works list uses on hover) the first time it
 * scrolls into view. Text already in view on mount — the hero — decodes on
 * landing. Hidden until it decodes so there's no pre-decode flash; honors
 * reduced-motion (renders the text immediately, no scramble).
 *
 * LAYOUT-STABLE, on two levels:
 *  1. A visibility-hidden GHOST of the real text reserves the exact final layout
 *     from first paint, and the scramble plays in an absolutely-positioned
 *     overlay that can't affect flow. On complete the ghost is revealed and the
 *     overlay dropped — the end state is the real text in normal flow.
 *  2. The overlay is split into ONE SPAN PER LAID-OUT LINE (measured off the
 *     ghost, after `document.fonts.ready` so the webfont's metrics are the ones
 *     in play), each `white-space: nowrap`. The space-less binary is narrower
 *     than the words, so a single blob re-wrapped mid-animation: a title that
 *     ends on two lines flashed on ONE line first and then jumped (visible on
 *     mobile, where titles wrap). Per line, the line structure is the FINAL one
 *     from the first frame and cannot change; each line reveals in reading order
 *     (delay/duration proportional to its share of the characters), so the pace
 *     reads the same as the old single tween.
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
    let cancelled = false
    let tl: gsap.core.Timeline | null = null

    const play = () => {
      if (cancelled) return
      // Swap to the real text in normal flow (also restores a11y/selection).
      // Empty the overlay too so the element's textContent isn't doubled.
      const finish = () => {
        ghost.style.visibility = "visible"
        live.style.display = "none"
        live.textContent = ""
      }
      const lines = measureLines(ghost, children)
      const total = lines.reduce((n, l) => n + l.length, 0)
      live.textContent = ""
      if (!lines.length || !total) {
        // Nothing measurable (empty text) — just reveal.
        finish()
        return
      }
      tl = gsap.timeline({ delay, onComplete: finish })
      let before = 0
      for (const text of lines) {
        const el = document.createElement("span")
        el.style.display = "block"
        el.style.whiteSpace = "nowrap" // this line can never re-wrap
        el.style.overflow = "hidden"
        // Pre-fill with binary: a line waiting for its turn must NOT sit there
        // showing its real text (the old single tween had everything scrambled
        // from frame one). Space-less, like the plugin's own scramble.
        el.textContent = Array.from({ length: text.length }, () => (Math.random() < 0.5 ? "0" : "1")).join("")
        live.appendChild(el)
        tl.to(
          el,
          {
            duration: Math.max(0.2, dur * (text.length / total)),
            ease: "none",
            scrambleText: { text, chars: "01", speed: 1, revealDelay: 0.15 }
          },
          dur * (before / total)
        )
        before += text.length
      }
      gsap.set(live, { autoAlpha: 1 })
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        io.disconnect() // decode once
        // Measure AFTER the webfont has swapped in: with fallback metrics the
        // ghost wraps somewhere else and the measured lines would be wrong.
        if (document.fonts?.status === "loaded") play()
        else void document.fonts?.ready.then(play)
      },
      { threshold: 0.25 }
    )
    io.observe(wrap)
    return () => {
      cancelled = true
      io.disconnect()
      tl?.kill()
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
      {/* Overlay — plays the scramble inside the reserved box, one span per line. */}
      <span ref={liveRef} aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", visibility: "hidden" }} />
    </span>
  )
}
