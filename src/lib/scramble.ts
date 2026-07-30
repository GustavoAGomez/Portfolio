import gsap from "gsap"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"

gsap.registerPlugin(ScrambleTextPlugin)

const SCRAMBLE_CHARS = "01"

/**
 * Scramble each `[data-scramble]` target TOWARD its real text (read from
 * `data-text`, NOT the live `textContent`). Using the stored real text instead
 * of gsap's `"{original}"` is what fixes the first-view↔hover collision: if a
 * hover scramble starts while the first-view decode is mid-flight, `"{original}"`
 * would capture the intermediate binary as the target and leave it as binary
 * forever. `overwrite:true` kills any in-flight tween on the same target so the
 * latest scramble always wins and always lands on the real text.
 *
 * Shared by the Home works list rows and the case-study "Sobre mí" row (Footer).
 */
export function scrambleToReal(targets: ArrayLike<HTMLElement>, stagger: number): void {
  Array.from(targets).forEach((t, i) => {
    const text = t.getAttribute("data-text") ?? t.textContent ?? ""
    gsap.to(t, {
      duration: 0.7,
      delay: i * stagger,
      ease: "none",
      overwrite: true,
      scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 1, revealDelay: 0.1 }
    })
  })
}
