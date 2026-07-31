import { useThree } from "@react-three/fiber"
import { SCENE } from "../../config/tokens"

export interface BlockLayout {
  /** Visible world width/height (orthographic, already accounts for zoom). */
  worldWidth: number
  worldHeight: number
  /** `worldWidth` capped at SCENE.contentMaxPx — mirrors the DOM's `.content-max` 1440 cap. */
  layoutWidth: number
  /** World units per screen pixel (≈ 1 / zoom for an ortho camera). */
  worldPerPixel: number
  zoom: number
  mobile: boolean
  viewportPx: { width: number; height: number }
}

/** Derives responsive layout from the live viewport; maps pixel scroll to world parallax. */
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
