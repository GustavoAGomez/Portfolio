import { Suspense, useLayoutEffect } from "react"
import { Text, useTexture } from "@react-three/drei"
import { SRGBColorSpace, type Texture } from "three"
import { Block } from "../parallax/Block"
import { useBlock } from "../parallax/useBlock"
import { ChromaticPlane } from "../ChromaticPlane"
import { useStore, type SectionId } from "../../scroll/store"
import { BRAND } from "../../config/tokens"
import { ACTIVE_TYPO } from "../../config/typography"
import { ABOUT } from "../../config/aboutContent"

// Desktop cap in world units (reached ~1440px); below it the plane is a fraction
// of the world width. Portrait photo → narrower than the story's landscape caps.
const PORTRAIT_WIDTH = 5.6
const X_OFFSET = 2.6

/**
 * About-me WebGL layer: the portrait photo as a chromatic plane (same RGB-split
 * trail + parallax as the case-study media — the photo is a graphic piece of the
 * system, not a headshot <img>), plus a giant dim brand word behind it (the
 * works-list "dim number" language). Anchored to the slot Profile.tsx measures.
 */
export function ProfileScene({ id }: { id: SectionId }) {
  const { worldWidth, viewportPx } = useBlock()
  // Mirrors the DOM's `lg:` breakpoint in Profile.tsx (stacked below 1024).
  const stacked = viewportPx.width < 1024
  const aspect = ABOUT.photo.aspect

  // Stacked: fills the DOM spacer exactly (SAME 0.58 fraction — keep in sync
  // with Profile.tsx's slot). Desktop: fraction of the world, capped.
  const width = stacked ? worldWidth * 0.58 : Math.min(PORTRAIT_WIDTH, worldWidth * 0.34)
  const height = width / aspect
  const x = stacked ? 0 : -Math.min(X_OFFSET, ((worldWidth - width) / 2) * 0.66)

  // DOM is the anchor source of truth (store.profileAnchors, measured by
  // Profile.tsx). The estimate only covers the first frames before it lands.
  const anchor = () => {
    const st = useStore.getState()
    const measured = st.profileAnchors[0]
    if (measured != null) return measured
    const b = st.sections[id]
    return b ? b.top + b.height * 0.35 : 0
  }

  return (
    <Block factor={1} anchor={anchor}>
      {/* Giant dim brand word behind the photo — same tone as the works numbers. */}
      <Text
        font={ACTIVE_TYPO.displayFontUrl}
        fontSize={width * 0.55}
        color={BRAND.numberDim}
        anchorX="center"
        anchorY="middle"
        position={[stacked ? 0 : x + width * 0.5, 0, -8]}
      >
        GUSGQ
      </Text>
      <Suspense fallback={null}>
        <PhotoPlane src={ABOUT.photo.src} args={[width, height, 32, 32]} position={[x, 0, 0]} />
      </Suspense>
    </Block>
  )
}

function PhotoPlane({ src, args, position }: { src: string; args: [number, number, number, number]; position: [number, number, number] }) {
  const texture = useTexture(src) as Texture
  useLayoutEffect(() => {
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 4
  }, [texture])
  return <ChromaticPlane map={texture} args={args} position={position} shiftStrength={1.6} />
}
