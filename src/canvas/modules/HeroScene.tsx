import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import { Group } from "three"
import { Block } from "../parallax/Block"
import { useBlock } from "../parallax/useBlock"
import { ChromaticPlane } from "../ChromaticPlane"
import { useSection } from "../../scroll/useSection"
import { useStore, type SectionId } from "../../scroll/store"
import { SCENE, BRAND } from "../../config/tokens"
import { damp } from "../../lib/math"

const FONT = "/fonts/Anton-Regular.ttf"

/**
 * Hero WebGL layer. The GUSGQ headline is now a 3D <Text> on LAYER 0, sitting
 * BEHIND the hero diamond (which is at z=50) — so the diamond's double-FBO
 * refraction warps it as it spins. Also: the recurring diagonal stripe + a faint
 * chromatic wash, all inside a damped pointer micro-parallax group.
 */
export function HeroScene({ id }: { id: SectionId }) {
  const { getCenter } = useSection(id)
  const { worldWidth } = useBlock()
  const pointer = useRef<Group>(null)

  useFrame((state, dt) => {
    const g = pointer.current
    if (!g) return
    const { reducedMotion } = useStore.getState()
    const tx = reducedMotion ? 0 : state.pointer.x * 0.4
    const ty = reducedMotion ? 0 : state.pointer.y * 0.25
    g.position.x = damp(g.position.x, tx, 4, dt)
    g.position.y = damp(g.position.y, ty, 4, dt)
  })

  return (
    <group ref={pointer}>
      {/* Diagonal stripe, slow background factor. */}
      <Block factor={0.5} anchor={getCenter}>
        <ChromaticPlane
          color={BRAND.numberDim}
          opacity={0.9}
          args={[60, 2.4, 32, 4]}
          rotation={[0, 0, SCENE.stripeAngle]}
          position={[0, 0, -12]}
          shiftStrength={0.8}
        />
      </Block>
      {/* Faint chromatic wash behind the title. */}
      <Block factor={0.8} anchor={getCenter}>
        <ChromaticPlane color={BRAND.accentA} opacity={0.05} args={[14, 9, 16, 16]} position={[0, 0, -6]} shiftStrength={1.2} />
      </Block>
      {/* The headline — 3D so the diamond can refract it (layer 0, z behind the gem). */}
      <Block factor={1} anchor={getCenter}>
        <Text
          font={FONT}
          fontSize={worldWidth * 0.16}
          color="#f5f5f5"
          anchorX="center"
          anchorY="middle"
          letterSpacing={-0.02}
          position={[0, 0, 0]}
        >
          GUSGQ
        </Text>
      </Block>
    </group>
  )
}
