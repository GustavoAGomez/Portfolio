import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import { Group } from "three"
import { Block } from "../parallax/Block"
import { useBlock } from "../parallax/useBlock"
import { useSection } from "../../scroll/useSection"
import { useStore, type SectionId } from "../../scroll/store"
import { BRAND } from "../../config/tokens"
import { ACTIVE_TYPO } from "../../config/typography"
import { damp } from "../../lib/math"

const FONT = ACTIVE_TYPO.displayFontUrl

/** Hero headline as 3D <Text> on layer 0, behind the diamond so its refraction warps it. */
export function HeroScene({ id }: { id: SectionId }) {
  const { getCenter } = useSection(id)
  const { layoutWidth, mobile } = useBlock()
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
      <Block factor={1} anchor={getCenter}>
        <Text
          font={FONT}
          // Keep fractions below ~0.2: the gem's refraction magnifies the word and
          // larger fractions get the refracted copies cut at phone edges.
          fontSize={layoutWidth * (mobile ? 0.19 : 0.16)}
          color={BRAND.text}
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
