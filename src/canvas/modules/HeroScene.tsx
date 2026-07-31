import { useLayoutEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import gsap from "gsap"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import { Group, type Mesh } from "three"
import { Block } from "../parallax/Block"
import { useBlock } from "../parallax/useBlock"
import { useSection } from "../../scroll/useSection"
import { useStore, type SectionId } from "../../scroll/store"
import { BRAND } from "../../config/tokens"
import { ACTIVE_TYPO } from "../../config/typography"
import { damp } from "../../lib/math"

gsap.registerPlugin(ScrambleTextPlugin)

const FONT = ACTIVE_TYPO.displayFontUrl
const HERO_WORD = "GUSGQ"
/** Landing decode: the same binary scramble the DOM uses, but the headline is a
 *  troika <Text> inside the Canvas (it has to be, for the gem to refract it), so
 *  <Decode> can't wrap it. GSAP scrambles a DETACHED span and each update is
 *  written straight onto the troika instance — no React state in the loop. */
const DECODE_DURATION = 2

type TroikaText = Mesh & { text: string; sync: (onDone?: () => void) => void }

/** Ambient word behind the hero. The clear colour is `BRAND.bg` on every route,
 *  but the detail routes carry one of these (PROJECT / ABOUT / 404) and its dim
 *  purple fills their whole field — the Home had none and read flat black.
 *  0.3125 is StatementScene's fraction for 7 letters; normalized by length so
 *  any word bleeds the same width. Change the word here. */
// Desactivada: al reactivar el <Text> de abajo hay que descomentar estas dos
// (tsc corre con noUnusedLocals y una constante muerta tumba el build).
// const AMBIENT_WORD = "PORTFOLIO"
// const AMBIENT_FRACTION = (0.3125 * 7) / AMBIENT_WORD.length

/** Hero headline as 3D <Text> on layer 0, behind the diamond so its refraction warps it. */
export function HeroScene({ id }: { id: SectionId }) {
  const { getCenter } = useSection(id)
  const { layoutWidth, mobile } = useBlock()
  const pointer = useRef<Group>(null)
  const headline = useRef<TroikaText>(null)

  // Layout effect: the binary must be in place BEFORE the first painted frame,
  // or the real word flashes first.
  useLayoutEffect(() => {
    const el = headline.current
    if (!el || useStore.getState().reducedMotion) return
    let killed = false
    let tween: gsap.core.Tween | null = null
    const proxy = document.createElement("span")
    const write = (s: string) => {
      el.text = s
      el.sync()
    }
    const binary = Array.from(HERO_WORD, () => (Math.random() < 0.5 ? "0" : "1")).join("")
    proxy.textContent = binary
    el.text = binary
    // Start only once troika reports the glyphs laid out (i.e. the webfont has
    // loaded): before that the canvas shows nothing and the whole decode would
    // play unseen — which is exactly what happened when it ran on mount.
    el.sync(() => {
      if (killed) return
      tween = gsap.to(proxy, {
        duration: DECODE_DURATION,
        ease: "none",
        scrambleText: { text: HERO_WORD, chars: "01", speed: 1, revealDelay: 0.15 },
        onUpdate: () => write(proxy.textContent ?? HERO_WORD),
        onComplete: () => write(HERO_WORD)
      })
    })
    return () => {
      killed = true
      tween?.kill()
      write(HERO_WORD)
    }
  }, [])

  useFrame((state, dt) => {
    const g = pointer.current
    if (!g) return
    const { reducedMotion } = useStore.getState()
    const tx = reducedMotion ? 0 : state.pointer.x * 0.4
    const ty = reducedMotion ? 0 : state.pointer.y * 0.25
    g.position.x = damp(g.position.x, tx, 4, dt)
    g.position.y = damp(g.position.y, ty, 4, dt)
  })

  return (
    <group ref={pointer}>
      <Block factor={0.45} anchor={getCenter}>
        {/* <Text
          font={FONT}
          fontSize={Math.min(6, layoutWidth * AMBIENT_FRACTION)}
          color={BRAND.textDim}
          anchorX="center"
          anchorY="middle"
          position={[0, 0, -14]}
          letterSpacing={-0.04}
        >
          {AMBIENT_WORD}
        </Text> */}
      </Block>
      <Block factor={1} anchor={getCenter}>
        <Text
          ref={headline}
          font={FONT}
          // Keep fractions below ~0.2: the gem's refraction magnifies the word and
          // larger fractions get the refracted copies cut at phone edges.
          fontSize={layoutWidth * (mobile ? 0.19 : 0.16)}
          color={BRAND.text}
          anchorX="center"
          anchorY="middle"
          letterSpacing={-0.02}
          position={[0, 0, 0]}
        >
          {HERO_WORD}
        </Text>
      </Block>
    </group>
  )
}
