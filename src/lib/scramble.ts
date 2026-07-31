import gsap from "gsap"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"

gsap.registerPlugin(ScrambleTextPlugin)

const SCRAMBLE_CHARS = "01"

// Scramble toward data-text, NOT "{original}": a scramble starting mid-decode would
// capture the intermediate binary as the target and leave it as binary forever.
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
