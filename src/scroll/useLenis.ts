import { useEffect } from "react"
import Lenis from "lenis"
import { useStore } from "./store"
import { SCENE } from "../config/tokens"
import { clamp, debounce } from "../lib/math"

/**
 * Lenis is the single source of truth for scroll. On every scroll event it
 * pushes raw values straight into the store's live `scroll` object (mutated in
 * place — no React churn). Velocity is normalized here; damping to rest happens
 * in ScrollBridge inside the render loop.
 *
 * Mount once (in App).
 */
export function useLenis(): void {
  const setReducedMotion = useStore((s) => s.setReducedMotion)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const applyReduced = () => setReducedMotion(mq.matches)
    applyReduced()

    const lenis = new Lenis({
      lerp: mq.matches ? 1 : 0.1,
      duration: mq.matches ? 0 : 1.1,
      smoothWheel: !mq.matches,
      wheelMultiplier: 1,
      autoRaf: false
    })

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
      lenis.destroy()
    }
  }, [setReducedMotion])
}
