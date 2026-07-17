import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { Perf } from "r3f-perf"
import { Leva } from "leva"
import { ScrollBridge } from "./ScrollBridge"
import { Diamonds } from "./Diamonds"
import type { SectionConfig } from "../config/sections"
import { SCENE, BRAND } from "../config/tokens"

/** Dev tooling behind a flag: append ?debug to the URL in a dev build. */
const DEBUG = import.meta.env.DEV && new URLSearchParams(window.location.search).has("debug")

interface SceneProps {
  /** The active route's section set — its WebGL modules render here. */
  sections: SectionConfig[]
}

/**
 * The single, fixed, full-screen orthographic canvas. It is mounted ONCE in the
 * persistent SiteShell and never torn down across routes — only its children
 * (the active set's WebGL modules + the hero diamond) swap.
 *
 * Two render modes, driven purely by whether the hero diamond is present:
 *  - HOME  → <Diamonds> runs a priority-1 useFrame that OWNS the render loop
 *            (manual double-FBO passes; R3F auto-render is off).
 *  - DETAIL→ no diamond → no priority frame → R3F resumes its own auto-render.
 *            (Diamonds restores gl.autoClear + camera.layers on unmount so the
 *            detail route doesn't render black.)
 *
 * frameloop="always" is deliberate — scroll-velocity damping (ScrollBridge) and
 * the chromatic decay must keep advancing while React is idle. NO EffectComposer:
 * it would fight the manual multipass; grain/vignette are a CSS overlay.
 */
export function Scene({ sections }: SceneProps) {
  const modules = sections.filter((s) => s.Scene)
  const showDiamonds = sections.some((s) => s.id === "hero")

  return (
    <>
      <Leva hidden={!DEBUG} collapsed />
      <Canvas
        orthographic
        flat
        dpr={SCENE.dpr}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        camera={{ zoom: SCENE.zoom, position: SCENE.cameraPosition, near: SCENE.near, far: SCENE.far }}
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
