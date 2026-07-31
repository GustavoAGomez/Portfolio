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

let captured: Map<string, number> | null = null

/** Snapshot every section's viewport top. Call right before changing locale. */
export function captureSectionTops(): void {
  captured = new Map()
  document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => {
    const id = el.dataset.section
    if (id) captured?.set(id, el.getBoundingClientRect().top)
  })
}

/** Animate sections from their captured position to the new layout. No-op when
 *  nothing was captured (mount, navigation) or under reduced motion. */
export function playSectionFlip(reducedMotion: boolean): void {
  const prev = captured
  captured = null
  if (!prev || reducedMotion) return

  const moved: HTMLElement[] = []
  document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => {
    const old = prev.get(el.dataset.section ?? "")
    if (old == null) return
    const delta = old - el.getBoundingClientRect().top
    if (Math.abs(delta) < 2) return
    gsap.set(el, { y: delta })
    moved.push(el)
  })
  if (!moved.length) return

  const remeasure = () => window.dispatchEvent(new Event("resize"))
  gsap.to(moved, {
    y: 0,
    duration: 0.65,
    ease: "power2.inOut",
    clearProps: "transform",
    onUpdate: remeasure,
    onComplete: remeasure
  })
}
