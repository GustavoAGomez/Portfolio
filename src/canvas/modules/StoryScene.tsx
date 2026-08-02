import { Suspense, useEffect, useLayoutEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useTexture, useVideoTexture } from "@react-three/drei"
import { SRGBColorSpace, type Texture } from "three"
import { Block } from "../parallax/Block"
import { useBlock } from "../parallax/useBlock"
import { ChromaticPlane } from "../ChromaticPlane"
import { useStore, type SectionId } from "../../scroll/store"
import { getProjectContent, type StoryBlock } from "../../config/projectContent"

// Desktop plane width caps in world units (reached ~1440px); below, viewport fractions.
const LANDSCAPE_WIDTH = 9.6
const PORTRAIT_WIDTH = 6.2
// Max sideways offset of the plane (text sits on the opposite side in the DOM).
const X_OFFSET = 2.6

/**
 * Case-study media layer: one chromatic plane per block. Which project to render
 * comes from store.caseStudyId — the Canvas has no React Router context.
 */
export function StoryScene({ id }: { id: SectionId }) {
  const caseStudyId = useStore((s) => s.caseStudyId)
  // Media/aspect/leadGap are identical across locales, so plane keys/layout never
  // change on a language switch (no texture reload).
  const locale = useStore((s) => s.locale)
  const content = caseStudyId ? getProjectContent(caseStudyId, locale) : undefined
  if (!content) return null

  // Weighted slots: 1 unit per block + its leadGap before it — the SAME leadGap
  // drives the DOM margin in Story.tsx, so plane and text stay aligned.
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

/** One block's plane + parallax slot (video or image, each in its own <Suspense>). */
function StoryBlockPlane({ id, block, index, centerFraction }: { id: SectionId; block: StoryBlock; index: number; centerFraction: number }) {
  const { worldWidth, viewportPx } = useBlock()
  // Mirrors the DOM's `lg:` breakpoint in Story.tsx (NOT the 768px mobile flag).
  const stacked = viewportPx.width < 1024
  const aspect = block.aspect ?? 1.6
  const portrait = aspect < 1
  // Stacked fractions (0.86 / 0.58) size the DOM spacer in Story.tsx too — keep in sync.
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

  // DOM is the anchor source of truth (store.storyAnchors, measured by Story.tsx);
  // the even-split estimate only covers the first frames.
  const anchor = () => {
    const st = useStore.getState()
    const measured = st.storyAnchors[index]
    if (measured != null) return measured
    const b = st.sections[id]
    return b ? b.top + centerFraction * b.height : 0
  }

  const args: [number, number, number, number] = [width, height, 32, 32]

  return (
    <Block factor={1} anchor={anchor}>
      <Suspense fallback={null}>
        {block.video ? (
          <VideoPlane src={block.video} args={args} position={[x, 0, 0]} playbackRate={block.playbackRate} anchor={anchor} />
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

function VideoPlane({ src, args, position, playbackRate, anchor }: PlaneVariantProps & { playbackRate?: number; anchor: () => number }) {
  // Muted + loop + playsInline so it autoplays everywhere.
  const texture = useVideoTexture(src, { muted: true, loop: true, start: true, playsInline: true, crossOrigin: "anonymous" }) as Texture
  const reducedMotion = useStore((s) => s.reducedMotion)
  const { size } = useThree()
  // Proximity gate: a paused video produces no frames, killing decode + per-frame
  // texture upload (the main non-render cost on mobile).
  const nearRef = useRef(true)
  useEffect(() => {
    texture.colorSpace = SRGBColorSpace
  }, [texture])
  // Pause the underlying <video> on unmount: leaving a case study should stop its
  // decode/texture-upload, not leave it running in the background across navigations.
  useEffect(() => {
    const video = texture.image as HTMLVideoElement | undefined
    return () => video?.pause()
  }, [texture])
  // reduced-motion pauses (still frame); otherwise honor the block's playbackRate.
  useEffect(() => {
    const video = texture.image as HTMLVideoElement | undefined
    if (!video) return
    if (reducedMotion) {
      video.pause()
    } else {
      video.playbackRate = playbackRate ?? 1
      if (nearRef.current) void video.play().catch(() => {})
    }
  }, [texture, reducedMotion, playbackRate])
  // Play only near the viewport — asymmetric hysteresis (resume 1.1·vh, pause 1.6·vh)
  // so the boundary never thrashes.
  useFrame(() => {
    const video = texture.image as HTMLVideoElement | undefined
    if (!video || reducedMotion) return
    const dist = Math.abs(anchor() - (useStore.getState().scroll.scrollY + size.height / 2))
    const near = dist < size.height * (nearRef.current ? 1.6 : 1.1)
    if (near === nearRef.current) return
    nearRef.current = near
    if (near) void video.play().catch(() => {})
    else video.pause()
  })
  return <ChromaticPlane map={texture} args={args} position={position} shiftStrength={1.6} />
}
