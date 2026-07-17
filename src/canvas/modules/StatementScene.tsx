import { Text } from "@react-three/drei"
import { Block } from "../parallax/Block"
import { ChromaticPlane } from "../ChromaticPlane"
import { useSection } from "../../scroll/useSection"
import { type SectionId } from "../../scroll/store"
import { SCENE, BRAND } from "../../config/tokens"

const FONT = "/fonts/Anton-Regular.ttf"

/**
 * Statement WebGL layer: an oversized dim word for depth (parallaxes slowly
 * behind the DOM neon line) plus a chromatic accent bar. The readable neon
 * headline itself is DOM (sections/Statement) for accessibility.
 */
export function StatementScene({ id }: { id: SectionId }) {
  const { getCenter } = useSection(id)
  return (
    <>
      <Block factor={0.45} anchor={getCenter}>
        <Text font={FONT} fontSize={7} color={BRAND.numberDim} anchorX="center" anchorY="middle" position={[0, 0, -14]} letterSpacing={-0.04}>
          BEYOND
        </Text>
      </Block>
      <Block factor={1.3} anchor={getCenter}>
        <ChromaticPlane color={BRAND.accentB} opacity={0.7} args={[20, 0.14, 8, 2]} rotation={[0, 0, SCENE.stripeAngle]} position={[0, -3.2, -2]} shiftStrength={2.2} />
      </Block>
    </>
  )
}
