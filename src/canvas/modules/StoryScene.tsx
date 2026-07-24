import { Suspense, useEffect, useLayoutEffect } from "react"
import { useTexture, useVideoTexture } from "@react-three/drei"
import { SRGBColorSpace, type Texture } from "three"
import { Block } from "../parallax/Block"
import { useBlock } from "../parallax/useBlock"
import { ChromaticPlane } from "../ChromaticPlane"
import { useStore, type SectionId } from "../../scroll/store"
import { getProjectContent, type StoryBlock } from "../../config/projectContent"

// Desktop plane width CAPS in world units (reached at ~1440px wide). Below that,
// planes are a FRACTION of the world width (moksha technique) so they never
// bleed off narrower viewports. Landscape is deliberately large so the media
// reads big; portrait is narrower because its height is already tall (w/aspect).
const LANDSCAPE_WIDTH = 9.6
const PORTRAIT_WIDTH = 6.2
// Max sideways offset of the plane (text sits on the opposite side in the DOM).
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

  // Weighted vertical layout: each block is a 1-unit slot plus its optional
  // `leadGap` (extra space BEFORE it). The SAME leadGap drives the DOM margin in
  // Story.tsx, so plane and text stay aligned. `centerFraction` ∈ [0,1] locates a
  // plane's center within the story section — with no leadGap it collapses to the
  // former even split (index + 0.5) / count, so other projects are unaffected.
  const total = content.blocks.reduce((sum, b) => sum + 1 + (b.leadGap ?? 0), 0)
  let cursor = 0

  return (
    <>
      {content.blocks.map((block, i) => {
        cursor += block.leadGap ?? 0
        const centerFraction = (cursor + 0.5) / total
        cursor += 1
        return <StoryBlockPlane key={block.video ?? block.image} id={id} block={block} index={i} centerFraction={centerFraction} />
      })}
    </>
  )
}

/** One block's plane + parallax slot. Picks the video or image texture variant
 *  (each in its own <Suspense> so a loading video never blanks the others). */
function StoryBlockPlane({ id, block, index, centerFraction }: { id: SectionId; block: StoryBlock; index: number; centerFraction: number }) {
  const { worldWidth, viewportPx } = useBlock()
  // Stacked (centered plane, copy below) until 1024px — mirrors the DOM's `lg:`
  // breakpoint in Story.tsx, NOT the 768px `mobile` flag: at md widths there is
  // no room for the side-by-side layout without plane/text overlap.
  const stacked = viewportPx.width < 1024
  const aspect = block.aspect ?? 1.6
  const portrait = aspect < 1
  // Stacked: centered, near-full-bleed (moksha's 0.8 content fraction, a touch
  // wider for landscape). Desktop: fraction of the world width, capped at the
  // tuned sizes — at ≥1440px this is exactly the previous fixed layout.
  const width = portrait
    ? stacked
      ? worldWidth * 0.58
      : Math.min(PORTRAIT_WIDTH, worldWidth * 0.4)
    : stacked
      ? worldWidth * 0.86
      : Math.min(LANDSCAPE_WIDTH, worldWidth * 0.62)
  const height = width / aspect
  const left = index % 2 === 0
  const x = stacked ? 0 : (left ? -1 : 1) * Math.min(X_OFFSET, ((worldWidth - width) / 2) * 0.66)
  // Stacked shifts the plane up so the copy (bottom of the DOM slot) clears it.
  const y = stacked ? Math.min(1.2, height * 0.18) : 0

  // Per-block scroll slot within the story section (resize-safe getter). Uses the
  // block's weighted centerFraction so `leadGap` spacing matches the DOM article.
  const anchor = () => {
    const b = useStore.getState().sections[id]
    return b ? b.top + centerFraction * b.height : 0
  }

  const args: [number, number, number, number] = [width, height, 32, 32]

  return (
    <Block factor={1} anchor={anchor}>
      <Suspense fallback={null}>
        {block.video ? (
          <VideoPlane src={block.video} args={args} position={[x, y, 0]} playbackRate={block.playbackRate} />
        ) : (
          <ImagePlane src={block.image ?? ""} args={args} position={[x, y, 0]} />
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

function VideoPlane({ src, args, position, playbackRate }: PlaneVariantProps & { playbackRate?: number }) {
  // Muted + loop + playsInline so it autoplays everywhere; frameloop="always"
  // keeps the VideoTexture advancing each frame.
  const texture = useVideoTexture(src, { muted: true, loop: true, start: true, playsInline: true, crossOrigin: "anonymous" }) as Texture
  const reducedMotion = useStore((s) => s.reducedMotion)
  useEffect(() => {
    texture.colorSpace = SRGBColorSpace
  }, [texture])
  // Honor reduced-motion: pause the video (shows a still frame) instead of looping.
  // Otherwise play at the block's playbackRate (default 1) — some captured clips
  // read too fast on the chromatic plane and want slowing down.
  useEffect(() => {
    const video = texture.image as HTMLVideoElement | undefined
    if (!video) return
    if (reducedMotion) {
      video.pause()
    } else {
      video.playbackRate = playbackRate ?? 1
      void video.play().catch(() => {})
    }
  }, [texture, reducedMotion, playbackRate])
  return <ChromaticPlane map={texture} args={args} position={position} shiftStrength={1.6} />
}
