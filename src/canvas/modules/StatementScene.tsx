import { Text } from "@react-three/drei"
import { Block } from "../parallax/Block"
import { useBlock } from "../parallax/useBlock"
import { useSection } from "../../scroll/useSection"
import { type SectionId } from "../../scroll/store"
import { BRAND } from "../../config/tokens"
import { ACTIVE_TYPO } from "../../config/typography"

const FONT = ACTIVE_TYPO.displayFontUrl
/** Muted ambient-word colour (palette `textDim`) — lighter than numberDim so the
 *  word reads; numberDim stays for the works numbers / hero stripe. */
const BEYOND_COLOR = BRAND.textDim

/**
 * Statement WebGL layer: an oversized dim word for depth (parallaxes slowly
 * behind the DOM headline). The readable headline itself is DOM
 * (sections/Statement) for accessibility.
 */
export function StatementScene({ id }: { id: SectionId }) {
  const { getCenter } = useSection(id)
  const { worldWidth } = useBlock()
  // Fraction of the world width (moksha-style) instead of a fixed world size, so
  // the ambient word keeps the same oversized-bleed proportion on any screen.
  // 0.3125 ≡ the previous fontSize 6 at a 1440px viewport; capped there so large
  // desktops don't grow past the tuned look.
  const fontSize = Math.min(6, worldWidth * 0.3125)
  return (
    <Block factor={0.45} anchor={getCenter}>
      <Text font={FONT} fontSize={fontSize} color={BEYOND_COLOR} anchorX="center" anchorY="middle" position={[0, 0, -14]} letterSpacing={-0.04}>
        PROJECT
      </Text>
    </Block>
  )
}
