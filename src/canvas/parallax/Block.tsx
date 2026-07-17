import { useRef, type ReactNode } from "react"
import { useFrame } from "@react-three/fiber"
import { Group } from "three"
import { useBlock } from "./useBlock"
import { useStore } from "../../scroll/store"
import { lerp } from "../../lib/math"

interface BlockProps {
  /**
   * Parallax multiplier. 1 = tracks its section 1:1 (feels pinned to the DOM);
   * >1 = foreground (moves faster), <1 = background (moves slower / drifts).
   */
  factor?: number
  /**
   * Live document-space anchor (px) this block is centered on — typically a
   * section center from `useSection().getCenter`. When scroll reaches it, the
   * block sits at y = 0 (screen center). Read live so resize just works.
   */
  anchor?: () => number
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  children?: ReactNode
}

/**
 * Ported from GUSGQ's <Block> (blocks.jsx). Original read a global mutable ref
 * (`state.top.current`); this reads OUR zustand store via getState() in the
 * frame loop. Each frame it lerps its inner group's y toward the parallax
 * target, so different `factor`s across blocks produce depth.
 *
 * net y = ((scrollY + vh/2) - anchor) * worldPerPixel * factor
 *   → 0 when the anchor is centered in the viewport, parallaxing as you move away.
 */
export function Block({ factor = 1, anchor, position, rotation, scale, children }: BlockProps) {
  const inner = useRef<Group>(null)
  const { worldPerPixel, viewportPx } = useBlock()

  useFrame(() => {
    const g = inner.current
    if (!g) return
    const { scroll, reducedMotion } = useStore.getState()
    // reduced-motion: collapse every layer to factor 1 → no differential parallax.
    const f = reducedMotion ? 1 : factor
    const anchorPx = anchor ? anchor() : 0
    const target = (scroll.scrollY + viewportPx.height / 2 - anchorPx) * worldPerPixel * f
    g.position.y = lerp(g.position.y, target, 0.1)
  })

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group ref={inner}>{children}</group>
    </group>
  )
}
