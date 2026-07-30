import { useThree } from "@react-three/fiber"
import { SCENE } from "../../config/tokens"

export interface BlockLayout {
  /** Visible world width/height (orthographic, already accounts for zoom). */
  worldWidth: number
  worldHeight: number
  /** `worldWidth` capped at the site-wide content width (SCENE.contentMaxPx,
   *  mirrored by the DOM's `.content-max`). Use it for anything sized/placed as
   *  a fraction of the viewport WITHOUT a Math.min world-unit cap of its own
   *  (hero headline, gem scale), so ultra-wide screens keep the ≤1440 look. */
  layoutWidth: number
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
  const worldPerPixel = viewport.width / size.width
  return {
    worldWidth: viewport.width,
    worldHeight: viewport.height,
    layoutWidth: Math.min(viewport.width, SCENE.contentMaxPx * worldPerPixel),
    worldPerPixel,
    zoom: SCENE.zoom,
    mobile: size.width < SCENE.mobileBreakpoint,
    viewportPx: { width: size.width, height: size.height }
  }
}
