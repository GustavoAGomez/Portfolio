import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { useStore } from "../scroll/store"

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
        shown = true
        gsap.set(el, { x: e.clientX, y: e.clientY })
        gsap.to(el, { opacity: 1, duration: 0.25, ease: "power2.out" })
      }
      xTo(e.clientX)
      yTo(e.clientY)
    }
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
  // The three discs MUST stay siblings in the root stacking context, in this exact
  // paint order (invert → tint → floor) — any wrapper isolates the blend group.
  return (
    <>
      <div ref={invertRef} className="site-cursor site-cursor--invert" aria-hidden="true" />
      <div ref={tintRef} className="site-cursor site-cursor--tint" aria-hidden="true" />
      <div ref={floorRef} className="site-cursor site-cursor--floor" aria-hidden="true" />
    </>
  )
}
