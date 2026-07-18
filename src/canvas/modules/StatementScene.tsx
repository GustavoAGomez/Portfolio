import { Text } from "@react-three/drei"
import { Block } from "../parallax/Block"
import { useSection } from "../../scroll/useSection"
import { type SectionId } from "../../scroll/store"

const FONT = "/fonts/Anton-Regular.ttf"
/** Lighter than BRAND.numberDim so the ambient word reads (it's its own colour —
 *  numberDim is still used by the works numbers / hero stripe). */
const BEYOND_COLOR = "#3c4454"

/**
 * Statement WebGL layer: an oversized dim word for depth (parallaxes slowly
 * behind the DOM headline). The readable headline itself is DOM
 * (sections/Statement) for accessibility.
 */
export function StatementScene({ id }: { id: SectionId }) {
  const { getCenter } = useSection(id)
  return (
    <Block factor={0.45} anchor={getCenter}>
      <Text font={FONT} fontSize={6} color={BEYOND_COLOR} anchorX="center" anchorY="middle" position={[0, 0, -14]} letterSpacing={-0.04}>
        PROJECT
      </Text>
    </Block>
  )
}
