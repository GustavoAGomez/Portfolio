import { useLayoutEffect, type RefObject } from "react"
import { useStore } from "./store"

/**
 * Compositor-only DOM parallax from rAF. This loop OWNS the element's transform,
 * so it also ADDS the `data-flip-y` offset that lib/sectionFlip tweens.
 */
export function useDomParallax(ref: RefObject<HTMLElement | null>, factor = 0.18): void {
  // Layout effect: the data-dom-parallax tag must exist before SiteShell's FLIP runs.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.dataset.domParallax = ""
    let raf = 0
    const loop = () => {
      const { scroll, reducedMotion } = useStore.getState()
      const flip = Number(el.dataset.flipY) || 0
      const y = (reducedMotion ? 0 : scroll.scrollY * factor) + flip
      el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      delete el.dataset.domParallax
    }
  }, [ref, factor])
}
