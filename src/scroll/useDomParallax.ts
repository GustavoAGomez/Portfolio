import { useLayoutEffect, type RefObject } from "react"
import { useStore } from "./store"

/**
 * Cheap DOM parallax for a single element (e.g. the hero / statement headline).
 * Writes a compositor-only `translate3d` from a rAF loop reading the store — no
 * React re-render, no layout thrash. Honors reduced-motion.
 *
 * Because this loop OWNS the element's transform (it would overwrite anyone
 * else's), it also ADDS the `data-flip-y` offset that lib/sectionFlip tweens
 * during the language switch — that's how the parallaxed headlines glide with
 * the FLIP instead of snapping (the flip can't just gsap-transform them). The
 * hook tags the element with `data-dom-parallax` so the flip knows to use the
 * dataset instead of a transform.
 */
export function useDomParallax(ref: RefObject<HTMLElement | null>, factor = 0.18): void {
  // LAYOUT effect on purpose: the `data-dom-parallax` tag must exist BEFORE
  // SiteShell's own layout effect runs the language-switch FLIP (child layout
  // effects fire first) — with a plain useEffect the tag lands after paint, the
  // flip picks the gsap-transform path, and this loop overwrites it (the
  // "headline still jumps" bug).
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
