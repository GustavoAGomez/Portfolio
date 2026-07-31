import { useRef, type ReactNode } from "react"
import { useFrame } from "@react-three/fiber"
import { Group } from "three"
import { useBlock } from "./useBlock"
import { useStore } from "../../scroll/store"
import { lerp } from "../../lib/math"

interface BlockProps {
  /** Parallax multiplier: 1 tracks its section 1:1; >1 foreground, <1 background. */
  factor?: number
  /** Live document-space anchor (px) — read every frame, so resize just works. */
  anchor?: () => number
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  children?: ReactNode
}

/** Lerps the group's y toward ((scrollY + vh/2) - anchor) * worldPerPixel * factor. */
export function Block({ factor = 1, anchor, position, rotation, scale, children }: BlockProps) {
  const inner = useRef<Group>(null)
  const { worldPerPixel, viewportPx } = useBlock()

  useFrame(() => {
    const g = inner.current
    if (!g) return
    const { scroll, reducedMotion } = useStore.getState()
    const f = reducedMotion ? 1 : factor
    const anchorPx = anchor ? anchor() : 0
    const target = (scroll.scrollY + viewportPx.height / 2 - anchorPx) * worldPerPixel * f
    // Snap (no trailing lerp) below 1024px: stacked plane+text overlap, so the lag
    // would drag a plane onto the next block's text.
    if (viewportPx.width < 1024) g.position.y = target
    else g.position.y = lerp(g.position.y, target, 0.1)
  })

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group ref={inner}>{children}</group>
    </group>
  )
}
