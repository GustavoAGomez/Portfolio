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
 * About-me WebGL layer: the case-study hero language (oversized gem — mounted by
 * Scene via `profile` — refracting a dim ambient "ABOUT" word behind the name)
 * plus the portrait photo as a chromatic plane (same RGB-split trail + parallax
 * as the case-study media — the photo is a graphic piece of the system, not a
 * headshot <img>). Photo anchored to the slot Profile.tsx measures.
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

  // Ambient-word anchor: the profile section spans the whole /about page, so
  // the statement-style word pins to its FIRST viewport (the hero), mirroring
  // the gem's `heroAnchor` in Diamonds.tsx.
  const heroAnchor = () => {
    const b = useStore.getState().sections[id]
    return (b ? b.top : 0) + viewportPx.height / 2
  }

  return (
    <>
      {/* /about runs in the diamond's manual-loop render mode (gem behind the
          hero), which draws the clear colour darker than R3F auto-render — same
          fix as the case study (DescriptionScene): a fixed full-screen plane so
          the page stays exactly BRAND.bg. */}
      <mesh position={[0, 0, -30]} frustumCulled={false}>
        <planeGeometry args={[140, 140]} />
        <meshBasicMaterial color={BRAND.bg} toneMapped={false} />
      </mesh>
      {/* Statement-style ambient word behind the hero, warped by the gem.
          0.4375 ≈ StatementScene's 0.3125 scaled by 7/5 chars, so the 5-letter
          ABOUT bleeds the same width PROJECT does. */}
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
