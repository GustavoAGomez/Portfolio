import { Suspense, lazy } from "react"
import { Canvas } from "@react-three/fiber"
import { ScrollBridge } from "./ScrollBridge"
import { Diamonds } from "./Diamonds"
import type { SectionConfig } from "../config/sections"
import { SCENE, BRAND } from "../config/tokens"

/** Dev tooling behind a flag: append ?debug to the URL in a dev build. */
const DEBUG = import.meta.env.DEV && new URLSearchParams(window.location.search).has("debug")

// Lazy: leva injects CSS on import (side effect), so a static import survives tree-shaking.
const Leva = lazy(() => import("leva").then((m) => ({ default: m.Leva })))
const Perf = lazy(() => import("r3f-perf").then((m) => ({ default: m.Perf })))

interface SceneProps {
  /** The active route's section set — its WebGL modules render here. */
  sections: SectionConfig[]
}

/**
 * The single persistent fixed canvas. frameloop="always": the chromatic decay must
 * keep advancing while React is idle. Background is a clear color (gl.setClearColor),
 * NOT scene.background.
 */
export function Scene({ sections }: SceneProps) {
  const modules = sections.filter((s) => s.Scene)
  const showDiamonds = sections.some((s) => s.id === "hero" || s.id === "description" || s.id === "profile")

  return (
    <>
      {DEBUG && (
        <Suspense fallback={null}>
          <Leva collapsed />
        </Suspense>
      )}
      <Canvas
        orthographic
        flat
        dpr={SCENE.dpr}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        camera={{ zoom: SCENE.zoom, position: SCENE.cameraPosition, near: SCENE.near, far: SCENE.far }}
        // offsetSize: measure by layout size — the route-warp's scale transform
        // inflates the bounding rect and would resize the whole world.
        resize={{ offsetSize: true, scroll: true, debounce: { scroll: 50, resize: 0 } }}
        frameloop="always"
        onCreated={({ gl }) => gl.setClearColor(BRAND.bg, 1)}
        style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 0 }}
      >
        <ScrollBridge />
        <Suspense fallback={null}>
          {showDiamonds && <Diamonds />}
          {modules.map(({ id, Scene: SceneModule }) => SceneModule && <SceneModule key={id} id={id} />)}
        </Suspense>
        {DEBUG && <Perf position="bottom-right" />}
      </Canvas>
    </>
  )
}
