import { Block } from "../parallax/Block"
import { ChromaticPlane } from "../ChromaticPlane"
import { useSection } from "../../scroll/useSection"
import { type SectionId } from "../../scroll/store"
import { SCENE, BRAND } from "../../config/tokens"

/**
 * About WebGL layer: intentionally sparse — a single thin chromatic accent line
 * drifting with parallax. Text is DOM (sections/About).
 */
export function AboutScene({ id }: { id: SectionId }) {
  const { getCenter } = useSection(id)
  return (
    <Block factor={1.25} anchor={getCenter}>
      <ChromaticPlane color={BRAND.accentA} opacity={0.75} args={[18, 0.1, 8, 2]} rotation={[0, 0, SCENE.stripeAngle]} position={[0, 0, -3]} shiftStrength={2} />
    </Block>
  )
}
