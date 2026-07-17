import { useEffect } from "react"
import { lenisRef } from "./useLenis"
import { useStore } from "./store"
import { clamp, easeInOutCubic } from "../lib/math"

const WHEEL_THRESHOLD = 6 // px of deltaY that counts as an intentional gesture
const TOUCH_THRESHOLD = 24 // px of finger travel
const SNAP_DURATION = 0.9 // s
const COOLDOWN = 160 // ms after a snap before another gesture is accepted

/**
 * Gesture-driven anchor snap for the HOME only (two screens: hero + works list).
 * One scroll gesture = one full jump to the next/previous anchor (hero = doc top,
 * works = the works section's document top). Direction-driven, not nearest-based.
 *
 * Lenis binds wheel/touch in the CAPTURE phase (registered first), so we can't
 * out-order it — instead we `lenis.stop()` while on the Home (Lenis then ignores
 * all input) and `preventDefault()` the native scroll ourselves. The jump goes
 * through Lenis (`scrollTo`, force:true so it runs while stopped), so the store
 * keeps receiving scrollY/velocity as usual. Disabled entirely under reduced-motion.
 *
 * Mount only when the active route is the Home (`enabled`). On detail it never
 * runs, so that route scrolls normally.
 */
export function useHomeSnap(enabled: boolean): void {
  const reducedMotion = useStore((s) => s.reducedMotion)

  useEffect(() => {
    if (!enabled || reducedMotion) return
    const lenis = lenisRef.current
    if (!lenis) return

    let snapping = false
    let cooldownTimer = 0
    let touchStartY: number | null = null

    // [heroTop, worksTop] in document px; worksTop read live from the store.
    const anchors = (): number[] => {
      const worksTop = useStore.getState().sections.works?.top
      return worksTop != null ? [0, worksTop] : [0]
    }

    const snapTo = (targetY: number) => {
      snapping = true
      lenis.scrollTo(targetY, {
        force: true,
        lock: true,
        duration: SNAP_DURATION,
        easing: easeInOutCubic,
        onComplete: () => {
          if (cooldownTimer) window.clearTimeout(cooldownTimer)
          cooldownTimer = window.setTimeout(() => {
            snapping = false
          }, COOLDOWN)
        }
      })
    }

    const step = (dir: 1 | -1) => {
      const a = anchors()
      if (a.length < 2) return
      const cur = lenis.scroll
      const nearest = Math.abs(cur - a[0]!) <= Math.abs(cur - a[1]!) ? 0 : 1
      const target = clamp(nearest + dir, 0, a.length - 1)
      if (target !== nearest) snapTo(a[target]!)
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault() // block native scroll (Lenis is stopped and won't)
      if (snapping || Math.abs(e.deltaY) < WHEEL_THRESHOLD) return
      step(e.deltaY > 0 ? 1 : -1)
    }

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? null
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (snapping || touchStartY === null) return
      const y = e.touches[0]?.clientY ?? touchStartY
      const delta = touchStartY - y
      if (Math.abs(delta) < TOUCH_THRESHOLD) return
      touchStartY = null
      step(delta > 0 ? 1 : -1)
    }
    const onTouchEnd = () => {
      touchStartY = null
    }

    // Stop Lenis (it ignores input while stopped) so our snap owns the gesture.
    lenis.stop()
    const opts: AddEventListenerOptions = { passive: false }
    window.addEventListener("wheel", onWheel, opts)
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, opts)
    window.addEventListener("touchend", onTouchEnd, { passive: true })

    return () => {
      if (cooldownTimer) window.clearTimeout(cooldownTimer)
      window.removeEventListener("wheel", onWheel, opts)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove, opts)
      window.removeEventListener("touchend", onTouchEnd)
      lenis.start()
    }
  }, [enabled, reducedMotion])
}
