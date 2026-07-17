import { useEffect, type RefObject } from "react"
import { useStore } from "./store"

/**
 * Cheap DOM parallax for a single element (e.g. the hero / statement headline).
 * Writes a compositor-only `translate3d` from a rAF loop reading the store — no
 * React re-render, no layout thrash. Honors reduced-motion.
 */
export function useDomParallax(ref: RefObject<HTMLElement | null>, factor = 0.18): void {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const loop = () => {
      const { scroll, reducedMotion } = useStore.getState()
      const y = reducedMotion ? 0 : scroll.scrollY * factor
      el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [ref, factor])
}
