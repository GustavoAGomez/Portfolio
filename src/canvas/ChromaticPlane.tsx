import { useLayoutEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Texture } from "three"
import { ChromaticPlaneMaterial, type ChromaticPlaneMaterialImpl } from "./materials/ChromaticPlaneMaterial"
import { useStore } from "../scroll/store"
import { lerp } from "../lib/math"

// Ensure the material's `extend` side effect runs even if tree-shaken elsewhere.
void ChromaticPlaneMaterial

interface ChromaticPlaneProps {
  map?: Texture | null
  color?: string
  opacity?: number
  /** planeGeometry args — keep segments high enough for the vertex wobble. */
  args?: [number, number, number, number]
  /** How strongly damped scroll velocity feeds the RGB-split. */
  shiftStrength?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
}

/**
 * A plane driven by ChromaticPlaneMaterial. Per frame it lerps uShift toward the
 * store's damped velocity → visible RGB-split on fast scroll that decays to rest
 * when scrolling stops (the decay is the lerp, cf. GUSGQ's Plane.jsx).
 */
export function ChromaticPlane({
  map = null,
  color = "#ffffff",
  opacity = 1,
  args = [1, 1, 32, 32],
  shiftStrength = 1.6,
  position,
  rotation,
  scale
}: ChromaticPlaneProps) {
  const mat = useRef<ChromaticPlaneMaterialImpl>(null)

  useLayoutEffect(() => {
    const m = mat.current
    if (!m) return
    m.uColor.set(color)
    m.uMap = map
    m.uHasMap = map ? 1 : 0
    m.uOpacity = opacity
  }, [map, color, opacity])

  useFrame(() => {
    const m = mat.current
    if (!m) return
    const { scroll, reducedMotion } = useStore.getState()
    const target = reducedMotion ? 0 : scroll.velocity * shiftStrength
    m.uShift = lerp(m.uShift, target, 0.1)
  })

  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={args} />
      <chromaticPlaneMaterial ref={mat} transparent depthWrite={false} />
    </mesh>
  )
}
