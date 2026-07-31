import { useEffect } from "react"
import Lenis from "lenis"
import { useStore } from "./store"
import { SCENE } from "../config/tokens"
import { clamp, debounce } from "../lib/math"

/** Live Lenis instance, exposed so the router shell can reset scroll on navigation. */
export const lenisRef: { current: Lenis | null } = { current: null }

/**
 * Lenis is the single source of truth for scroll: each event writes into the
 * store's live `scroll` object. Mount once (persistent SiteShell).
 */
export function useLenis(): void {
  const setReducedMotion = useStore((s) => s.setReducedMotion)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const applyReduced = () => setReducedMotion(mq.matches)
    applyReduced()

    // syncTouch: native touch scrolling bypasses Lenis (untunable, no velocity for the chromatic effect).
    const coarse = window.matchMedia("(pointer: coarse)").matches
    const lenis = new Lenis({
      lerp: mq.matches ? 1 : 0.1,
      duration: mq.matches ? 0 : 1.1,
      smoothWheel: !mq.matches,
      wheelMultiplier: 1,
      syncTouch: coarse && !mq.matches,
      // MUST stay 1 — it scales the DRAG too; anything ≠1 breaks 1:1 finger tracking on iOS.
      touchMultiplier: 1,
      // Flick glide: touchend slides |velocity|^exponent px; syncTouchLerp eases it out.
      touchInertiaExponent: 1.8,
      syncTouchLerp: 0.06,
      autoRaf: false
    })
    lenisRef.current = lenis

    const scroll = useStore.getState().scroll
    lenis.on("scroll", (e: Lenis) => {
      scroll.scrollY = e.scroll
      scroll.limit = e.limit
      scroll.progress = e.limit > 0 ? e.scroll / e.limit : 0
      scroll.rawVelocity = clamp(e.velocity / SCENE.velocityRef, -3, 3)
    })

    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onResize = debounce(() => lenis.resize(), 150)
    window.addEventListener("resize", onResize)
    mq.addEventListener("change", applyReduced)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      mq.removeEventListener("change", applyReduced)
      lenisRef.current = null
      lenis.destroy()
    }
  }, [setReducedMotion])
}
