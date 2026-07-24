import { useLayoutEffect } from "react"
import { Text, useTexture } from "@react-three/drei"
import { SRGBColorSpace, type Texture } from "three"
import { Block } from "../parallax/Block"
import { useBlock } from "../parallax/useBlock"
import { ChromaticPlane } from "../ChromaticPlane"
import { useStore, type SectionId } from "../../scroll/store"
import { PROJECTS } from "../../config/projects"
import { BRAND } from "../../config/tokens"

const FONT = "/fonts/Anton-Regular.ttf"
const PLANE_WIDTH = 6

/**
 * Works WebGL layer: one chromatic image plane per project + a giant dim number
 * behind it. Projects are laid out down the (tall) works section — each gets its
 * own scroll slot so it centers as you reach it. Alternates left/right.
 */
export function WorksScene({ id }: { id: SectionId }) {
  const { worldWidth, viewportPx } = useBlock()
  // Mirrors the DOM's `lg:` breakpoint in Gallery.tsx (stacked text below 1024).
  const stacked = viewportPx.width < 1024
  const textures = useTexture(PROJECTS.map((p) => p.image)) as Texture[]

  useLayoutEffect(() => {
    textures.forEach((t) => {
      t.colorSpace = SRGBColorSpace
      t.anisotropy = 4
    })
  }, [textures])

  return (
    <>
      {PROJECTS.map((project, i) => {
        const left = i % 2 === 0
        // Stacked: centered near-full-bleed plane (moksha); desktop: fraction of
        // the world width capped at the tuned size (≥1440px = previous layout).
        const width = stacked ? worldWidth * 0.78 : Math.min(PLANE_WIDTH, worldWidth * 0.42)
        const height = width / project.aspect
        const x = stacked ? 0 : (left ? -1 : 1) * Math.min(3, (worldWidth - width) * 0.3)
        const numberX = stacked ? 0 : x + (left ? 1 : -1) * Math.min(2.5, width * 0.42)
        const map = textures[i] ?? null

        // Per-project scroll slot within the works section (resize-safe getter).
        const anchor = () => {
          const b = useStore.getState().sections[id]
          return b ? b.top + ((i + 0.5) * b.height) / PROJECTS.length : 0
        }

        return (
          <Block key={project.id} factor={1} anchor={anchor}>
            {/* Giant dim number behind. */}
            <Text
              font={FONT}
              fontSize={height * 1.35}
              color={BRAND.numberDim}
              anchorX="center"
              anchorY="middle"
              position={[numberX, 0, -8]}
            >
              {"0" + project.index}
            </Text>
            {/* Chromatic image plane. */}
            <ChromaticPlane map={map} args={[width, height, 32, 32]} position={[x, 0, 0]} shiftStrength={1.6} />
          </Block>
        )
      })}
    </>
  )
}
