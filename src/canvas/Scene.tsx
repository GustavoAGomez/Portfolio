import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { Perf } from "r3f-perf"
import { Leva } from "leva"
import { ScrollBridge } from "./ScrollBridge"
import { Diamonds } from "./Diamonds"
import { SECTIONS } from "../config/sections"
import { SCENE, BRAND } from "../config/tokens"

/** Dev tooling behind a flag: append ?debug to the URL in a dev build. */
const DEBUG = import.meta.env.DEV && new URLSearchParams(window.location.search).has("debug")

/**
 * The single, fixed, full-screen orthographic canvas. Persistent scene: every
 * enabled section's WebGL module renders here in config order.
 *
 * frameloop="always" is deliberate — the scroll-velocity damping (ScrollBridge)
 * and the chromatic decay must keep advancing while React is idle.
 *
 * NO EffectComposer here: <Diamonds> runs the double-FBO refraction in a
 * priority-1 useFrame and owns the render loop (renders straight to screen). A
 * postprocessing composer would fight it and kill the lens effect. Grain +
 * vignette are a CSS overlay instead (see FxOverlay / index.css). The background
 * is a clear color (set here) rather than scene.background, which would repaint
 * on every pass and wipe the scene render.
 */
export function Scene() {
  const modules = SECTIONS.filter((s) => s.enabled && s.Scene)

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
          <Diamonds />
          {modules.map(({ id, Scene: SceneModule }) => SceneModule && <SceneModule key={id} id={id} />)}
        </Suspense>
        {DEBUG && <Perf position="bottom-right" />}
      </Canvas>
    </>
  )
}
