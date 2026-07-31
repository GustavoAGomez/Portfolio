import gsap from "gsap"

/**
 * FLIP for the language switch. Switching locale REMOUNTS every DOM section
 * (that's what replays the decode), and the new texts have different lengths —
 * so section heights change and everything below the reader JUMPS to its new
 * position in one frame (worst on mobile, where copy outgrows the min-h boxes).
 * A CSS transition can't animate that: the elements are brand new and the shift
 * is pure reflow. So we FLIP instead:
 *
 *   1. `captureSectionTops()` — called by LangSwitch BEFORE setLocale — records
 *      each section's viewport top.
 *   2. `playSectionFlip()` — called by SiteShell's layout effect right after
 *      the remount commit (before paint) — offsets every moved section back to
 *      its OLD position and glides it to the new one.
 *
 * While gliding, a window `resize` is dispatched each frame: Story/Profile
 * re-measure their media anchors from getBoundingClientRect (which FOLLOWS the
 * transform), so the stacked WebGL planes travel glued to their DOM slots
 * instead of snapping to the final layout ahead of the text.
 */

/** Content blocks that can shift INSIDE a section whose own top doesn't move —
 *  e.g. the statement hero: its section is min-h-svh (top/height fixed) but the
 *  centered title+tagline re-center when the new tagline wraps fewer lines.
 *  Matched BY INDEX inside each section: both locales render the same component
 *  tree, so the nth block before == the nth block after. */
const BLOCKS = "h1, h2, h3, p, ol, ul"

interface Snapshot {
  sections: Map<string, number>
  /** `${sectionId}#${i}` → viewport top. */
  blocks: Map<string, number>
  /** Per-section block count — a mismatch after the switch means the structure
   *  changed (shouldn't happen; guard) and that section's blocks are skipped. */
  counts: Map<string, number>
}

let captured: Snapshot | null = null

/** Snapshot section + content-block viewport tops. Call before setLocale. */
export function captureSectionTops(): void {
  const snap: Snapshot = { sections: new Map(), blocks: new Map(), counts: new Map() }
  document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => {
    const id = el.dataset.section
    if (!id) return
    snap.sections.set(id, el.getBoundingClientRect().top)
    const blocks = el.querySelectorAll<HTMLElement>(BLOCKS)
    snap.counts.set(id, blocks.length)
    blocks.forEach((b, i) => snap.blocks.set(`${id}#${i}`, b.getBoundingClientRect().top))
  })
  captured = snap
}

/** Animate sections AND their content blocks from the captured layout to the
 *  new one. Block deltas are RELATIVE to their section's delta (both get a
 *  transform; nesting them absolutely would double the shift). No-op when
 *  nothing was captured (mount, navigation) or under reduced motion. */
export function playSectionFlip(reducedMotion: boolean): void {
  const prev = captured
  captured = null
  if (!prev || reducedMotion) return

  const moved: HTMLElement[] = []
  // Elements whose transform is OWNED by useDomParallax's rAF loop (statement /
  // profile / 404 headlines): a gsap transform would be overwritten every frame,
  // so their offset is tweened through `data-flip-y`, which the hook adds in.
  const proxies: { el: HTMLElement; from: number }[] = []
  document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => {
    const id = el.dataset.section ?? ""
    const old = prev.sections.get(id)
    if (old == null) return
    const sectionDelta = old - el.getBoundingClientRect().top
    const animateSection = Math.abs(sectionDelta) >= 2
    if (animateSection) {
      gsap.set(el, { y: sectionDelta })
      moved.push(el)
    }
    const blocks = el.querySelectorAll<HTMLElement>(BLOCKS)
    if (blocks.length !== prev.counts.get(id)) return // structure changed — sections only
    blocks.forEach((b, i) => {
      const oldB = prev.blocks.get(`${id}#${i}`)
      if (oldB == null) return
      // The section's own transform already moves this block; compensate.
      const delta = oldB - b.getBoundingClientRect().top - (animateSection ? sectionDelta : 0)
      if (Math.abs(delta) < 1) return
      if (b.dataset.domParallax !== undefined) {
        b.dataset.flipY = String(delta)
        proxies.push({ el: b, from: delta })
      } else {
        gsap.set(b, { y: delta })
        moved.push(b)
      }
    })
  })
  if (!moved.length && !proxies.length) return

  const remeasure = () => window.dispatchEvent(new Event("resize"))
  const state = { p: 0 }
  gsap.to(state, {
    p: 1,
    duration: 0.65,
    ease: "power2.inOut",
    onUpdate: () => {
      proxies.forEach(({ el, from }) => {
        el.dataset.flipY = String(from * (1 - state.p))
      })
      remeasure()
    },
    onComplete: () => {
      proxies.forEach(({ el }) => delete el.dataset.flipY)
      remeasure()
    }
  })
  if (moved.length) gsap.to(moved, { y: 0, duration: 0.65, ease: "power2.inOut", clearProps: "transform" })
}
