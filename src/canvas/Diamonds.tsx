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
  /** Anchor to the section's FIRST VIEWPORT (top + vh/2) instead of its centre —
   *  for a section that spans a whole page (profile) rather than one svh box. */
  heroAnchor?: boolean
  /** TRIGGERED shrink, not scroll-scrubbed — once the viewport scrolls past the
   *  hero (~45% of its viewport, with hysteresis) the gem launches a fixed-time
   *  collapse to 0, and re-grows when you scroll back up. Used by both the
   *  case-study statement and /about — it also guarantees the gem is long gone
   *  before any media/portrait plane can pass behind the lens. */
  shrinkPastHero?: boolean
}

const DIAMONDS: DiamondDef[] = [
  // Home hero lens — so large it reads as a glassy refraction background.
  // Faster spin on mobile: with the smaller gem/viewport the 0.2 rotation reads
  // almost static on a phone, so it gets more life there.
  { section: "hero", x: 0, scale: 20, factor: 0.6, spin: 0.5, mobileSpin: 0.5 },
  // Case-study hero (statement): the SAME oversized gem behind the project title,
  // warping the dim ambient word for the same background effect. Leaving the
  // hero TRIGGERS the eased collapse (same shrinkPastHero + timing as /about),
  // so it is long gone before the case-study media can appear.
  { section: "statement", x: 0, scale: 20, factor: 0.6, spin: 0.2, shrinkPastHero: true },
  // About-me hero (profile): the same oversized gem behind "GUSTAVO GÓMEZ",
  // warping the ambient ABOUT word (ProfileScene). The profile section spans the
  // whole /about page, so it anchors to the first viewport; leaving the hero
  // TRIGGERS an eased collapse (see shrinkPastHero).
  { section: "profile", x: 0, scale: 20, factor: 0.6, spin: 0.2, heroAnchor: true, shrinkPastHero: true }
]

/** shrinkPastHero collapse/re-grow duration, seconds — identical both ways. */
const SHRINK_DURATION = 0.7

const dummy = new Object3D()

/**
 * Ported from GUSGQ's diamonds/Diamonds.jsx — the hand-rolled double-FBO
 * refraction (NOT drei's MeshRefractionMaterial). The gem acts as a real LENS
 * that warps the 3D titles behind it:
 *
 *   envFbo      = the whole scene on layer 0 (incl. the <Text> headline)
 *   backfaceFbo = the diamond's back-faces as normals (layer 1)
 *   RefractionMaterial samples envFbo at a screen UV bent by both normals.
 *
 * The instancedMesh lives on layer 1 so it is excluded from envFbo (never
 * self-refracts). The priority-1 useFrame owns the render loop (R3F auto-render
 * is off), so this MUST NOT sit inside an EffectComposer.
 */
export function Diamonds() {
  const gltf = useGLTF(DIAMOND_URL) as unknown as { nodes: Record<string, Mesh> }
  const { gl, scene, camera, size, clock } = useThree()
  const { worldPerPixel, layoutWidth, mobile } = useBlock()
  const model = useRef<InstancedMesh>(null)
  const yLerp = useRef<number[]>(DIAMONDS.map(() => 0))
  // Triggered-shrink state (shrinkPastHero): latched past/not-past + a LINEAR
  // 0–1 progress advanced at fixed speed (smoothstepped into the scale), so the
  // collapse and the re-grow take exactly the same time — an exponential lerp
  // read slower on the way out (the shrinking tail is visible; the growing tail
  // isn't).
  const shrunk = useRef<boolean[]>(DIAMONDS.map(() => false))
  const shrinkAnim = useRef<number[]>(DIAMONDS.map(() => 1))
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
    // Mobile/tablet: the FBOs render at a capped pixel ratio (≤1.5) — their
    // content is only ever seen THROUGH the gem's refraction warp, where the
    // extra resolution is invisible, and the env pass is a full scene render so
    // its fill-rate dominates the multipass cost. The shader samples both maps
    // at normalized UVs, so FBO size is independent of `resolution` — that
    // uniform must stay the SCREEN buffer size (gl_FragCoord domain). ≥1024px
    // keeps full-res FBOs (previous behaviour, GLSL untouched).
    const fboRatio = size.width < 1024 ? Math.min(ratio, 1.5) : ratio
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
    // Keep the gem on layer 1 (excluded from the env pass) — imperative so it
    // survives regardless of how R3F coerces the `layers` prop.
    model.current?.layers.set(1)
  }, [])

  // CRITICAL for routing: the frame loop below flips gl.autoClear off and moves
  // the camera to layer 1 every frame and never restores them. On unmount (e.g.
  // navigating Home → detail, where no diamond exists) R3F resumes its own
  // auto-render — restore both here or the detail route renders black.
  useEffect(() => {
    return () => {
      gl.autoClear = true
      camera.layers.set(0)
    }
  }, [gl, camera])

  useFrame((_, delta) => {
    const mesh = model.current
    if (!mesh) return
    const { scroll, sections, reducedMotion } = useStore.getState()
    const t = clock.getElapsedTime()
    // layoutWidth: the gem stops growing past the 1440px content cap too, so an
    // ultra-wide hero reads exactly like the tuned desktop one.
    const contentMaxWidth = layoutWidth * (mobile ? 0.8 : 0.6)
    let anyVisible = false

    DIAMONDS.forEach((d, i) => {
      const bounds = sections[d.section]
      const center = bounds ? bounds.top + (d.heroAnchor ? size.height : bounds.height) / 2 : 0
      const targetY = reducedMotion ? 0 : (scroll.scrollY + size.height / 2 - center) * worldPerPixel * d.factor
      const cur = lerp(yLerp.current[i] ?? 0, targetY, 0.1)
      yLerp.current[i] = cur

      // Hide instances whose section isn't in the active route set (no bounds),
      // so on the Home only the hero gem shows (works gem sits behind the opaque
      // list). mobile also drops the decorative ones.
      const hidden = !bounds || (mobile && d.mobileHidden)
      let fade = 1
      if (d.shrinkPastHero && bounds) {
        // TRIGGER, not scrub: crossing ~45% of the hero launches the collapse
        // to 0; scrolling back above ~30% re-grows it. The asymmetric
        // thresholds are hysteresis so the boundary never thrashes (same
        // pattern as the story-video pause). reduced-motion snaps instantly.
        const was = shrunk.current[i] ?? false
        const now = scroll.scrollY > bounds.top + size.height * (was ? 0.3 : 0.45)
        shrunk.current[i] = now
        const target = now ? 0 : 1
        const prev = shrinkAnim.current[i] ?? 1
        const step = delta / SHRINK_DURATION
        const p = reducedMotion ? target : prev + Math.max(-step, Math.min(step, target - prev))
        shrinkAnim.current[i] = p
        fade = p * p * (3 - 2 * p) // smoothstep — symmetric ease, no visible tail
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

    // No gem visible (e.g. deep in a case study's story after shrinkPastHero shrank it
    // to nothing): skip the whole double-FBO multipass — 1 scene render instead of
    // 4. The mesh sits on layer 1 so the layer-0 render excludes it for free; the
    // FBOs just hold stale (unused) frames until a gem scrolls back into view.
    // Same manual clear as the multipass, so the background tone doesn't shift.
    if (!anyVisible) {
      gl.autoClear = false
      camera.layers.set(0)
      gl.setRenderTarget(null)
      gl.clearColor()
      gl.clearDepth()
      gl.render(scene, camera)
      return
    }

    // ---- EXACT multipass order (GUSGQ diamonds/Diamonds.jsx) ----
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
