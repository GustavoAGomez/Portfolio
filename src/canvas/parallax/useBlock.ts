import { useThree } from "@react-three/fiber"
import { SCENE } from "../../config/tokens"

export interface BlockLayout {
  /** Visible world width/height (orthographic, already accounts for zoom). */
  worldWidth: number
  worldHeight: number
  /** World units per screen pixel (≈ 1 / zoom for an ortho camera). */
  worldPerPixel: number
  zoom: number
  mobile: boolean
  viewportPx: { width: number; height: number }
}

/**
 * Ported from GUSGQ's `useBlock` (blocks.jsx) — derives responsive layout from
 * the live viewport instead of hardcoded page constants. Used by <Block> to map
 * pixel-space scroll into world-space parallax.
 */
export function useBlock(): BlockLayout {
  const { viewport, size } = useThree()
  return {
    worldWidth: viewport.width,
    worldHeight: viewport.height,
    worldPerPixel: viewport.width / size.width,
    zoom: SCENE.zoom,
    mobile: size.width < SCENE.mobileBreakpoint,
    viewportPx: { width: size.width, height: size.height }
  }
}
