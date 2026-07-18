import { type SectionId } from "../../scroll/store"

/**
 * Case-study background: a fixed, full-screen grey plane on layer 0, behind
 * everything (incl. the "BEYOND" word at z:-14 and the diamond's refraction). The
 * diamond's manual multipass render loop draws the clear colour darker than R3F's
 * auto-render, so the case study looked pure black; this plane restores the soft
 * grey the page had before the gem. It does NOT scroll (no Block) — it just fills
 * the viewport for the whole case study. The gem refracts it, so the gem now sits
 * on grey too. Mounted via the `description` section (case-study only).
 */
export function DescriptionScene(_props: { id: SectionId }) {
  return (
    <mesh position={[0, 0, -30]} frustumCulled={false}>
      <planeGeometry args={[140, 140]} />
      <meshBasicMaterial color="#0f0f0f" toneMapped={false} />
    </mesh>
  )
}
