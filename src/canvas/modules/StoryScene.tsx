import { Suspense, useEffect, useLayoutEffect } from "react"
import { useTexture, useVideoTexture } from "@react-three/drei"
import { SRGBColorSpace, type Texture } from "three"
import { Block } from "../parallax/Block"
import { ChromaticPlane } from "../ChromaticPlane"
import { useStore, type SectionId } from "../../scroll/store"
import { getProjectContent, type StoryBlock } from "../../config/projectContent"

// Plane widths in world units. Landscape is deliberately large so the media
// reads big; portrait is narrower because its height is already tall (w/aspect).
const LANDSCAPE_WIDTH = 9.6
const PORTRAIT_WIDTH = 6.2
// Sideways offset of the plane (text sits on the opposite side in the DOM).
const X_OFFSET = 2.6

/**
 * Case-study story WebGL layer: one chromatic plane per block, laid out down the
 * (tall) story section — the SAME red/blue-trail + parallax treatment the works
 * gallery gives its images. A block's media is a looping VIDEO when `block.video`
 * is set (VideoTexture) or a still IMAGE otherwise; both feed the same
 * ChromaticPlane, so video blocks get the exact same scroll effect.
 *
 * Which project's blocks to render comes from the store (`caseStudyId`), set by
 * SiteShell from the URL — the Canvas gets no React Router context.
 */
export function StoryScene({ id }: { id: SectionId }) {
  const caseStudyId = useStore((s) => s.caseStudyId)
  const content = caseStudyId ? getProjectContent(caseStudyId) : undefined
  if (!content) return null
  return (
    <>
      {content.blocks.map((block, i) => (
        <StoryBlockPlane key={block.video ?? block.image} id={id} block={block} index={i} count={content.blocks.length} />
      ))}
    </>
  )
}

/** One block's plane + parallax slot. Picks the video or image texture variant
 *  (each in its own <Suspense> so a loading video never blanks the others). */
function StoryBlockPlane({ id, block, index, count }: { id: SectionId; block: StoryBlock; index: number; count: number }) {
  const aspect = block.aspect ?? 1.6
  const portrait = aspect < 1
  const width = portrait ? PORTRAIT_WIDTH : LANDSCAPE_WIDTH
  const height = width / aspect
  const left = index % 2 === 0
  const x = left ? -X_OFFSET : X_OFFSET

  // Per-block scroll slot within the story section (resize-safe getter).
  const anchor = () => {
    const b = useStore.getState().sections[id]
    return b ? b.top + ((index + 0.5) * b.height) / count : 0
  }

  const args: [number, number, number, number] = [width, height, 32, 32]

  return (
    <Block factor={1} anchor={anchor}>
      <Suspense fallback={null}>
        {block.video ? (
          <VideoPlane src={block.video} args={args} position={[x, 0, 0]} />
        ) : (
          <ImagePlane src={block.image ?? ""} args={args} position={[x, 0, 0]} />
        )}
      </Suspense>
    </Block>
  )
}

interface PlaneVariantProps {
  src: string
  args: [number, number, number, number]
  position: [number, number, number]
}

function ImagePlane({ src, args, position }: PlaneVariantProps) {
  const texture = useTexture(src) as Texture
  useLayoutEffect(() => {
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 4
  }, [texture])
  return <ChromaticPlane map={texture} args={args} position={position} shiftStrength={1.6} />
}

function VideoPlane({ src, args, position }: PlaneVariantProps) {
  // Muted + loop + playsInline so it autoplays everywhere; frameloop="always"
  // keeps the VideoTexture advancing each frame.
  const texture = useVideoTexture(src, { muted: true, loop: true, start: true, playsInline: true, crossOrigin: "anonymous" }) as Texture
  const reducedMotion = useStore((s) => s.reducedMotion)
  useEffect(() => {
    texture.colorSpace = SRGBColorSpace
  }, [texture])
  // Honor reduced-motion: pause the video (shows a still frame) instead of looping.
  useEffect(() => {
    const video = texture.image as HTMLVideoElement | undefined
    if (!video) return
    if (reducedMotion) video.pause()
    else void video.play().catch(() => {})
  }, [texture, reducedMotion])
  return <ChromaticPlane map={texture} args={args} position={position} shiftStrength={1.6} />
}
