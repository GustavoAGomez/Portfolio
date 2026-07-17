import { useFrame } from "@react-three/fiber"
import { useStore } from "../scroll/store"
import { damp } from "../lib/math"

/**
 * The bridge between the Lenis-fed store and the render loop. Mounted once inside
 * <Canvas>. Each frame it integrates the damped scroll velocity that every
 * chromatic material and parallax block reads:
 *
 *   - velocity  follows rawVelocity (smoothing)
 *   - rawVelocity decays toward 0, so once Lenis stops emitting events the
 *     RGB-split settles back to rest.
 *
 * This is WHY the canvas runs frameloop="always": the decay must keep advancing
 * even while React state is idle. Under "demand" the aberration would freeze
 * mid-decay instead of easing out.
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
