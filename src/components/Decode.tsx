import { useEffect, useRef, type CSSProperties } from "react"
import gsap from "gsap"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import { useStore } from "../scroll/store"

gsap.registerPlugin(ScrambleTextPlugin)

interface DecodeProps {
  children: string
  className?: string
  style?: CSSProperties
  delay?: number
  duration?: number
}

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

// A hidden ghost reserves the final layout; the scramble plays in one nowrap span
// per laid-out line, measured after document.fonts.ready. Must stay the SOLE text
// child of its styled parent. Honors reduced-motion (plain text, no ghost/overlay).
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
      const finish = () => {
        ghost.style.visibility = "visible"
        live.style.display = "none"
        live.textContent = ""
      }
      const lines = measureLines(ghost, children)
      const total = lines.reduce((n, l) => n + l.length, 0)
      live.textContent = ""
      if (!lines.length || !total) {
        finish()
        return
      }
      tl = gsap.timeline({ delay, onComplete: finish })
      let before = 0
      for (const text of lines) {
        const el = document.createElement("span")
        el.style.display = "block"
        el.style.whiteSpace = "nowrap"
        el.style.overflow = "hidden"
        // Pre-fill with binary — a line waiting its turn must not show its real text.
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
        io.disconnect()
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

  if (reducedMotion) {
    return (
      <span className={className} style={{ overflowWrap: "anywhere", ...style }}>
        {children}
      </span>
    )
  }

  return (
    <span ref={wrapRef} className={className} style={{ position: "relative", display: "inline-block", maxWidth: "100%", verticalAlign: "top", ...style }}>
      <span ref={ghostRef} style={{ visibility: "hidden" }}>
        {children}
      </span>
      <span ref={liveRef} aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", visibility: "hidden" }} />
    </span>
  )
}
