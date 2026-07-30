import { Text } from "@react-three/drei"
import { Block } from "../parallax/Block"
import { useBlock } from "../parallax/useBlock"
import { useSection } from "../../scroll/useSection"
import { type SectionId } from "../../scroll/store"
import { BRAND } from "../../config/tokens"
import { ACTIVE_TYPO } from "../../config/typography"

/**
 * 404 WebGL layer: a giant dim "404" behind the DOM message — the statement
 * ambient-word recipe. No diamond on this route (R3F auto-render mode), so the
 * word isn't warped; it just parallaxes slowly behind the copy, exactly like
 * PROJECT does on a generic detail page.
 */
export function NotFoundScene({ id }: { id: SectionId }) {
  const { getCenter } = useSection(id)
  const { layoutWidth } = useBlock()
  // 3 digits — fraction tuned so the word nearly bleeds the content width.
  // layoutWidth: stops growing past the 1440px content cap (site-wide rule).
  const fontSize = Math.min(9, layoutWidth * 0.47)
  return (
    <Block factor={0.45} anchor={getCenter}>
      <Text font={ACTIVE_TYPO.displayFontUrl} fontSize={fontSize} color={BRAND.textDim} anchorX="center" anchorY="middle" position={[0, 0, -14]} letterSpacing={-0.04}>
        404
      </Text>
    </Block>
  )
}
