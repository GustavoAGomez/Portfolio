import { type SectionId } from "../../scroll/store"
import { BRAND } from "../../config/tokens"

/**
 * Case-study background: a fixed, full-screen plane on layer 0, behind everything
 * (incl. the "BEYOND" word at z:-14 and the diamond's refraction). The diamond's
 * manual multipass render loop draws the CLEAR COLOUR darker than R3F's
 * auto-render, so without this the case study looked pure black; drawn as
 * geometry instead, the colour lands 1:1 on screen (measured: exactly `bg`).
 * It is the PALETTE BG — the same tone the Home renders — so no route is a
 * different black; it used to be `surface` (#141026), which read as a lighter
 * page. It does NOT scroll (no Block), it just fills the viewport for the whole
 * case study. The gem refracts it, so the gem sits on the same tone.
 * Mounted via the `description` section (case-study only).
 */
export function DescriptionScene(_props: { id: SectionId }) {
  return (
    <mesh position={[0, 0, -30]} frustumCulled={false}>
      <planeGeometry args={[140, 140]} />
      <meshBasicMaterial color={BRAND.bg} toneMapped={false} />
    </mesh>
  )
}
