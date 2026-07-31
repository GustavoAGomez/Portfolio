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

// Desktop cap in world units (reached ~1440px); below it the plane is a viewport fraction.
const PORTRAIT_WIDTH = 5.6
const X_OFFSET = 2.6

/** About-me WebGL layer: ambient ABOUT word + the portrait photo as a chromatic plane. */
export function ProfileScene({ id }: { id: SectionId }) {
  const { worldWidth, viewportPx } = useBlock()
  // Mirrors the DOM's `lg:` breakpoint in Profile.tsx.
  const stacked = viewportPx.width < 1024
  const aspect = ABOUT.photo.aspect

  // Stacked 0.58 fraction sizes the DOM spacer too — keep in sync with Profile.tsx.
  const width = stacked ? worldWidth * 0.58 : Math.min(PORTRAIT_WIDTH, worldWidth * 0.34)
  const height = width / aspect
  const x = stacked ? 0 : -Math.min(X_OFFSET, ((worldWidth - width) / 2) * 0.66)

  // DOM is the anchor source of truth (store.profileAnchors, measured by Profile.tsx);
  // the estimate only covers the first frames.
  const anchor = () => {
    const st = useStore.getState()
    const measured = st.profileAnchors[0]
    if (measured != null) return measured
    const b = st.sections[id]
    return b ? b.top + b.height * 0.35 : 0
  }

  // Pins the ambient word to the section's FIRST viewport (mirrors the gem's heroAnchor).
  const heroAnchor = () => {
    const b = useStore.getState().sections[id]
    return (b ? b.top : 0) + viewportPx.height / 2
  }

  return (
    <>
      {/* Manual-loop mode draws the clear colour darker — same bg-plane fix as DescriptionScene. */}
      <mesh position={[0, 0, -30]} frustumCulled={false}>
        <planeGeometry args={[140, 140]} />
        <meshBasicMaterial color={BRAND.bg} toneMapped={false} />
      </mesh>
      {/* 0.4375 ≈ StatementScene's 0.3125 × 7/5 chars, so ABOUT bleeds like PROJECT. */}
      <Block factor={0.45} anchor={heroAnchor}>
        <Text
          font={ACTIVE_TYPO.displayFontUrl}
          fontSize={Math.min(8.4, worldWidth * 0.4375)}
          color={BRAND.textDim}
          anchorX="center"
          anchorY="middle"
          position={[0, 0, -14]}
          letterSpacing={-0.04}
        >
          ABOUT
        </Text>
      </Block>
      <Block factor={1} anchor={anchor}>
        <Suspense fallback={null}>
          <PhotoPlane src={ABOUT.photo.src} args={[width, height, 32, 32]} position={[x, 0, 0]} />
        </Suspense>
      </Block>
    </>
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
