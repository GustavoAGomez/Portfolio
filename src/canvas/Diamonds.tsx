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
  /** Hidden on mobile to keep the multipass affordable. */
  mobileHidden?: boolean
}

const DIAMONDS: DiamondDef[] = [
  { section: "hero", x: 0, scale: 14, factor: 0.6, spin: 0.18 },
  { section: "statement", x: 3.4, scale: 1.8, factor: 1.3, spin: 0.4, mobileHidden: true },
  { section: "works", x: -4.2, scale: 1.8, factor: 1.1, spin: 0.35, mobileHidden: true },
  { section: "about", x: 3.0, scale: 2.0, factor: 0.9, spin: 0.5, mobileHidden: true }
]

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
  const { worldPerPixel, worldWidth, mobile } = useBlock()
  const model = useRef<InstancedMesh>(null)
  const yLerp = useRef<number[]>(DIAMONDS.map(() => 0))
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
    const env = new WebGLRenderTarget(w, h)
    const backface = new WebGLRenderTarget(w, h)
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

  useFrame(() => {
    const mesh = model.current
    if (!mesh) return
    const { scroll, sections, reducedMotion } = useStore.getState()
    const t = clock.getElapsedTime()
    const contentMaxWidth = worldWidth * (mobile ? 0.8 : 0.6)

    DIAMONDS.forEach((d, i) => {
      const bounds = sections[d.section]
      const center = bounds ? bounds.top + bounds.height / 2 : 0
      const targetY = reducedMotion ? 0 : (scroll.scrollY + size.height / 2 - center) * worldPerPixel * d.factor
      const cur = lerp(yLerp.current[i] ?? 0, targetY, 0.1)
      yLerp.current[i] = cur

      // Hide instances whose section isn't in the active route set (no bounds),
      // so on the Home only the hero gem shows (works gem sits behind the opaque
      // list). mobile also drops the decorative ones.
      const hidden = !bounds || (mobile && d.mobileHidden)
      const s = (contentMaxWidth / 35) * d.scale * (hidden ? 0.0001 : 1)
      const spin = t * d.spin

      dummy.position.set(mobile ? 0 : d.x, cur, 0)
      if (reducedMotion) dummy.rotation.set(0.4, 0.6, 0)
      else dummy.rotation.set(spin, spin * 0.9, spin * 0.4)
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true

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
