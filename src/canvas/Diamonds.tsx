import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import { Object3D, Vector2, WebGLRenderTarget, type BufferGeometry, type InstancedMesh, type Mesh } from "three"
import { BackfaceMaterial } from "./materials/BackfaceMaterial"
import { RefractionMaterial } from "./materials/RefractionMaterial"
import { useBlock } from "./parallax/useBlock"
import { useStore, type SectionId } from "../scroll/store"
import { lerp } from "../lib/math"

const DIAMOND_URL = "/models/diamond.glb"

interface DiamondDef {
  section: SectionId
  /** World-space x (0 on mobile). */
  x: number
  /** Relative scale multiplier (s = contentMaxWidth / 35 * scale). */
  scale: number
  /** Parallax multiplier. */
  factor: number
  /** Spin speed. */
  spin: number
  /** Spin speed under the mobile breakpoint (defaults to `spin`). */
  mobileSpin?: number
  /** Hidden on mobile to keep the multipass affordable. */
  mobileHidden?: boolean
  /** Anchor to the section's FIRST viewport (top + vh/2) instead of its centre. */
  heroAnchor?: boolean
  /** Triggered (not scrubbed) collapse to 0 once the viewport scrolls past the hero;
   *  re-grows scrolling back up. Guarantees the gem never warps the media planes. */
  shrinkPastHero?: boolean
}

const DIAMONDS: DiamondDef[] = [
  { section: "hero", x: 0, scale: 20, factor: 0.6, spin: 0.5, mobileSpin: 0.5 },
  { section: "statement", x: 0, scale: 20, factor: 0.6, spin: 0.2, shrinkPastHero: true },
  { section: "profile", x: 0, scale: 20, factor: 0.6, spin: 0.2, heroAnchor: true, shrinkPastHero: true }
]

/** shrinkPastHero collapse/re-grow duration, seconds — identical both ways. */
const SHRINK_DURATION = 0.7

const dummy = new Object3D()

/**
 * Double-FBO refraction lens. The priority-1 useFrame OWNS the render loop
 * (R3F auto-render off) — must never sit inside an EffectComposer.
 */
