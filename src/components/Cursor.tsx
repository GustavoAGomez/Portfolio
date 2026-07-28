import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { useStore } from "../scroll/store"

/**
 * Custom circular cursor: a LIME disc that knocks any text under it to the page
 * background tone, over ANY content (DOM, WebGL, video) — no per-element hover.
 *
 * It is THREE stacked discs, and the stack is the whole trick (see index.css):
 *   1. white disc in `mix-blend-mode: difference` (+ a grayscale/contrast
 *      backdrop-filter threshold) → negative of the backdrop: page → white,
 *      any type → black,
 *   2. lime disc in `mix-blend-mode: multiply` on top → tints that negative
 *      (white → lime, black → stays black),
 *   3. bg-coloured disc in `mix-blend-mode: lighten` → floors the black at the
 *      palette bg, so the knocked-out letters match the rest of the site.
 * A single lime disc in `difference` can't do this: it only lands on black over
 * lime type, and reads violet over white type. They MUST be siblings in the root
 * stacking context — nesting them (or a transformed wrapper) isolates the blend
 * group and the multiply would see the white disc instead of the page.
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
  const invertRef = useRef<HTMLDivElement>(null)
  const tintRef = useRef<HTMLDivElement>(null)
  const floorRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const [finePointer] = useState(() => window.matchMedia("(hover: hover) and (pointer: fine)").matches)
  const enabled = finePointer && !reducedMotion

  useEffect(() => {
    // The three discs are driven by the SAME tweens, so they stay pixel-aligned.
    const el = [invertRef.current, tintRef.current, floorRef.current].filter((n): n is HTMLDivElement => n !== null)
    if (el.length !== 3 || !enabled) return
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
  // Siblings, in this exact paint order (invert → tint → floor); none may live
  // inside a wrapper, which would isolate the blend group and kill the effect.
  return (
    <>
      <div ref={invertRef} className="site-cursor site-cursor--invert" aria-hidden="true" />
      <div ref={tintRef} className="site-cursor site-cursor--tint" aria-hidden="true" />
      <div ref={floorRef} className="site-cursor site-cursor--floor" aria-hidden="true" />
    </>
  )
}
