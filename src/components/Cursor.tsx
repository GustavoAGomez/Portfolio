import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { useStore } from "../scroll/store"

/**
 * Custom circular cursor. A white disc in `mix-blend-mode: difference` — it
 * INVERTS whatever sits under it (dark bg → light disc, white type → black),
 * the classic technique for a cursor that stays visible over any content.
 *
 * - Trails the pointer with gsap.quickTo (power3 ease) — skatey, not robotic.
 * - GROWS over anything selectable (delegated `pointerover` on the document —
 *   one listener, no per-element wiring) with a back.out pop; slight shrink
 *   while pressing. Opt-in growth for non-semantic targets via [data-cursor].
 * - Desktop only: mounts under `(hover: hover) and (pointer: fine)`; touch
 *   devices never see it. reduced-motion keeps the native cursor (no trailing
 *   element at all, honoring the site-wide convention).
 * - Mounted OUTSIDE #warp-fixed/#warp-main: their transition filters create
 *   stacking contexts that would trap the blend. z-index above the warp cover
 *   so the invert rides through route transitions.
 *
 * The native cursor is hidden globally by `html.custom-cursor` (index.css).
 */
const INTERACTIVE = "a, button, [role='button'], [data-cursor]"
const SIZE_HOVER = 2.6
const SIZE_PRESSED = 1.9

export function Cursor() {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const [finePointer] = useState(() => window.matchMedia("(hover: hover) and (pointer: fine)").matches)
  const enabled = finePointer && !reducedMotion

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    document.documentElement.classList.add("custom-cursor")

    gsap.set(el, { xPercent: -50, yPercent: -50 })
    const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" })
    const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" })

    let shown = false
    let hovering = false
    let pressed = false

    const applyScale = () => {
      const target = hovering ? (pressed ? SIZE_PRESSED : SIZE_HOVER) : pressed ? 0.8 : 1
      gsap.to(el, { scale: target, duration: 0.5, ease: "back.out(1.7)", overwrite: "auto" })
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      if (!shown) {
        // First move: snap into place (no tween from 0,0) then fade in.
        shown = true
        gsap.set(el, { x: e.clientX, y: e.clientY })
        gsap.to(el, { opacity: 1, duration: 0.25, ease: "power2.out" })
      }
      xTo(e.clientX)
      yTo(e.clientY)
    }
    // Delegated hover: pointerover fires on every target change, so recomputing
    // `closest` there keeps the state fresh with a single document listener.
    const onOver = (e: PointerEvent) => {
      const next = e.target instanceof Element && !!e.target.closest(INTERACTIVE)
      if (next !== hovering) {
        hovering = next
        applyScale()
      }
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      pressed = true
      applyScale()
    }
    const onUp = () => {
      pressed = false
      applyScale()
    }
    const onLeaveDoc = () => gsap.to(el, { opacity: 0, duration: 0.2 })
    const onEnterDoc = () => {
      if (shown) gsap.to(el, { opacity: 1, duration: 0.2 })
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    document.addEventListener("pointerover", onOver)
    window.addEventListener("pointerdown", onDown)
    window.addEventListener("pointerup", onUp)
    document.documentElement.addEventListener("mouseleave", onLeaveDoc)
    document.documentElement.addEventListener("mouseenter", onEnterDoc)

    return () => {
      document.documentElement.classList.remove("custom-cursor")
      window.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerover", onOver)
      window.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
      document.documentElement.removeEventListener("mouseleave", onLeaveDoc)
      document.documentElement.removeEventListener("mouseenter", onEnterDoc)
      gsap.killTweensOf(el)
    }
  }, [enabled])

  if (!enabled) return null
  return <div ref={ref} className="site-cursor" aria-hidden="true" />
}