export function Diamonds() {
  const gltf = useGLTF(DIAMOND_URL) as unknown as { nodes: Record<string, Mesh> }
  const { gl, scene, camera, size, clock } = useThree()
  const { worldPerPixel, layoutWidth, mobile } = useBlock()
  const model = useRef<InstancedMesh>(null)
  const yLerp = useRef<number[]>(DIAMONDS.map(() => 0))
  // shrinkPastHero: latched state + linear 0–1 progress (smoothstepped into scale).
  const shrunk = useRef<boolean[]>(DIAMONDS.map(() => false))
  const shrinkAnim = useRef<number[]>(DIAMONDS.map(() => 1))
  // Grow-in reset: progress restarts when the section's bounds appear or caseStudyId changes.
  const hadBounds = useRef<boolean[]>(DIAMONDS.map(() => false))
  const prevCaseId = useRef<string | null | undefined>(undefined)
  const ratio = gl.getPixelRatio()

  const geometry = useMemo<BufferGeometry | undefined>(() => {
    for (const node of Object.values(gltf.nodes)) {
      if (node.geometry) return node.geometry
    }
    return undefined
  }, [gltf])

  const [envFbo, backfaceFbo, backfaceMaterial, refractionMaterial] = useMemo(() => {
    const w = size.width * ratio
    const h = size.height * ratio
    // FBO pixel ratio capped at 1.5 — content is only seen THROUGH the gem's warp.
    // `resolution` must stay the SCREEN buffer size (gl_FragCoord domain).
    const fboRatio = Math.min(ratio, 1.5)
    const fw = Math.round(size.width * fboRatio)
    const fh = Math.round(size.height * fboRatio)
    const env = new WebGLRenderTarget(fw, fh)
    const backface = new WebGLRenderTarget(fw, fh)
    const backfaceMat = new BackfaceMaterial()
    const refractionMat = new RefractionMaterial({
      envMap: env.texture,
      backfaceMap: backface.texture,
      resolution: new Vector2(w, h)
    })
    return [env, backface, backfaceMat, refractionMat] as const
  }, [size.width, size.height, ratio])

  // Dispose GPU resources when they're recreated (resize) or on unmount.
  useEffect(() => {
    return () => {
      envFbo.dispose()
      backfaceFbo.dispose()
      backfaceMaterial.dispose()
      refractionMaterial.dispose()
    }
  }, [envFbo, backfaceFbo, backfaceMaterial, refractionMaterial])

  useLayoutEffect(() => {
    geometry?.center()
  }, [geometry])

  useLayoutEffect(() => {
    // Mesh on layer 1 = excluded from the env pass (never self-refracts).
    model.current?.layers.set(1)
  }, [])

  // The frame loop flips gl.autoClear off + camera to layer 1 and never restores
  // them — restore both on unmount or a no-diamond route renders black.
  useEffect(() => {
    return () => {
      gl.autoClear = true
      camera.layers.set(0)
    }
  }, [gl, camera])

  useFrame((_, delta) => {
    const mesh = model.current
    if (!mesh) return
    const { scroll, sections, reducedMotion, caseStudyId } = useStore.getState()
    const caseChanged = prevCaseId.current !== caseStudyId
    prevCaseId.current = caseStudyId
    const t = clock.getElapsedTime()
    const contentMaxWidth = layoutWidth * (mobile ? 0.8 : 0.6)
    let anyVisible = false

    DIAMONDS.forEach((d, i) => {
      const bounds = sections[d.section]
      const center = bounds ? bounds.top + (d.heroAnchor ? size.height : bounds.height) / 2 : 0
      const targetY = reducedMotion ? 0 : (scroll.scrollY + size.height / 2 - center) * worldPerPixel * d.factor
      const cur = lerp(yLerp.current[i] ?? 0, targetY, 0.1)
      yLerp.current[i] = cur

      const hidden = !bounds || (mobile && d.mobileHidden)
      let fade = 1
      if (d.shrinkPastHero) {
        const has = !!bounds
        if (has && (!(hadBounds.current[i] ?? false) || (caseChanged && d.section === "statement"))) {
          shrinkAnim.current[i] = reducedMotion ? 1 : 0
          shrunk.current[i] = false
        }
        hadBounds.current[i] = has
      }
      if (d.shrinkPastHero && bounds) {
        // Trigger + hysteresis (collapse past ~45%, re-grow above ~30%) so the boundary never thrashes.
        const was = shrunk.current[i] ?? false
        const now = scroll.scrollY > bounds.top + size.height * (was ? 0.3 : 0.45)
        shrunk.current[i] = now
        const target = now ? 0 : 1
        const prev = shrinkAnim.current[i] ?? 1
        const step = delta / SHRINK_DURATION
        const p = reducedMotion ? target : prev + Math.max(-step, Math.min(step, target - prev))
        shrinkAnim.current[i] = p
        fade = p * p * (3 - 2 * p) // smoothstep
      }
      const s = (contentMaxWidth / 35) * d.scale * (hidden ? 0.0001 : fade)
      if (!hidden && fade > 0.002) anyVisible = true
      const spin = t * (mobile ? d.mobileSpin ?? d.spin : d.spin)

      dummy.position.set(mobile ? 0 : d.x, cur, 0)
      if (reducedMotion) dummy.rotation.set(0.4, 0.6, 0)
      else dummy.rotation.set(spin, spin * 0.9, spin * 0.4)
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true

    // No gem visible: skip the multipass — ONE scene render, with the same manual
    // clear so the background tone doesn't shift.
    if (!anyVisible) {
      gl.autoClear = false
      camera.layers.set(0)
      gl.setRenderTarget(null)
      gl.clearColor()
      gl.clearDepth()
      gl.render(scene, camera)
      return
    }

    // ---- EXACT multipass order ----
    gl.autoClear = false
    camera.layers.set(0)
    gl.setRenderTarget(envFbo)
    gl.clearColor()
    gl.render(scene, camera)
    gl.clearDepth()
    camera.layers.set(1)
    mesh.material = backfaceMaterial
    gl.setRenderTarget(backfaceFbo)
    gl.clearDepth()
    gl.render(scene, camera)
    camera.layers.set(0)
    gl.setRenderTarget(null)
    gl.clearColor() // clear the screen before the scene pass to avoid smearing
    gl.render(scene, camera)
    gl.clearDepth()
    camera.layers.set(1)
    mesh.material = refractionMaterial
    gl.render(scene, camera)
  }, 1)

  if (!geometry) return null

  return (
    <instancedMesh ref={model} args={[geometry, undefined, DIAMONDS.length]} position={[0, 0, 50]} frustumCulled={false}>
      <primitive object={refractionMaterial} attach="material" />
    </instancedMesh>
  )
}

useGLTF.preload(DIAMOND_URL)
