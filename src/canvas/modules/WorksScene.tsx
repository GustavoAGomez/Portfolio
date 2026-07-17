import { useLayoutEffect } from "react"
import { Text, useTexture } from "@react-three/drei"
import { SRGBColorSpace, type Texture } from "three"
import { Block } from "../parallax/Block"
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
        const x = left ? -3 : 3
        const width = PLANE_WIDTH
        const height = PLANE_WIDTH / project.aspect
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
              position={[left ? x + 2.5 : x - 2.5, 0, -8]}
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
