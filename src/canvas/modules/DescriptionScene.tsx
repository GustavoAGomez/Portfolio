import { type SectionId } from "../../scroll/store"
import { BRAND } from "../../config/tokens"

/**
 * Fixed full-screen bg plane (case-study only): the manual multipass draws the
 * clear colour darker than R3F auto-render — as geometry the colour lands 1:1.
 */
export function DescriptionScene(_props: { id: SectionId }) {
  return (
    <mesh position={[0, 0, -30]} frustumCulled={false}>
      <planeGeometry args={[140, 140]} />
      <meshBasicMaterial color={BRAND.bg} toneMapped={false} />
    </mesh>
  )
}
