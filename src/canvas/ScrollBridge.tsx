import { useFrame } from "@react-three/fiber"
import { useStore } from "../scroll/store"
import { damp } from "../lib/math"

/**
 * Damps scroll velocity each frame (velocity → rawVelocity → 0). This decay is
 * why the canvas runs frameloop="always" — it must advance while React is idle.
 */
export function ScrollBridge() {
  useFrame((_, dt) => {
    const { scroll, reducedMotion } = useStore.getState()
    if (reducedMotion) {
      scroll.velocity = 0
      scroll.rawVelocity = 0
      return
    }
    scroll.velocity = damp(scroll.velocity, scroll.rawVelocity, 6, dt)
    scroll.rawVelocity = damp(scroll.rawVelocity, 0, 4, dt)
  })
  return null
}
