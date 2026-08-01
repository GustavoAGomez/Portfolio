import { Text } from "@react-three/drei"
import { Block } from "../parallax/Block"
import { useBlock } from "../parallax/useBlock"
import { useStore, type SectionId } from "../../scroll/store"
import { BRAND } from "../../config/tokens"
import { ACTIVE_TYPO } from "../../config/typography"

/**
 * Legal-page WebGL layer: oversized dim ambient "LEGAL" behind the header.
 * No diamond on this route → R3F auto-render (like NotFoundScene). The ambient word is
 * what makes the page read dark purple rather than flat black, same as every other route.
 */
export function LegalScene({ id }: { id: SectionId }) {
  const { worldWidth, viewportPx } = useBlock()

  // The legal page is taller than one viewport, so pin the word to the section's FIRST
  // viewport (the header), mirroring ProfileScene's heroAnchor — not the section centre.
  const heroAnchor = () => {
    const b = useStore.getState().sections[id]
    return (b ? b.top : 0) + viewportPx.height / 2
  }

  return (
    <Block factor={0.45} anchor={heroAnchor}>
      {/* 0.4375 ≈ StatementScene's 0.3125 × 7/5 chars, so 5-letter LEGAL bleeds like PROJECT. */}
      <Text
        font={ACTIVE_TYPO.displayFontUrl}
        fontSize={Math.min(8.4, worldWidth * 0.4375)}
        color={BRAND.textDim}
        anchorX="center"
        anchorY="middle"
        position={[0, 0, -14]}
        letterSpacing={-0.04}
      >
        LEGAL
      </Text>
    </Block>
  )
}
